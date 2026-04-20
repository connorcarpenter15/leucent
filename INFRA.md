# Leucent — deployment & infrastructure

This document is the runbook for taking the monorepo from `pnpm dev` to a
publicly reachable interview platform. It assumes Vercel for the Next.js app
and Railway for the three backend services.

## Topology

```
            ┌──────────────────────────────┐
 candidate ─┤  apps/web        (Vercel)    ├──┐
            │  Next.js / Better Auth       │  │ HTTPS
interviewer ┤  Yjs/SSE clients             │  │
            └──────┬───────────────────────┘  │
                   │ HTTPS                    │
                   ▼                          ▼
        ┌────────────────────┐   ┌──────────────────────┐
        │ apps/realtime-     │   │ apps/ai-orchestrator │
        │ server (Railway)   │◄──┤ (Railway, FastAPI)   │
        │ Rust + Axum + yrs  │   └─────────┬────────────┘
        └─────────┬──────────┘             │
                  │                        │
                  ▼                        ▼
           ┌────────────┐           ┌──────────────────────┐
           │ Neon       │           │ apps/sandbox-        │
           │ Postgres   │           │ provisioner (Railway)│
           └────────────┘           │ FastAPI + Docker SDK │
                                    └──────────────────────┘
                                              │
                                              ▼ docker socket
                                        ┌────────────────┐
                                        │ Per-interview  │
                                        │ sandbox        │
                                        │ containers     │
                                        └────────────────┘
```

S3 / Cloudflare R2 stores replay JSONL logs. Neon stores the canonical
multi-tenant DB plus the per-interview branches.

## Steps

1.  **Neon project**: create one project. Note the project id and the parent
    branch id (`main`). Generate an API key and put it in `NEON_API_KEY`.
2.  **S3 bucket** (or R2): one bucket, e.g. `leucent-replays`. Generate an
    access key pair and write `S3_*` env vars.
3.  **Vercel project (apps/web)**:
    - Root directory: `apps/web` (uses `vercel.json` install/build commands
      to traverse up to the workspace root).
    - Set every non-public env from `.env.example` plus
      `NEXT_PUBLIC_REALTIME_WS_URL` and `NEXT_PUBLIC_AI_ORCHESTRATOR_URL`
      pointing at the public Railway URLs.
4.  **Railway services** — three services in one project, each pointed at this
    repo. The `railway.json` next to each app's Dockerfile constrains
    `watchPatterns` so unrelated commits don't redeploy:
    - `realtime-server`: needs `DATABASE_URL` (Neon), `REALTIME_JWT_SECRET`,
      `REALTIME_INTERNAL_TOKEN`, and the `S3_*` vars.
    - `ai-orchestrator`: needs `DATABASE_URL`, `REALTIME_INTERNAL_TOKEN`,
      `WEB_APP_URL`, `OPENAI_API_KEY` (or whichever LiteLLM provider).
    - `sandbox-provisioner`: needs `REALTIME_INTERNAL_TOKEN`, `NEON_*`, and a
      Docker host. On Railway use a private Docker-in-Docker service or a
      dedicated VM accessed via `DOCKER_HOST=tcp://...`.
5.  **DNS / public URLs**: configure Vercel custom domain
    (`leucent.app`) and Railway custom domains for the realtime server
    (`rt.leucent.app`) and the AI orchestrator (`ai.leucent.app`). The
    sandbox provisioner stays on a private network — never expose it.
6.  **Sandbox base image**: build & push `apps/sandbox-provisioner/sandbox-base.Dockerfile`
    to your registry, then set `SANDBOX_IMAGE` env on the provisioner.
7.  **Database migration**: from CI or locally with prod creds
    `pnpm --filter @leucent/db migrate`.

## Smoke test (`scripts/smoke.sh`)

Once everything is up:

```bash
./scripts/smoke.sh \
  https://leucent.app \
  https://rt.leucent.app \
  https://ai.leucent.app
```

The script walks the full live loop: signs up an interviewer, creates an
interview, hits the realtime `/health`, opens a Yjs websocket, posts a
telemetry event, hits the AI `/health`, and explicitly ends the interview.

## Rollback

Each Railway service deploys atomically. If the realtime server starts
failing health checks, click "Rollback to previous deploy" — clients
reconnect automatically thanks to `y-websocket`'s exponential backoff.
