import { getDb } from '@leucent/db';
import { env } from './env';

/** Lazy singleton Drizzle client for the Next.js app. */
export function db() {
  return getDb(env().DATABASE_URL);
}
