import { decodeJwt } from 'jose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const SECRET = 'test-realtime-secret-very-long-enough';

const ORIGINAL_ENV = { ...process.env };

beforeAll(() => {
  process.env.DATABASE_URL = 'postgres://x:y@localhost:5432/test';
  process.env.BETTER_AUTH_SECRET = 'aaaaaaaaaaaaaaaaaaaaaaaa';
  process.env.BETTER_AUTH_URL = 'http://localhost:3000';
  process.env.REALTIME_SERVER_URL = 'http://localhost:4000';
  process.env.REALTIME_INTERNAL_TOKEN = 'internal-token';
  process.env.REALTIME_JWT_SECRET = SECRET;
  process.env.AI_ORCHESTRATOR_URL = 'http://localhost:5000';
  process.env.SANDBOX_PROVISIONER_URL = 'http://localhost:6000';
  process.env.NEXT_PUBLIC_REALTIME_WS_URL = 'ws://localhost:4000';
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe('mintRealtimeToken / verifyRealtimeToken', () => {
  it('round-trips claims through HS256 with iss + aud baked in', async () => {
    const { mintRealtimeToken, verifyRealtimeToken } = await import('../../src/lib/realtime-token');
    const interviewId = '11111111-2222-4333-8444-555555555555';
    const token = await mintRealtimeToken({
      subject: 'user_123',
      interviewId,
      role: 'candidate',
      ttlSeconds: 60,
    });
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const decoded = decodeJwt(token);
    expect(decoded.iss).toBe('leucent-web');
    expect(decoded.aud).toBe('leucent-realtime');
    expect(decoded.sub).toBe('user_123');
    expect(decoded.interviewId).toBe(interviewId);
    expect(decoded.role).toBe('candidate');
    expect(decoded.exp! - decoded.iat!).toBe(60);

    const verified = await verifyRealtimeToken(token);
    expect(verified.role).toBe('candidate');
    expect(verified.interviewId).toBe(interviewId);
  });

  it('uses a one-hour default TTL', async () => {
    const { mintRealtimeToken } = await import('../../src/lib/realtime-token');
    const token = await mintRealtimeToken({
      subject: 'u',
      interviewId: '11111111-2222-4333-8444-555555555555',
      role: 'interviewer',
    });
    const decoded = decodeJwt(token);
    expect(decoded.exp! - decoded.iat!).toBe(3600);
  });

  it('produces a token that fails verification under a different secret', async () => {
    const { mintRealtimeToken } = await import('../../src/lib/realtime-token');
    const { jwtVerify } = await import('jose');
    const token = await mintRealtimeToken({
      subject: 'u',
      interviewId: '11111111-2222-4333-8444-555555555555',
      role: 'candidate',
    });
    const wrongSecret = new TextEncoder().encode('an-entirely-different-secret');
    await expect(
      jwtVerify(token, wrongSecret, {
        issuer: 'leucent-web',
        audience: 'leucent-realtime',
      }),
    ).rejects.toThrow();
  });

  it('produces a token that fails when audience or issuer does not match', async () => {
    const { mintRealtimeToken } = await import('../../src/lib/realtime-token');
    const { jwtVerify } = await import('jose');
    const token = await mintRealtimeToken({
      subject: 'u',
      interviewId: '11111111-2222-4333-8444-555555555555',
      role: 'candidate',
    });
    const correctSecret = new TextEncoder().encode(SECRET);
    await expect(
      jwtVerify(token, correctSecret, {
        issuer: 'wrong-iss',
        audience: 'leucent-realtime',
      }),
    ).rejects.toThrow();
  });
});
