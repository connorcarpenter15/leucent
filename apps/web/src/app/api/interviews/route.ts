import { NextResponse } from 'next/server';
import { z } from 'zod';
import { schema } from '@leucent/db';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { generateInviteToken } from '@/lib/invite-token';
import { env } from '@/lib/env';

const Body = z.object({
  title: z.string().min(1).max(200),
  candidateName: z.string().min(1).max(100),
  candidateEmail: z.string().email(),
  initialConstraints: z.array(z.string().min(1)).default([]),
});

/**
 * Creates an interview row + a single-use invite token. Returns the interview
 * id and the candidate join URL. The caller (interviewer dashboard) is then
 * responsible for delivering the URL to the candidate.
 *
 * Note: the actual sandbox + Neon branch are provisioned lazily when the
 * interviewer hits "Start" from the interviewer console (see /api/interviews/[id]/start),
 * so we don't burn cloud resources for a scheduled-but-never-attended slot.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });
  const orgId = session.session.activeOrganizationId;
  if (!orgId) return new NextResponse('No active organization', { status: 400 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  const [created] = await db()
    .insert(schema.interview)
    .values({
      organizationId: orgId,
      interviewerUserId: session.user.id,
      title: body.title,
      candidateName: body.candidateName,
      candidateEmail: body.candidateEmail,
      status: 'scheduled',
    })
    .returning();
  if (!created) return new NextResponse('insert failed', { status: 500 });

  if (body.initialConstraints.length > 0) {
    await db()
      .insert(schema.interviewerConstraint)
      .values(
        body.initialConstraints.map((text) => ({
          interviewId: created.id,
          text,
          createdByUserId: session.user.id,
        })),
      );
  }

  const { token, hash } = generateInviteToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3);
  await db().insert(schema.interviewInvite).values({
    interviewId: created.id,
    tokenHash: hash,
    expiresAt,
  });

  const joinUrl = new URL(`/join/${token}`, env().BETTER_AUTH_URL).toString();

  return NextResponse.json({
    interviewId: created.id,
    joinUrl,
    expiresAt,
  });
}
