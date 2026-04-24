"""FastAPI entrypoint for the sandbox provisioner.

All routes are gated behind the shared internal token. The `POST /sandboxes`
handler does the heavy lift: branch Neon, wait for `SELECT 1`, launch the
container, wait for an in-container readiness check, register, and return.
This is the contract the spec relies on — when the call returns 200 the
candidate environment is fully usable end-to-end.
"""

from __future__ import annotations

import logging
import uuid
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, status
from pydantic import BaseModel, Field

from .auth import require_internal
from .config import get_settings, resolve_sandbox_image
from .docker_runtime import (
    container_ready,
    create_container,
    destroy_container,
    exec_in,
    list_workspace,
    read_workspace_file,
    write_workspace_file,
)
from .neon import create_branch, delete_branch, wait_until_ready
from .registry import SandboxRecord, registry

log = logging.getLogger("leucent.sandbox")
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Leucent Sandbox Provisioner", version="0.1.0")


class CreateBody(BaseModel):
    interview_id: str
    organization_id: str | None = None
    sandbox_template: str | None = None


class CreateResponse(BaseModel):
    sandbox_id: str
    status: str = Field("ready")
    database_url: str
    neon_branch_id: str | None = None


class ExecBody(BaseModel):
    command: list[str]


class ExecResponse(BaseModel):
    exit_code: int
    output: str


class WriteBody(BaseModel):
    content: str


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post(
    "/sandboxes",
    response_model=CreateResponse,
    dependencies=[Depends(require_internal)],
)
async def create_sandbox(body: CreateBody) -> CreateResponse:
    sandbox_id = uuid.uuid4().hex
    log.info("provisioning sandbox %s for interview %s", sandbox_id, body.interview_id)

    settings = get_settings()
    resolved_image = resolve_sandbox_image(
        body.sandbox_template,
        settings.sandbox_image,
    )

    branch = await create_branch(body.interview_id)
    try:
        await wait_until_ready(branch.database_url)
    except Exception as exc:
        log.exception("DB readiness probe failed")
        await delete_branch(branch.branch_id)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"database not ready: {exc}",
        ) from exc

    try:
        handle = create_container(
            interview_id=body.interview_id,
            database_url=branch.database_url,
            image_override=resolved_image,
        )
        await container_ready(handle.container_id)
    except Exception as exc:
        log.exception("container provisioning failed")
        await delete_branch(branch.branch_id)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"container not ready: {exc}",
        ) from exc

    registry.add(
        SandboxRecord(
            sandbox_id=sandbox_id,
            interview_id=body.interview_id,
            container_id=handle.container_id,
            container_name=handle.name,
            database_url=branch.database_url,
            neon_branch_id=branch.branch_id,
        )
    )
    return CreateResponse(
        sandbox_id=sandbox_id,
        database_url=branch.database_url,
        neon_branch_id=branch.branch_id,
    )


@app.delete("/sandboxes/{sandbox_id}", dependencies=[Depends(require_internal)])
async def delete_sandbox(sandbox_id: str) -> dict[str, str]:
    rec = registry.pop(sandbox_id)
    if not rec:
        return {"status": "missing"}
    try:
        await destroy_container(rec.container_id)
    finally:
        await delete_branch(rec.neon_branch_id)
    return {"status": "destroyed"}


@app.post(
    "/sandboxes/{sandbox_id}/exec",
    response_model=ExecResponse,
    dependencies=[Depends(require_internal)],
)
async def exec_sandbox(sandbox_id: str, body: ExecBody) -> ExecResponse:
    rec = _require(sandbox_id)
    res = await exec_in(rec.container_id, body.command)
    return ExecResponse(exit_code=res["exit_code"], output=res["output"])


@app.get("/sandboxes/{sandbox_id}/fs", dependencies=[Depends(require_internal)])
async def list_fs(sandbox_id: str) -> dict[str, list[dict]]:
    rec = _require(sandbox_id)
    return {"entries": await list_workspace(rec.container_id)}


@app.get(
    "/sandboxes/{sandbox_id}/fs/{path:path}",
    dependencies=[Depends(require_internal)],
)
async def read_fs(sandbox_id: str, path: str) -> dict[str, str]:
    rec = _require(sandbox_id)
    safe_path = _safe_path(path)
    try:
        content = await read_workspace_file(rec.container_id, safe_path)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="not found") from exc
    return {"path": safe_path, "content": content}


@app.put(
    "/sandboxes/{sandbox_id}/fs/{path:path}",
    dependencies=[Depends(require_internal)],
)
async def write_fs(sandbox_id: str, path: str, body: WriteBody) -> dict[str, str]:
    rec = _require(sandbox_id)
    safe_path = _safe_path(path)
    await write_workspace_file(rec.container_id, safe_path, body.content)
    return {"path": safe_path, "status": "written"}


def _require(sandbox_id: str) -> SandboxRecord:
    rec = registry.get(sandbox_id)
    if not rec:
        raise HTTPException(status_code=404, detail="sandbox not found")
    return rec


def _safe_path(path: str) -> str:
    """Constrain all FS ops to /workspace inside the container."""
    if path.startswith("/"):
        path = path.lstrip("/")
    if ".." in path.split("/"):
        raise HTTPException(status_code=400, detail="path traversal not allowed")
    return f"/workspace/{path}"


# Imported for type checking.
_ = Annotated
