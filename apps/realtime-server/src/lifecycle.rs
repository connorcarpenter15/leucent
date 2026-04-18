use std::time::Duration;

use anyhow::Result;
use tracing::{info, warn};
use uuid::Uuid;

use crate::persistence::{load_event_log, mark_completed};
use crate::state::AppState;

/// Flushes the interview's persisted event log to S3 and marks the row as
/// completed. Used by both the explicit `POST /internal/end/{id}` webhook and
/// the idle-room garbage collector. Idempotent: calling twice is a no-op.
pub async fn close_interview(state: &AppState, interview_id: Uuid) -> Result<()> {
    let Some(room) = state.rooms.get(&interview_id) else {
        return Ok(());
    };
    if room.is_closed().await {
        return Ok(());
    }
    room.mark_closed().await;

    let events = load_event_log(&state.pool, interview_id).await?;
    let key = format!("interviews/{interview_id}/replay.jsonl");

    if state.replay.enabled() {
        match state.replay.write_replay_log(&key, &events).await {
            Ok(()) => {
                info!(%interview_id, key, "wrote replay log to S3");
                mark_completed(&state.pool, interview_id, Some(&key)).await?;
            }
            Err(err) => {
                warn!(?err, %interview_id, "S3 flush failed; marking completed without replay key");
                mark_completed(&state.pool, interview_id, None).await?;
            }
        }
    } else {
        info!(%interview_id, "S3 disabled; skipping replay flush");
        mark_completed(&state.pool, interview_id, None).await?;
    }

    state.rooms.remove(&interview_id);
    Ok(())
}

/// Background task: every `gc_interval_secs`, scans all rooms and closes any
/// that have had zero connected clients for at least `idle_timeout_secs`. This
/// is the safety net behind the explicit-end webhook (see plan section 3B).
pub async fn run_idle_gc(state: AppState) {
    let interval = Duration::from_secs(state.cfg.gc_interval_secs);
    let timeout = state.cfg.idle_timeout_secs;
    loop {
        tokio::time::sleep(interval).await;
        for id in state.rooms.iter_ids() {
            let Some(room) = state.rooms.get(&id) else {
                continue;
            };
            if room.is_idle_for(timeout).await {
                info!(%id, "idle GC closing room");
                if let Err(err) = close_interview(&state, id).await {
                    warn!(?err, %id, "idle GC close failed");
                }
            }
        }
    }
}
