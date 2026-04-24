'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, Field, Input } from '@leucent/ui';
import { ensureActiveOrganization } from '@/lib/ensure-active-organization';
import {
  DEFAULT_SANDBOX_TEMPLATE,
  SANDBOX_TEMPLATE_KEYS,
  SANDBOX_TEMPLATE_LABELS,
  type SandboxTemplateKey,
  normalizeSandboxTemplate,
} from '@/lib/sandbox-templates';

export function InterviewCreationPanel() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [laterName, setLaterName] = useState('');
  const [laterEmail, setLaterEmail] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [laterTemplate, setLaterTemplate] = useState<SandboxTemplateKey>(DEFAULT_SANDBOX_TEMPLATE);

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'instant' | 'later' | null>(null);
  const [createdLink, setCreatedLink] = useState<{ joinUrl: string; interviewId: string } | null>(
    null,
  );

  async function postInterview(body: unknown) {
    const orgGate = await ensureActiveOrganization();
    if (!orgGate.ok) {
      setError(orgGate.message);
      return null;
    }
    const res = await fetch('/api/interviews', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const t = await res.text();
      setError(t || `Request failed (${res.status})`);
      return null;
    }
    return (await res.json()) as {
      interviewId: string;
      joinUrl: string;
      mode?: string;
    };
  }

  async function startInstant() {
    setError(null);
    setCreatedLink(null);
    setBusy('instant');
    const data = await postInterview({
      mode: 'instant',
      sandboxTemplate: DEFAULT_SANDBOX_TEMPLATE,
    });
    setBusy(null);
    if (!data) return;
    router.push(`/interviews/${data.interviewId}/conduct?instant=1`);
  }

  function openLaterModal() {
    setError(null);
    setCreatedLink(null);
    dialogRef.current?.showModal();
  }

  function closeLaterModal() {
    dialogRef.current?.close();
  }

  async function submitLater(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const name = laterName.trim();
    const email = laterEmail.trim();
    if (!name && !email) {
      setError('Enter a candidate email or name.');
      return;
    }
    setBusy('later');
    const data = await postInterview({
      mode: 'later',
      candidateName: name || undefined,
      candidateEmail: email || undefined,
      targetRole: targetRole.trim() || undefined,
      sandboxTemplate: normalizeSandboxTemplate(laterTemplate),
    });
    setBusy(null);
    if (!data) return;
    setCreatedLink({ joinUrl: data.joinUrl, interviewId: data.interviewId });
    closeLaterModal();
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      setError('Could not copy to clipboard.');
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-2">
        <Card tone="raised" className="flex flex-col">
          <CardHeader>
            <CardTitle>Start instant interview</CardTitle>
            <Badge tone="success" dot>
              1-click
            </Badge>
          </CardHeader>
          <CardBody className="flex flex-1 flex-col gap-3 text-sm text-surface-300">
            <p>
              Create a room and open your interviewer console immediately. We&apos;ll generate a
              title and join link — share the link when you&apos;re ready.
            </p>
            <div className="mt-auto flex justify-end">
              <Button size="lg" onClick={() => void startInstant()} disabled={busy === 'instant'}>
                {busy === 'instant' ? 'Starting…' : 'Start instant interview'}
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card tone="raised" className="flex flex-col">
          <CardHeader>
            <CardTitle>Create link for later</CardTitle>
            <Badge tone="info" dot>
              Async
            </Badge>
          </CardHeader>
          <CardBody className="flex flex-1 flex-col gap-3 text-sm text-surface-300">
            <p>
              Collect a candidate label and optional role, pick a sandbox profile, then copy the
              join link into your calendar invite.
            </p>
            <div className="mt-auto flex justify-end">
              <Button
                size="lg"
                variant="outline"
                onClick={openLaterModal}
                disabled={busy === 'later'}
              >
                {busy === 'later' ? 'Creating…' : 'Create link…'}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      <dialog
        ref={dialogRef}
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-surface-700 bg-surface-900 p-0 text-surface-100 shadow-xl backdrop:bg-black/60"
      >
        <form onSubmit={submitLater} className="flex flex-col gap-4 p-6">
          <div>
            <h2 className="font-display text-lg font-semibold text-surface-50">Link for later</h2>
            <p className="mt-1 text-xs text-surface-500">
              Provide an email <span className="text-surface-400">or</span> name so the dashboard
              stays readable.
            </p>
          </div>
          <Field label="Candidate email">
            <Input
              type="email"
              autoComplete="email"
              value={laterEmail}
              onChange={(e) => setLaterEmail(e.target.value)}
              placeholder="alex@company.com"
            />
          </Field>
          <Field label="Candidate name">
            <Input
              value={laterName}
              onChange={(e) => setLaterName(e.target.value)}
              placeholder="Alex Rivera"
            />
          </Field>
          <Field label="Target role (optional)">
            <Input
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="Senior Backend Engineer"
            />
          </Field>
          <Field label="Sandbox environment">
            <select
              className="w-full rounded-md border border-surface-700 bg-surface-950 px-3 py-2 text-sm text-surface-100"
              value={laterTemplate}
              onChange={(e) => setLaterTemplate(normalizeSandboxTemplate(e.target.value))}
            >
              {SANDBOX_TEMPLATE_KEYS.map((k) => (
                <option key={k} value={k}>
                  {SANDBOX_TEMPLATE_LABELS[k]}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={closeLaterModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy === 'later'}>
              {busy === 'later' ? 'Creating…' : 'Create & copy link'}
            </Button>
          </div>
        </form>
      </dialog>

      {createdLink && (
        <Card tone="raised">
          <CardHeader>
            <CardTitle>Join link ready</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-3 text-sm">
            <p className="text-surface-400">
              Paste this URL into a calendar invite or message. It stays valid until the interview
              ends or the invite expires.
            </p>
            <code className="break-all rounded-md border border-surface-800 bg-surface-950 px-3 py-2 text-xs text-accent-200">
              {createdLink.joinUrl}
            </code>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={() => void copyLink(createdLink.joinUrl)}>
                Copy link
              </Button>
              <Link
                href={`/interviews/${createdLink.interviewId}/conduct`}
                className="inline-flex h-8 items-center rounded-md border border-surface-700 px-3 text-xs text-surface-100 hover:border-accent-500 hover:text-accent-200"
              >
                Open interviewer console
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-8 items-center rounded-md border border-surface-700 px-3 text-xs text-surface-100 hover:border-accent-500 hover:text-accent-200"
              >
                Back to dashboard
              </Link>
            </div>
          </CardBody>
        </Card>
      )}

      {error && (
        <p className="rounded-md border border-red-700/60 bg-red-900/30 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}
    </div>
  );
}
