import { createNeonAuth } from '@neondatabase/auth/next/server';
import { env } from './env';

/**
 * Neon Auth (Beta) server instance. The underlying auth server (Better Auth) is
 * managed by Neon — password policy, session TTL, org limits, OAuth providers
 * and the Organization plugin are configured per-branch in
 * Neon Console -> Auth -> Plugins rather than in code.
 *
 * `.handler()` is mounted at `app/api/auth/[...path]/route.ts`, and server
 * components/route handlers call `auth.getSession()` (which requires
 * `export const dynamic = 'force-dynamic'` on pages).
 */
export const auth = createNeonAuth({
  baseUrl: env().NEON_AUTH_BASE_URL,
  cookies: { secret: env().NEON_AUTH_COOKIE_SECRET },
});

export type Auth = typeof auth;
