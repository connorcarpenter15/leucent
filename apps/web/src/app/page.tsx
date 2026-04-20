import Link from 'next/link';
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, Container } from '@leucent/ui';
import { SiteShell } from '@/components/SiteShell';

const FEATURES = [
  {
    title: 'Real-time canvas + IDE',
    body: 'React Flow + Monaco synchronized over Yjs CRDTs. Zero merge conflicts, even when both participants type at once. Awareness and cursors come for free.',
    badge: 'Realtime',
  },
  {
    title: 'Context-aware AI co-pilot',
    body: 'The orchestrator injects the live filesystem, the architecture canvas, and any interviewer constraints into every prompt — so guidance is always grounded in what the candidate is actually doing.',
    badge: 'AI',
  },
  {
    title: 'Ephemeral sandboxes',
    body: 'Each interview gets its own hardened Docker container and an isolated Neon database branch, torn down the moment the session ends. No noisy neighbors, no shared state.',
    badge: 'Isolation',
  },
  {
    title: 'Perfect replay',
    body: 'Every keystroke, canvas op, AI prompt, and exec run is captured as a CRDT update + telemetry stream. Scrub a finished interview at variable speed with cumulative stats.',
    badge: 'Audit',
  },
  {
    title: 'Interviewer console',
    body: 'A read-only mirror of the candidate&apos;s editor and canvas, an action log with semantic summaries, the AI conversation, and a constraint editor — all in one screen.',
    badge: 'Observe',
  },
  {
    title: 'Built for teams',
    body: 'Better Auth organizations and roles out of the box. Single-use candidate invite tokens. JWT-scoped realtime sessions. Per-interview Neon branches for blast-radius containment.',
    badge: 'Enterprise',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Schedule',
    body: 'Create the interview from the dashboard with a title, candidate, and starting AI constraints. Leucent provisions a Neon branch and mints a single-use join link.',
  },
  {
    n: '02',
    title: 'Conduct',
    body: 'The candidate joins their workspace; you open the console. Code, canvas, AI traffic, and exec output stream live in both directions over a single Yjs room.',
  },
  {
    n: '03',
    title: 'Review',
    body: 'On End Interview, the realtime server flushes the full event log to S3. Replay the session at 0.5×–8× to see exactly how the candidate thought through the problem.',
  },
];

