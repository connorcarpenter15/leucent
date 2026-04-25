import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Badge, Button, Logo } from '@leucent/ui';
import { getSession } from '@/lib/session';
import { resolveJoinInvite } from '@/lib/interview-invites';
import {
  createOrReuseRegisteredParticipant,
  createParticipantSession,
  displayNameFromParts,
  participantSessionExpiresAt,
} from '@/lib/interview-participants';
import { GuestJoinForm } from './join-form';

export const dynamic = 'force-dynamic';

/**
 * Candidate landing page. Validates the invite token (reusable until the
 * interview ends or the invite expires), sets a scoped session cookie, and
 * redirects to the candidate workspace.
 */
export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const invite = await resolveJoinInvite(token);

  if (!invite) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="rounded-2xl border border-surface-800 bg-surface-900/60 p-8">
          <Logo size="md" className="justify-center" />
          <h1 className="mt-6 font-display text-2xl font-semibold text-surface-50">
            This link is not valid.
          </h1>
          <p className="mt-2 text-sm text-surface-400">
            The invite may have expired, or the interview may have already ended. Ask your
            interviewer for an updated link.
          </p>
        </div>
      </main>
    );
  }

  const session = await getSession();
  if (session?.user) {
    const participant = await createOrReuseRegisteredParticipant({
      interviewId: invite.interviewId,
      userId: session.user.id,
      email: session.user.email ?? invite.recipientEmail,
      displayName: displayNameFromParts(session.user.name, invite.recipientName),
      expiresAt: participantSessionExpiresAt(invite.inviteExpiresAt),
    });
    await createParticipantSession({
      participantId: participant.id,
      interviewId: invite.interviewId,
      expiresAt: participantSessionExpiresAt(invite.inviteExpiresAt),
    });
    redirect(`/interviews/${invite.interviewId}/work`);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="rounded-2xl border border-surface-800 bg-surface-900/60 p-8">
        <Logo size="md" className="justify-center" />
        <Badge tone="accent" dot className="mt-6">
          Candidate access
        </Badge>
        <h1 className="mt-4 font-display text-2xl font-semibold text-surface-50">
          Join {invite.interviewTitle}
        </h1>
        <p className="mt-2 text-sm text-surface-400">
          Continue as a verified guest using this interview link, or sign in to attach the session
          to your global candidate account.
        </p>
        <GuestJoinForm
          token={token}
          suggestedName={invite.recipientName}
          suggestedEmail={invite.recipientEmail}
        />
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Link href={`/login?intent=candidate&next=/join/${encodeURIComponent(token)}`}>
            <Button type="button" variant="outline" size="sm">
              Sign in instead
            </Button>
          </Link>
          <Link href={`/candidate/signup?next=/join/${encodeURIComponent(token)}`}>
            <Button type="button" variant="ghost" size="sm">
              Create candidate account
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
