import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { schema } from '@leucent/db';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { destroySandbox } from '@/lib/sandbox-client';

/**
 * Deletes an interview and cascaded rows (invites, events, constraints, AI
 * chunks). Live sessions must be ended first so candidates are not cut off
 * without an explicit close.
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

  const orgId = session.session.activeOrganizationId;
  if (!orgId) return new NextResponse('No active organization', { status: 400 });

  const [iv] = await db().select().from(schema.interview).where(eq(schema.interview.id, id));
  if (!iv) return new NextResponse('Not found', { status: 404 });
  if (iv.organizationId !== orgId) return new NextResponse('Forbidden', { status: 403 });
  if (iv.status === 'live') {
    return new NextResponse('Cannot delete a live interview. End it first.', { status: 409 });
  }

  if (iv.sandboxId) {
    try {
      await destroySandbox(iv.sandboxId);
    } catch (err) {
      console.warn('[delete interview] sandbox destroy failed (continuing):', err);
    }
  }

  await db().delete(schema.interview).where(eq(schema.interview.id, id));

  return new NextResponse(null, { status: 204 });
}
