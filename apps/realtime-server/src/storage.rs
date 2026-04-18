use anyhow::{Context, Result};
use aws_sdk_s3::config::{Credentials, Region};
use aws_sdk_s3::primitives::ByteStream;
use aws_sdk_s3::Client;
use serde_json::Value;

use crate::config::Config;

/// Lazily-constructed S3 client. Configured to talk to MinIO in dev (force
/// path-style + custom endpoint) and to AWS S3 / R2 in prod.
pub struct ReplayStore {
    client: Option<Client>,
    bucket: Option<String>,
}

impl ReplayStore {
    pub async fn new(cfg: &Config) -> Self {
        let bucket = cfg.s3_bucket.clone();
        let client = if let (Some(key), Some(secret)) = (
            cfg.s3_access_key_id.clone(),
            cfg.s3_secret_access_key.clone(),
        ) {
            let creds = Credentials::new(key, secret, None, None, "bleucent");
            let conf_loader = aws_config::defaults(aws_config::BehaviorVersion::latest())
                .region(Region::new(cfg.s3_region.clone()))
                .credentials_provider(creds);
            let conf_loader = if let Some(endpoint) = cfg.s3_endpoint.clone() {
                conf_loader.endpoint_url(endpoint)
            } else {
                conf_loader
            };
            let sdk_config = conf_loader.load().await;
            let mut s3_builder = aws_sdk_s3::config::Builder::from(&sdk_config);
            if cfg.s3_endpoint.is_some() {
                s3_builder = s3_builder.force_path_style(true);
            }
            Some(Client::from_conf(s3_builder.build()))
        } else {
            None
        };
        Self { client, bucket }
    }

    pub fn enabled(&self) -> bool {
        self.client.is_some() && self.bucket.is_some()
    }

    /// Writes a JSONL-encoded event log to s3://{bucket}/{key}. Returns the key.
    pub async fn write_replay_log(&self, key: &str, events: &[Value]) -> Result<()> {
        let (Some(client), Some(bucket)) = (self.client.as_ref(), self.bucket.as_ref()) else {
            anyhow::bail!("S3 not configured; refusing to write replay log");
        };
        let mut buf = Vec::with_capacity(events.len() * 256);
        for event in events {
            let line = serde_json::to_vec(event).context("serializing event")?;
            buf.extend_from_slice(&line);
            buf.push(b'\n');
        }
        client
            .put_object()
            .bucket(bucket)
            .key(key)
            .body(ByteStream::from(buf))
            .content_type("application/x-ndjson")
            .send()
            .await
            .context("S3 PUT failed")?;
        Ok(())
    }
}
