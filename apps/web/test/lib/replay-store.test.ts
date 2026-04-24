import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

const sendMock = vi.fn();
const ctorMock = vi.fn();

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class {
    constructor(args: unknown) {
      ctorMock(args);
    }
    send = sendMock;
  },
  GetObjectCommand: class {
    public input: unknown;
    constructor(args: unknown) {
      this.input = args;
    }
  },
}));

function bodyFromString(text: string) {
  return { transformToString: async () => text };
}

beforeEach(() => {
  vi.resetModules();
  sendMock.mockReset();
  ctorMock.mockReset();
  // Build a clean env that omits every S3_* variable so each test can opt in.
  const cleaned = { ...ORIGINAL_ENV };
  for (const k of Object.keys(cleaned)) {
    if (k.startsWith('S3_')) delete cleaned[k];
  }
  process.env = {
    ...cleaned,
    DATABASE_URL: 'postgres://u:p@h/d',
    NEON_AUTH_BASE_URL: 'http://localhost:9999/dev-neon-auth',
    NEON_AUTH_COOKIE_SECRET: 'test-neon-auth-cookie-secret-32-bytes-ok',
    REALTIME_SERVER_URL: 'http://localhost:4000',
    REALTIME_INTERNAL_TOKEN: 'internal',
    REALTIME_JWT_SECRET: 'jwt-secret-very-long-enough',
    AI_ORCHESTRATOR_URL: 'http://localhost:5050',
    SANDBOX_PROVISIONER_URL: 'http://localhost:6500',
    NEXT_PUBLIC_REALTIME_WS_URL: 'ws://localhost:4000',
  };
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('fetchReplay', () => {
  it('returns [] when S3 credentials are unset', async () => {
    const { fetchReplay } = await import('../../src/lib/replay-store');
    const events = await fetchReplay('any/key.jsonl');
    expect(events).toEqual([]);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('parses JSONL into ReplayEvent[] when S3 returns a body', async () => {
    process.env.S3_BUCKET = 'replays';
    process.env.S3_ACCESS_KEY_ID = 'k';
    process.env.S3_SECRET_ACCESS_KEY = 's';
    process.env.S3_ENDPOINT = 'http://localhost:9000';
    sendMock.mockResolvedValue({
      Body: bodyFromString(
        [
          JSON.stringify({
            ts: '2026-04-18T00:00:00Z',
            kind: 'presence',
            actor: 'candidate',
            payload: {},
            seq: 1,
          }),
          JSON.stringify({
            ts: '2026-04-18T00:00:01Z',
            kind: 'code_edit',
            actor: 'candidate',
            payload: { path: 'a.ts' },
            seq: 2,
          }),
          '',
        ].join('\n'),
      ),
    });

    const { fetchReplay } = await import('../../src/lib/replay-store');
    const events = await fetchReplay('iv/log.jsonl');
    expect(events).toHaveLength(2);
    expect(events[0].kind).toBe('presence');
    expect(events[1].seq).toBe(2);
  });

  it('skips malformed JSON lines and returns the rest', async () => {
    process.env.S3_BUCKET = 'replays';
    process.env.S3_ACCESS_KEY_ID = 'k';
    process.env.S3_SECRET_ACCESS_KEY = 's';
    sendMock.mockResolvedValue({
      Body: bodyFromString(
        [
          JSON.stringify({
            ts: '2026-04-18T00:00:00Z',
            kind: 'a',
            actor: 'system',
            payload: {},
            seq: 1,
          }),
          '{not json',
          JSON.stringify({
            ts: '2026-04-18T00:00:02Z',
            kind: 'b',
            actor: 'system',
            payload: {},
            seq: 3,
          }),
        ].join('\n'),
      ),
    });
    const { fetchReplay } = await import('../../src/lib/replay-store');
    const events = await fetchReplay('iv/log.jsonl');
    expect(events.map((e) => e.kind)).toEqual(['a', 'b']);
  });

  it('returns [] when the body is empty/undefined', async () => {
    process.env.S3_BUCKET = 'replays';
    process.env.S3_ACCESS_KEY_ID = 'k';
    process.env.S3_SECRET_ACCESS_KEY = 's';
    sendMock.mockResolvedValue({ Body: undefined });
    const { fetchReplay } = await import('../../src/lib/replay-store');
    expect(await fetchReplay('k')).toEqual([]);
  });

  it('configures the S3 client with forcePathStyle when a custom endpoint is set', async () => {
    process.env.S3_BUCKET = 'replays';
    process.env.S3_ACCESS_KEY_ID = 'k';
    process.env.S3_SECRET_ACCESS_KEY = 's';
    process.env.S3_ENDPOINT = 'http://localhost:9000';
    sendMock.mockResolvedValue({ Body: bodyFromString('') });
    const { fetchReplay } = await import('../../src/lib/replay-store');
    await fetchReplay('k');
    expect(ctorMock).toHaveBeenCalledTimes(1);
    expect(ctorMock.mock.calls[0][0]).toMatchObject({
      endpoint: 'http://localhost:9000',
      forcePathStyle: true,
    });
  });
});
