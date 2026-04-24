import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { schema } from '@leucent/db';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

/**
 * Lightweight status for waiting-room polling. Caller must be either the owning
 * org (interviewer) or hold the scoped candidate cookie for this interview.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [iv] = await db().select().from(schema.interview).where(eq(schema.interview.id, id));
  if (!iv) return new NextResponse('Not found', { status: 404 });

  const session = await getSession();
  const orgId = session?.session.activeOrganizationId;
  const interviewerOk = session?.user && orgId && iv.organizationId === orgId ? true : false;

  const cookie = (await cookies()).get(`leucent_candidate_${id}`);
  const candidateOk = Boolean(cookie?.value);

  if (!interviewerOk && !candidateOk) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  return NextResponse.json({
    status: iv.status,
    title: iv.title,
  });
}
