import { z } from 'zod';

/**
 * Web-app environment schema.
 *
 * Philosophy:
 *   - Anything the homepage / login / signup flow needs to boot is REQUIRED.
 *     If it's missing in prod we want a loud, self-diagnosing error — not a
 *     confusing 500 that turns out to be a missing secret.
 *   - Anything only a specific route exercises is OPTIONAL here and guarded
 *     at the call site (see `sandbox-client.ts`, `realtime-client.ts`). That
 *     way a misconfigured Railway URL for one backend service doesn't take
 *     down the marketing site.
 */
const schema = z.object({
  // Required: used at request time by auth on every page.
  DATABASE_URL: z.string().url(),
  NEON_AUTH_BASE_URL: z.string().url(),
  NEON_AUTH_COOKIE_SECRET: z.string().min(32),

  // Required: used by the realtime token minter which runs on every
  // /api/interviews/*/realtime-token request.
  REALTIME_INTERNAL_TOKEN: z.string().min(8),
  REALTIME_JWT_SECRET: z.string().min(16),

  // Optional: individual backend service URLs. Guarded at call sites so a
  // missing one surfaces a clear "X not configured" error on the specific
  // route that needs it rather than taking down the whole site.
  REALTIME_SERVER_URL: z.string().url().optional(),
  AI_ORCHESTRATOR_URL: z.string().url().optional(),
  SANDBOX_PROVISIONER_URL: z.string().url().optional(),
  NEXT_PUBLIC_REALTIME_WS_URL: z.string().url().optional(),

  // Fully optional: storage and Neon API integration.
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
    const fieldErrors = parsed.error.flatten().fieldErrors;
    if (process.env.NODE_ENV === 'production' && !isNextBuildPhase) {
      // Include the field errors in the thrown message so ops can diagnose
      // which var is missing/malformed from the runtime logs without needing
      // source access. Prior versions only logged this to stderr, which
      // turned into opaque 500s in practice.
      console.error('Invalid environment configuration:', fieldErrors);
      throw new Error(`Invalid environment configuration: ${JSON.stringify(fieldErrors)}`);
    }
    console.warn(
      '[env] Some required env vars are missing. Falling back to dev defaults where possible.',
      fieldErrors,
    );
    cached = {
      DATABASE_URL: process.env.DATABASE_URL ?? 'postgres://leucent:leucent@localhost:5432/leucent',
      NEON_AUTH_BASE_URL: process.env.NEON_AUTH_BASE_URL ?? 'http://localhost:9999/dev-neon-auth',
      NEON_AUTH_COOKIE_SECRET:
        process.env.NEON_AUTH_COOKIE_SECRET ?? 'dev-neon-auth-cookie-secret-32-bytes-long-ok',
      REALTIME_SERVER_URL: process.env.REALTIME_SERVER_URL,
      REALTIME_INTERNAL_TOKEN: process.env.REALTIME_INTERNAL_TOKEN ?? 'dev-internal-token',
      REALTIME_JWT_SECRET: process.env.REALTIME_JWT_SECRET ?? 'dev-jwt-secret-change-me-please!',
      AI_ORCHESTRATOR_URL: process.env.AI_ORCHESTRATOR_URL,
      SANDBOX_PROVISIONER_URL: process.env.SANDBOX_PROVISIONER_URL,
      NEXT_PUBLIC_REALTIME_WS_URL: process.env.NEXT_PUBLIC_REALTIME_WS_URL,
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
