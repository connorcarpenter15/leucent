use axum::extract::ws::WebSocketUpgrade;
use axum::extract::{Path, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::Json;
use chrono::Utc;
use serde::Deserialize;
use serde_json::json;
use tracing::{info, warn};
use uuid::Uuid;

use crate::auth::{decode_token, Role};
use crate::events_ws::run_events_ws;
use crate::lifecycle::close_interview;
use crate::state::AppState;
use crate::yjs_ws::run_yjs_ws;

#[derive(Deserialize)]
pub struct WsAuthQuery {
    pub token: String,
}

pub async fn health() -> &'static str {
    "ok"
}

pub async fn ws_yjs(
    Path(interview_id): Path<Uuid>,
    Query(q): Query<WsAuthQuery>,
    State(state): State<AppState>,
    ws: WebSocketUpgrade,
) -> Result<axum::response::Response, (StatusCode, String)> {
    let claims = decode_token(&q.token, &state.cfg.jwt_secret)
        .map_err(|e| (StatusCode::UNAUTHORIZED, format!("invalid token: {e}")))?;
    if claims.interview_id != interview_id {
        return Err((StatusCode::FORBIDDEN, "token interview_id mismatch".into()));
    }
    let room = state.rooms.get_or_create(interview_id);
    let response = ws.on_upgrade(move |socket| async move {
        room.client_connected().await;
        let result = run_yjs_ws(socket, room.clone()).await;
        room.client_disconnected().await;
        if let Err(err) = result {
            warn!(?err, %interview_id, "yjs ws closed with error");
        }
    });
    Ok(response)
}

pub async fn ws_events(
    Path(interview_id): Path<Uuid>,
    Query(q): Query<WsAuthQuery>,
    State(state): State<AppState>,
    ws: WebSocketUpgrade,
) -> Result<axum::response::Response, (StatusCode, String)> {
    let claims = decode_token(&q.token, &state.cfg.jwt_secret)
        .map_err(|e| (StatusCode::UNAUTHORIZED, format!("invalid token: {e}")))?;
    if claims.interview_id != interview_id {
        return Err((StatusCode::FORBIDDEN, "token interview_id mismatch".into()));
    }
    let room = state.rooms.get_or_create(interview_id);
    let pool = state.pool.clone();
    let role = claims.role;
    let subject = claims.sub.clone();
    let response = ws.on_upgrade(move |socket| async move {
        room.client_connected().await;
        run_events_ws(socket, room.clone(), pool, role, interview_id, subject).await;
        room.client_disconnected().await;
    });
    Ok(response)
}

fn require_internal(headers: &HeaderMap, expected: &str) -> Result<(), (StatusCode, String)> {
    let auth = headers
        .get(axum::http::header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");
    if auth != format!("Bearer {expected}") {
        return Err((StatusCode::UNAUTHORIZED, "internal token required".into()));
    }
    Ok(())
}

/// `GET /internal/snapshot/{interview_id}` — consumed by the AI orchestrator.
/// Walks the canvas + code sub-docs, serializes them to plain JSON.
pub async fn internal_snapshot(
    Path(interview_id): Path<Uuid>,
    headers: HeaderMap,
    State(state): State<AppState>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    require_internal(&headers, &state.cfg.internal_token)?;

    let Some(room) = state.rooms.get(&interview_id) else {
        return Err((StatusCode::NOT_FOUND, "no live room".into()));
    };
    let canvas = room.snapshot_canvas().await;
    let code = room.snapshot_code().await;
    Ok(Json(json!({
        "interviewId": interview_id,
        "capturedAt": Utc::now(),
        "canvas": canvas,
        "code": code,
    })))
}

/// `POST /internal/end/{interview_id}` — explicit close webhook from the
/// Next.js app. Flushes the event log to S3 and marks the room closed.
/// This is the canonical close path.
pub async fn internal_end(
    Path(interview_id): Path<Uuid>,
    headers: HeaderMap,
    State(state): State<AppState>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    require_internal(&headers, &state.cfg.internal_token)?;
    info!(%interview_id, "explicit end requested");
    close_interview(&state, interview_id)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    Ok(Json(json!({ "status": "closed" })))
}

#[derive(Deserialize)]
pub struct InternalBroadcastBody {
    pub kind: String,
    pub actor: String,
    pub payload: serde_json::Value,
}

/// `POST /internal/broadcast/{interview_id}` — used by the AI orchestrator to
/// mirror streamed AI response chunks onto the telemetry channel so the interviewer console
/// sees them in the same action log as the candidate.
pub async fn internal_broadcast(
    Path(interview_id): Path<Uuid>,
    headers: HeaderMap,
    State(state): State<AppState>,
    Json(body): Json<InternalBroadcastBody>,
) -> Result<StatusCode, (StatusCode, String)> {
    require_internal(&headers, &state.cfg.internal_token)?;
    let Some(room) = state.rooms.get(&interview_id) else {
        return Err((StatusCode::NOT_FOUND, "no live room".into()));
    };
    let seq = room.next_seq().await;
    let ts = Utc::now();
    let _ = room.events.send(crate::room::TelemetryFanout {
        kind: body.kind.clone(),
        actor: body.actor.clone(),
        ts,
        payload: body.payload.clone(),
        seq,
    });
    let pool = state.pool.clone();
    tokio::spawn(async move {
        if let Err(err) = crate::persistence::insert_event(
            &pool,
            interview_id,
            ts,
            &body.kind,
            &body.actor,
            &body.payload,
            seq,
        )
        .await
        {
            warn!(?err, "internal broadcast persistence failed");
        }
    });
    Ok(StatusCode::ACCEPTED)
}

/// Helper used by tests / scripts to confirm the role of a token.
pub async fn whoami(
    Query(q): Query<WsAuthQuery>,
    State(state): State<AppState>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    let claims = decode_token(&q.token, &state.cfg.jwt_secret)
        .map_err(|e| (StatusCode::UNAUTHORIZED, format!("invalid: {e}")))?;
    Ok(Json(json!({
        "interviewId": claims.interview_id,
        "role": match claims.role { Role::Candidate => "candidate", Role::Interviewer => "interviewer" },
        "sub": claims.sub,
    })))
}
