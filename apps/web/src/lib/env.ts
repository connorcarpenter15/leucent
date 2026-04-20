import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(16),
  BETTER_AUTH_URL: z.string().url(),
  REALTIME_SERVER_URL: z.string().url(),
  REALTIME_INTERNAL_TOKEN: z.string().min(8),
  REALTIME_JWT_SECRET: z.string().min(16),
  AI_ORCHESTRATOR_URL: z.string().url(),
  SANDBOX_PROVISIONER_URL: z.string().url(),
  NEXT_PUBLIC_REALTIME_WS_URL: z.string().url(),
  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  NEON_API_KEY: z.string().optional(),
  NEON_PROJECT_ID: z.string().optional(),
  NEON_PARENT_BRANCH_ID: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/** True while `next build` is collecting page data (i.e. module side effects
 * are being evaluated at build time, not at runtime). In that phase we allow
 * missing env vars and fall back to dev defaults, because the build should
 * not require production secrets — they're only needed at request time. */
const isNextBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

/** Validates and returns env vars. Logs a warning instead of throwing in dev so
 * the very first `pnpm dev` doesn't crash before the user copies .env.example.
 * Also tolerant during `next build` so deploys don't require env to be
 * populated on the platform before the very first build succeeds. */
export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    if (process.env.NODE_ENV === 'production' && !isNextBuildPhase) {
      console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
      throw new Error('Invalid environment configuration');
    }
    console.warn(
      '[env] Some required env vars are missing. Falling back to dev defaults where possible.',
      parsed.error.flatten().fieldErrors,
    );
    cached = {
      DATABASE_URL: process.env.DATABASE_URL ?? 'postgres://leucent:leucent@localhost:5432/leucent',
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? 'dev-secret-change-me-32-bytes-long!',
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
      REALTIME_SERVER_URL: process.env.REALTIME_SERVER_URL ?? 'http://localhost:4000',
      REALTIME_INTERNAL_TOKEN: process.env.REALTIME_INTERNAL_TOKEN ?? 'dev-internal-token',
      REALTIME_JWT_SECRET: process.env.REALTIME_JWT_SECRET ?? 'dev-jwt-secret-change-me-please!',
      AI_ORCHESTRATOR_URL: process.env.AI_ORCHESTRATOR_URL ?? 'http://localhost:5000',
      SANDBOX_PROVISIONER_URL: process.env.SANDBOX_PROVISIONER_URL ?? 'http://localhost:6000',
      NEXT_PUBLIC_REALTIME_WS_URL: process.env.NEXT_PUBLIC_REALTIME_WS_URL ?? 'ws://localhost:4000',
      S3_ENDPOINT: process.env.S3_ENDPOINT,
      S3_REGION: process.env.S3_REGION ?? 'us-east-1',
      S3_BUCKET: process.env.S3_BUCKET,
      S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
      S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
      NEON_API_KEY: process.env.NEON_API_KEY,
      NEON_PROJECT_ID: process.env.NEON_PROJECT_ID,
      NEON_PARENT_BRANCH_ID: process.env.NEON_PARENT_BRANCH_ID,
    };
    return cached;
  }
  cached = parsed.data;
  return cached;
}
