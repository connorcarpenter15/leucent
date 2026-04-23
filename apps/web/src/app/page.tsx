import Link from 'next/link';
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, Container } from '@leucent/ui';
import { SiteShell } from '@/components/SiteShell';
import { HOME_FEATURES_SUMMARY } from '@/lib/marketing-features';

// SiteShell reads the session via Neon Auth, which requires dynamic rendering.
export const dynamic = 'force-dynamic';

const STEPS = [
  {
    n: '01',
    title: 'Schedule',
    body: 'From your dashboard, add the interview details and invite the candidate. Leucent prepares a private workspace and a simple link they use to join—no installs required on their side.',
  },
  {
    n: '02',
    title: 'Run the session',
    body: 'The candidate codes and sketches while you watch in your interviewer view. You can follow the timeline, adjust the exercise, and decide how much automated help is appropriate.',
  },
  {
    n: '03',
    title: 'Review afterward',
    body: 'When the interview is over, walk through what happened at your own pace. Playback is there for debriefs, hiring decisions, and getting aligned with teammates who were not in the room.',
  },
];

const SECURITY_POINTS = [
  'Each interview uses its own short-lived workspace instead of sharing one long-lived machine.',
  'Candidate links are single-use and tied to the interview you created.',
  'Interview data is packaged up when the session ends the way your team expects—not left scattered across personal laptops.',
  'Team accounts and roles so the right people can schedule, run, or review sessions.',
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
            Technical interviews you can
            <span className="block bg-accent-gradient bg-clip-text text-transparent">
              actually observe.
            </span>
          </h1>
          <p className="max-w-2xl text-lg text-surface-300">
            Leucent gives candidates a real coding surface and a simple way to draw architecture
            ideas—while you follow along live and replay the session afterward. Less guessing what
            happened off-screen; more confidence in what you saw.
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
              Live workspace for everyone
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-500 shadow-[0_0_6px_rgba(47,116,255,0.8)]" />
              Fresh session per interview
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-500 shadow-[0_0_6px_rgba(47,116,255,0.8)]" />
              Locked-down candidate environment
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
          <span className="text-xs text-surface-500">Interview · backend exercise</span>
          <Badge tone="success" dot>
            live
          </Badge>
        </div>
        <div className="grid grid-cols-12">
          <div className="col-span-7 border-r border-surface-800 bg-surface-925 p-4 font-mono text-xs leading-relaxed text-surface-300">
            <pre className="whitespace-pre-wrap">{`def count_paths(graph, start, end):
    """How many distinct routes from start to end?"""
    seen = set()
    stack = [(start, [start])]
    total = 0
    while stack:
        node, path = stack.pop()
        if node == end:
            total += 1
            continue
        for nxt in graph.get(node, []):
            if nxt not in path:
                stack.append((nxt, path + [nxt]))
    return total`}</pre>
          </div>
          <div className="col-span-5 flex flex-col">
            <div className="border-b border-surface-800 px-4 py-2 text-[11px] uppercase tracking-wider text-surface-500">
              Assistant
            </div>
            <div className="space-y-2 p-4 text-xs">
              <div className="rounded-md border border-surface-700 bg-surface-800/40 p-2 text-surface-200">
                Talk me through how you avoid counting the same loop twice.
              </div>
              <div className="rounded-md border border-accent-700/50 bg-accent-500/10 p-2 text-surface-100">
                I only extend the path when the next city is not already on the current route, so
                cycles cannot inflate the count.
              </div>
            </div>
            <div className="mt-auto border-t border-surface-800 bg-surface-925 px-4 py-2 text-[11px] text-surface-500">
              <span className="text-accent-300">Interviewer</span> added a note: &quot;Please do not
              use a third-party shortest-path library.&quot;
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Features() {
  const { eyebrow, title, lead, bullets } = HOME_FEATURES_SUMMARY;

  return (
    <section id="features" className="border-b border-surface-800/80 py-24">
      <Container size="xl">
        <div className="mb-10 max-w-2xl">
          <Badge tone="accent">{eyebrow}</Badge>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-surface-50 sm:text-4xl">
            {title}
          </h2>
          <p className="mt-3 text-surface-400">{lead}</p>
          <ul className="mt-6 flex flex-col gap-3 text-sm text-surface-300">
            {bullets.map((line) => (
              <li key={line} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-accent-500 shadow-[0_0_6px_rgba(47,116,255,0.8)]" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Link href="/features">
              <Button size="lg">See all features</Button>
            </Link>
          </div>
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
            Three simple beats: schedule, run, review.
          </h2>
          <p className="mt-3 text-surface-400">
            You stay focused on the conversation and the signal—not on duct-taping screen shares,
            shared docs, and timer apps together.
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
          <Badge tone="accent">Security and privacy</Badge>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-surface-50 sm:text-4xl">
            Sessions are meant to start clean—and end clean.
          </h2>
          <p className="mt-3 text-surface-400">
            Candidates should feel they are in a professional, bounded environment—not on someone
            else&apos;s personal laptop. Your team should feel the same about where interview
            artifacts live.
          </p>
        </div>
        <div className="grid gap-3">
          {SECURITY_POINTS.map((line) => (
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
              Ready to try a better interview loop?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-surface-300">
              Create a workspace for your team, send your first candidate link, and see whether live
              observation fits how you hire.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="/signup">
                <Button size="lg">Create a workspace</Button>
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
