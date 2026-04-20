import { NextResponse } from 'next/server';
import { eq, isNull, and } from 'drizzle-orm';
import { z } from 'zod';
import { schema } from '@leucent/db';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { env } from '@/lib/env';

const Body = z.object({ text: z.string().min(1).max(2000) });

/** Lists active constraints. Used by the AI orchestrator at prompt time. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Internal route — auth via shared service token.
  const auth = _req.headers.get('authorization') ?? '';
  if (auth !== `Bearer ${env().REALTIME_INTERNAL_TOKEN}`) {
    const session = await getSession();
    const [iv] = await db().select().from(schema.interview).where(eq(schema.interview.id, id));
    if (!iv) return new NextResponse('Not found', { status: 404 });
    if (!session?.user || iv.organizationId !== session.session.activeOrganizationId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  }
  const rows = await db()
    .select()
    .from(schema.interviewerConstraint)
    .where(
      and(
        eq(schema.interviewerConstraint.interviewId, id),
        isNull(schema.interviewerConstraint.revokedAt),
      ),
    );
  return NextResponse.json({ constraints: rows });
}

/** Interviewer adds a constraint. Mirrored to the realtime telemetry channel
 * by the interviewer's browser via the WebSocket; no need to push from here. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

  const [iv] = await db().select().from(schema.interview).where(eq(schema.interview.id, id));
  if (!iv) return new NextResponse('Not found', { status: 404 });
  if (iv.organizationId !== session.session.activeOrganizationId) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [created] = await db()
    .insert(schema.interviewerConstraint)
    .values({
      interviewId: id,
      text: parsed.data.text,
      createdByUserId: session.user.id,
    })
    .returning();

  return NextResponse.json({ constraint: created });
}
