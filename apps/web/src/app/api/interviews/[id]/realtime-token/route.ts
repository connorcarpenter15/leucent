import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { schema } from '@leucent/db';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { mintRealtimeToken } from '@/lib/realtime-token';

/**
 * Mints a short-lived JWT for the realtime server. Authorization rules:
 * - Interviewer: must own the interview (matching org).
 * - Candidate: must present the candidate session cookie set by /join/{token}.
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

  const candidateCookie = (await cookies()).get(`leucent_candidate_${id}`);
  if (candidateCookie?.value) {
    const token = await mintRealtimeToken({
      subject: candidateCookie.value,
      interviewId: id,
      role: 'candidate',
    });
    return NextResponse.json({ token });
  }

  return new NextResponse('Unauthorized', { status: 401 });
}
