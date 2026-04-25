'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge, Button, Logo } from '@leucent/ui';
import { CodeEditor } from '@/components/CodeEditor';
import { Canvas } from '@/components/Canvas';
import { AiChatPanel } from '@/components/AiChatPanel';
import { useRealtimeToken } from '@/lib/use-realtime-token';
import { useEventsChannel, useYjsRoom } from '@/lib/yjs-provider';

export function CandidateWorkspace({
  interviewId,
  title,
  initialStatus,
  canUpgrade,
}: {
  interviewId: string;
  title: string;
  initialStatus: string;
  canUpgrade: boolean;
}) {
  const [sessionStatus, setSessionStatus] = useState(initialStatus);

  useEffect(() => {
    if (sessionStatus !== 'scheduled') return;
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/interviews/${interviewId}/status`);
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { status: string };
        if (data.status === 'live') setSessionStatus('live');
      } catch {
        /* ignore transient errors */
      }
    }

    poll();
    const interval = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [interviewId, sessionStatus]);

  if (sessionStatus === 'scheduled') {
    return <WaitingRoom interviewId={interviewId} title={title} canUpgrade={canUpgrade} />;
  }

  return (
    <CandidateWorkspaceActive interviewId={interviewId} title={title} canUpgrade={canUpgrade} />
  );
}

function WaitingRoom({
  interviewId,
  title,
  canUpgrade,
}: {
  interviewId: string;
  title: string;
  canUpgrade: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-950 text-surface-100">
      <header className="relative z-10 border-b border-surface-800 bg-surface-925/90 px-4 py-3 backdrop-blur">
        <div className="leucent-hairline absolute inset-x-0 bottom-0 h-px opacity-40" />
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <span className="text-sm font-semibold text-surface-50">{title}</span>
          <Badge tone="info" dot>
            waiting
          </Badge>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-xl font-semibold text-surface-50">
          Waiting for your interviewer to start the session
        </p>
        <p className="mt-3 max-w-md text-sm text-surface-400">
          You can keep this tab open. When the interviewer starts the interview, your workspace will
          load automatically.
        </p>
        {canUpgrade ? (
          <Link href={`/interviews/${interviewId}/upgrade`} className="mt-6">
            <Button variant="outline">Save to candidate account</Button>
          </Link>
        ) : null}
      </main>
    </div>
  );
}

function CandidateWorkspaceActive({
  interviewId,
  title,
  canUpgrade,
}: {
  interviewId: string;
  title: string;
  canUpgrade: boolean;
}) {
  const { token, error: tokenError } = useRealtimeToken(interviewId);
  const { doc, provider, synced } = useYjsRoom(interviewId, token);

  const sendEvent = useEventsChannel(interviewId, token, () => {
    // Candidate doesn't need to consume incoming telemetry — it's outbound only.
  });

  const onCodeEdit = useCallback(
    (bytes: number) => {
      sendEvent({
        kind: 'code_edit',
        actor: 'candidate',
        payload: { path: 'main.py', bytesChanged: bytes },
      });
    },
    [sendEvent],
  );

  const onCanvasEdit = useCallback(
    (delta: { nodes: number; edges: number }) => {
      sendEvent({
        kind: 'canvas_edit',
        actor: 'candidate',
        payload: { nodesAdded: delta.nodes, edgesAdded: delta.edges },
      });
    },
    [sendEvent],
  );

  const status = tokenError ? 'auth error' : !token ? 'connecting' : synced ? 'synced' : 'syncing';
  const statusTone = tokenError ? 'danger' : !token ? 'warning' : synced ? 'success' : 'warning';

  return (
    <div className="flex h-screen flex-col bg-surface-950 text-surface-100">
      <header className="relative z-10 flex items-center justify-between border-b border-surface-800 bg-surface-925/90 px-4 py-2 backdrop-blur">
        <div className="leucent-hairline absolute inset-x-0 bottom-0 h-px opacity-40" />
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <span className="hidden h-4 w-px bg-surface-700 sm:inline-block" />
          <span className="text-sm font-semibold text-surface-50">{title}</span>
          <Badge tone={statusTone} dot>
            {status}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-surface-400">
          <span className="hidden sm:inline">Candidate workspace</span>
          {canUpgrade ? (
            <Link
              href={`/interviews/${interviewId}/upgrade`}
              className="hidden rounded-md border border-surface-700 px-2 py-1 text-surface-100 hover:border-accent-500 hover:text-accent-200 sm:inline-flex"
            >
              Save to account
            </Link>
          ) : null}
          <Badge tone="accent">Live</Badge>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-12 overflow-hidden">
        <div className="col-span-5 flex flex-col border-r border-surface-800">
          <PaneTitle>Editor</PaneTitle>
          <div className="flex-1">
            <CodeEditor doc={doc} provider={provider} onLocalEdit={onCodeEdit} />
          </div>
        </div>
        <div className="col-span-4 flex flex-col border-r border-surface-800">
          <PaneTitle>Canvas</PaneTitle>
          <div className="flex-1">
            <Canvas doc={doc} onChange={onCanvasEdit} />
          </div>
        </div>
        <div className="col-span-3 flex flex-col">
          <PaneTitle>AI co-pilot</PaneTitle>
          <div className="flex-1">
            <AiChatPanel interviewId={interviewId} />
          </div>
        </div>
      </div>
    </div>
  );
}

function PaneTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-surface-800 bg-surface-925 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-surface-400">
      {children}
    </div>
  );
}
