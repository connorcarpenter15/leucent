import Link from 'next/link';
import { redirect } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, Container } from '@leucent/ui';
import { schema } from '@leucent/db';
import { SiteShell } from '@/components/SiteShell';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { ensureCandidateProfile } from '@/lib/interview-participants';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Candidate profile' };

export default async function CandidatePage() {
  const session = await getSession();
  if (!session?.user) redirect('/login?intent=candidate&next=/candidate');

  await ensureCandidateProfile({
    userId: session.user.id,
    displayName: session.user.name ?? session.user.email,
  });

  const rows = await db()
    .select({
      participantId: schema.interviewParticipant.id,
      displayName: schema.interviewParticipant.displayName,
      email: schema.interviewParticipant.email,
      identityMode: schema.interviewParticipant.identityMode,
      joinedAt: schema.interviewParticipant.joinedAt,
      interviewId: schema.interview.id,
      title: schema.interview.title,
      status: schema.interview.status,
    })
    .from(schema.interviewParticipant)
    .innerJoin(schema.interview, eq(schema.interviewParticipant.interviewId, schema.interview.id))
    .where(eq(schema.interviewParticipant.userId, session.user.id))
    .orderBy(desc(schema.interviewParticipant.joinedAt))
    .limit(50);

  return (
    <SiteShell activeNav="candidate">
      <Container size="lg" className="py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge tone="info">Candidate</Badge>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-surface-50">
              Candidate profile
            </h1>
            <p className="mt-1 text-sm text-surface-400">
              Signed in as <span className="text-surface-200">{session.user.email}</span>. This
              account is independent of company organizations.
            </p>
          </div>
          <Link href="/signup">
            <Button variant="outline">Switch account type</Button>
          </Link>
        </div>

        {rows.length === 0 ? (
          <Card tone="raised">
            <CardBody className="text-sm text-surface-300">
              Interview history appears here after you join with a candidate account or upgrade a
              guest participation.
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {rows.map((row) => (
              <Card key={row.participantId}>
                <CardHeader>
                  <CardTitle>{row.title}</CardTitle>
                  <Badge tone={row.status === 'completed' ? 'neutral' : 'info'} dot>
                    {row.status}
                  </Badge>
                </CardHeader>
                <CardBody className="text-sm text-surface-300">
                  <p>
                    Participant:{' '}
                    <span className="text-surface-100">
                      {row.displayName ?? row.email ?? 'Candidate'}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-surface-500">
                    Joined {new Date(row.joinedAt).toLocaleString()} as {row.identityMode}.
                  </p>
                  {row.status !== 'completed' && row.status !== 'expired' ? (
                    <Link
                      href={`/interviews/${row.interviewId}/work`}
                      className="mt-4 inline-flex h-8 items-center rounded-md border border-surface-700 px-3 text-xs text-surface-100 hover:border-accent-500 hover:text-accent-200"
                    >
                      Open workspace
                    </Link>
                  ) : null}
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </SiteShell>
  );
}
