import Link from 'next/link';
import { Badge, Card, CardBody, CardHeader, CardTitle, Container } from '@leucent/ui';
import { SiteShell } from '@/components/SiteShell';

export const metadata = { title: 'Create an account' };

// SiteShell reads the session via Neon Auth, which requires dynamic rendering.
export const dynamic = 'force-dynamic';

export default function SignupPage() {
  return (
    <SiteShell>
      <section className="relative overflow-hidden">
        <div className="leucent-glow pointer-events-none absolute inset-0" />
        <Container size="lg" className="grid gap-10 py-20 md:grid-cols-[1.1fr_1fr]">
          <div className="hidden flex-col justify-center md:flex">
            <Badge tone="accent" dot>
              Choose your workspace
            </Badge>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-surface-50">
              Two separate ways to use Leucent.
            </h1>
            <p className="mt-3 max-w-md text-surface-400">
              Companies schedule and conduct interviews from an organization. Candidates join
              interviews as global users or scoped guests without joining that organization.
            </p>
            <ul className="mt-8 flex flex-col gap-3 text-sm text-surface-300">
              {[
                'Company accounts create organizations and invite team members',
                'Candidate accounts exist independently of any company tenant',
                'Interview links bridge the two worlds for one session only',
              ].map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-accent-500 shadow-[0_0_6px_rgba(47,116,255,0.8)]" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-4">
            <Card tone="raised">
              <CardHeader>
                <CardTitle>Leucent for Work</CardTitle>
                <Badge tone="accent">Company</Badge>
              </CardHeader>
              <CardBody className="flex flex-col gap-4 text-sm text-surface-300">
                <p>Create an organization, invite teammates, and schedule interviews.</p>
                <Link
                  href="/work/signup"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-accent-600 px-4 text-sm font-medium text-white hover:bg-accent-500"
                >
                  Create organization
                </Link>
              </CardBody>
            </Card>
            <Card tone="raised">
              <CardHeader>
                <CardTitle>Leucent for Candidates</CardTitle>
                <Badge tone="info">Global user</Badge>
              </CardHeader>
              <CardBody className="flex flex-col gap-4 text-sm text-surface-300">
                <p>Create a candidate profile without joining any company organization.</p>
                <Link
                  href="/candidate/signup"
                  className="inline-flex h-10 items-center justify-center rounded-md border border-surface-700 px-4 text-sm font-medium text-surface-100 hover:border-accent-500 hover:text-accent-200"
                >
                  Create candidate account
                </Link>
              </CardBody>
            </Card>
          </div>
        </Container>
      </section>
    </SiteShell>
  );
}
