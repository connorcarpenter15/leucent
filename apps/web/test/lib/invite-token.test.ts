import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { generateInviteToken, hashInviteToken } from '../../src/lib/invite-token';

describe('hashInviteToken', () => {
  it('returns a 64-char lowercase SHA-256 hex digest', () => {
    const hash = hashInviteToken('hello');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toBe(createHash('sha256').update('hello').digest('hex'));
  });

  it('is deterministic', () => {
    expect(hashInviteToken('same-input')).toBe(hashInviteToken('same-input'));
  });

  it('produces different digests for different inputs', () => {
    expect(hashInviteToken('a')).not.toBe(hashInviteToken('b'));
  });
});

describe('generateInviteToken', () => {
  it('returns a token paired with its SHA-256 hash', () => {
    const { token, hash } = generateInviteToken();
    expect(hash).toBe(hashInviteToken(token));
  });

  it('returns a base64url token (no padding, url-safe alphabet)', () => {
    const { token } = generateInviteToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(token.endsWith('=')).toBe(false);
  });

  it('generates ~32 bytes of entropy (~43-char base64url)', () => {
    const { token } = generateInviteToken();
    expect(token.length).toBeGreaterThanOrEqual(42);
    expect(token.length).toBeLessThanOrEqual(44);
  });

  it('returns a unique token on each call', () => {
    const tokens = new Set(Array.from({ length: 50 }, () => generateInviteToken().token));
    expect(tokens.size).toBe(50);
  });
});
