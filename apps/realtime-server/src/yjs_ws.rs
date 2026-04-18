use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;

use anyhow::Result;
use axum::extract::ws::{Message, WebSocket};
use bytes::Bytes;
use futures_util::{SinkExt, StreamExt};
use tracing::warn;
use yrs::encoding::read::Read as YRead;
use yrs::encoding::write::Write as YWrite;
use yrs::updates::decoder::{Decode, DecoderV1};
use yrs::updates::encoder::{Encode, Encoder, EncoderV1};
use yrs::{ReadTxn, StateVector, Transact, Update};

use crate::room::{Room, YjsBroadcast};

/// Y-websocket protocol message types (matches y-websocket reference impl).
const MSG_SYNC: u64 = 0;
const MSG_AWARENESS: u64 = 1;

/// Y-websocket sync sub-message types.
const SYNC_STEP_1: u64 = 0;
const SYNC_STEP_2: u64 = 1;
const SYNC_UPDATE: u64 = 2;

static CONNECTION_COUNTER: AtomicU64 = AtomicU64::new(0);

/// Runs one Yjs WebSocket connection. We implement just enough of the
/// y-websocket protocol to:
///   1. Reply to a client's SyncStep1 with a SyncStep2 containing our state.
///   2. Apply incoming SyncStep2/Update bytes to the room's local Doc.
///   3. Relay every received frame to all other peers in the room verbatim
///      (this propagates updates AND awareness messages to other clients).
///
/// We intentionally do not maintain server-side awareness state.
pub async fn run_yjs_ws(socket: WebSocket, room: Arc<Room>) -> Result<()> {
    let (mut sender, mut receiver) = socket.split();
    let conn_id = CONNECTION_COUNTER.fetch_add(1, Ordering::Relaxed);
    let mut peer_rx = room.yjs_broadcast.subscribe();

    // Kick off the sync handshake by sending our SyncStep1 (state vector).
    let initial_frame = compute_initial_sync_frame(&room).await;
    if sender.send(Message::Binary(initial_frame)).await.is_err() {
        return Ok(());
    }

    loop {
        tokio::select! {
            maybe_msg = receiver.next() => {
                let Some(Ok(msg)) = maybe_msg else { break };
                match msg {
                    Message::Binary(bytes) => {
                        match handle_incoming(&room, conn_id, &bytes).await {
                            Ok(Some(reply)) => {
                                if sender.send(Message::Binary(reply)).await.is_err() { break; }
                            }
                            Ok(None) => {}
                            Err(err) => warn!(?err, "yjs frame handling failed"),
                        }
                    }
                    Message::Close(_) => break,
                    Message::Ping(p) => { let _ = sender.send(Message::Pong(p)).await; }
                    _ => {}
                }
            }
            Ok(broadcast) = peer_rx.recv() => {
                if broadcast.from == conn_id { continue; }
                if sender.send(Message::Binary(broadcast.bytes.to_vec())).await.is_err() {
                    break;
                }
            }
        }
    }
    Ok(())
}

async fn compute_initial_sync_frame(room: &Arc<Room>) -> Vec<u8> {
    let doc = room.doc.lock().await;
    let txn = doc.transact();
    let sv = txn.state_vector();
    encode_sync_step_1(&sv)
}

async fn handle_incoming(room: &Arc<Room>, conn_id: u64, bytes: &[u8]) -> Result<Option<Vec<u8>>> {
    let mut decoder = DecoderV1::from(bytes);
    let msg_type = decoder.read_var::<u64>()?;

    match msg_type {
        MSG_SYNC => {
            let sub = decoder.read_var::<u64>()?;
            match sub {
                SYNC_STEP_1 => {
                    let payload = decoder.read_buf()?.to_vec();
                    let sv = StateVector::decode_v1(&payload)?;
                    let update_bytes = {
                        let doc = room.doc.lock().await;
                        let txn = doc.transact();
                        txn.encode_state_as_update_v1(&sv)
                    };
                    Ok(Some(encode_sync_step_2(&update_bytes)))
                }
                SYNC_STEP_2 | SYNC_UPDATE => {
                    let payload = decoder.read_buf()?.to_vec();
                    {
                        let doc = room.doc.lock().await;
                        let update = Update::decode_v1(&payload)?;
                        let mut txn = doc.transact_mut();
                        txn.apply_update(update)?;
                    }
                    relay_to_peers(room, conn_id, bytes);
                    Ok(None)
                }
                _ => Ok(None),
            }
        }
        MSG_AWARENESS => {
            relay_to_peers(room, conn_id, bytes);
            Ok(None)
        }
        _ => Ok(None),
    }
}

fn relay_to_peers(room: &Arc<Room>, from: u64, bytes: &[u8]) {
    let _ = room.yjs_broadcast.send(YjsBroadcast {
        from,
        bytes: Bytes::copy_from_slice(bytes),
    });
}

fn encode_sync_step_1(sv: &StateVector) -> Vec<u8> {
    let mut encoder = EncoderV1::new();
    encoder.write_var(MSG_SYNC);
    encoder.write_var(SYNC_STEP_1);
    let inner = sv.encode_v1();
    encoder.write_buf(&inner);
    encoder.to_vec()
}

fn encode_sync_step_2(update_bytes: &[u8]) -> Vec<u8> {
    let mut encoder = EncoderV1::new();
    encoder.write_var(MSG_SYNC);
    encoder.write_var(SYNC_STEP_2);
    encoder.write_buf(update_bytes);
    encoder.to_vec()
}
