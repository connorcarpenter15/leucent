'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, Field, Input } from '@leucent/ui';
import {
  authClient,
  useActiveMemberRole,
  useActiveOrganization,
  useListOrganizations,
  useSession,
} from '@/lib/auth-client';
import { messageFromAuthError } from '@/lib/auth-errors';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
}

function canManageOrg(role: string | undefined): boolean {
  return role === 'owner' || role === 'admin';
}

export function OrganizationSettingsPanel() {
  const router = useRouter();
  const { data: session } = useSession();
  const activeOrgId = session?.session.activeOrganizationId ?? null;
  const { data: orgs, isPending: orgsLoading, refetch: refetchOrgs } = useListOrganizations();
  const {
    data: activeOrg,
    isPending: activeLoading,
    refetch: refetchActive,
  } = useActiveOrganization();
  const { data: memberRoleData } = useActiveMemberRole();
  const role = memberRoleData?.role;
  const manage = canManageOrg(role);

  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [orgSaveError, setOrgSaveError] = useState<string | null>(null);
  const [orgSaveOk, setOrgSaveOk] = useState<string | null>(null);
  const [orgSaving, setOrgSaving] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteOk, setInviteOk] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const activeId = activeOrg?.id ?? activeOrgId;

  useEffect(() => {
    if (activeOrg) {
      setOrgName(activeOrg.name);
      setOrgSlug(activeOrg.slug);
    }
  }, [activeOrg?.id, activeOrg?.name, activeOrg?.slug]);

  async function switchOrganization(organizationId: string) {
    setSwitchingId(organizationId);
    setSwitchError(null);
    try {
      const res = await authClient.organization.setActive({ organizationId });
      if (res.error) {
        setSwitchError(messageFromAuthError(res.error, 'Could not switch workspace. Try again.'));
        return;
      }
      await refetchOrgs();
      await refetchActive();
      router.refresh();
    } finally {
      setSwitchingId(null);
    }
  }

  async function onOrgDetailsSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeOrg || !manage) return;
    setOrgSaveError(null);
    setOrgSaveOk(null);
    setOrgSaving(true);
    try {
      const slug = slugify(orgSlug.trim()) || activeOrg.slug;
      const res = await authClient.organization.update({
        organizationId: activeOrg.id,
        data: {
          name: orgName.trim() || activeOrg.name,
          slug,
        },
      });
      if (res.error) {
        setOrgSaveError(
          messageFromAuthError(res.error, 'Could not update organization. Try again.'),
        );
        return;
      }
      setOrgSaveOk('Organization updated.');
      setOrgSlug(res.data?.slug ?? slug);
      await refetchOrgs();
      await refetchActive();
      router.refresh();
    } finally {
      setOrgSaving(false);
    }
  }

  async function onInviteSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeOrg || !manage) return;
    setInviteError(null);
    setInviteOk(null);
    setInviteLoading(true);
    try {
      const res = await authClient.organization.inviteMember({
        email: inviteEmail.trim(),
        role: inviteRole,
        organizationId: activeOrg.id,
      });
      if (res.error) {
        setInviteError(
          messageFromAuthError(res.error, 'Could not send invitation. Check the email address.'),
        );
        return;
      }
      setInviteOk('Invitation sent.');
      setInviteEmail('');
      await refetchActive();
    } finally {
      setInviteLoading(false);
    }
  }

  async function cancelInvitation(invitationId: string) {
    setCancelingId(invitationId);
    try {
      const res = await authClient.organization.cancelInvitation({ invitationId });
      if (!res.error) {
        await refetchActive();
      }
    } finally {
      setCancelingId(null);
    }
  }

  if (orgsLoading && !orgs?.length) {
    return <p className="text-sm text-surface-400">Loading organizations…</p>;
  }

  if (!orgs?.length) {
    return (
      <Card tone="raised">
        <CardBody className="text-sm text-surface-300">
          <p>You are not a member of any organization yet.</p>
          <p className="mt-2">
            <Link href="/signup" className="text-accent-300">
              Create an account and workspace
            </Link>{' '}
            or ask your admin for an invite.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Your workspaces</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          <p className="text-sm text-surface-400">
            The active workspace is used for new interviews and the dashboard.
          </p>
          <ul className="divide-y divide-surface-800 rounded-lg border border-surface-800">
            {orgs.map((o) => {
              const isActive = o.id === activeId;
              return (
                <li
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div>
                    <div className="font-medium text-surface-100">{o.name}</div>
                    <div className="text-xs text-surface-500">
                      <span className="font-mono">{o.slug}</span>
                      {isActive && (
                        <Badge tone="accent" className="ml-2">
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                  {!isActive && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={switchingId !== null}
                      onClick={() => void switchOrganization(o.id)}
                    >
                      {switchingId === o.id ? 'Switching…' : 'Switch here'}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
          {switchError && <p className="text-sm text-red-400">{switchError}</p>}
        </CardBody>
      </Card>

      {activeLoading && !activeOrg ? (
        <p className="text-sm text-surface-400">Loading active workspace…</p>
      ) : activeOrg ? (
        <>
          <Card tone="raised">
            <CardHeader>
              <CardTitle>Workspace details</CardTitle>
              {role && (
                <Badge tone="neutral" dot>
                  {role}
                </Badge>
              )}
            </CardHeader>
            <CardBody className="space-y-4">
              {!manage && (
                <p className="text-sm text-surface-400">
                  Only owners and admins can rename the workspace or send invitations.
                </p>
              )}
              {manage ? (
                <form className="flex max-w-lg flex-col gap-4" onSubmit={onOrgDetailsSubmit}>
                  <Field label="Workspace name">
                    <Input
                      value={orgName}
                      onChange={(ev) => setOrgName(ev.target.value)}
                      autoComplete="organization"
                    />
                  </Field>
                  <Field
                    label="URL slug"
                    hint="Lowercase letters, numbers, and hyphens. Used in URLs and integrations."
                  >
                    <Input
                      value={orgSlug}
                      onChange={(ev) => setOrgSlug(ev.target.value)}
                      autoComplete="off"
                    />
                  </Field>
                  {orgSaveError && <p className="text-sm text-red-400">{orgSaveError}</p>}
                  {orgSaveOk && <p className="text-sm text-emerald-400/90">{orgSaveOk}</p>}
                  <div>
                    <Button type="submit" disabled={orgSaving}>
                      {orgSaving ? 'Saving…' : 'Save workspace'}
                    </Button>
                  </div>
                </form>
              ) : (
                <dl className="grid gap-3 text-sm">
                  <div>
                    <dt className="text-surface-500">Name</dt>
                    <dd className="text-surface-100">{activeOrg.name}</dd>
                  </div>
                  <div>
                    <dt className="text-surface-500">Slug</dt>
                    <dd className="font-mono text-surface-200">{activeOrg.slug}</dd>
                  </div>
                </dl>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
            </CardHeader>
            <CardBody>
              {activeOrg.members.length === 0 ? (
                <p className="text-sm text-surface-400">No members listed.</p>
              ) : (
                <ul className="divide-y divide-surface-800">
                  {activeOrg.members.map((m) => (
                    <li
                      key={m.id}
                      className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm"
                    >
                      <div>
                        <div className="text-surface-100">{m.user.name}</div>
                        <div className="text-xs text-surface-500">{m.user.email}</div>
                      </div>
                      <Badge tone="neutral">{m.role}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          {activeOrg.invitations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pending invitations</CardTitle>
              </CardHeader>
              <CardBody>
                <ul className="divide-y divide-surface-800">
                  {activeOrg.invitations.map((inv) => (
                    <li
                      key={inv.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                    >
                      <div>
                        <span className="text-surface-100">{inv.email}</span>
                        <span className="ml-2 text-surface-500">({inv.role})</span>
                        <span className="ml-2 text-xs text-surface-500">{inv.status}</span>
                      </div>
                      {manage && String(inv.status).toLowerCase() === 'pending' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={cancelingId !== null}
                          onClick={() => void cancelInvitation(inv.id)}
                        >
                          {cancelingId === inv.id ? 'Canceling…' : 'Revoke'}
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}

          {manage && (
            <Card>
              <CardHeader>
                <CardTitle>Invite teammate</CardTitle>
              </CardHeader>
              <CardBody>
                <form className="flex max-w-lg flex-col gap-4" onSubmit={onInviteSubmit}>
                  <Field label="Email">
                    <Input
                      type="email"
                      value={inviteEmail}
                      onChange={(ev) => setInviteEmail(ev.target.value)}
                      autoComplete="email"
                      placeholder="colleague@company.com"
                    />
                  </Field>
                  <Field label="Role">
                    <select
                      className="w-full rounded-md border border-surface-700 bg-surface-900 px-3 py-2 text-sm text-surface-100"
                      value={inviteRole}
                      onChange={(ev) => setInviteRole(ev.target.value as 'member' | 'admin')}
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </Field>
                  {inviteError && <p className="text-sm text-red-400">{inviteError}</p>}
                  {inviteOk && <p className="text-sm text-emerald-400/90">{inviteOk}</p>}
                  <div>
                    <Button type="submit" disabled={inviteLoading || !inviteEmail.trim()}>
                      {inviteLoading ? 'Sending…' : 'Send invite'}
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          )}
        </>
      ) : (
        <Card tone="raised">
          <CardBody className="text-sm text-surface-300">
            <p>No active workspace is set. Pick one from the list above.</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
