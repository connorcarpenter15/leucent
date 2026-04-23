'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Field, Input } from '@leucent/ui';
import { PasswordInput } from '@/components/PasswordInput';
import { authClient, signUp } from '@/lib/auth-client';
import { messageFromAuthError } from '@/lib/auth-errors';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
}

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function clearPasswordFieldErrors() {
    setConfirmError(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setConfirmError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setConfirmError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const userResult = await signUp.email({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      if (userResult.error) {
        setError(
          messageFromAuthError(
            userResult.error,
            'Could not create your account. Check your details and try again.',
          ),
        );
        return;
      }

      const orgResult = await authClient.organization.create({
        name: orgName.trim() || `${name.trim()}'s team`,
        slug: slugify(orgName || name) || `org-${Date.now()}`,
        keepCurrentActiveOrganization: false,
      });
      if (orgResult.error) {
        setError(
          `Account created but organization setup failed: ${messageFromAuthError(
            orgResult.error,
            'Unknown error',
          )}`,
        );
        return;
      }
      const orgId = orgResult.data?.id;
      if (!orgId) {
        setError('Account created but organization id was missing. Try signing in again.');
        return;
      }
      const activeResult = await authClient.organization.setActive({ organizationId: orgId });
      if (activeResult.error) {
        setError(
          `Account created but activating the organization failed: ${messageFromAuthError(
            activeResult.error,
            'Unknown error',
          )}`,
        );
        return;
      }
      router.push('/dashboard');
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Something went wrong. Check your connection and try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <Field label="Your name">
        <Input required value={name} onChange={(e) => setName(e.target.value)} name="name" />
      </Field>
      <Field label="Work email">
        <Input
          type="email"
          autoComplete="email"
          required
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <Field label="Password" hint="At least 8 characters.">
        <PasswordInput
          name="new-password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (confirmError) {
              setConfirmError(null);
            }
          }}
        />
      </Field>
      <Field
        label="Confirm password"
        error={confirmError}
        hint={!confirmError ? 'Re-enter your password to confirm.' : undefined}
      >
        <PasswordInput
          name="password-confirm"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (confirmError) {
              setConfirmError(null);
            }
          }}
        />
      </Field>
      <Field label="Organization name" hint="Defaults to your name's team.">
        <Input
          placeholder="Acme Engineering"
          name="orgName"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
        />
      </Field>
      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-700/60 bg-red-900/30 px-3 py-2 text-sm text-red-200"
        >
          {error}
        </div>
      )}
      <Button type="submit" disabled={loading} size="lg">
        {loading ? 'Creating…' : 'Create account'}
      </Button>
    </form>
  );
}
