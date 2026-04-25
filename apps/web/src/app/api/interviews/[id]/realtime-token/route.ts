import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { schema } from '@leucent/db';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { mintRealtimeToken } from '@/lib/realtime-token';
import { getValidParticipantSession } from '@/lib/interview-participants';

/**
 * Mints a short-lived JWT for the realtime server. Authorization rules:
 * - Interviewer: must own the interview (matching org).
 * - Candidate: must present a valid participant session created by /join/{token}.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [iv] = await db().select().from(schema.interview).where(eq(schema.interview.id, id));
  if (!iv) return new NextResponse('Not found', { status: 404 });

  const session = await getSession();
  if (session?.user && iv.organizationId === session.session.activeOrganizationId) {
    const token = await mintRealtimeToken({
      subject: session.user.id,
      interviewId: id,
      role: 'interviewer',
    });
    return NextResponse.json({ token });
  }

  const participant = await getValidParticipantSession(id);
  if (participant) {
    const token = await mintRealtimeToken({
      subject: participant.participantId,
      interviewId: id,
      role: 'candidate',
      userId: participant.userId,
    });
    return NextResponse.json({ token });
  }

  return new NextResponse('Unauthorized', { status: 401 });
}
