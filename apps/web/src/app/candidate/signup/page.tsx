import { Badge, Card, CardBody, CardHeader, CardTitle, Container } from '@leucent/ui';
import { SiteShell } from '@/components/SiteShell';
import { CandidateSignupForm } from '@/app/signup/signup-form';

export const metadata = { title: 'Create candidate account' };

export const dynamic = 'force-dynamic';

export default function CandidateSignupPage() {
  return (
    <SiteShell>
      <section className="relative overflow-hidden">
        <div className="leucent-glow pointer-events-none absolute inset-0" />
        <Container size="lg" className="grid gap-10 py-20 md:grid-cols-[1.1fr_1fr]">
          <div className="hidden flex-col justify-center md:flex">
            <Badge tone="info" dot>
              Leucent for Candidates
            </Badge>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-surface-50">
              Create a global candidate account.
            </h1>
            <p className="mt-3 max-w-md text-surface-400">
              Candidate accounts are not organization members. They are linked to specific
              interviews through participant records and can save interview history over time.
            </p>
          </div>

          <Card tone="raised">
            <CardHeader>
              <CardTitle>Create candidate account</CardTitle>
              <Badge tone="info">No organization</Badge>
            </CardHeader>
            <CardBody>
              <CandidateSignupForm />
            </CardBody>
          </Card>
        </Container>
      </section>
    </SiteShell>
  );
}
