import { env } from './env';

/** Thin client for the Python sandbox provisioner service. */

export type SandboxCreateResponse = {
  sandbox_id: string;
  status: 'ready' | 'provisioning' | 'failed';
  database_url?: string;
  neon_branch_id?: string;
};

function requireSandboxUrl(): string {
  const url = env().SANDBOX_PROVISIONER_URL;
  if (!url) {
    throw new Error(
      'SANDBOX_PROVISIONER_URL is not configured. Set it in Doppler (prd) or .env.local ' +
        'before starting interviews. See DEPLOY.md section 4b for the expected value.',
    );
  }
  return url;
}

/**
 * WHATWG Fetch "bad ports" — Node's built-in fetch (undici) refuses to connect
 * to any of these and throws `TypeError: fetch failed` with cause "bad port"
 * before any TCP traffic happens. The list is from the Fetch spec
 * (https://fetch.spec.whatwg.org/#port-blocking) and includes legacy services
 * like X11 (6000) and FTP (21). If we see a sandbox URL pointing at one,
 * surface a clear configuration error instead of a confusing network error.
 */
const FETCH_BAD_PORTS = new Set([
  1, 7, 9, 11, 13, 15, 17, 19, 20, 21, 22, 23, 25, 37, 42, 43, 53, 69, 77, 79, 87, 95, 101, 102,
  103, 104, 109, 110, 111, 113, 115, 117, 119, 123, 135, 137, 139, 143, 161, 179, 389, 427, 465,
  512, 513, 514, 515, 526, 530, 531, 532, 540, 548, 554, 556, 563, 587, 601, 636, 989, 990, 993,
  995, 1719, 1720, 1723, 2049, 3659, 4045, 4190, 5060, 5061, 6000, 6566, 6665, 6666, 6667, 6668,
  6669, 6679, 6697, 10080,
]);

/**
 * Next.js API routes run in Node. Undici often resolves `localhost` to IPv6 (::1)
 * first; a typical uvicorn `--host 0.0.0.0` bind only accepts IPv4 — so
 * `fetch(http://localhost:6500/...)` fails with "fetch failed" while the
 * service is up. Force IPv4 loopback for outbound server-side calls.
 */
function outboundSandboxBase(raw: string): string {
  if (typeof window !== 'undefined') return raw;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return raw;
  }
  if (u.hostname === 'localhost') {
    u.hostname = '127.0.0.1';
  }
  const port = u.port ? Number(u.port) : u.protocol === 'https:' ? 443 : 80;
  if (FETCH_BAD_PORTS.has(port)) {
    throw new Error(
      `SANDBOX_PROVISIONER_URL points at port ${port}, which Node's built-in ` +
        `fetch refuses to connect to (WHATWG Fetch "bad ports" blocklist; port ` +
        `${port} is reserved for a legacy service such as X11). Move the ` +
        `provisioner to a different port (e.g. 6500) and update ` +
        `SANDBOX_PROVISIONER_URL accordingly.`,
    );
  }
  return u.href.replace(/\/?$/, '');
}

/**
 * Creates a sandbox + ephemeral DB branch for an interview. The provisioner is
 * required to block until both the Neon branch passes a `SELECT 1` readiness
 * probe AND the in-container readiness check succeeds (see plan section 3D),
 * so when this call returns 200 the candidate environment is fully usable.
 */
export async function createSandbox(args: {
  interviewId: string;
  organizationId: string;
  sandboxTemplate?: string;
}): Promise<SandboxCreateResponse> {
  const base = outboundSandboxBase(requireSandboxUrl());
  let res: Response;
  try {
    res = await fetch(`${base}/sandboxes`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${env().REALTIME_INTERNAL_TOKEN}`,
      },
      body: JSON.stringify({
        interview_id: args.interviewId,
        organization_id: args.organizationId,
        sandbox_template: args.sandboxTemplate ?? 'nodejs',
      }),
    });
  } catch (cause) {
    const origin = safeOrigin(base);
    const detail = describeFetchError(cause);
    throw new Error(
      `Cannot connect to sandbox provisioner${origin ? ` at ${origin}` : ''}. ` +
        `Verify the service is listening (e.g. \`lsof -iTCP -sTCP:LISTEN | grep 6500\`) ` +
        `and that SANDBOX_PROVISIONER_URL points to it. Underlying error: ${detail}`,
      { cause },
    );
  }
  if (!res.ok) {
    const detail = await safeText(res);
    throw new Error(`sandbox provisioner returned ${res.status}: ${detail}`);
  }
  return (await res.json()) as SandboxCreateResponse;
}

function safeOrigin(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return '';
  }
}

/**
 * Node's `fetch` (undici) wraps the real network failure in a generic
 * "fetch failed" Error and stashes the actionable detail (ECONNREFUSED,
 * EADDRNOTAVAIL, ENOTFOUND, ETIMEDOUT, etc.) on `error.cause`. Walk that
 * chain so callers see something they can act on.
 */
function describeFetchError(err: unknown): string {
  const parts: string[] = [];
  let cur: unknown = err;
  let depth = 0;
  while (cur && depth < 4) {
    if (cur instanceof Error) {
      const code = (cur as Error & { code?: string }).code;
      const errno = (cur as Error & { errno?: string | number }).errno;
      const syscall = (cur as Error & { syscall?: string }).syscall;
      const address = (cur as Error & { address?: string }).address;
      const port = (cur as Error & { port?: number }).port;
      const segs = [cur.message];
      if (code) segs.push(`code=${code}`);
      if (errno !== undefined) segs.push(`errno=${errno}`);
      if (syscall) segs.push(`syscall=${syscall}`);
      if (address) segs.push(`address=${address}${port ? `:${port}` : ''}`);
      parts.push(segs.join(' '));
      cur = (cur as Error & { cause?: unknown }).cause;
      depth += 1;
    } else {
      parts.push(String(cur));
      break;
    }
  }
  return parts.join(' <- ') || 'unknown';
}

const DESTROY_SANDBOX_TIMEOUT_MS = 15_000;

export async function destroySandbox(sandboxId: string): Promise<void> {
  const base = outboundSandboxBase(requireSandboxUrl());
  let res: Response;
  try {
    res = await fetch(`${base}/sandboxes/${sandboxId}`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${env().REALTIME_INTERNAL_TOKEN}` },
      signal: AbortSignal.timeout(DESTROY_SANDBOX_TIMEOUT_MS),
    });
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    throw new Error(`Cannot connect to sandbox provisioner for teardown: ${detail}`, { cause });
  }
  if (!res.ok) {
    const detail = await safeText(res);
    throw new Error(`sandbox destroy returned ${res.status}: ${detail}`);
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return '<no body>';
  }
}
