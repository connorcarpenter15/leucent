import { env } from './env';

/** Thin client for service-to-service calls to the Rust realtime server. */

const END_REALTIME_TIMEOUT_MS = 15_000;

export async function endRealtimeSession(interviewId: string): Promise<void> {
  const base = env().REALTIME_SERVER_URL;
  if (!base) {
    throw new Error(
      'REALTIME_SERVER_URL is not configured. Set it in Doppler (prd) or .env.local ' +
        'so the web app can reach the realtime service.',
    );
  }
  const res = await fetch(`${base}/internal/end/${interviewId}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${env().REALTIME_INTERNAL_TOKEN}` },
    signal: AbortSignal.timeout(END_REALTIME_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`realtime end webhook returned ${res.status}`);
  }
}
