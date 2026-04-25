import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { schema } from '@leucent/db';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { endRealtimeSession } from '@/lib/realtime-client';
import { destroySandbox } from '@/lib/sandbox-client';
import { revokeParticipantSessionsForInterview } from '@/lib/interview-participants';

/**
 * Explicitly ends an interview. This is the canonical close path required by
 * the spec: it calls the realtime server's POST /internal/end/{id} webhook,
 * which flushes the event log to S3 and marks the room closed. We do NOT rely
 * on "last client disconnect" — see plan section 3B for rationale.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

  const [iv] = await db().select().from(schema.interview).where(eq(schema.interview.id, id));
  if (!iv) return new NextResponse('Not found', { status: 404 });
  if (iv.organizationId !== session.session.activeOrganizationId) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    await endRealtimeSession(id);
  } catch (err) {
    console.warn('[end] realtime webhook failed (continuing):', err);
  }

  if (iv.sandboxId) {
    try {
      await destroySandbox(iv.sandboxId);
    } catch (err) {
      console.warn('[end] sandbox destroy failed (continuing):', err);
    }
  }

  await db()
    .update(schema.interview)
    .set({ status: 'completed', endedAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.interview.id, id));
  await revokeParticipantSessionsForInterview(id);

  return NextResponse.json({ status: 'completed' });
}
