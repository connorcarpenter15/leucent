/**
 * Reconciliation script for the Neon-Auth migration.
 *
 * Two failure modes this script recovers from:
 *
 * 1. Half-applied pre-Neon-Auth migration.
 *    The old `drizzle/0000_misty_silver_surfer.sql` (Better Auth era) created
 *    leucent's domain tables + the `interview_status` enum. After we replaced
 *    that file with `drizzle/0000_init.sql`, a fresh `pnpm db:migrate` on a
 *    branch that already ran the old file errors out with:
 *        type "interview_status" already exists
 *    This script drops leucent-owned objects so the new migration applies
 *    cleanly. (Default behavior, `--confirm` required.)
 *
 * 2. Orphan `public.*` auth tables from Better Auth.
 *    The old migration also created `public.user`, `public.session`,
 *    `public.account`, `public.verification`, `public.organization`,
 *    `public.member`, `public.invitation`. Neon Auth does NOT use those —
 *    it stores all auth data in the `neon_auth` schema. Those tables are
 *    dead weight AND, worse, they match the FK targets that the old leucent
 *    migration generated, masking a bug. Pass `--drop-auth-orphans` to drop
 *    them so the new migration's FKs-into-`neon_auth` are the only referents.
 *    This script never touches the real `neon_auth.*` tables — those are
 *    managed by Neon.
 *
 * Usage:
 *   DATABASE_URL=postgres://... pnpm --filter @leucent/db reset:leucent -- --confirm
 *   DATABASE_URL=postgres://... pnpm --filter @leucent/db reset:leucent -- --confirm --drop-auth-orphans
 *
 * After a successful run:
 *   pnpm --filter @leucent/db migrate
 */
import postgres from 'postgres';

import { loadEnvForDbScripts } from './load-env';

loadEnvForDbScripts();

// Order matters: dependents before parents so CASCADE has less to do.
const LEUCENT_TABLES = [
  'ai_context_chunk',
  'interviewer_constraint',
  'interview_event',
  'interview_invite',
  'interview',
];

const LEUCENT_ENUMS = ['interview_status'];

// These are the Better-Auth-era orphans in `public` that Neon Auth replaces
// with its own `neon_auth.*` tables. Only dropped when `--drop-auth-orphans`
// is passed — an explicit opt-in because the list is destructive and only
// correct immediately after switching to Neon Auth.
const BETTER_AUTH_ORPHAN_TABLES = [
  'invitation',
  'member',
  'organization',
  'session',
  'account',
  'verification',
  'user',
];

async function main() {
  const args = new Set(process.argv.slice(2));
  if (!args.has('--confirm')) {
    console.error(
      'Refusing to run without --confirm. This DROPs leucent tables + enums.\n' +
        'Pass `--drop-auth-orphans` as well to also drop the legacy\n' +
        '`public.user` / `public.session` / etc. tables left behind by\n' +
        'Better Auth (safe only after switching to Neon Auth — Neon Auth\n' +
        'stores its data in the `neon_auth` schema, not in `public`).\n\n' +
        'Example:\n' +
        '  DATABASE_URL=postgres://... pnpm --filter @leucent/db \\\n' +
        '    reset:leucent -- --confirm --drop-auth-orphans',
    );
    process.exit(1);
  }
  const dropOrphans = args.has('--drop-auth-orphans');

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');

  const client = postgres(url, { max: 1 });
  try {
    const safeUrl = url.replace(/:[^:@/]+@/, ':****@');
    console.log(`Resetting leucent objects on ${safeUrl}`);

    for (const table of LEUCENT_TABLES) {
      await client.unsafe(`DROP TABLE IF EXISTS "${table}" CASCADE`);
      console.log(`  dropped table: public.${table}`);
    }

    for (const enumName of LEUCENT_ENUMS) {
      await client.unsafe(`DROP TYPE IF EXISTS "${enumName}" CASCADE`);
      console.log(`  dropped enum: public.${enumName}`);
    }

    if (dropOrphans) {
      console.log(
        '  dropping legacy Better Auth orphan tables (Neon Auth uses `neon_auth` schema):',
      );
      for (const table of BETTER_AUTH_ORPHAN_TABLES) {
        await client.unsafe(`DROP TABLE IF EXISTS "public"."${table}" CASCADE`);
        console.log(`    dropped table: public.${table}`);
      }
    }

    // Clear the drizzle journal so whatever hash was recorded for the old
    // `0000_misty_silver_surfer.sql` file no longer confuses migrate(). The
    // `__drizzle_migrations` table itself stays — migrate() will repopulate
    // it with the new file's hash.
    await client.unsafe(`DELETE FROM drizzle.__drizzle_migrations WHERE true`);
    console.log('  cleared drizzle.__drizzle_migrations');

    console.log('Done. Run `pnpm --filter @leucent/db migrate` next.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
