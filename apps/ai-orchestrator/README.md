# @leucent/ai-orchestrator

FastAPI + LiteLLM service that:

- exposes `POST /ai/stream` returning Server-Sent Events
- pulls live snapshot (canvas + code) from the realtime server
- pulls active interviewer constraints from the Next.js app
- pulls relevant chunks from `ai_context_chunk` (pgvector RAG)
- mirrors every streamed chunk to the realtime telemetry channel via
  `POST /internal/broadcast/{id}`

## Local dev

```bash
cd apps/ai-orchestrator
python -m venv .venv && source .venv/bin/activate
pip install -e '.[dev]'
uvicorn app.main:app --reload --port 5000
```

The service expects the standard root `.env` to be loaded (see `.env.example`).
