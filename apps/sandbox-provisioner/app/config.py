"""Configuration for the sandbox provisioner.

Loaded from the root `.env` (or process env in prod). Resource limits are
deliberately conservative — interviews don't need a lot of horsepower, and we
want to keep one host able to support many concurrent sandboxes.
"""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Walk up from this file to find candidate `.env` locations. Locally the repo
# root is parents[3] (apps/sandbox-provisioner/app/config.py -> repo root); in
# the Railway container the app is copied to /app/app/config.py, where deeper
# parents don't exist. Indexing past the filesystem root raises IndexError
# at import time, so we collect only the parents that actually resolve.
_CONFIG_PARENTS = Path(__file__).resolve().parents
_ENV_FILES = tuple(
    _CONFIG_PARENTS[depth] / ".env"
    for depth in (3, 2)
    if depth < len(_CONFIG_PARENTS)
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_ENV_FILES,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    realtime_internal_token: str = "local-dev-internal-token-change-me"
    database_url: str = "postgres://leucent:leucent@localhost:5432/leucent"

    # Docker
    docker_host: str | None = None  # e.g. "tcp://dind:2375" in docker-compose
    sandbox_image: str = "ghcr.io/leucent/sandbox-base:latest"
    sandbox_mem_limit: str = "1g"
    sandbox_cpu_quota: int = 50_000  # 50% of one core (period default 100k)
    sandbox_pids_limit: int = 256
    sandbox_workspace_size: str = "256m"
    sandbox_egress_allowlist: str = ""  # comma-separated host:ip pairs

    # Neon
    neon_api_key: str | None = None
    neon_project_id: str | None = None
    neon_parent_branch_id: str | None = None
    neon_role: str = "leucent"
    neon_database: str = "leucent"

    # Readiness probe budget
    readiness_total_seconds: float = 30.0
    readiness_initial_delay: float = 0.25
    readiness_max_delay: float = 5.0

    bind_host: str = "0.0.0.0"
    # NOTE: avoid 6000 — it's on the WHATWG Fetch "bad ports" blocklist
    # (historical X11 port), so Node's built-in fetch (undici) refuses to
    # connect with `TypeError: fetch failed` / cause "bad port".
    bind_port: int = 6500


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


def resolve_sandbox_image(template: str | None, default_image: str) -> str:
    """Maps allowlisted template keys to Docker images. Unknown keys fall back."""
    mapping: dict[str, str] = {
        "nodejs": default_image,
        "python_ds": default_image,
        "rust": default_image,
    }
    if not template:
        return default_image
    return mapping.get(template, default_image)
