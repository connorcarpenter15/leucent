import { and, eq, gt, isNull, ne } from 'drizzle-orm';
import { schema } from '@leucent/db';
import { db } from './db';
import { hashInviteToken } from './invite-token';

export async function resolveJoinInvite(token: string) {
  const hash = hashInviteToken(token);
  const [row] = await db()
    .select({
      inviteId: schema.interviewInvite.id,
      interviewId: schema.interviewInvite.interviewId,
      recipientName: schema.interviewInvite.recipientName,
      recipientEmail: schema.interviewInvite.recipientEmail,
      inviteExpiresAt: schema.interviewInvite.expiresAt,
      interviewTitle: schema.interview.title,
      interviewStatus: schema.interview.status,
    })
    .from(schema.interviewInvite)
    .innerJoin(schema.interview, eq(schema.interviewInvite.interviewId, schema.interview.id))
    .where(
      and(
        eq(schema.interviewInvite.tokenHash, hash),
        gt(schema.interviewInvite.expiresAt, new Date()),
        isNull(schema.interviewInvite.revokedAt),
        ne(schema.interview.status, 'completed'),
        ne(schema.interview.status, 'expired'),
      ),
    )
    .limit(1);

  return row ?? null;
}
