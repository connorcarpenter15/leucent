# Leucent

A synchronous, multi-tenant interview platform: a candidate IDE/canvas, a
real-time console for interviewers, an AI co-pilot, and an isolated
code execution sandbox.

See [`AGENTS.md`](./AGENTS.md) for the architecture overview and developer quickstart.

## Quickstart

```bash
cp .env.example .env
pnpm install
pnpm compose:up
pnpm --filter @leucent/db migrate
pnpm dev
```

Open [http://localhost:3000].

## Repository layout

```{shell}
apps/
  web/                    Next.js 15 (App Router) — candidate IDE + interviewer console + auth
  realtime-server/        Rust + Axum + yrs — Yjs sync + telemetry channel
  ai-orchestrator/        Python + FastAPI + LiteLLM — AI co-pilot SSE
  sandbox-provisioner/    Python + FastAPI + Docker — ephemeral exec environments
packages/
  shared-protocol/        TS event types + JSON Schema (consumed by web/Rust/Python)
  db/                     Drizzle schema + migrations for Neon Postgres
  ui/                     Shared React components + Tailwind preset
infra/
  docker-compose.yml      Local dev: postgres-with-pgvector, MinIO, Docker-in-Docker
```

## License

Proprietary — Leucent.
