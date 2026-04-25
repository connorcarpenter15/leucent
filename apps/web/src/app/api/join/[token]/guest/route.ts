import { NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveJoinInvite } from '@/lib/interview-invites';
import {
  createOrReuseGuestParticipant,
  createParticipantSession,
  participantSessionExpiresAt,
} from '@/lib/interview-participants';

const Body = z.object({
  email: z.string().email(),
  displayName: z.string().max(100).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await resolveJoinInvite(token);
  if (!invite) return new NextResponse('This invite is no longer valid.', { status: 404 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const expiresAt = participantSessionExpiresAt(invite.inviteExpiresAt);
  const participant = await createOrReuseGuestParticipant({
    interviewId: invite.interviewId,
    email: parsed.data.email,
    displayName: parsed.data.displayName ?? invite.recipientName,
    expiresAt,
  });
  await createParticipantSession({
    participantId: participant.id,
    interviewId: invite.interviewId,
    expiresAt,
  });

  return NextResponse.json({ workUrl: `/interviews/${invite.interviewId}/work` });
}
