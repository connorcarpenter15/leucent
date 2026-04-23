'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Field, Input, Textarea } from '@leucent/ui';
import { ensureActiveOrganization } from '@/lib/ensure-active-organization';

export function NewInterviewForm() {
  const router = useRouter();
  const [title, setTitle] = useState('Senior Backend Loop');
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [constraints, setConstraints] = useState(
    'Use async asyncpg instead of psycopg2.\nNo external API calls.',
  );
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    const orgGate = await ensureActiveOrganization();
    if (!orgGate.ok) {
      setCreating(false);
      setError(orgGate.message);
      return;
    }
    const res = await fetch('/api/interviews', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title,
        candidateName,
        candidateEmail,
        initialConstraints: constraints
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean),
      }),
    });
    setCreating(false);
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    const { interviewId } = (await res.json()) as { interviewId: string };
    router.push(`/interviews/${interviewId}/conduct`);
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={submit}>
      <Field label="Title">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Candidate name">
          <Input
            value={candidateName}
            onChange={(e) => setCandidateName(e.target.value)}
            required
          />
        </Field>
        <Field label="Candidate email">
          <Input
            type="email"
            value={candidateEmail}
            onChange={(e) => setCandidateEmail(e.target.value)}
            required
          />
        </Field>
      </div>
      <Field
        label="Initial AI constraints"
        hint="One per line. Injected into every AI prompt during the session. You can add or remove constraints live from the interviewer console."
      >
        <Textarea rows={5} value={constraints} onChange={(e) => setConstraints(e.target.value)} />
      </Field>
      {error && (
        <p className="rounded-md border border-red-700/60 bg-red-900/30 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}
      <div className="flex items-center justify-end gap-2">
        <Button type="submit" size="lg" disabled={creating}>
          {creating ? 'Creating…' : 'Create interview'}
        </Button>
      </div>
    </form>
  );
}
