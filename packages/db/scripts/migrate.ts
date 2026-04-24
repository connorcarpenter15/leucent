/**
 * Applies the latest Drizzle migrations against DATABASE_URL.
 * Used for local dev (Neon dev branch or CI Postgres) and production deploys.
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

import { loadEnvForDbScripts } from './load-env';

loadEnvForDbScripts();

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');

  const client = postgres(url, { max: 1 });
  const db = drizzle(client);
  console.log(`Applying migrations to ${url.replace(/:[^:@/]+@/, ':****@')}`);
  await migrate(db, { migrationsFolder: new URL('../drizzle', import.meta.url).pathname });
  await client.end();
  console.log('Migrations applied.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
