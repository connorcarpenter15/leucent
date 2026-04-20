import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { schema } from '@leucent/db';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { createSandbox } from '@/lib/sandbox-client';

/**
 * Provisions the sandbox + Neon branch for an interview and flips the row to
 * `live`. This is the only place that calls the sandbox provisioner with the
 * interviewer's authority. The provisioner blocks until the DB readiness probe
 * passes (see plan section 3D), so by the time this returns 200 the candidate
 * environment is ready to accept connections.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });
  const orgId = session.session.activeOrganizationId;
  if (!orgId) return new NextResponse('No active organization', { status: 400 });

  const [iv] = await db().select().from(schema.interview).where(eq(schema.interview.id, id));
  if (!iv || iv.organizationId !== orgId) {
    return new NextResponse('Not found', { status: 404 });
  }
  if (iv.status === 'live') {
    return NextResponse.json({ status: 'live', sandboxId: iv.sandboxId });
  }
  if (iv.status === 'completed' || iv.status === 'expired') {
    return new NextResponse(`Interview already ${iv.status}`, { status: 409 });
  }

  await db()
    .update(schema.interview)
    .set({ sandboxStatus: 'provisioning', updatedAt: new Date() })
    .where(eq(schema.interview.id, id));

  let sandbox: Awaited<ReturnType<typeof createSandbox>>;
  try {
    sandbox = await createSandbox({ interviewId: id, organizationId: orgId });
  } catch (err) {
    await db()
      .update(schema.interview)
      .set({ sandboxStatus: 'failed', updatedAt: new Date() })
      .where(eq(schema.interview.id, id));
    return new NextResponse(`Sandbox provisioner: ${(err as Error).message}`, { status: 503 });
  }

  await db()
    .update(schema.interview)
    .set({
      status: 'live',
      startedAt: new Date(),
      sandboxId: sandbox.sandbox_id,
      sandboxStatus: sandbox.status,
      neonBranchId: sandbox.neon_branch_id ?? null,
      updatedAt: new Date(),
    })
    .where(eq(schema.interview.id, id));

  return NextResponse.json({ status: 'live', sandboxId: sandbox.sandbox_id });
}
