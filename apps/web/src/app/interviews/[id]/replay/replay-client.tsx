'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Logo } from '@bleucent/ui';

type ReplayEvent = {
  ts: string;
  kind: string;
  actor: string;
  payload: Record<string, unknown>;
  seq: number;
};

const SPEEDS = [0.5, 1, 2, 4, 8] as const;

export function ReplayClient({
  title,
  candidateName,
  hasKey,
  events,
}: {
  title: string;
  candidateName: string;
  hasKey: boolean;
  events: ReplayEvent[];
}) {
  const sorted = useMemo(
    () =>
      [...events].sort((a, b) => {
        const t = new Date(a.ts).getTime() - new Date(b.ts).getTime();
        return t !== 0 ? t : a.seq - b.seq;
      }),
    [events],
  );
  const startMs = sorted[0] ? new Date(sorted[0].ts).getTime() : 0;
  const endMs = sorted[sorted.length - 1]
    ? new Date(sorted[sorted.length - 1]!.ts).getTime()
    : startMs;
  const totalMs = Math.max(endMs - startMs, 1);

  const [cursorMs, setCursorMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTickRef.current = null;
      return;
    }
    const tick = (now: number) => {
      const last = lastTickRef.current ?? now;
      const dt = now - last;
      lastTickRef.current = now;
      setCursorMs((prev) => {
        const next = prev + dt * speed;
        if (next >= totalMs) {
          setPlaying(false);
          return totalMs;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, speed, totalMs]);

  const visible = useMemo(() => {
    const cutoff = startMs + cursorMs;
    return sorted.filter((e) => new Date(e.ts).getTime() <= cutoff);
  }, [sorted, startMs, cursorMs]);

  const codeBytes = visible.reduce((sum, e) => {
    if (e.kind !== 'code_edit') return sum;
    const p = e.payload as { bytesChanged?: number };
    return sum + (p.bytesChanged ?? 0);
  }, 0);
  const canvasOps = visible.filter((e) => e.kind === 'canvas_edit').length;
  const aiPrompts = visible.filter((e) => e.kind === 'ai_prompt').length;
  const execRuns = visible.filter((e) => e.kind === 'exec_start').length;

  if (!hasKey) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-12">
        <div className="rounded-2xl border border-surface-800 bg-surface-900/60 p-8 text-center">
          <Logo size="md" className="justify-center" />
          <h1 className="mt-6 font-display text-2xl font-semibold text-surface-50">{title}</h1>
          <p className="mt-2 text-sm text-surface-400">
            No replay log was stored for this interview. The realtime server only flushes to S3 on
            an explicit End or after the idle GC fires.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-surface-950 text-surface-100">
      <header className="relative z-10 flex items-center justify-between border-b border-surface-800 bg-surface-925/90 px-4 py-2 backdrop-blur">
        <div className="bleucent-hairline absolute inset-x-0 bottom-0 h-px opacity-40" />
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <span className="hidden h-4 w-px bg-surface-700 sm:inline-block" />
          <h1 className="text-sm font-semibold text-surface-50">{title}</h1>
          <span className="text-xs text-surface-500">candidate: {candidateName}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Badge tone="info">{sorted.length} events</Badge>
          <Badge tone="neutral">{Math.round(totalMs / 1000)}s long</Badge>
          <Badge tone="accent">Replay</Badge>
        </div>
      </header>

      <div className="mx-4 mt-4 flex items-center gap-3 rounded-xl border border-surface-800 bg-surface-900/60 px-4 py-3 shadow-elevated">
        <Button size="sm" onClick={() => setPlaying((p) => !p)}>
          {playing ? 'Pause' : 'Play'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setCursorMs(0);
            setPlaying(false);
          }}
        >
          Restart
        </Button>
        <input
          type="range"
          min={0}
          max={totalMs}
          value={cursorMs}
          onChange={(e) => {
            setCursorMs(Number(e.target.value));
            setPlaying(false);
          }}
          className="flex-1 accent-accent-500"
          style={{ accentColor: 'var(--bleucent-accent)' }}
        />
        <span className="w-24 text-right text-xs text-surface-400 tabular-nums">
          {formatMs(cursorMs)} / {formatMs(totalMs)}
        </span>
        <select
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value) as (typeof SPEEDS)[number])}
          className="rounded-md border border-surface-700 bg-surface-900 px-2 py-1 text-xs text-surface-100 focus-visible:border-accent-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
        >
          {SPEEDS.map((s) => (
            <option key={s} value={s}>
              {s}x
            </option>
          ))}
        </select>
      </div>

      <div className="m-4 grid flex-1 grid-cols-12 gap-4 overflow-hidden">
        <div className="col-span-3 rounded-xl border border-surface-800 bg-surface-900/60 p-4 text-sm">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-surface-400">
            Cumulative
          </h2>
          <ul className="mt-3 space-y-2 text-surface-200">
            <Stat label="Code edits" value={`${codeBytes} bytes`} />
            <Stat label="Canvas ops" value={canvasOps} />
            <Stat label="AI prompts" value={aiPrompts} />
            <Stat label="Exec runs" value={execRuns} />
          </ul>
        </div>
        <div className="col-span-9 overflow-auto rounded-xl border border-surface-800 bg-surface-900/40 p-2 text-xs">
          {visible.length === 0 && (
            <p className="p-4 text-surface-500">Press play to start replaying.</p>
          )}
          <ul className="space-y-1">
            {visible
              .slice(-200)
              .reverse()
              .map((e) => (
                <li
                  key={`${e.ts}_${e.seq}`}
                  className="rounded-md border border-surface-800 bg-surface-950/60 px-2 py-1"
                >
                  <div className="flex items-center justify-between text-[10px] text-surface-500">
                    <span>{new Date(e.ts).toLocaleTimeString()}</span>
                    <span>
                      {e.actor} · {e.kind}
                    </span>
                  </div>
                  <pre className="whitespace-pre-wrap text-surface-200">
                    {JSON.stringify(e.payload)}
                  </pre>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-surface-400">{label}</span>
      <span className="font-medium text-surface-100">{value}</span>
    </li>
  );
}

function formatMs(ms: number) {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
