/**
 * Loads env files for `@leucent/db` CLI scripts so `DATABASE_URL` from the
 * monorepo root `.env` is visible when running e.g.
 * `pnpm --filter @leucent/db migrate` (without exporting vars in the shell).
 *
 * Order: repo root `.env`, then optional `packages/db/.env` (overrides).
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export function loadEnvForDbScripts(): void {
  const here = dirname(fileURLToPath(import.meta.url));
  config({ path: resolve(here, '../../../.env') });
  config({ path: resolve(here, '../../.env') });
}
