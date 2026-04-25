import { Badge, Card, CardBody, CardHeader, CardTitle, Container } from '@leucent/ui';
import { SiteShell } from '@/components/SiteShell';
import { WorkSignupForm } from '@/app/signup/signup-form';

export const metadata = { title: 'Create an organization' };

export const dynamic = 'force-dynamic';

export default function WorkSignupPage() {
  return (
    <SiteShell>
      <section className="relative overflow-hidden">
        <div className="leucent-glow pointer-events-none absolute inset-0" />
        <Container size="lg" className="grid gap-10 py-20 md:grid-cols-[1.1fr_1fr]">
          <div className="hidden flex-col justify-center md:flex">
            <Badge tone="accent" dot>
              Leucent for Work
            </Badge>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-surface-50">
              Spin up an organization in under a minute.
            </h1>
            <p className="mt-3 max-w-md text-surface-400">
              Create the tenant that owns interviews, billing, team membership, and sandbox
              settings. Candidates will still join through interview-scoped participant records.
            </p>
          </div>

          <Card tone="raised">
            <CardHeader>
              <CardTitle>Create your organization</CardTitle>
              <Badge tone="accent">Company</Badge>
            </CardHeader>
            <CardBody>
              <WorkSignupForm />
            </CardBody>
          </Card>
        </Container>
      </section>
    </SiteShell>
  );
}
