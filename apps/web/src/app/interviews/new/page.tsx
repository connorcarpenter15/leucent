import { redirect } from 'next/navigation';
import { Badge, Card, CardBody, CardHeader, CardTitle, Container } from '@leucent/ui';
import { SiteShell } from '@/components/SiteShell';
import { getSession } from '@/lib/session';
import { NewInterviewForm } from './new-interview-form';

export const metadata = { title: 'New interview' };

export default async function NewInterviewPage() {
  const session = await getSession();
  if (!session?.user) redirect('/login');

  return (
    <SiteShell activeNav="new">
      <Container size="md" className="py-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <Badge tone="accent">Schedule</Badge>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-surface-50">
              New interview
            </h1>
            <p className="mt-1 text-sm text-surface-400">
              Leucent will provision a Neon branch and mint a single-use candidate join link as soon
              as you submit.
            </p>
          </div>
        </div>

        <Card tone="raised">
          <CardHeader>
            <CardTitle>Interview details</CardTitle>
          </CardHeader>
          <CardBody>
            <NewInterviewForm />
          </CardBody>
        </Card>
      </Container>
    </SiteShell>
  );
}
