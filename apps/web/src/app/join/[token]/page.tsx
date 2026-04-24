import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { eq, and, gt, ne } from 'drizzle-orm';
import { Logo } from '@leucent/ui';
import { schema } from '@leucent/db';
import { db } from '@/lib/db';
import { hashInviteToken } from '@/lib/invite-token';

export const dynamic = 'force-dynamic';

/**
 * Candidate landing page. Validates the invite token (reusable until the
 * interview ends or the invite expires), sets a scoped session cookie, and
 * redirects to the candidate workspace.
 */
export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const hash = hashInviteToken(token);

  const [row] = await db()
    .select({ interviewId: schema.interviewInvite.interviewId })
    .from(schema.interviewInvite)
    .innerJoin(schema.interview, eq(schema.interviewInvite.interviewId, schema.interview.id))
    .where(
      and(
        eq(schema.interviewInvite.tokenHash, hash),
        gt(schema.interviewInvite.expiresAt, new Date()),
        ne(schema.interview.status, 'completed'),
        ne(schema.interview.status, 'expired'),
      ),
    )
    .limit(1);

  if (!row) {
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

  const candidateId = `cand_${crypto.randomUUID()}`;
  (await cookies()).set({
    name: `leucent_candidate_${row.interviewId}`,
    value: candidateId,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  redirect(`/interviews/${row.interviewId}/work`);
}
