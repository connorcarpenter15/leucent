'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Field, Input } from '@leucent/ui';
import { PasswordInput } from '@/components/PasswordInput';
import { signIn } from '@/lib/auth-client';
import { messageFromAuthError } from '@/lib/auth-errors';
import { ensureActiveOrganization } from '@/lib/ensure-active-organization';

function safeNextPath(value: string | null) {
  if (!value?.startsWith('/') || value.startsWith('//')) return null;
  return value;
}

function isWorkPath(path: string | null) {
  return Boolean(
    path?.startsWith('/dashboard') ||
    path?.startsWith('/settings') ||
    path?.startsWith('/interviews/new') ||
    path?.startsWith('/work'),
  );
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signIn.email({ email: email.trim(), password });
      if (result.error) {
        setError(
          messageFromAuthError(
            result.error,
            'Could not sign in. Check your email and password and try again.',
          ),
        );
        return;
      }
      const next = safeNextPath(searchParams.get('next'));
      const intent = searchParams.get('intent');
      if (intent === 'work' || isWorkPath(next)) {
        const orgGate = await ensureActiveOrganization();
        if (!orgGate.ok) {
          setError(orgGate.message);
          return;
        }
        router.push(next ?? '/dashboard');
        return;
      }
      if (intent === 'candidate' || next?.startsWith('/join') || next?.startsWith('/candidate')) {
        router.push(next ?? '/candidate');
        return;
      }

      const orgGate = await ensureActiveOrganization();
      router.push(orgGate.ok ? '/dashboard' : '/candidate');
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
      <Field label="Email">
        <Input
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <Field label="Password">
        <PasswordInput
          autoComplete="current-password"
          required
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
        {loading ? 'Signing in…' : 'Sign in'}
      </Button>
      <p className="pt-1 text-center text-xs text-surface-500">
        No account yet?{' '}
        <Link href="/signup" className="text-accent-300 hover:text-accent-200">
          Choose account type
        </Link>
        .
      </p>
    </form>
  );
}
