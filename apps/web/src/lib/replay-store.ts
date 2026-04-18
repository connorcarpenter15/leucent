import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { env } from './env';

let cached: S3Client | null = null;

function getClient(): S3Client | null {
  if (cached) return cached;
  const e = env();
  if (!e.S3_BUCKET || !e.S3_ACCESS_KEY_ID || !e.S3_SECRET_ACCESS_KEY) return null;
  cached = new S3Client({
    region: e.S3_REGION,
    endpoint: e.S3_ENDPOINT,
    forcePathStyle: Boolean(e.S3_ENDPOINT),
    credentials: {
      accessKeyId: e.S3_ACCESS_KEY_ID,
      secretAccessKey: e.S3_SECRET_ACCESS_KEY,
    },
  });
  return cached;
}

export type ReplayEvent = {
  ts: string;
  kind: string;
  actor: string;
  payload: Record<string, unknown>;
  seq: number;
};

/** Fetch a JSONL replay log from S3 and parse it into events. */
export async function fetchReplay(key: string): Promise<ReplayEvent[]> {
  const client = getClient();
  if (!client) return [];
  const e = env();
  const res = await client.send(new GetObjectCommand({ Bucket: e.S3_BUCKET, Key: key }));
  const body = await res.Body?.transformToString('utf-8');
  if (!body) return [];
  const events: ReplayEvent[] = [];
  for (const line of body.split('\n')) {
    if (!line.trim()) continue;
    try {
      events.push(JSON.parse(line) as ReplayEvent);
    } catch {
      /* ignore malformed line */
    }
  }
  return events;
}
