import type { Config } from 'drizzle-kit';
import { config as loadDotenv } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
loadDotenv({ path: resolve(here, '../../.env') });
loadDotenv({ path: resolve(here, '.env') });

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL must be set to generate migrations.');
}

/**
 * drizzle-kit emits migrations for every table referenced in `schema.ts`, but
 * we intentionally declare PK-only stubs for the auth tables so leucent's FKs
 * can reference them — those tables are provisioned + maintained by Neon Auth
 * and must NOT appear in leucent's migration files.
 *
 * `tablesFilter` takes a list of SQL LIKE patterns of tables to INCLUDE, so we
 * express "everything except the auth-owned names" by listing leucent's own
 * tables. Keep this list in sync with `schema.ts` when new domain tables are
 * added.
 */
const LEUCENT_OWNED_TABLES = [
  'candidate_profile',
  'interview',
  'interview_invite',
  'interview_participant',
  'interview_participant_session',
  'interview_event',
  'interviewer_constraint',
  'ai_context_chunk',
];

export default {
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url },
  tablesFilter: LEUCENT_OWNED_TABLES,
  strict: true,
  verbose: true,
} satisfies Config;
