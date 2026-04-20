# Leucent — agent guide

A synchronous multi-tenant interview platform. This file is for AI agents and humans onboarding to the codebase.

## Architecture at a glance

| Service                                   | Path                       | Stack                           | Hosting (prod)                 |
| ----------------------------------------- | -------------------------- | ------------------------------- | ------------------------------ |
| Web (candidate IDE + interviewer console) | `apps/web`                 | Next.js 15 + Better Auth        | Vercel                         |
| Realtime server                           | `apps/realtime-server`     | Rust + Axum + yrs               | Railway                        |
| AI orchestrator                           | `apps/ai-orchestrator`     | Python 3.12 + FastAPI + LiteLLM | Railway                        |
| Sandbox provisioner                       | `apps/sandbox-provisioner` | Python 3.12 + FastAPI + Docker  | Railway (P1) / AWS .metal (P2) |
| Shared protocol                           | `packages/shared-protocol` | TS + JSON Schema                | n/a                            |
| Database schema                           | `packages/db`              | Drizzle ORM + Neon Postgres     | Neon                           |
| Shared UI                                 | `packages/ui`              | React + Tailwind preset         | n/a                            |

## Tooling

- JS/TS: **pnpm** (workspaces) + **Turborepo**.
- Python: **uv** for dependency management; each Python app has its own `pyproject.toml` + `.venv`.
- Rust: **cargo**, one crate per Rust app.

Common commands from the repo root:

```bash
pnpm install                # install all JS deps across the workspace
pnpm dev                    # turbo run dev --parallel (starts everything)
pnpm build                  # turbo run build
pnpm typecheck              # tsc across all TS packages
pnpm compose:up             # bring up postgres + minio + dind for local dev
pnpm compose:down           # tear down local infra
```

Per-app commands (Rust/Python apps expose them through `package.json` so Turbo can drive them):

```bash
pnpm --filter @leucent/realtime-server dev      # cargo run inside apps/realtime-server
pnpm --filter @leucent/ai-orchestrator dev      # uv run uvicorn ...
pnpm --filter @leucent/sandbox-provisioner dev  # uv run uvicorn ...
```

## Conventions

- All cross-service contracts live in `packages/shared-protocol`. When you add a new event kind, update the TS discriminated union, regenerate the JSON schema (`pnpm --filter @leucent/shared-protocol build`), and update the Rust + Python consumers.
- The realtime server is the only writer of `interview_event` rows during a live session.
- The Next.js app is the only writer of `interviewer_constraint` rows.
- Internal service-to-service routes are namespaced under `/internal/*` and require the `REALTIME_INTERNAL_TOKEN` (or the equivalent token for that service). They are never exposed to browsers.
- A session is closed only by an explicit `POST /internal/end/{interview_id}` from the web app, or the 15-minute idle GC. Never close on the last WebSocket disconnect.
- `POST /sandboxes` blocks until the Neon branch passes a `SELECT 1` readiness probe (exp backoff, 30s budget). Never return `ready` before the DB is reachable both from the provisioner and from inside the container.

## Local dev quickstart

```bash
cp .env.example .env
pnpm install
pnpm compose:up         # starts postgres-with-pgvector, minio, dind
pnpm --filter @leucent/db migrate
pnpm dev
```

Then open http://localhost:3000.
