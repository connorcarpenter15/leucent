import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  uuid,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/* ===================================================================
 * Better Auth core tables.
 * Names follow Better Auth defaults so the Drizzle adapter Just Works.
 * =================================================================== */

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  activeOrganizationId: text('active_organization_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const organization = pgTable('organization', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logo: text('logo'),
  metadata: text('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const member = pgTable(
  'member',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('member'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    orgUserUnique: uniqueIndex('member_org_user_unique').on(t.organizationId, t.userId),
  }),
);

export const invitation = pgTable('invitation', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role'),
  status: text('status').notNull().default('pending'),
  inviterId: text('inviter_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});

/* ===================================================================
 * Leucent domain tables.
 * =================================================================== */

export const interviewStatus = pgEnum('interview_status', [
  'scheduled',
  'live',
  'completed',
  'expired',
]);

export const interview = pgTable(
  'interview',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    interviewerUserId: text('interviewer_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    candidateName: text('candidate_name').notNull(),
    candidateEmail: text('candidate_email').notNull(),
    title: text('title').notNull(),
    status: interviewStatus('status').notNull().default('scheduled'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    neonBranchId: text('neon_branch_id'),
    sandboxId: text('sandbox_id'),
    sandboxStatus: text('sandbox_status').notNull().default('not_provisioned'),
    replayS3Key: text('replay_s3_key'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    orgIdx: index('interview_org_idx').on(t.organizationId),
    interviewerIdx: index('interview_interviewer_idx').on(t.interviewerUserId),
    statusIdx: index('interview_status_idx').on(t.status),
  }),
);

export const interviewInvite = pgTable(
  'interview_invite',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    interviewId: uuid('interview_id')
      .notNull()
      .references(() => interview.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    interviewIdx: index('invite_interview_idx').on(t.interviewId),
  }),
);

export const interviewEvent = pgTable(
  'interview_event',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    interviewId: uuid('interview_id')
      .notNull()
      .references(() => interview.id, { onDelete: 'cascade' }),
    ts: timestamp('ts', { withTimezone: true }).notNull().defaultNow(),
    kind: text('kind').notNull(),
    actor: text('actor').notNull(),
    payload: jsonb('payload').notNull(),
    seq: integer('seq').notNull().default(0),
  },
  (t) => ({
    interviewTsIdx: index('event_interview_ts_idx').on(t.interviewId, t.ts),
    kindIdx: index('event_kind_idx').on(t.kind),
  }),
);

export const interviewerConstraint = pgTable(
  'interviewer_constraint',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    interviewId: uuid('interview_id')
      .notNull()
      .references(() => interview.id, { onDelete: 'cascade' }),
    text: text('text').notNull(),
    createdByUserId: text('created_by_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (t) => ({
    interviewIdx: index('constraint_interview_idx').on(t.interviewId),
  }),
);

/**
 * Lightweight RAG table. Files from the candidate sandbox are chunked,
 * embedded, and stored here. We use jsonb to keep the schema vector-impl
 * agnostic; pgvector can be added later via a migration.
 */
export const aiContextChunk = pgTable(
  'ai_context_chunk',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    interviewId: uuid('interview_id')
      .notNull()
      .references(() => interview.id, { onDelete: 'cascade' }),
    sourcePath: text('source_path').notNull(),
    chunkIndex: integer('chunk_index').notNull(),
    contents: text('contents').notNull(),
    embedding: jsonb('embedding'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    interviewIdx: index('ai_chunk_interview_idx').on(t.interviewId),
  }),
);

export type Interview = typeof interview.$inferSelect;
export type NewInterview = typeof interview.$inferInsert;
export type InterviewInvite = typeof interviewInvite.$inferSelect;
export type InterviewEvent = typeof interviewEvent.$inferSelect;
export type InterviewerConstraint = typeof interviewerConstraint.$inferSelect;
