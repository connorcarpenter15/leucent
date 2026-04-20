# @leucent/sandbox-provisioner

FastAPI service that owns the lifecycle of per-interview Docker sandboxes and
Neon branches.

Endpoints:

- `POST /sandboxes` — create a sandbox + Neon branch, **block** until both are
  ready. Returns the `database_url` to inject into the candidate environment.
- `DELETE /sandboxes/{id}` — tear down container + Neon branch.
- `POST /sandboxes/{id}/exec` — run a command inside the container, stream
  combined output, return exit code + truncated stdout/stderr tails.
- `GET /sandboxes/{id}/fs` — list files (used by the AI orchestrator).
- `GET /sandboxes/{id}/fs/{path}` — read a single file.
- `PUT /sandboxes/{id}/fs/{path}` — write a single file.

## Hardening

Containers are launched with:

- `network_mode="none"` plus an explicit egress allowlist via `--add-host`
  rules (configurable, default empty).
- `mem_limit`, `cpu_quota`, `pids_limit`, `read_only=True` rootfs with a
  scoped `/workspace` tmpfs.
- A non-root `leucent` user inside the image.

## Neon readiness

When `NEON_API_KEY` is set we create a fresh Neon branch per interview and
poll `SELECT 1` with exponential backoff (250ms → 5s, 30s budget) before
returning `status: "ready"`. Without Neon configured we fall back to the
shared local Postgres `DATABASE_URL` from the root env so dev still works.
