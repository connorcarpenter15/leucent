import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { schema } from '@leucent/db';
import { db } from './db';

const PARTICIPANT_COOKIE_PREFIX = 'leucent_participant_';
const PARTICIPANT_SESSION_TTL_MS = 1000 * 60 * 60 * 8;

export type ValidParticipantSession = {
  participantId: string;
  sessionId: string;
  interviewId: string;
  userId: string | null;
  email: string | null;
  displayName: string | null;
  identityMode: 'guest' | 'registered';
  expiresAt: Date;
};

export function participantCookieName(interviewId: string) {
  return `${PARTICIPANT_COOKIE_PREFIX}${interviewId}`;
}

export function normalizeParticipantEmail(email: string | null | undefined) {
  const normalized = email?.trim().toLowerCase();
  return normalized && normalized.length > 0 ? normalized : null;
}

export function displayNameFromParts(
  name: string | null | undefined,
  email: string | null | undefined,
) {
  const trimmed = name?.trim();
  if (trimmed && trimmed.length > 0) return trimmed;
  return normalizeParticipantEmail(email);
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function newSessionToken() {
  return randomBytes(32).toString('base64url');
}

export function participantSessionExpiresAt(limit?: Date | null) {
  const ttl = new Date(Date.now() + PARTICIPANT_SESSION_TTL_MS);
  return limit && limit.getTime() < ttl.getTime() ? limit : ttl;
}

export async function createOrReuseRegisteredParticipant(args: {
  interviewId: string;
  userId: string;
  email?: string | null;
  displayName?: string | null;
  expiresAt: Date;
}) {
  const email = normalizeParticipantEmail(args.email);
  const displayName = displayNameFromParts(args.displayName, email);

  await ensureCandidateProfile({
    userId: args.userId,
    displayName,
  });

  const [existing] = await db()
    .select()
    .from(schema.interviewParticipant)
    .where(
      and(
        eq(schema.interviewParticipant.interviewId, args.interviewId),
        eq(schema.interviewParticipant.userId, args.userId),
        isNull(schema.interviewParticipant.revokedAt),
      ),
    )
    .limit(1);

  if (existing) {
    const [updated] = await db()
      .update(schema.interviewParticipant)
      .set({
        email,
        displayName,
        identityMode: 'registered',
        authMethod: 'session',
        expiresAt: args.expiresAt,
        lastSeenAt: new Date(),
      })
      .where(eq(schema.interviewParticipant.id, existing.id))
      .returning();
    return updated ?? existing;
  }

  const [created] = await db()
    .insert(schema.interviewParticipant)
    .values({
      interviewId: args.interviewId,
      userId: args.userId,
      email,
      displayName,
      identityMode: 'registered',
      authMethod: 'session',
      expiresAt: args.expiresAt,
    })
    .returning();
  if (!created) throw new Error('Could not create registered participant.');
  return created;
}

export async function createOrReuseGuestParticipant(args: {
  interviewId: string;
  email: string;
  displayName?: string | null;
  expiresAt: Date;
}) {
  const email = normalizeParticipantEmail(args.email);
  if (!email) throw new Error('A valid email is required to join as a guest.');
  const displayName = displayNameFromParts(args.displayName, email);

  const [existing] = await db()
    .select()
    .from(schema.interviewParticipant)
    .where(
      and(
        eq(schema.interviewParticipant.interviewId, args.interviewId),
        eq(schema.interviewParticipant.email, email),
        isNull(schema.interviewParticipant.userId),
        isNull(schema.interviewParticipant.revokedAt),
      ),
    )
    .limit(1);

  if (existing) {
    const [updated] = await db()
      .update(schema.interviewParticipant)
      .set({
        displayName,
        authMethod: 'magic_link',
        expiresAt: args.expiresAt,
        lastSeenAt: new Date(),
      })
      .where(eq(schema.interviewParticipant.id, existing.id))
      .returning();
    return updated ?? existing;
  }

  const [created] = await db()
    .insert(schema.interviewParticipant)
    .values({
      interviewId: args.interviewId,
      userId: null,
      email,
      displayName,
      identityMode: 'guest',
      authMethod: 'magic_link',
      expiresAt: args.expiresAt,
    })
    .returning();
  if (!created) throw new Error('Could not create guest participant.');
  return created;
}

export async function createParticipantSession(args: {
  participantId: string;
  interviewId: string;
  expiresAt: Date;
}) {
  const token = newSessionToken();
  const [session] = await db()
    .insert(schema.interviewParticipantSession)
    .values({
      participantId: args.participantId,
      sessionTokenHash: hashToken(token),
      expiresAt: args.expiresAt,
    })
    .returning();
  if (!session) throw new Error('Could not create participant session.');

  (await cookies()).set({
    name: participantCookieName(args.interviewId),
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: args.expiresAt,
  });

  return session;
}

export async function getValidParticipantSession(
  interviewId: string,
): Promise<ValidParticipantSession | null> {
  const token = (await cookies()).get(participantCookieName(interviewId))?.value;
  if (!token) return null;

  const now = new Date();
  const [row] = await db()
    .select({
      participantId: schema.interviewParticipant.id,
      sessionId: schema.interviewParticipantSession.id,
      interviewId: schema.interviewParticipant.interviewId,
      userId: schema.interviewParticipant.userId,
      email: schema.interviewParticipant.email,
      displayName: schema.interviewParticipant.displayName,
      identityMode: schema.interviewParticipant.identityMode,
      expiresAt: schema.interviewParticipant.expiresAt,
    })
    .from(schema.interviewParticipantSession)
    .innerJoin(
      schema.interviewParticipant,
      eq(schema.interviewParticipantSession.participantId, schema.interviewParticipant.id),
    )
    .where(
      and(
        eq(schema.interviewParticipantSession.sessionTokenHash, hashToken(token)),
        eq(schema.interviewParticipant.interviewId, interviewId),
        gt(schema.interviewParticipantSession.expiresAt, now),
        gt(schema.interviewParticipant.expiresAt, now),
        isNull(schema.interviewParticipantSession.revokedAt),
        isNull(schema.interviewParticipant.revokedAt),
      ),
    )
    .limit(1);

  if (!row) return null;

  await db()
    .update(schema.interviewParticipantSession)
    .set({ lastUsedAt: now })
    .where(eq(schema.interviewParticipantSession.id, row.sessionId));
  await db()
    .update(schema.interviewParticipant)
    .set({ lastSeenAt: now })
    .where(eq(schema.interviewParticipant.id, row.participantId));

  return row;
}

export async function revokeParticipantSessionsForInterview(interviewId: string) {
  const now = new Date();
  const participants = await db()
    .select({ id: schema.interviewParticipant.id })
    .from(schema.interviewParticipant)
    .where(eq(schema.interviewParticipant.interviewId, interviewId));

  await Promise.all(
    participants.map((participant) =>
      db()
        .update(schema.interviewParticipantSession)
        .set({ revokedAt: now })
        .where(eq(schema.interviewParticipantSession.participantId, participant.id)),
    ),
  );

  await db()
    .update(schema.interviewParticipant)
    .set({ revokedAt: now })
    .where(eq(schema.interviewParticipant.interviewId, interviewId));
}

export async function ensureCandidateProfile(args: {
  userId: string;
  displayName?: string | null;
}) {
  await db()
    .insert(schema.candidateProfile)
    .values({
      userId: args.userId,
      displayName: displayNameFromParts(args.displayName, null),
    })
    .onConflictDoUpdate({
      target: schema.candidateProfile.userId,
      set: {
        displayName: displayNameFromParts(args.displayName, null),
        updatedAt: new Date(),
      },
    });
}

export async function linkParticipantToUser(args: {
  participantId: string;
  userId: string;
  email?: string | null;
  displayName?: string | null;
}) {
  const email = normalizeParticipantEmail(args.email);
  const displayName = displayNameFromParts(args.displayName, email);

  await ensureCandidateProfile({ userId: args.userId, displayName });

  const [updated] = await db()
    .update(schema.interviewParticipant)
    .set({
      userId: args.userId,
      email,
      displayName,
      identityMode: 'registered',
      authMethod: 'session',
      upgradedAt: new Date(),
      lastSeenAt: new Date(),
    })
    .where(eq(schema.interviewParticipant.id, args.participantId))
    .returning();

  if (!updated) throw new Error('Participant not found.');
  return updated;
}
