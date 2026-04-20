import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

function clearRequiredEnv() {
  for (const key of [
    'DATABASE_URL',
    'NEON_AUTH_BASE_URL',
    'NEON_AUTH_COOKIE_SECRET',
    'REALTIME_SERVER_URL',
    'REALTIME_INTERNAL_TOKEN',
    'REALTIME_JWT_SECRET',
    'AI_ORCHESTRATOR_URL',
    'SANDBOX_PROVISIONER_URL',
    'NEXT_PUBLIC_REALTIME_WS_URL',
    'NODE_ENV',
  ]) {
    delete process.env[key];
  }
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('env()', () => {
  it('returns dev defaults when required vars are missing in non-production', async () => {
    clearRequiredEnv();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { env } = await import('../../src/lib/env');
    const e = env();
    expect(e.DATABASE_URL).toMatch(/^postgres:\/\//);
    expect(e.NEON_AUTH_BASE_URL).toMatch(/^https?:\/\//);
    expect(e.NEON_AUTH_COOKIE_SECRET.length).toBeGreaterThanOrEqual(32);
    expect(e.REALTIME_JWT_SECRET.length).toBeGreaterThanOrEqual(16);
    expect(warn).toHaveBeenCalled();
  });

  it('returns the parsed values when env is fully configured', async () => {
    clearRequiredEnv();
    process.env.DATABASE_URL = 'postgres://u:p@h:5432/db';
    process.env.NEON_AUTH_BASE_URL = 'https://auth.example.com/neondb/auth';
    process.env.NEON_AUTH_COOKIE_SECRET = 'test-cookie-secret-32-characters-long-ok';
    process.env.REALTIME_SERVER_URL = 'http://realtime.example.com';
    process.env.REALTIME_INTERNAL_TOKEN = 'internal-token-x';
    process.env.REALTIME_JWT_SECRET = 'jwt-secret-very-long-here';
    process.env.AI_ORCHESTRATOR_URL = 'http://ai.example.com';
    process.env.SANDBOX_PROVISIONER_URL = 'http://sbx.example.com';
    process.env.NEXT_PUBLIC_REALTIME_WS_URL = 'ws://realtime.example.com';

    const { env } = await import('../../src/lib/env');
    const e = env();
    expect(e.DATABASE_URL).toBe('postgres://u:p@h:5432/db');
    expect(e.NEON_AUTH_BASE_URL).toBe('https://auth.example.com/neondb/auth');
    expect(e.S3_REGION).toBe('us-east-1');
  });

  it('service URLs (realtime/ai/sandbox/ws) are optional and may be undefined', async () => {
    clearRequiredEnv();
    process.env.DATABASE_URL = 'postgres://u:p@h:5432/db';
    process.env.NEON_AUTH_BASE_URL = 'https://auth.example.com/neondb/auth';
    process.env.NEON_AUTH_COOKIE_SECRET = 'test-cookie-secret-32-characters-long-ok';
    process.env.REALTIME_INTERNAL_TOKEN = 'internal-token-x';
    process.env.REALTIME_JWT_SECRET = 'jwt-secret-very-long-here';
    const { env } = await import('../../src/lib/env');
    const e = env();
    expect(e.REALTIME_SERVER_URL).toBeUndefined();
    expect(e.AI_ORCHESTRATOR_URL).toBeUndefined();
    expect(e.SANDBOX_PROVISIONER_URL).toBeUndefined();
    expect(e.NEXT_PUBLIC_REALTIME_WS_URL).toBeUndefined();
  });

  it('throws in production when required vars are missing and includes field errors in the message', async () => {
    clearRequiredEnv();
    process.env.NODE_ENV = 'production';
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { env } = await import('../../src/lib/env');
    try {
      env();
      throw new Error('expected env() to throw');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      expect(msg).toMatch(/Invalid environment configuration/);
      // The thrown message must self-diagnose which var was missing.
      expect(msg).toMatch(/NEON_AUTH_BASE_URL|DATABASE_URL/);
    }
  });

  it('does not throw during `next build` even when required vars are missing', async () => {
    clearRequiredEnv();
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PHASE = 'phase-production-build';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const { env } = await import('../../src/lib/env');
      const e = env();
      expect(e.DATABASE_URL).toMatch(/^postgres:\/\//);
      expect(e.NEON_AUTH_BASE_URL).toMatch(/^https?:\/\//);
      expect(warn).toHaveBeenCalled();
    } finally {
      delete process.env.NEXT_PHASE;
    }
  });

  it('caches the result across calls', async () => {
    clearRequiredEnv();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { env } = await import('../../src/lib/env');
    const a = env();
    const b = env();
    expect(a).toBe(b);
  });
});
