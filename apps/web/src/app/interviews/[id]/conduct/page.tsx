import { redirect } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { schema } from '@leucent/db';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { InterviewerConsole } from './console-client';

export const dynamic = 'force-dynamic';

/** Interviewer console. Live-mirrors the candidate's editor and
 * canvas, surfaces telemetry as an action log, accepts new AI constraints,
 * shows exec output, and exposes the canonical End Interview button. */
export default async function ConductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ instant?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await getSession();
  if (!session?.user) redirect('/login');

  const [iv] = await db().select().from(schema.interview).where(eq(schema.interview.id, id));
  if (!iv) redirect('/dashboard');
  if (iv.organizationId !== session.session.activeOrganizationId) {
    redirect('/dashboard');
  }

  const constraints = await db()
    .select()
    .from(schema.interviewerConstraint)
    .where(eq(schema.interviewerConstraint.interviewId, id));
  const [participant] = await db()
    .select()
    .from(schema.interviewParticipant)
    .where(eq(schema.interviewParticipant.interviewId, id))
    .orderBy(desc(schema.interviewParticipant.joinedAt))
    .limit(1);
  const [invite] = await db()
    .select()
    .from(schema.interviewInvite)
    .where(eq(schema.interviewInvite.interviewId, id))
    .orderBy(desc(schema.interviewInvite.createdAt))
    .limit(1);
  const candidateName =
    participant?.displayName ??
    participant?.email ??
    invite?.recipientName ??
    invite?.recipientEmail ??
    null;

  return (
    <InterviewerConsole
      interviewId={id}
      title={iv.title}
      candidateName={candidateName}
      status={iv.status}
      initialAutoStart={sp.instant === '1'}
      initialConstraints={constraints.map((c) => ({
        id: c.id,
        text: c.text,
        createdAt: c.createdAt.toISOString(),
        revokedAt: c.revokedAt?.toISOString() ?? null,
      }))}
    />
  );
}
