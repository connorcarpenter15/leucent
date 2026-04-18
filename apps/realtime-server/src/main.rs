mod auth;
mod config;
mod events_ws;
mod lifecycle;
mod persistence;
mod room;
mod routes;
mod state;
mod storage;
mod yjs_ws;

use std::sync::Arc;

use anyhow::Result;
use axum::routing::{get, post};
use axum::Router;
use sqlx::postgres::PgPoolOptions;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{fmt, prelude::*, EnvFilter};

use crate::config::Config;
use crate::lifecycle::run_idle_gc;
use crate::room::RoomRegistry;
use crate::routes::{
    health, internal_broadcast, internal_end, internal_snapshot, whoami, ws_events, ws_yjs,
};
use crate::state::AppState;
use crate::storage::ReplayStore;

#[tokio::main]
async fn main() -> Result<()> {
    let _ = dotenvy::dotenv();
    tracing_subscriber::registry()
        .with(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")))
        .with(fmt::layer().with_target(false))
        .init();

    let cfg = Arc::new(Config::from_env()?);
    let pool = PgPoolOptions::new()
        .max_connections(20)
        .connect(&cfg.database_url)
        .await?;
    let replay = Arc::new(ReplayStore::new(&cfg).await);

    let state = AppState {
        cfg: cfg.clone(),
        pool,
        rooms: Arc::new(RoomRegistry::new()),
        replay,
    };

    {
        let gc_state = state.clone();
        tokio::spawn(async move { run_idle_gc(gc_state).await });
    }

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_headers(Any)
        .allow_methods(Any);

    let app = Router::new()
        .route("/health", get(health))
        .route("/whoami", get(whoami))
        .route("/yjs/:interview_id", get(ws_yjs))
        .route("/events/:interview_id", get(ws_events))
        .route("/internal/snapshot/:interview_id", get(internal_snapshot))
        .route("/internal/end/:interview_id", post(internal_end))
        .route(
            "/internal/broadcast/:interview_id",
            post(internal_broadcast),
        )
        .with_state(state)
        .layer(cors)
        .layer(TraceLayer::new_for_http());

    let listener = tokio::net::TcpListener::bind(&cfg.bind_addr).await?;
    tracing::info!("realtime server listening on {}", cfg.bind_addr);
    axum::serve(listener, app).await?;
    Ok(())
}