export default function HomePage() {
  return (
    <SiteShell activeNav="home">
      <Hero />
      <Features />
      <HowItWorks />
      <Security />
      <CallToAction />
    </SiteShell>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-surface-800/80">
      <div className="leucent-glow pointer-events-none absolute inset-0" />
      <div className="leucent-grid pointer-events-none absolute inset-0 opacity-60" />
      <Container size="xl" className="relative py-24 sm:py-32">
        <div className="flex max-w-3xl flex-col items-start gap-6">
          <Badge tone="accent" dot>
            Beta · invite only
          </Badge>
          <h1 className="font-display text-5xl font-semibold tracking-tight text-surface-50 sm:text-6xl">
            Synchronous, observable
            <span className="block bg-accent-gradient bg-clip-text text-transparent">
              technical interviews.
            </span>
          </h1>
          <p className="max-w-2xl text-lg text-surface-300">
            Leucent gives candidates a real IDE, a system-design canvas, and an AI co-pilot — and
            gives interviewers a live console with perfect playback after the fact. Run the loop you
            actually want, not the one a shared Google Doc forces on you.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/signup">
              <Button size="lg">Get started — it&apos;s free</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Interviewer sign in
              </Button>
            </Link>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-surface-400">
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-500 shadow-[0_0_6px_rgba(47,116,255,0.8)]" />
              Yjs CRDT sync
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-500 shadow-[0_0_6px_rgba(47,116,255,0.8)]" />
              Per-interview Neon branch
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-500 shadow-[0_0_6px_rgba(47,116,255,0.8)]" />
              Hardened Docker sandbox
            </span>
          </div>
        </div>

        <HeroPreview />
      </Container>
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="relative mt-16">
      <div
        aria-hidden
        className="absolute inset-x-12 -top-6 h-12 rounded-t-2xl bg-accent-500/10 blur-2xl"
      />
      <div className="relative overflow-hidden rounded-2xl border border-surface-800 bg-surface-900/80 shadow-elevated">
        <div className="flex items-center justify-between gap-3 border-b border-surface-800 bg-surface-925 px-4 py-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-surface-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-surface-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-surface-700" />
          </div>
          <span className="text-xs text-surface-500">interview · senior-backend-loop</span>
          <Badge tone="success" dot>
            live
          </Badge>
        </div>
        <div className="grid grid-cols-12">
          <div className="col-span-7 border-r border-surface-800 bg-surface-925 p-4 font-mono text-xs leading-relaxed text-surface-300">
            <pre className="whitespace-pre-wrap">{`def solve(graph: dict[str, list[str]]) -> int:
    """Find the longest path in a DAG. O(V + E)."""
    indegree = {n: 0 for n in graph}
    for n, edges in graph.items():
        for e in edges:
            indegree[e] += 1
    order = topo_sort(graph, indegree)
    dist = {n: 0 for n in graph}
    for n in order:
        for e in graph[n]:
            dist[e] = max(dist[e], dist[n] + 1)
    return max(dist.values())`}</pre>
          </div>
          <div className="col-span-5 flex flex-col">
            <div className="border-b border-surface-800 px-4 py-2 text-[11px] uppercase tracking-wider text-surface-500">
              AI co-pilot
            </div>
            <div className="space-y-2 p-4 text-xs">
              <div className="rounded-md border border-surface-700 bg-surface-800/40 p-2 text-surface-200">
                Walk me through your topo_sort implementation.
              </div>
              <div className="rounded-md border border-accent-700/50 bg-accent-500/10 p-2 text-surface-100">
                Kahn&apos;s algorithm — pop nodes with indegree 0, decrement neighbors, repeat.
                O(V+E) and detects cycles via residual count.
              </div>
            </div>
            <div className="mt-auto border-t border-surface-800 bg-surface-925 px-4 py-2 text-[11px] text-surface-500">
              <span className="text-accent-300">interviewer</span> added constraint: &quot;no
              third-party graph libraries&quot;
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Features() {
  return (
    <section id="features" className="border-b border-surface-800/80 py-24">
      <Container size="xl">
        <div className="mb-12 max-w-2xl">
          <Badge tone="accent">Platform</Badge>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-surface-50 sm:text-4xl">
            Everything an interview loop needs, nothing it doesn&apos;t.
          </h2>
          <p className="mt-3 text-surface-400">
            Built around a single shared CRDT room per interview, with everything else — AI,
            sandbox, telemetry — orbiting that source of truth.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="h-full">
              <CardHeader>
                <CardTitle>{f.title}</CardTitle>
                <Badge tone="accent">{f.badge}</Badge>
              </CardHeader>
              <CardBody className="text-sm text-surface-300">{f.body}</CardBody>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-surface-800/80 py-24">
      <Container size="xl">
        <div className="mb-12 max-w-2xl">
          <Badge tone="accent">How it works</Badge>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-surface-50 sm:text-4xl">
            Three surfaces, one source of truth.
          </h2>
          <p className="mt-3 text-surface-400">
            A single Yjs room per interview powers the candidate workspace, the interviewer console,
            and replay. The Rust realtime server is the only thing that talks to S3.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {STEPS.map((s) => (
            <Card key={s.n} tone="raised" className="relative overflow-hidden">
              <div className="absolute right-4 top-4 font-display text-5xl font-semibold text-surface-800">
                {s.n}
              </div>
              <CardBody className="space-y-2 pt-6">
                <h3 className="text-lg font-semibold text-surface-50">{s.title}</h3>
                <p className="text-sm text-surface-300">{s.body}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}

function Security() {
  return (
    <section id="security" className="border-b border-surface-800/80 py-24">
      <Container size="xl" className="grid gap-10 md:grid-cols-2">
        <div>
          <Badge tone="accent">Security</Badge>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-surface-50 sm:text-4xl">
            Isolated by construction.
          </h2>
          <p className="mt-3 text-surface-400">
            Every interview runs in its own hardened sandbox container with no network by default,
            an explicit egress allowlist, CPU/memory/PID caps, and a read-only root filesystem. The
            candidate&apos;s database is a per-interview Neon branch, blown away when the session
            ends.
          </p>
        </div>
        <div className="grid gap-3">
          {[
            'JWT-scoped websocket sessions, per interview, expiring with the room',
            'Single-use candidate invite tokens, hashed at rest',
            'Per-interview Neon branch with strict readiness probe before signaling ready',
            'S3 flush only on explicit End Interview or idle GC',
            'Better Auth organizations + role-based access for interviewers',
          ].map((line) => (
            <div
              key={line}
              className="flex items-start gap-3 rounded-lg border border-surface-800 bg-surface-900/60 px-4 py-3"
            >
              <span className="mt-1 inline-block h-1.5 w-1.5 flex-none rounded-full bg-accent-500 shadow-[0_0_6px_rgba(47,116,255,0.8)]" />
              <span className="text-sm text-surface-200">{line}</span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function CallToAction() {
  return (
    <section className="py-24">
      <Container size="lg">
        <div className="relative overflow-hidden rounded-2xl border border-accent-700/40 bg-surface-900 p-10 text-center shadow-accent-glow">
          <div className="leucent-glow pointer-events-none absolute inset-0" />
          <div className="relative">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-surface-50 sm:text-4xl">
              Run your next loop on Leucent.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-surface-300">
              Spin up an organization in under a minute, send your first candidate a join link, and
              stop pretending a shared Google Doc is an interview tool.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="/signup">
                <Button size="lg">Create an organization</Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">
                  I already have an account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
