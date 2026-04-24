import type { ReactNode } from 'react';
import Link from 'next/link';
import { Badge, Button, Container } from '@leucent/ui';
import { SiteShell } from '@/components/SiteShell';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Features',
  description:
    'A live workspace for the candidate, a real-time console for the interviewer, and frame-perfect playback of every interview.',
};

export default function FeaturesPage() {
  return (
    <SiteShell activeNav="features">
      <Hero />
      <StatStrip />
      <BentoGrid />
      <FlowSection />
      <CallToAction />
    </SiteShell>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Hero
 * ────────────────────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-surface-800/80">
      <div className="leucent-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="leucent-glow pointer-events-none absolute inset-0" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[920px] -translate-x-1/2 rounded-full bg-accent-500/15 blur-[120px]"
      />
      <Container size="xl" className="relative py-24 sm:py-32">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <Badge tone="accent" dot>
            Platform overview
          </Badge>
          <h1 className="mt-6 font-display text-5xl font-semibold tracking-tight text-surface-50 sm:text-6xl">
            Everything you need to run a real
            <span className="mt-2 block bg-accent-gradient bg-clip-text text-transparent">
              technical interview.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-surface-300">
            One live workspace, one calm interviewer view, and perfect playback when you&apos;re
            done. No tab juggling, no copy-pasting code into Slack, no &ldquo;can you share your
            screen again?&rdquo;
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg">Start free</Button>
            </Link>
            <Link href="/#how-it-works">
              <Button size="lg" variant="outline">
                See how it works
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Stat strip
 * ────────────────────────────────────────────────────────────────────────── */

const STATS = [
  { value: '< 60s', label: 'From schedule to a working candidate link' },
  { value: '0', label: 'Tools the candidate has to install' },
  { value: '100%', label: 'Of the session captured for replay' },
  { value: '1', label: 'Screen for the interviewer to watch' },
] as const;

function StatStrip() {
  return (
    <section className="border-b border-surface-800/80 py-14">
      <Container size="xl">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-surface-800 bg-surface-800 lg:grid-cols-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-start justify-center gap-1 bg-surface-925 px-6 py-7"
            >
              <div className="font-display text-3xl font-semibold tracking-tight text-surface-50 sm:text-4xl">
                <span className="bg-accent-gradient bg-clip-text text-transparent">{s.value}</span>
              </div>
              <p className="text-sm text-surface-400">{s.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Bento grid of features
 * ────────────────────────────────────────────────────────────────────────── */

function BentoGrid() {
  return (
    <section className="border-b border-surface-800/80 py-24">
      <Container size="xl">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <Badge tone="accent">What you get</Badge>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-surface-50 sm:text-4xl">
            Six things that make every interview better.
          </h2>
          <p className="mt-3 text-surface-400">
            Designed around how interviews actually feel — focused, conversational, and replayable.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-6">
          <FeatureCard
            className="lg:col-span-4"
            badge="Live workspace"
            title="Code and diagram together, in real time."
            body="Everyone sees the same cursor, the same keystrokes, and the same sketch — so the conversation never stalls on &ldquo;wait, where are you looking?&rdquo;"
            tone="primary"
            preview={<LiveCodePreview />}
          />
          <FeatureCard
            className="lg:col-span-2"
            badge="Guided AI"
            title="An assistant that stays on topic."
            body="Hints reflect what the candidate is actually doing — and you choose how much help is fair."
            icon={<SparkleIcon />}
            preview={<AssistantBubblesPreview />}
          />
          <FeatureCard
            className="lg:col-span-2"
            badge="Privacy by design"
            title="A fresh, private workspace each time."
            body="Every interview gets its own sandbox that's wiped the moment the session ends."
            icon={<ShieldIcon />}
            preview={<PrivacyPreview />}
          />
          <FeatureCard
            className="lg:col-span-4"
            badge="Replay"
            title="Scrub through the interview later, like a video."
            body="Replay typing, drawings, assistant chat, and run output at your own pace — perfect for debriefs and calibration."
            tone="primary"
            preview={<ReplayPreview />}
          />
          <FeatureCard
            className="lg:col-span-3"
            badge="Interviewer console"
            title="One screen for the interviewer."
            body="Follow along, see what changed, and tweak the exercise without leaving the call."
            icon={<MonitorIcon />}
            preview={<ConsolePreview />}
          />
          <FeatureCard
            className="lg:col-span-3"
            badge="Built for teams"
            title="Share a workspace with your hiring team."
            body="Invite teammates, send candidates a single join link, and keep every interview cleanly separated."
            icon={<UsersIcon />}
            preview={<TeamsPreview />}
          />
        </div>
      </Container>
    </section>
  );
}

type FeatureCardProps = {
  badge: string;
  title: string;
  body: string;
  className?: string;
  icon?: ReactNode;
  preview?: ReactNode;
  tone?: 'default' | 'primary';
};

function FeatureCard({
  badge,
  title,
  body,
  className = '',
  icon,
  preview,
  tone = 'default',
}: FeatureCardProps) {
  const isPrimary = tone === 'primary';
  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-surface-800 bg-surface-900/60 backdrop-blur-sm transition-all hover:border-accent-700/50 hover:shadow-accent-glow ${className}`}
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 -top-24 h-48 transition-opacity duration-500 ${
          isPrimary ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'
        }`}
        style={{
          background:
            'radial-gradient(60% 60% at 50% 100%, rgba(47,116,255,0.18) 0%, rgba(47,116,255,0) 70%)',
        }}
      />

      {preview ? (
        <div className="relative h-44 overflow-hidden border-b border-surface-800 bg-surface-925">
          {preview}
        </div>
      ) : null}

      <div className="relative flex flex-1 flex-col gap-3 p-6">
        <div className="flex items-center justify-between gap-3">
          <Badge tone="accent">{badge}</Badge>
          {icon ? (
            <span className="text-accent-300/80 transition-colors group-hover:text-accent-300">
              {icon}
            </span>
          ) : null}
        </div>
        <h3 className="font-display text-lg font-semibold tracking-tight text-surface-50 sm:text-xl">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-surface-400">{body}</p>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Workflow / "How an interview flows" section
 * ────────────────────────────────────────────────────────────────────────── */

const FLOW_STEPS = [
  {
    n: '01',
    title: 'Schedule it',
    body: 'Pick a candidate, write a one-line prompt, and Leucent generates a private join link.',
  },
  {
    n: '02',
    title: 'Run it live',
    body: 'You and the candidate share the same workspace — code, diagram, and assistant in one place.',
  },
  {
    n: '03',
    title: 'Replay it later',
    body: 'When the call ends, scrub through the whole session to compare candidates fairly.',
  },
] as const;

function FlowSection() {
  return (
    <section className="border-b border-surface-800/80 py-24">
      <Container size="xl">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <Badge tone="accent">How an interview flows</Badge>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-surface-50 sm:text-4xl">
            Three simple steps from invite to replay.
          </h2>
        </div>

        <div className="relative grid grid-cols-1 gap-5 md:grid-cols-3">
          <div
            aria-hidden
            className="leucent-hairline pointer-events-none absolute left-8 right-8 top-12 hidden h-px md:block"
          />
          {FLOW_STEPS.map((s) => (
            <div
              key={s.n}
              className="relative flex flex-col gap-3 rounded-2xl border border-surface-800 bg-surface-900/60 p-6 backdrop-blur-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-accent-700/50 bg-accent-500/10 font-mono text-sm text-accent-200 shadow-accent-glow">
                {s.n}
              </div>
              <h3 className="font-display text-lg font-semibold tracking-tight text-surface-50">
                {s.title}
              </h3>
              <p className="text-sm leading-relaxed text-surface-400">{s.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * CTA
 * ────────────────────────────────────────────────────────────────────────── */

function CallToAction() {
  return (
    <section className="py-24">
      <Container size="lg">
        <div className="relative overflow-hidden rounded-2xl border border-accent-700/40 bg-surface-900 p-10 text-center shadow-accent-glow sm:p-14">
          <div className="leucent-glow pointer-events-none absolute inset-0" />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[640px] -translate-x-1/2 rounded-full bg-accent-500/15 blur-3xl"
          />
          <div className="relative">
            <Badge tone="accent" dot>
              Ready in minutes
            </Badge>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-surface-50 sm:text-4xl">
              Run your next interview on Leucent.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-surface-300">
              Create a workspace for your team, invite a candidate, and start a real conversation
              about real code.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link href="/signup">
                <Button size="lg">Get started — free</Button>
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

/* ──────────────────────────────────────────────────────────────────────────
 * Decorative card previews (pure CSS / inline SVG, no external assets)
 * ────────────────────────────────────────────────────────────────────────── */

function LiveCodePreview() {
  return (
    <div className="absolute inset-0 grid grid-cols-2 gap-px bg-surface-800">
      <div className="bg-surface-925 p-4 font-mono text-[11px] leading-relaxed text-surface-400">
        <div className="text-surface-600">// candidate</div>
        <div>
          <span className="text-accent-300">function</span>{' '}
          <span className="text-surface-200">solve</span>(g) {'{'}
        </div>
        <div className="pl-3">
          <span className="text-accent-300">const</span> seen ={' '}
          <span className="text-accent-300">new</span> Set();
        </div>
        <div className="pl-3">
          <span className="text-accent-300">return</span> dfs(g, seen);
        </div>
        <div>
          {'}'}
          <span className="ml-1 inline-block h-3 w-1 animate-pulse bg-accent-400 align-middle" />
        </div>
      </div>
      <div className="relative bg-surface-925 p-4">
        <svg
          viewBox="0 0 160 110"
          className="h-full w-full"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <g className="text-surface-700">
            <rect x="10" y="10" width="36" height="22" rx="3" />
            <rect x="62" y="10" width="36" height="22" rx="3" />
            <rect x="114" y="10" width="36" height="22" rx="3" />
            <rect x="36" y="78" width="36" height="22" rx="3" />
            <rect x="88" y="78" width="36" height="22" rx="3" />
          </g>
          <g className="text-accent-500">
            <path d="M28 32 L54 78" />
            <path d="M80 32 L54 78" />
            <path d="M80 32 L106 78" />
            <path d="M132 32 L106 78" />
          </g>
          <g className="text-accent-300">
            <circle cx="28" cy="21" r="2" fill="currentColor" />
            <circle cx="80" cy="21" r="2" fill="currentColor" />
            <circle cx="132" cy="21" r="2" fill="currentColor" />
            <circle cx="54" cy="89" r="2" fill="currentColor" />
            <circle cx="106" cy="89" r="2" fill="currentColor" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function AssistantBubblesPreview() {
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-2 bg-surface-925 p-4">
      <div className="max-w-[80%] rounded-lg rounded-bl-sm border border-surface-700 bg-surface-800/60 px-3 py-2 text-[11px] text-surface-200">
        Try inverting that loop.
      </div>
      <div className="ml-auto max-w-[80%] rounded-lg rounded-br-sm border border-accent-700/40 bg-accent-500/10 px-3 py-2 text-[11px] text-surface-100">
        Good — now O(n) instead of O(n²).
      </div>
      <div className="max-w-[60%] rounded-lg rounded-bl-sm border border-surface-700 bg-surface-800/60 px-3 py-2 text-[11px] text-surface-300">
        <span className="inline-flex gap-1">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-surface-500" />
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-surface-500"
            style={{ animationDelay: '0.2s' }}
          />
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-surface-500"
            style={{ animationDelay: '0.4s' }}
          />
        </span>
      </div>
    </div>
  );
}

function PrivacyPreview() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-surface-925">
      <div className="relative">
        <div className="absolute inset-0 -m-6 rounded-full bg-accent-500/10 blur-2xl" />
        <svg
          width="80"
          height="80"
          viewBox="0 0 64 64"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="relative text-accent-300"
        >
          <path
            d="M32 6 L52 14 V32 C52 44 42 54 32 58 C22 54 12 44 12 32 V14 Z"
            className="fill-accent-500/10"
          />
          <path d="M22 32 L29 39 L43 25" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-widest text-surface-500">
        sandbox · ephemeral
      </div>
    </div>
  );
}

function ReplayPreview() {
  return (
    <div className="absolute inset-0 flex flex-col justify-end bg-surface-925">
      <div className="grid grid-cols-12 items-end gap-1 px-5 pt-6">
        {Array.from({ length: 36 }).map((_, i) => {
          const h = 12 + ((i * 17) % 70);
          const isAccent = i % 5 === 0;
          return (
            <div
              key={i}
              className={`rounded-sm ${isAccent ? 'bg-accent-500/70' : 'bg-surface-700'}`}
              style={{ height: `${h}%` }}
            />
          );
        })}
      </div>
      <div className="relative mt-4 px-5 pb-4">
        <div className="h-1 w-full overflow-hidden rounded-full bg-surface-800">
          <div className="h-full w-2/3 rounded-full bg-accent-gradient" />
        </div>
        <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-surface-500">
          <span>00:14:22</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-400 shadow-[0_0_6px_rgba(47,116,255,0.8)]" />
            playback · 1.5×
          </span>
          <span>00:42:10</span>
        </div>
      </div>
    </div>
  );
}

function ConsolePreview() {
  return (
    <div className="absolute inset-0 grid grid-cols-3 gap-px bg-surface-800">
      <div className="col-span-2 bg-surface-925 p-3">
        <div className="mb-2 h-2 w-16 rounded-full bg-surface-700" />
        <div className="space-y-1">
          <div className="h-1.5 w-full rounded-full bg-surface-800" />
          <div className="h-1.5 w-5/6 rounded-full bg-surface-800" />
          <div className="h-1.5 w-3/4 rounded-full bg-surface-800" />
          <div className="h-1.5 w-2/3 rounded-full bg-accent-500/40" />
          <div className="h-1.5 w-4/5 rounded-full bg-surface-800" />
          <div className="h-1.5 w-1/2 rounded-full bg-surface-800" />
        </div>
      </div>
      <div className="bg-surface-925 p-3">
        <div className="mb-2 h-2 w-12 rounded-full bg-surface-700" />
        <div className="space-y-1.5">
          <div className="rounded border border-accent-700/40 bg-accent-500/10 px-1.5 py-1 text-[9px] text-accent-200">
            edit
          </div>
          <div className="rounded border border-surface-700 bg-surface-800/40 px-1.5 py-1 text-[9px] text-surface-400">
            run
          </div>
          <div className="rounded border border-surface-700 bg-surface-800/40 px-1.5 py-1 text-[9px] text-surface-400">
            note
          </div>
          <div className="rounded border border-surface-700 bg-surface-800/40 px-1.5 py-1 text-[9px] text-surface-400">
            ask
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamsPreview() {
  const PEOPLE = ['AB', 'KM', 'JL', 'RP', 'SN'] as const;
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-surface-925">
      <div className="flex -space-x-2">
        {PEOPLE.map((p, i) => (
          <div
            key={p}
            className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-surface-925 font-mono text-[10px] font-semibold ${
              i === 0 ? 'bg-accent-gradient text-white' : 'bg-surface-800 text-surface-300'
            }`}
          >
            {p}
          </div>
        ))}
        <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-surface-925 bg-surface-800 font-mono text-[10px] text-surface-400">
          +4
        </div>
      </div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-surface-500">
        one workspace · many interviewers
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Inline icons (24px stroke)
 * ────────────────────────────────────────────────────────────────────────── */

function SparkleIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3 L13.5 9 L19.5 10.5 L13.5 12 L12 18 L10.5 12 L4.5 10.5 L10.5 9 Z" />
      <path d="M19 16 L19.8 18.2 L22 19 L19.8 19.8 L19 22 L18.2 19.8 L16 19 L18.2 18.2 Z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3 L20 6 V13 C20 17 16 20 12 21 C8 20 4 17 4 13 V6 Z" />
      <path d="M9 12 L11 14 L15 10" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21 H16" />
      <path d="M12 17 V21" />
      <path d="M7 9 H13" />
      <path d="M7 12 H11" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="9" r="3.2" />
      <circle cx="17" cy="11" r="2.4" />
      <path d="M3 19 C3 16 5.5 14.5 9 14.5 S15 16 15 19" />
      <path d="M14.5 14.5 C18 14.5 20.5 16 20.5 18.5" />
    </svg>
  );
}
