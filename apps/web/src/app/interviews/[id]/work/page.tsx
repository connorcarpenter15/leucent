import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { Logo } from '@leucent/ui';
import { schema } from '@leucent/db';
import { db } from '@/lib/db';
import { CandidateWorkspace } from './workspace-client';

export const dynamic = 'force-dynamic';

/** The candidate's IDE + canvas + AI chat. Only renders if the candidate
 * cookie set by /join/{token} is present. */
export default async function CandidateWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookie = (await cookies()).get(`leucent_candidate_${id}`);
  if (!cookie?.value) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="rounded-2xl border border-surface-800 bg-surface-900/60 p-8">
          <Logo size="md" className="justify-center" />
          <h1 className="mt-6 font-display text-2xl font-semibold text-surface-50">
            Join link required.
          </h1>
          <p className="mt-2 text-sm text-surface-400">
            Use the candidate join link your interviewer shared with you.
          </p>
        </div>
      </main>
    );
  }

  const [iv] = await db().select().from(schema.interview).where(eq(schema.interview.id, id));
  if (!iv) redirect('/');
  if (iv.status === 'completed' || iv.status === 'expired') {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="rounded-2xl border border-surface-800 bg-surface-900/60 p-8">
          <Logo size="md" className="justify-center" />
          <h1 className="mt-6 font-display text-2xl font-semibold text-surface-50">
            This interview has ended.
          </h1>
          <p className="mt-2 text-sm text-surface-400">Thanks for participating.</p>
        </div>
      </main>
    );
  }

  return <CandidateWorkspace interviewId={id} title={iv.title} initialStatus={iv.status} />;
}
