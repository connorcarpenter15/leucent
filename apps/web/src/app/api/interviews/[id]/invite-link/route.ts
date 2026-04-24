import { NextResponse } from 'next/server';
import { and, desc, eq, gt } from 'drizzle-orm';
import { schema } from '@leucent/db';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { generateInviteToken } from '@/lib/invite-token';

/** Returns a shareable candidate join URL for org members managing this interview. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });
  const orgId = session.session.activeOrganizationId;
  if (!orgId) return new NextResponse('No active organization', { status: 400 });

  const [iv] = await db().select().from(schema.interview).where(eq(schema.interview.id, id));
  if (!iv || iv.organizationId !== orgId) return new NextResponse('Not found', { status: 404 });

  const [invite] = await db()
    .select()
    .from(schema.interviewInvite)
    .where(
      and(
        eq(schema.interviewInvite.interviewId, id),
        gt(schema.interviewInvite.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(schema.interviewInvite.createdAt))
    .limit(1);

  let token = invite?.urlToken ?? null;
  let expiresAt = invite?.expiresAt ?? null;

  if (!token) {
    const mint = generateInviteToken();
    expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3);
    await db().insert(schema.interviewInvite).values({
      interviewId: id,
      tokenHash: mint.hash,
      urlToken: mint.token,
      expiresAt,
    });
    token = mint.token;
  }

  const joinUrl = new URL(`/join/${token}`, new URL(req.url).origin).toString();

  return NextResponse.json({
    joinUrl,
    expiresAt: expiresAt?.toISOString() ?? null,
  });
}
