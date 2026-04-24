import { redirect } from 'next/navigation';
import { Badge, Card, CardBody, Container } from '@leucent/ui';
import { SiteShell } from '@/components/SiteShell';
import { getSession } from '@/lib/session';
import { InterviewCreationPanel } from './interview-creation-panel';

export const metadata = { title: 'New interview' };

export const dynamic = 'force-dynamic';

export default async function NewInterviewPage() {
  const session = await getSession();
  if (!session?.user) redirect('/login');

  return (
    <SiteShell activeNav="new">
      <Container size="md" className="py-12">
        <div className="mb-8">
          <Badge tone="accent">Venue</Badge>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-surface-50">
            New interview room
          </h1>
          <p className="mt-2 max-w-xl text-sm text-surface-400">
            Leucent is the venue: generate a persistent join link and use your normal calendar or
            ATS for scheduling. Start instantly when you&apos;re already on a call, or create a link
            to share for later.
          </p>
        </div>

        <InterviewCreationPanel />
      </Container>
    </SiteShell>
  );
}
