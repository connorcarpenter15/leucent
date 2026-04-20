import { auth } from '@/lib/auth';

/**
 * Catch-all route that proxies Neon Auth API calls from the browser client to
 * the Neon Auth server. The segment name must be `[...path]` — the handler's
 * Params type is `{ path: string[] }`.
 */
export const { GET, POST } = auth.handler();
