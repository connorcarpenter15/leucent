'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Field, Input } from '@leucent/ui';

export function GuestJoinForm({
  token,
  suggestedName,
  suggestedEmail,
}: {
  token: string;
  suggestedName: string | null;
  suggestedEmail: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(suggestedName ?? '');
  const [email, setEmail] = useState(suggestedEmail ?? '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/join/${encodeURIComponent(token)}/guest`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          displayName: name.trim() || undefined,
          email: email.trim(),
        }),
      });
      if (!res.ok) {
        setError((await res.text()) || `Could not join (${res.status}).`);
        return;
      }
      const data = (await res.json()) as { workUrl: string };
      router.replace(data.workUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mt-6 flex flex-col gap-4 text-left" onSubmit={submit} noValidate>
      <Field label="Email">
        <Input
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </Field>
      <Field label="Name">
        <Input
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Alex Rivera"
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
        {loading ? 'Joining...' : 'Join interview'}
      </Button>
      <p className="text-xs text-surface-500">
        This creates a guest participant scoped only to this interview. You can save it to a
        persistent candidate account later.
      </p>
    </form>
  );
}
