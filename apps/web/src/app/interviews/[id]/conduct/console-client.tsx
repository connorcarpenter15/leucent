'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, Input, Logo } from '@leucent/ui';
import { CodeEditor } from '@/components/CodeEditor';
import { Canvas } from '@/components/Canvas';
import { useRealtimeToken } from '@/lib/use-realtime-token';
import { useEventsChannel, useYjsRoom } from '@/lib/yjs-provider';

type Constraint = {
  id: string;
  text: string;
  createdAt: string;
  revokedAt: string | null;
};

type LogEntry = {
  id: string;
  ts: string;
  kind: string;
  actor: string;
  summary: string;
};

type ExecRun = {
  id: string;
  command: string;
  startedAt: string;
  finishedAt?: string;
  exitCode?: number;
  durationMs?: number;
  stdout?: string;
  stderr?: string;
};

type AiStream = {
  id: string;
  prompt?: string;
  text: string;
  done: boolean;
};

export function InterviewerConsole({
  interviewId,
  title,
  candidateName,
  status: initialStatus,
  initialConstraints,
}: {
  interviewId: string;
  title: string;
  candidateName: string;
  status: string;
  initialConstraints: Constraint[];
}) {
  const router = useRouter();
  const { token, error: tokenError } = useRealtimeToken(interviewId);
  const { doc, provider, synced } = useYjsRoom(interviewId, token);

  const [status, setStatus] = useState(initialStatus);
  const [constraints, setConstraints] = useState<Constraint[]>(initialConstraints);
  const [constraintDraft, setConstraintDraft] = useState('');
  const [submittingConstraint, setSubmittingConstraint] = useState(false);

  const [log, setLog] = useState<LogEntry[]>([]);
  const [execRuns, setExecRuns] = useState<Record<string, ExecRun>>({});
  const [aiStreams, setAiStreams] = useState<Record<string, AiStream>>({});

  const [ending, setEnding] = useState(false);

  const handleEvent = useCallback((raw: unknown) => {
    if (!raw || typeof raw !== 'object') return;
    const ev = raw as {
      kind: string;
      actor: string;
      ts?: string;
      payload?: Record<string, unknown>;
    };
    const ts = ev.ts ?? new Date().toISOString();
    const id = `${ts}_${Math.random().toString(36).slice(2, 8)}`;
    const summary = summarize(ev);

    setLog((prev) => {
      const next = [{ id, ts, kind: ev.kind, actor: ev.actor, summary }, ...prev];
      return next.slice(0, 200);
    });

    if (ev.kind === 'exec_start' && ev.payload) {
      const p = ev.payload as { execId: string; command: string };
      setExecRuns((prev) => ({
        ...prev,
        [p.execId]: { id: p.execId, command: p.command, startedAt: ts },
      }));
    } else if (ev.kind === 'exec_end' && ev.payload) {
      const p = ev.payload as {
        execId: string;
        exitCode: number;
        durationMs: number;
        stdoutTail: string;
        stderrTail: string;
      };
      setExecRuns((prev) => ({
        ...prev,
        [p.execId]: {
          ...(prev[p.execId] ?? { id: p.execId, command: '(unknown)', startedAt: ts }),
          finishedAt: ts,
          exitCode: p.exitCode,
          durationMs: p.durationMs,
          stdout: p.stdoutTail,
          stderr: p.stderrTail,
        },
      }));
    } else if (ev.kind === 'ai_prompt' && ev.payload) {
      const p = ev.payload as { promptId: string; prompt: string };
      setAiStreams((prev) => ({
        ...prev,
        [p.promptId]: { id: p.promptId, prompt: p.prompt, text: '', done: false },
      }));
    } else if (ev.kind === 'ai_response_chunk' && ev.payload) {
      const p = ev.payload as { promptId: string; chunk: string; done: boolean };
      setAiStreams((prev) => {
        const existing = prev[p.promptId] ?? { id: p.promptId, text: '', done: false };
        return {
          ...prev,
          [p.promptId]: { ...existing, text: existing.text + p.chunk, done: p.done },
        };
      });
    }
  }, []);

  const sendEvent = useEventsChannel(interviewId, token, handleEvent);

  async function addConstraint(e: React.FormEvent) {
    e.preventDefault();
    const text = constraintDraft.trim();
    if (!text || submittingConstraint) return;
    setSubmittingConstraint(true);
    try {
      const res = await fetch(`/api/interviews/${interviewId}/constraints`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { constraint } = (await res.json()) as { constraint: Constraint };
      setConstraints((c) => [
        ...c,
        {
          id: constraint.id,
          text: constraint.text,
          createdAt: constraint.createdAt,
          revokedAt: null,
        },
      ]);
      sendEvent({
        kind: 'interviewer_constraint',
        actor: 'interviewer',
        payload: { constraintId: constraint.id, text: constraint.text },
      });
      setConstraintDraft('');
    } catch (err) {
      console.error(err);
      alert(`Failed to add constraint: ${(err as Error).message}`);
    } finally {
      setSubmittingConstraint(false);
    }
  }

  async function endInterview() {
    if (ending) return;
    if (!confirm('End this interview now? This will close the candidate session.')) return;
    setEnding(true);
    try {
      const res = await fetch(`/api/interviews/${interviewId}/end`, { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());
      setStatus('completed');
      router.replace('/dashboard');
    } catch (err) {
      console.error(err);
      alert(`Failed to end interview: ${(err as Error).message}`);
    } finally {
      setEnding(false);
    }
  }

  const connTone = tokenError ? 'danger' : !token ? 'warning' : synced ? 'success' : 'warning';
  const connLabel = tokenError
    ? 'auth error'
    : !token
      ? 'connecting'
      : synced
        ? 'mirroring'
        : 'syncing';
  const statusTone = status === 'live' ? 'success' : status === 'completed' ? 'neutral' : 'info';

  return (
    <div className="flex h-screen flex-col bg-surface-950 text-surface-100">
      <header className="relative z-10 flex items-center justify-between border-b border-surface-800 bg-surface-925/90 px-4 py-2 backdrop-blur">
        <div className="leucent-hairline absolute inset-x-0 bottom-0 h-px opacity-40" />
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <span className="hidden h-4 w-px bg-surface-700 sm:inline-block" />
          <span className="text-sm font-semibold text-surface-50">{title}</span>
          <span className="text-xs text-surface-500">candidate: {candidateName}</span>
          <Badge tone={statusTone} dot>
            {status}
          </Badge>
          <Badge tone={connTone} dot>
            {connLabel}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone="accent">Interviewer console</Badge>
          <Button
            variant="danger"
            size="sm"
            onClick={endInterview}
            disabled={ending || status === 'completed'}
          >
            {ending ? 'Ending…' : 'End interview'}
          </Button>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-12 overflow-hidden">
        <div className="col-span-5 flex flex-col border-r border-surface-800">
          <SectionHeader>Code (read-only mirror)</SectionHeader>
          <div className="flex-1">
            <CodeEditor doc={doc} provider={provider} readOnly />
          </div>
          <SectionHeader>Exec output</SectionHeader>
          <ExecPanel runs={execRuns} />
        </div>

        <div className="col-span-4 flex flex-col border-r border-surface-800">
          <SectionHeader>Canvas (read-only mirror)</SectionHeader>
          <div className="flex-1">
            <Canvas doc={doc} readOnly />
          </div>
          <SectionHeader>AI conversation</SectionHeader>
          <AiPanel streams={aiStreams} />
        </div>

        <div className="col-span-3 flex flex-col">
          <SectionHeader>Action log</SectionHeader>
          <ActionLog entries={log} />
          <SectionHeader>AI constraints</SectionHeader>
          <ConstraintPanel
            constraints={constraints}
            draft={constraintDraft}
            setDraft={setConstraintDraft}
            onSubmit={addConstraint}
            disabled={submittingConstraint || status === 'completed'}
          />
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-y border-surface-800 bg-surface-925 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-surface-400">
      {children}
    </div>
  );
}

function ActionLog({ entries }: { entries: LogEntry[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: 0 });
  }, [entries.length]);
  return (
    <div ref={ref} className="h-64 overflow-auto p-2 text-xs">
      {entries.length === 0 && <p className="p-2 text-surface-500">Waiting for activity…</p>}
      <ul className="space-y-1">
        {entries.map((e) => (
          <li
            key={e.id}
            className="rounded-md border border-surface-800 bg-surface-900/60 px-2 py-1"
          >
            <div className="flex items-center justify-between text-[10px] text-surface-500">
              <span>{new Date(e.ts).toLocaleTimeString()}</span>
              <span>
                {e.actor} · {e.kind}
              </span>
            </div>
            <div className="text-surface-100">{e.summary}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExecPanel({ runs }: { runs: Record<string, ExecRun> }) {
  const list = Object.values(runs).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  return (
    <div className="h-48 overflow-auto p-2 text-xs">
      {list.length === 0 && <p className="p-2 text-surface-500">No exec runs yet.</p>}
      {list.map((r) => (
        <div key={r.id} className="mb-2 rounded-md border border-surface-800 bg-surface-900/60 p-2">
          <div className="flex items-center justify-between text-[10px] text-surface-400">
            <code className="text-surface-100">{r.command}</code>
            <span>
              {r.exitCode !== undefined ? `exit ${r.exitCode} · ${r.durationMs}ms` : 'running…'}
            </span>
          </div>
          {r.stdout && <pre className="mt-1 whitespace-pre-wrap text-surface-200">{r.stdout}</pre>}
          {r.stderr && <pre className="mt-1 whitespace-pre-wrap text-red-300">{r.stderr}</pre>}
        </div>
      ))}
    </div>
  );
}

function AiPanel({ streams }: { streams: Record<string, AiStream> }) {
  const list = Object.values(streams);
  return (
    <div className="h-56 overflow-auto p-2 text-xs">
      {list.length === 0 && <p className="p-2 text-surface-500">No AI traffic yet.</p>}
      {list.map((s) => (
        <div
          key={s.id}
          className="mb-2 rounded-md border border-accent-700/40 bg-accent-500/10 p-2 shadow-[0_0_24px_-14px_rgba(47,116,255,0.6)]"
        >
          {s.prompt && (
            <div className="mb-1 text-[10px] uppercase tracking-wider text-accent-300">
              prompt: <span className="text-surface-100">{s.prompt}</span>
            </div>
          )}
          <pre className="whitespace-pre-wrap text-surface-100">{s.text || '…'}</pre>
          {!s.done && <div className="mt-1 text-[10px] text-surface-500">streaming…</div>}
        </div>
      ))}
    </div>
  );
}

function ConstraintPanel({
  constraints,
  draft,
  setDraft,
  onSubmit,
  disabled,
}: {
  constraints: Constraint[];
  draft: string;
  setDraft: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled: boolean;
}) {
  const active = constraints.filter((c) => !c.revokedAt);
  return (
    <div className="flex flex-col gap-2 p-2 text-xs">
      <form onSubmit={onSubmit} className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder='e.g. "no third-party libraries"'
          disabled={disabled}
        />
        <Button type="submit" size="sm" disabled={disabled || !draft.trim()}>
          Add
        </Button>
      </form>
      <ul className="space-y-1">
        {active.length === 0 && <li className="text-surface-500">No constraints.</li>}
        {active.map((c) => (
          <li
            key={c.id}
            className="rounded-md border border-amber-700/40 bg-amber-900/20 px-2 py-1 text-amber-100"
          >
            {c.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

function summarize(ev: { kind: string; actor: string; payload?: Record<string, unknown> }) {
  const p = (ev.payload ?? {}) as Record<string, unknown>;
  switch (ev.kind) {
    case 'code_edit':
      return `edited ${String(p.path ?? 'file')} (${p.bytesChanged ?? 0} bytes)`;
    case 'canvas_edit':
      return `canvas changes: nodes+${p.nodesAdded ?? 0}/-${p.nodesRemoved ?? 0}, edges+${p.edgesAdded ?? 0}/-${p.edgesRemoved ?? 0}`;
    case 'ai_prompt':
      return `asked AI: ${truncate(String(p.prompt ?? ''))}`;
    case 'ai_response_chunk':
      return p.done ? 'AI response complete' : 'AI response chunk';
    case 'exec_start':
      return `ran: ${String(p.command ?? '')}`;
    case 'exec_end':
      return `finished (exit ${p.exitCode ?? '?'}) in ${p.durationMs ?? '?'}ms`;
    case 'interviewer_constraint':
      return `constraint: ${truncate(String(p.text ?? ''))}`;
    case 'presence':
      return `${p.role ?? '?'} ${p.state ?? ''}`;
    default:
      return ev.kind;
  }
}

function truncate(s: string, n = 80) {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}
