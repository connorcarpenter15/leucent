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
 *
 * **Local dev:** when `NEON_AUTH_*` are unset, `env()` falls back to a dummy
 * `http://localhost:9999/...` base URL. Nothing listens there, so
 * `auth.getSession()` throws `TypeError: fetch failed` / `ECONNREFUSED`. In
 * non-production we treat unreachable-auth as "signed out" and log once so
 * `pnpm dev` works before `.env.local` is filled. Production still surfaces
 * failures — an outage must not silently log everyone out.
 */
let warnedAboutUnreachableAuth = false;

export async function getSession() {
  try {
    const { data } = await auth.getSession();
    return data ?? null;
  } catch (err) {
    if (process.env.NODE_ENV === 'production' || !isUnreachableNetworkError(err)) {
      throw err;
    }
    if (!warnedAboutUnreachableAuth) {
      warnedAboutUnreachableAuth = true;
      console.warn(
        '[auth] Could not reach NEON_AUTH_BASE_URL (fetch failed). Treating requests as ' +
          'signed out. Add real `NEON_AUTH_BASE_URL` + `NEON_AUTH_COOKIE_SECRET` to ' +
          'apps/web/.env.local — see repo root `.env.example`.',
      );
    }
    return null;
  }
}

export async function requireSession() {
  const session = await getSession();
  if (!session?.user) {
    throw new Response('Unauthorized', { status: 401 });
  }
  return session;
}

/** True when Node/undici could not open a TCP connection to the auth host. */
const CONNECT_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ETIMEDOUT',
  'UND_ERR_SOCKET',
]);

function isUnreachableNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  // undici: "fetch failed" + AggregateError in `cause`, or nested `cause.code`.
  if (err.name !== 'TypeError' || err.message !== 'fetch failed') {
    return false;
  }
  return walkErrorCauses(err).some(
    (c) =>
      typeof c === 'object' &&
      c !== null &&
      'code' in c &&
      typeof (c as { code: unknown }).code === 'string' &&
      CONNECT_CODES.has((c as { code: string }).code),
  );
}

function walkErrorCauses(root: unknown): unknown[] {
  const out: unknown[] = [];
  const seen = new Set<unknown>();
  const visit = (e: unknown) => {
    if (e == null || typeof e !== 'object' || seen.has(e)) return;
    seen.add(e);
    out.push(e);
    if (e instanceof AggregateError) {
      for (const sub of e.errors) visit(sub);
    }
    const cause = (e as { cause?: unknown }).cause;
    if (cause !== undefined) visit(cause);
  };
  visit(root);
  return out;
}
