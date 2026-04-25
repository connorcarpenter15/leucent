import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import {
  getValidParticipantSession,
  linkParticipantToUser,
  normalizeParticipantEmail,
} from '@/lib/interview-participants';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) return new NextResponse('Sign in required.', { status: 401 });

  const participant = await getValidParticipantSession(id);
  if (!participant) return new NextResponse('Participant session required.', { status: 401 });

  if (participant.userId === session.user.id) {
    return NextResponse.json({ ok: true });
  }

  const participantEmail = normalizeParticipantEmail(participant.email);
  const accountEmail = normalizeParticipantEmail(session.user.email);
  if (participantEmail && accountEmail && participantEmail !== accountEmail) {
    return new NextResponse('Sign in with the same email used for this guest session.', {
      status: 409,
    });
  }

  await linkParticipantToUser({
    participantId: participant.participantId,
    userId: session.user.id,
    email: accountEmail ?? participantEmail,
    displayName: session.user.name ?? participant.displayName ?? accountEmail,
  });

  return NextResponse.json({ ok: true });
}
