'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, Field, Input } from '@leucent/ui';
import { PasswordInput } from '@/components/PasswordInput';
import { authClient, useSession } from '@/lib/auth-client';
import { messageFromAuthError } from '@/lib/auth-errors';

export function UserSettingsPanel() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [name, setName] = useState('');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileOk, setProfileOk] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwOk, setPwOk] = useState<string | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.name != null) {
      setName(session.user.name);
    }
  }, [session?.user?.name]);

  async function onProfileSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfileError(null);
    setProfileOk(null);
    setProfileLoading(true);
    try {
      const res = await authClient.updateUser({ name: name.trim() });
      if (res.error) {
        setProfileError(
          messageFromAuthError(res.error, 'Could not update your profile. Try again.'),
        );
        return;
      }
      setProfileOk('Profile saved.');
      router.refresh();
    } catch (caught) {
      setProfileError(caught instanceof Error ? caught.message : 'Something went wrong.');
    } finally {
      setProfileLoading(false);
    }
  }

  async function onPasswordSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwError(null);
    setPwOk(null);
    if (newPassword !== confirmPassword) {
      setPwError('New password and confirmation do not match.');
      return;
    }
    setPwLoading(true);
    try {
      const res = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });
      if (res.error) {
        setPwError(
          messageFromAuthError(
            res.error,
            'Could not change password. Check your current password.',
          ),
        );
        return;
      }
      setPwOk('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      router.refresh();
    } catch (caught) {
      setPwError(caught instanceof Error ? caught.message : 'Something went wrong.');
    } finally {
      setPwLoading(false);
    }
  }

  if (isPending && !session) {
    return <p className="text-sm text-surface-400">Loading your account…</p>;
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user;

  return (
    <div className="flex flex-col gap-8">
      <Card tone="raised">
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <Badge tone="neutral">Signed in</Badge>
        </CardHeader>
        <CardBody className="space-y-3 text-sm text-surface-300">
          <div>
            <span className="text-surface-500">Email</span>
            <p className="mt-0.5 text-surface-100">{user.email}</p>
          </div>
          <div>
            <span className="text-surface-500">User id</span>
            <p className="mt-0.5 font-mono text-xs text-surface-400">{user.id}</p>
          </div>
          {user.emailVerified === false && (
            <p className="text-amber-300/90">This email address is not verified yet.</p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Display name</CardTitle>
        </CardHeader>
        <CardBody>
          <form className="flex max-w-md flex-col gap-4" onSubmit={onProfileSubmit}>
            <Field label="Name">
              <Input
                value={name}
                onChange={(ev) => setName(ev.target.value)}
                autoComplete="name"
                placeholder="Your name"
              />
            </Field>
            {profileError && <p className="text-sm text-red-400">{profileError}</p>}
            {profileOk && <p className="text-sm text-emerald-400/90">{profileOk}</p>}
            <div>
              <Button type="submit" disabled={profileLoading}>
                {profileLoading ? 'Saving…' : 'Save profile'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
        </CardHeader>
        <CardBody>
          <form className="flex max-w-md flex-col gap-4" onSubmit={onPasswordSubmit}>
            <Field label="Current password">
              <PasswordInput
                value={currentPassword}
                onChange={(ev) => setCurrentPassword(ev.target.value)}
                autoComplete="current-password"
              />
            </Field>
            <Field label="New password">
              <PasswordInput
                value={newPassword}
                onChange={(ev) => setNewPassword(ev.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirm new password">
              <PasswordInput
                value={confirmPassword}
                onChange={(ev) => setConfirmPassword(ev.target.value)}
                autoComplete="new-password"
              />
            </Field>
            {pwError && <p className="text-sm text-red-400">{pwError}</p>}
            {pwOk && <p className="text-sm text-emerald-400/90">{pwOk}</p>}
            <div>
              <Button type="submit" disabled={pwLoading}>
                {pwLoading ? 'Updating…' : 'Change password'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
