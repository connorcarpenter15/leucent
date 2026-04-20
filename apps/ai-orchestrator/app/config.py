"""Environment configuration for the AI orchestrator.

Loaded from the root `.env` file (or from the actual process env in prod).
We use pydantic-settings so the same field names work for both local dev and
Railway, and so missing critical secrets fail loudly at boot.
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

    database_url: str = "postgres://leucent:leucent@localhost:5432/leucent"
    realtime_server_url: str = "http://localhost:4000"
    realtime_internal_token: str = "local-dev-internal-token-change-me"
    web_app_url: str = "http://localhost:3000"
    sandbox_provisioner_url: str = "http://localhost:6000"

    litellm_default_model: str = "gpt-4o-mini"
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None

    # Embedding model used for the pgvector RAG store.
    embedding_model: str = "text-embedding-3-small"
    rag_top_k: int = 4

    bind_host: str = "0.0.0.0"
    bind_port: int = 5000


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
