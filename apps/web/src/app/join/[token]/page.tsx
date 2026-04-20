import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { Logo } from '@leucent/ui';
import { schema } from '@leucent/db';
import { db } from '@/lib/db';
import { hashInviteToken } from '@/lib/invite-token';

export const dynamic = 'force-dynamic';

/**
 * The candidate landing page. Validates the single-use invite token, marks it
 * consumed, sets a scoped session cookie, and redirects to the candidate
 * workspace. Candidates never authenticate against Neon Auth; this cookie is
 * the entire scope of their session and is bound to one interview id.
 */
export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const hash = hashInviteToken(token);

  const [invite] = await db()
    .select()
    .from(schema.interviewInvite)
    .where(
      and(
        eq(schema.interviewInvite.tokenHash, hash),
        gt(schema.interviewInvite.expiresAt, new Date()),
        isNull(schema.interviewInvite.consumedAt),
      ),
    );

  if (!invite) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="rounded-2xl border border-surface-800 bg-surface-900/60 p-8">
          <Logo size="md" className="justify-center" />
          <h1 className="mt-6 font-display text-2xl font-semibold text-surface-50">
            This link is no longer valid.
          </h1>
          <p className="mt-2 text-sm text-surface-400">
            Invite tokens are single-use. Ask your interviewer to send a new link.
          </p>
        </div>
      </main>
    );
  }

  await db()
    .update(schema.interviewInvite)
    .set({ consumedAt: new Date() })
    .where(eq(schema.interviewInvite.id, invite.id));

  const candidateId = `cand_${crypto.randomUUID()}`;
  (await cookies()).set({
    name: `leucent_candidate_${invite.interviewId}`,
    value: candidateId,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  redirect(`/interviews/${invite.interviewId}/work`);
}
