import {
  pgTable,
  pgSchema,
  text,
  timestamp,
  integer,
  jsonb,
  uuid,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';

/* ===================================================================
 * Neon Auth (Better Auth under the hood) reference stubs.
 *
 * Neon Auth stores all authentication data in the dedicated `neon_auth`
 * Postgres schema — `neon_auth.user`, `neon_auth.session`,
 * `neon_auth.account`, `neon_auth.verification`, plus
 * `neon_auth.organization`, `neon_auth.member`, `neon_auth.invitation` when
 * the Organization plugin is enabled. These tables are provisioned
 * automatically when Auth is toggled on in the Neon Console.
 *
 * We declare only `user` and `organization` here, and only their PK, because
 * those are the two ids leucent's FK columns reference. Do NOT move these
 * into `public`: putting them in `public` would make drizzle-kit emit FKs
 * pointing at `public.user` / `public.organization`, which Neon Auth never
 * writes to — any INSERT into leucent.interview would then fail the FK check.
 *
 * Rules:
 *   1. Do NOT add columns to these stubs. Neon Auth owns the table shape;
 *      extra columns here would conflict with its provisioned DDL.
 *   2. drizzle.config.ts's `tablesFilter` ignores these names so
 *      `pnpm db:generate` never emits CREATE TABLE / DROP TABLE for them.
 *   3. Deployment order: enable Neon Auth on the branch FIRST so the
 *      `neon_auth` schema + tables exist, THEN run `pnpm db:migrate`.
 * =================================================================== */

const neonAuth = pgSchema('neon_auth');

// Column types MUST match what Neon Auth provisions on the branch:
//   neon_auth.user.id          uuid NOT NULL
//   neon_auth.organization.id  uuid NOT NULL
// If you ever change these, run `scripts/inspect-neon-auth.ts` against a
// Neon-Auth-enabled branch to confirm the live column types first — a
// mismatch (e.g. text vs uuid) makes Postgres reject every FK with
// "Key columns ... are of incompatible types".
export const user = neonAuth.table('user', {
  id: uuid('id').primaryKey(),
});

export const organization = neonAuth.table('organization', {
  id: uuid('id').primaryKey(),
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
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    interviewerUserId: uuid('interviewer_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    candidateName: text('candidate_name'),
    candidateEmail: text('candidate_email'),
    title: text('title').notNull(),
    /** Provisioner template key (allowlisted server-side), e.g. nodejs, python_ds, rust */
    sandboxTemplate: text('sandbox_template').notNull().default('nodejs'),
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
    /** Raw `/join/{token}` segment; server-only, enables reconstructing join URLs for interviewers */
    urlToken: text('url_token').unique(),
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
    createdByUserId: uuid('created_by_user_id')
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
