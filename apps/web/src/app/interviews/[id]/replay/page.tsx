import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { schema } from '@leucent/db';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { fetchReplay } from '@/lib/replay-store';
import { ReplayClient } from './replay-client';

export const dynamic = 'force-dynamic';

/** Replay viewer for a completed interview. The realtime server flushed the
 * full event log to S3 as JSONL on close — we hydrate it here and feed it
 * to a client component with a scrubber + variable speed playback. */
export default async function ReplayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) redirect('/login');

  const [iv] = await db().select().from(schema.interview).where(eq(schema.interview.id, id));
  if (!iv) redirect('/dashboard');
  if (iv.organizationId !== session.session.activeOrganizationId) redirect('/dashboard');

  let events = [] as Awaited<ReturnType<typeof fetchReplay>>;
  if (iv.replayS3Key) {
    try {
      events = await fetchReplay(iv.replayS3Key);
    } catch (err) {
      console.warn('replay fetch failed', err);
    }
  }

  return (
    <ReplayClient
      title={iv.title}
      candidateName={iv.candidateName}
      hasKey={Boolean(iv.replayS3Key)}
      events={events}
    />
  );
}
