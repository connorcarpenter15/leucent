import { SignJWT, jwtVerify } from 'jose';
import { env } from './env';

const ISSUER = 'leucent-web';
const AUDIENCE = 'leucent-realtime';

function secretKey(): Uint8Array {
  return new TextEncoder().encode(env().REALTIME_JWT_SECRET);
}

export type RealtimeRole = 'candidate' | 'interviewer';

/**
 * Mints a short-lived JWT used to authenticate WebSocket upgrades against the
 * Rust realtime server. Carries the interview id and the participant role.
 */
export async function mintRealtimeToken(args: {
  subject: string;
  interviewId: string;
  role: RealtimeRole;
  userId?: string | null;
  ttlSeconds?: number;
}): Promise<string> {
  const ttl = args.ttlSeconds ?? 60 * 60;
  return await new SignJWT({
    interviewId: args.interviewId,
    role: args.role,
    ...(args.userId ? { userId: args.userId } : {}),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setSubject(args.subject)
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .sign(secretKey());
}

export async function verifyRealtimeToken(token: string) {
  const { payload } = await jwtVerify(token, secretKey(), {
    issuer: ISSUER,
    audience: AUDIENCE,
  });
  return payload as {
    sub: string;
    interviewId: string;
    role: RealtimeRole;
    userId?: string;
    iat: number;
    exp: number;
  };
}
