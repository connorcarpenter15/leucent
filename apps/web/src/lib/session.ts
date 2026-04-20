import { auth } from './auth';

/**
 * Returns the current session (or null) for a server component / route
 * handler. Unwraps Neon Auth's `{ data, error }` envelope so callers can keep
 * using the `session?.user` / `session.session.activeOrganizationId` shape
 * they did under Better Auth directly.
 *
 * NOTE: every page that (directly or indirectly) calls this MUST set
 * `export const dynamic = 'force-dynamic'` — Neon Auth reads auth cookies at
 * request time and cannot run during static optimization.
 */
export async function getSession() {
  const { data } = await auth.getSession();
  return data ?? null;
}

export async function requireSession() {
  const session = await getSession();
  if (!session?.user) {
    throw new Response('Unauthorized', { status: 401 });
  }
  return session;
}
