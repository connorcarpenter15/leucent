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
 * Creates a sandbox + ephemeral DB branch for an interview. The provisioner is
 * required to block until both the Neon branch passes a `SELECT 1` readiness
 * probe AND the in-container readiness check succeeds (see plan section 3D),
 * so when this call returns 200 the candidate environment is fully usable.
 */
export async function createSandbox(args: {
  interviewId: string;
  organizationId: string;
}): Promise<SandboxCreateResponse> {
  const base = requireSandboxUrl();
  const res = await fetch(`${base}/sandboxes`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${env().REALTIME_INTERNAL_TOKEN}`,
    },
    body: JSON.stringify({
      interview_id: args.interviewId,
      organization_id: args.organizationId,
    }),
  });
  if (!res.ok) {
    const detail = await safeText(res);
    throw new Error(`sandbox provisioner returned ${res.status}: ${detail}`);
  }
  return (await res.json()) as SandboxCreateResponse;
}

const DESTROY_SANDBOX_TIMEOUT_MS = 15_000;

export async function destroySandbox(sandboxId: string): Promise<void> {
  const base = requireSandboxUrl();
  const res = await fetch(`${base}/sandboxes/${sandboxId}`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${env().REALTIME_INTERNAL_TOKEN}` },
    signal: AbortSignal.timeout(DESTROY_SANDBOX_TIMEOUT_MS),
  });
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
