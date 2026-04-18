# Bleucent — connecting Railway and Vercel

This is the operator's checklist for taking the monorepo from `pnpm dev` to a
publicly reachable interview platform. Read this once end-to-end before
clicking anything; the order matters because services need each other's URLs
before they finish booting.

`INFRA.md` describes the topology and per-service env contracts at a high
level. This document is the click-by-click walkthrough.

---

## 0. Prerequisites (one-time, ~5 minutes)

You will need accounts and CLIs for:

| Tool                      | Purpose                                               |
| ------------------------- | ----------------------------------------------------- |
| GitHub                    | Hosts the repo. Vercel + Railway both pull from here. |
| Vercel                    | Runs `apps/web` (Next.js).                            |
| Railway                   | Runs the three backend services + Docker host.        |
| Neon                      | Managed Postgres. Per-interview branches.             |
| Cloudflare R2 _or_ AWS S3 | Stores replay JSONL logs.                             |
| OpenAI / Anthropic        | LLM provider for the orchestrator.                    |

Install the CLIs once so the rest of this document is copy-pasteable:

```bash
brew install vercel-cli                              # vercel
brew install railwayapp/railway/railway              # railway
```

Both CLIs are optional — the entire flow can be done from the dashboards —
but the CLI is far faster for the env-var dance below.

---

## 1. Provision the data plane (Neon + R2/S3)

### 1a. Neon Postgres

1. https://console.neon.tech → **New Project** → name it `bleucent-prod`,
   region close to your Vercel deployment region (e.g. `aws-us-east-2`).
2. After creation, open the project's **Settings → Connection details**.
   Copy the pooled connection string — that becomes `DATABASE_URL`.
3. Open **Settings → API keys** → **Generate new key**. Name it `bleucent-ci`.
   This becomes `NEON_API_KEY` (the sandbox-provisioner uses it to branch
   the DB per interview).
4. Note two more values from the dashboard URL/Settings:
   - The **project ID** → `NEON_PROJECT_ID`
   - The **parent branch ID** of your `main` branch → `NEON_PARENT_BRANCH_ID`
