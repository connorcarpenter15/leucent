import Link from 'next/link';
import { redirect } from 'next/navigation';
import { eq, desc } from 'drizzle-orm';
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, Container } from '@leucent/ui';
import { schema } from '@leucent/db';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { SiteShell } from '@/components/SiteShell';
import { DeleteInterviewButton } from '@/components/DeleteInterviewButton';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user) redirect('/login');

  const orgId = session.session.activeOrganizationId;
  const interviews = orgId
    ? await db()
        .select()
        .from(schema.interview)
        .where(eq(schema.interview.organizationId, orgId))
        .orderBy(desc(schema.interview.createdAt))
        .limit(50)
    : [];

  const live = interviews.filter((i) => i.status === 'live').length;
  const scheduled = interviews.filter((i) => i.status === 'scheduled').length;
  const completed = interviews.filter((i) => i.status === 'completed').length;

  return (
    <SiteShell activeNav="dashboard">
      <Container size="xl" className="py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-surface-50">
              Interviews
            </h1>
            <p className="mt-1 text-sm text-surface-400">
              Signed in as <span className="text-surface-200">{session.user.email}</span>
              {orgId ? '' : ' — finish creating an organization to schedule interviews.'}
            </p>
          </div>
          <Link href="/interviews/new">
            <Button>+ New interview</Button>
          </Link>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Live now" value={live} tone="success" />
          <StatCard label="Scheduled" value={scheduled} tone="info" />
          <StatCard label="Completed" value={completed} tone="neutral" />
        </div>

        {interviews.length === 0 ? (
          <Card tone="raised">
            <CardBody className="flex flex-col items-start gap-3 text-sm text-surface-300">
              <Badge tone="accent">Get started</Badge>
              <p>
                No interviews yet.{' '}
                <Link href="/interviews/new" className="text-accent-300">
                  Create your first interview
                </Link>{' '}
                to mint a candidate join link.
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {interviews.map((iv) => (
              <Card key={iv.id} className="h-full">
                <CardHeader>
                  <CardTitle>{iv.title}</CardTitle>
                  <StatusBadge status={iv.status} />
                </CardHeader>
                <CardBody className="text-sm text-surface-300">
                  <div className="flex flex-col gap-1">
                    <span>
                      Candidate:{' '}
                      <span className="text-surface-100">
                        {iv.candidateName?.trim() || iv.candidateEmail?.trim() || '—'}
                      </span>
                    </span>
                    {iv.candidateEmail?.trim() ? (
                      <span className="text-surface-400">{iv.candidateEmail}</span>
                    ) : null}
                    <span className="text-xs text-surface-500">
                      Created {new Date(iv.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Link href={`/interviews/${iv.id}/conduct`}>
                      <Button size="sm">Open console</Button>
                    </Link>
                    {iv.status === 'completed' && (
                      <Link href={`/interviews/${iv.id}/replay`}>
                        <Button size="sm" variant="outline">
                          Replay
                        </Button>
                      </Link>
                    )}
                    <DeleteInterviewButton
                      interviewId={iv.id}
                      title={iv.title}
                      status={iv.status}
                    />
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </SiteShell>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'success' | 'info' | 'neutral';
}) {
  return (
    <Card>
      <CardBody className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-surface-400">{label}</div>
          <div className="font-display text-3xl font-semibold text-surface-50">{value}</div>
        </div>
        <Badge tone={tone} dot>
          {label.toLowerCase()}
        </Badge>
      </CardBody>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'live'
      ? 'success'
      : status === 'scheduled'
        ? 'info'
        : status === 'completed'
          ? 'neutral'
          : 'warning';
  return (
    <Badge tone={tone} dot>
      {status}
    </Badge>
  );
}
