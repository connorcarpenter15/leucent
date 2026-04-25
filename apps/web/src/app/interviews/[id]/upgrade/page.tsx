import { redirect } from 'next/navigation';
import { Badge, Card, CardBody, CardHeader, CardTitle, Container } from '@leucent/ui';
import { SiteShell } from '@/components/SiteShell';
import { getSession } from '@/lib/session';
import { getValidParticipantSession } from '@/lib/interview-participants';
import { UpgradeParticipantButton } from './upgrade-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Save interview history' };

export default async function UpgradeParticipantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const participant = await getValidParticipantSession(id);
  if (!participant) redirect(`/interviews/${id}/work`);

  const session = await getSession();
  if (!session?.user) {
    redirect(`/candidate/signup?next=/interviews/${id}/upgrade`);
  }

  if (participant.userId === session.user.id) redirect('/candidate');

  return (
    <SiteShell minimal>
      <Container size="sm" className="py-20">
        <Card tone="raised">
          <CardHeader>
            <CardTitle>Save this interview</CardTitle>
            <Badge tone="info">Candidate account</Badge>
          </CardHeader>
          <CardBody className="text-sm text-surface-300">
            <p>
              Link this guest participation to your signed-in candidate account. Leucent will keep
              the interview scoped to this participant record; you will not be added to the
              company&apos;s organization.
            </p>
            <UpgradeParticipantButton interviewId={id} />
          </CardBody>
        </Card>
      </Container>
    </SiteShell>
  );
}