5. Enable `pgvector` once: open the **SQL Editor** and run
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
6. Run the schema migrations from your laptop the first time:
   ```bash
   set -a && . ./.env.production && set +a
   pnpm --filter @bleucent/db migrate
   ```
   (after this is automated in CI you'll never run it by hand again.)

### 1b. Replay log bucket

Either Cloudflare R2 (recommended — egress-free) or AWS S3.

1. Create a bucket called `bleucent-replays`.
2. Generate an access key pair scoped to **that one bucket**, with both
   `s3:GetObject` and `s3:PutObject`. R2 calls these "API tokens".
3. Capture five env values:
   ```
   S3_BUCKET=bleucent-replays
   S3_REGION=auto              # for R2; for AWS use e.g. us-east-1
   S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com   # omit for AWS
   S3_ACCESS_KEY_ID=...
   S3_SECRET_ACCESS_KEY=...
   ```

---

## 2. Generate the shared service secrets

Two secrets are shared across the web app, the realtime server, the AI
orchestrator, and the sandbox provisioner. Generate them once and reuse the
exact same value everywhere — anything else and inter-service calls will 401.

```bash
node -e "console.log('REALTIME_JWT_SECRET=' + require('crypto').randomBytes(32).toString('base64url'))"
node -e "console.log('REALTIME_INTERNAL_TOKEN=' + require('crypto').randomBytes(32).toString('base64url'))"
node -e "console.log('BETTER_AUTH_SECRET=' + require('crypto').randomBytes(32).toString('base64url'))"
```

Save these to a password manager. You'll paste them into both Railway and
Vercel below.

---

## 3. Railway — backend services

We deploy the three Python/Rust services to a single Railway project. Each
service's `railway.json` already constrains `watchPatterns` so unrelated
commits don't trigger noisy redeploys.

### 3a. Create the project

```bash
railway login
railway init                  # name: bleucent-backend
```

Or via the dashboard: https://railway.app/new → **Deploy from GitHub repo**
→ select your fork → click **Empty Project** to skip auto-detect.

### 3b. Add each service as its own Railway service

Repeat this three times, once per service:

| Railway service name  | Source path                | Type   |
| --------------------- | -------------------------- | ------ |
| `realtime`            | `apps/realtime-server`     | Docker |
| `ai-orchestrator`     | `apps/ai-orchestrator`     | Docker |
| `sandbox-provisioner` | `apps/sandbox-provisioner` | Docker |

In the dashboard:

1. **+ New** → **GitHub Repo** → pick the bleucent repo → branch `main`.
2. **Settings → Source → Root Directory** → set the path from the table.
3. **Settings → Build → Dockerfile Path** → leave default; each service has
   its own `Dockerfile` next to `package.json`.
4. **Settings → Network → Generate Domain** for `realtime` and
   `ai-orchestrator` only. The `sandbox-provisioner` must stay
   **private** — only the realtime server and the orchestrator should be
   able to reach it.

### 3c. Set environment variables on each service

In Railway, **Settings → Variables → Raw Editor** is the fastest path.
Paste the per-service block exactly. Replace `${...}` with values from
sections 1–2 and the auto-generated Railway URLs.

#### `realtime`

```env
DATABASE_URL=${NEON_DATABASE_URL}
REALTIME_JWT_SECRET=${REALTIME_JWT_SECRET}
REALTIME_INTERNAL_TOKEN=${REALTIME_INTERNAL_TOKEN}
RUST_LOG=info
S3_BUCKET=bleucent-replays
S3_REGION=auto
S3_ENDPOINT=https://${R2_ACCOUNT}.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=${R2_ACCESS_KEY_ID}
S3_SECRET_ACCESS_KEY=${R2_SECRET_ACCESS_KEY}
PORT=4000
```

#### `ai-orchestrator`

```env
DATABASE_URL=${NEON_DATABASE_URL}
REALTIME_INTERNAL_TOKEN=${REALTIME_INTERNAL_TOKEN}
REALTIME_SERVER_URL=https://realtime.up.railway.app
WEB_APP_URL=https://bleucent.app
SANDBOX_PROVISIONER_URL=http://sandbox-provisioner.railway.internal:6000
LITELLM_DEFAULT_MODEL=gpt-4o-mini
OPENAI_API_KEY=${OPENAI_API_KEY}
EMBEDDING_MODEL=text-embedding-3-small
RAG_TOP_K=4
PORT=5000
```

> Use `*.railway.internal` hostnames for service-to-service calls — they
> never traverse the public internet, and Railway resolves them
> automatically inside the project's private network.

#### `sandbox-provisioner`

```env
REALTIME_INTERNAL_TOKEN=${REALTIME_INTERNAL_TOKEN}
NEON_API_KEY=${NEON_API_KEY}
NEON_PROJECT_ID=${NEON_PROJECT_ID}
NEON_PARENT_BRANCH_ID=${NEON_PARENT_BRANCH_ID}
NEON_ROLE=bleucent
NEON_DATABASE=bleucent
DOCKER_HOST=tcp://docker-dind.railway.internal:2375
SANDBOX_IMAGE=ghcr.io/${YOUR_GH_ORG}/sandbox-base:latest
SANDBOX_MEM_LIMIT=1g
SANDBOX_CPU_QUOTA=50000
SANDBOX_PIDS_LIMIT=256
PORT=6000
```

The sandbox provisioner needs a Docker socket. Either deploy a sibling
**Docker-in-Docker** service in the same Railway project (image
`docker:dind`) and point `DOCKER_HOST` at it, or rent a small VM and use
`DOCKER_HOST=tcp://your-vm:2375` over a private network.

### 3d. Deploy and capture the URLs

After all three services build, copy the public URLs you generated for
`realtime` and `ai-orchestrator`. They will look like
`https://realtime-production-XXXX.up.railway.app`. You'll paste them into
Vercel next.

Tail logs while it boots:

```bash
railway logs --service realtime
```

`/health` should return `200` on each public service. `sandbox-provisioner`
has no public URL — verify by `railway run --service sandbox-provisioner curl
localhost:6000/health`.

---

## 4. Vercel — Next.js app

### 4a. Import the repo

```bash
cd /Users/cmaccarp/bleucent
vercel link                   # follow prompts, pick "Create new project"
```

Or via dashboard: https://vercel.com/new → **Import Git Repository** → pick
`bleucent`.

Critical project settings:

| Setting          | Value                              |
| ---------------- | ---------------------------------- |
| Framework preset | **Next.js**                        |
| Root directory   | `apps/web`                         |
| Build command    | _leave blank_ (uses `vercel.json`) |
| Install command  | _leave blank_ (uses `vercel.json`) |
| Output directory | _leave blank_                      |
| Node version     | 20.x                               |

`apps/web/vercel.json` already does the right `cd ../.. && pnpm install`

- `pnpm --filter @bleucent/web build` dance, so do not override these
  fields manually.

### 4b. Set environment variables

**Settings → Environment Variables** → add for both **Production** and
**Preview**:

```env
DATABASE_URL=${NEON_DATABASE_URL}
BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
BETTER_AUTH_URL=https://bleucent.app
REALTIME_SERVER_URL=https://realtime-production-XXXX.up.railway.app
REALTIME_INTERNAL_TOKEN=${REALTIME_INTERNAL_TOKEN}
REALTIME_JWT_SECRET=${REALTIME_JWT_SECRET}
AI_ORCHESTRATOR_URL=https://ai-orchestrator-production-XXXX.up.railway.app
SANDBOX_PROVISIONER_URL=https://sandbox-provisioner-production-XXXX.up.railway.app
NEXT_PUBLIC_REALTIME_WS_URL=wss://realtime-production-XXXX.up.railway.app
S3_BUCKET=bleucent-replays
S3_REGION=auto
S3_ENDPOINT=https://${R2_ACCOUNT}.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=${R2_ACCESS_KEY_ID}
S3_SECRET_ACCESS_KEY=${R2_SECRET_ACCESS_KEY}
NEON_API_KEY=${NEON_API_KEY}
NEON_PROJECT_ID=${NEON_PROJECT_ID}
NEON_PARENT_BRANCH_ID=${NEON_PARENT_BRANCH_ID}
```

**Important:**

- `NEXT_PUBLIC_REALTIME_WS_URL` **must** use the `wss://` scheme; the
  browser opens a WebSocket against it.
- The web app needs `SANDBOX_PROVISIONER_URL` because it brokers the
  start-interview call. Since the provisioner is private, expose it on a
  **single** internal route protected by `REALTIME_INTERNAL_TOKEN`, or
  proxy it via the realtime server.

### 4c. Configure the production domain

**Settings → Domains** → add `bleucent.app` (or your domain). Vercel issues
the cert automatically. Then update `BETTER_AUTH_URL` to match.

### 4d. Deploy

```bash
vercel --prod
```

Vercel will build, run the workspace install, and surface a URL within
~90s. Tail the build logs in the dashboard if something fails — the
Bleucent build needs the workspace dependencies to compile first, which is
what `vercel.json` handles.

---

## 5. End-to-end smoke test

Once Vercel reports a healthy production deploy:

```bash
./scripts/smoke.sh \
  https://bleucent.app \
  https://realtime-production-XXXX.up.railway.app \
  https://ai-orchestrator-production-XXXX.up.railway.app
```

The script signs up a synthetic interviewer, creates an interview, hits
the realtime `/health`, opens a Yjs WebSocket, posts a telemetry event,
hits the AI `/health`, and explicitly ends the interview. If every step
returns 2xx you're shipped.

---

## 6. Hooking up CI to deploy automatically

The `.github/workflows/ci.yml` job in this repo runs lint, typecheck, and
all four test suites on every push and PR. It does **not** deploy by
itself — both Vercel and Railway watch the `main` branch directly:

- **Vercel**: every push to `main` triggers a production build.
  Every push to a non-main branch creates a Preview deployment that
  CI links from the PR's checks list.
- **Railway**: same model. Each service's `railway.json` `watchPatterns`
  filter ensures e.g. a docs-only commit doesn't redeploy the Rust
  realtime server.

Recommended branch protection on `main`:

1. **Settings → Branches → Add rule** → branch name pattern `main`.
2. Require PRs before merging.
3. Require the **`CI passed`** check (the aggregate gate from
   `.github/workflows/ci.yml`).
4. Require linear history if you want squash-only merges.

That's it — once green, Vercel + Railway will pick up the merged commit and
roll out automatically.

---

## 7. Rollback

| Surface | How                                                             |
| ------- | --------------------------------------------------------------- |
| Vercel  | **Deployments → ⋯ → Promote previous deployment to Production** |
| Railway | Per service: **Deployments → previous → Redeploy**              |
| Neon    | **Branches → restore from earlier point-in-time** (~30s)        |

Realtime clients automatically reconnect on the rollback because
`y-websocket` does exponential backoff — interviewees only see a half-second
flash in the connection indicator.
