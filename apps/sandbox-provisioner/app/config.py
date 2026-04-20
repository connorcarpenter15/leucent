"""Configuration for the sandbox provisioner.

Loaded from the root `.env` (or process env in prod). Resource limits are
deliberately conservative — interviews don't need a lot of horsepower, and we
want to keep one host able to support many concurrent sandboxes.
"""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=[
            Path(__file__).resolve().parents[3] / ".env",
            Path(__file__).resolve().parents[2] / ".env",
        ],
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
    bind_port: int = 6000


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
