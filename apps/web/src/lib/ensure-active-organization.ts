'use client';

import { authClient } from './auth-client';

export type EnsureOrgResult = { ok: true } | { ok: false; message: string };

/**
 * Ensures the Neon Auth session has an active organization when the user
 * belongs to at least one org. Server routes such as POST /api/interviews read
 * `session.session.activeOrganizationId`; without it, requests fail with
 * "No active organization".
 */
export async function ensureActiveOrganization(): Promise<EnsureOrgResult> {
  const sessionRes = await authClient.getSession();
  if (sessionRes.error || !sessionRes.data?.user) {
    return { ok: false, message: 'You need to sign in again.' };
  }
  if (sessionRes.data.session.activeOrganizationId) {
    return { ok: true };
  }

  const listRes = await authClient.organization.list();
  if (listRes.error) {
    return {
      ok: false,
      message: 'Could not load your organizations. Try signing out and back in.',
    };
  }

  const orgs = listRes.data ?? [];
  const firstOrg = orgs[0];
  if (!firstOrg) {
    return {
      ok: false,
      message: 'Create an organization before scheduling interviews.',
    };
  }

  const setRes = await authClient.organization.setActive({
    organizationId: firstOrg.id,
  });
  if (setRes.error) {
    return {
      ok: false,
      message: 'Could not activate your organization. Try signing out and back in.',
    };
  }

  return { ok: true };
}
