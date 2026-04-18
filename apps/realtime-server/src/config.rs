use anyhow::{Context, Result};
use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub bind_addr: String,
    pub jwt_secret: String,
    pub internal_token: String,
    pub database_url: String,
    pub s3_bucket: Option<String>,
    pub s3_region: String,
    pub s3_endpoint: Option<String>,
    pub s3_access_key_id: Option<String>,
    pub s3_secret_access_key: Option<String>,
    pub idle_timeout_secs: u64,
    pub gc_interval_secs: u64,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        let bind_addr = env::var("BIND_ADDR").unwrap_or_else(|_| "0.0.0.0:4000".into());
        let jwt_secret =
            env::var("REALTIME_JWT_SECRET").context("REALTIME_JWT_SECRET is required")?;
        let internal_token =
            env::var("REALTIME_INTERNAL_TOKEN").context("REALTIME_INTERNAL_TOKEN is required")?;
        let database_url = env::var("DATABASE_URL").context("DATABASE_URL is required")?;
        let s3_bucket = env::var("S3_BUCKET").ok();
        let s3_region = env::var("S3_REGION").unwrap_or_else(|_| "us-east-1".into());
        let s3_endpoint = env::var("S3_ENDPOINT").ok();
        let s3_access_key_id = env::var("S3_ACCESS_KEY_ID").ok();
        let s3_secret_access_key = env::var("S3_SECRET_ACCESS_KEY").ok();
        let idle_timeout_secs = env::var("IDLE_TIMEOUT_SECS")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(15 * 60);
        let gc_interval_secs = env::var("GC_INTERVAL_SECS")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(60);

        Ok(Self {
            bind_addr,
            jwt_secret,
            internal_token,
            database_url,
            s3_bucket,
            s3_region,
            s3_endpoint,
            s3_access_key_id,
            s3_secret_access_key,
            idle_timeout_secs,
            gc_interval_secs,
        })
    }
}
