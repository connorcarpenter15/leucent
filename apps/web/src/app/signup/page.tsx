import { Badge, Card, CardBody, CardHeader, CardTitle, Container } from '@leucent/ui';
import { SiteShell } from '@/components/SiteShell';
import { SignupForm } from './signup-form';

export const metadata = { title: 'Create an organization' };

export default function SignupPage() {
  return (
    <SiteShell>
      <section className="relative overflow-hidden">
        <div className="leucent-glow pointer-events-none absolute inset-0" />
        <Container size="lg" className="grid gap-10 py-20 md:grid-cols-[1.1fr_1fr]">
          <div className="hidden flex-col justify-center md:flex">
            <Badge tone="accent" dot>
              Get started
            </Badge>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-surface-50">
              Spin up an organization in under a minute.
            </h1>
            <p className="mt-3 max-w-md text-surface-400">
              You&apos;ll get a dashboard, an invite-link generator, and a fresh Neon branch per
              interview the moment you create one.
            </p>
            <ul className="mt-8 flex flex-col gap-3 text-sm text-surface-300">
              {[
                'Free to try, no credit card required',
                'One workspace per interview, torn down at end',
                'Built on Better Auth — your data, your tenants',
              ].map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-accent-500 shadow-[0_0_6px_rgba(47,116,255,0.8)]" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <Card tone="raised">
            <CardHeader>
              <CardTitle>Create your organization</CardTitle>
              <Badge tone="accent">Free</Badge>
            </CardHeader>
            <CardBody>
              <SignupForm />
            </CardBody>
          </Card>
        </Container>
      </section>
    </SiteShell>
  );
}
