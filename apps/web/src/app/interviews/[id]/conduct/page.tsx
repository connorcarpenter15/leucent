import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { schema } from '@leucent/db';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { InterviewerConsole } from './console-client';

export const dynamic = 'force-dynamic';

/** Interviewer console. Live-mirrors the candidate's editor and
 * canvas, surfaces telemetry as an action log, accepts new AI constraints,
 * shows exec output, and exposes the canonical End Interview button. */
export default async function ConductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  return (
    <InterviewerConsole
      interviewId={id}
      title={iv.title}
      candidateName={iv.candidateName}
      status={iv.status}
      initialConstraints={constraints.map((c) => ({
        id: c.id,
        text: c.text,
        createdAt: c.createdAt.toISOString(),
        revokedAt: c.revokedAt?.toISOString() ?? null,
      }))}
    />
  );
}
