'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Field, Input } from '@leucent/ui';
import { signIn } from '@/lib/auth-client';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signIn.email({ email, password });
    setLoading(false);
    if (result.error) {
      setError(result.error.message ?? 'Sign in failed');
      return;
    }
    router.push('/dashboard');
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <Field label="Email">
        <Input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <Field label="Password">
        <Input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      {error && (
        <p className="rounded-md border border-red-700/60 bg-red-900/30 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}
      <Button type="submit" disabled={loading} size="lg">
        {loading ? 'Signing in…' : 'Sign in'}
      </Button>
      <p className="pt-1 text-center text-xs text-surface-500">
        No account yet?{' '}
        <Link href="/signup" className="text-accent-300 hover:text-accent-200">
          Create an organization
        </Link>
        .
      </p>
    </form>
  );
}
