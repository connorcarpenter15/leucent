'use client';
import { createAuthClient } from '@neondatabase/auth/next';

/**
 * Neon Auth browser client. `createAuthClient()` takes no arguments in the
 * Next.js package — all calls are proxied through the `/api/auth/[...path]`
 * catch-all route handler, so the client doesn't need to know the Neon Auth
 * base URL.
 *
 * Organization methods (`authClient.organization.create`, `.setActive`,
 * `.inviteMember`, etc.) are included automatically when the Organization
 * plugin is enabled in Neon Console -> Auth -> Plugins.
 */
export const authClient = createAuthClient();

export const signIn = authClient.signIn;
export const signOut = authClient.signOut;
export const signUp = authClient.signUp;
export const useSession = authClient.useSession;
export const useActiveOrganization = authClient.useActiveOrganization;
export const useListOrganizations = authClient.useListOrganizations;
export const useActiveMemberRole = authClient.useActiveMemberRole;
