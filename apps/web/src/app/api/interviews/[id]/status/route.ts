import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { schema } from '@leucent/db';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { getValidParticipantSession } from '@/lib/interview-participants';

/**
 * Lightweight status for waiting-room polling. Caller must be either the owning
 * org (interviewer) or hold a valid scoped participant session.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [iv] = await db().select().from(schema.interview).where(eq(schema.interview.id, id));
  if (!iv) return new NextResponse('Not found', { status: 404 });

  const session = await getSession();
  const orgId = session?.session.activeOrganizationId;
  const interviewerOk = session?.user && orgId && iv.organizationId === orgId ? true : false;

  const participant = await getValidParticipantSession(id);
  const candidateOk = Boolean(participant);

  if (!interviewerOk && !candidateOk) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  return NextResponse.json({
    status: iv.status,
    title: iv.title,
  });
}
