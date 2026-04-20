"""Docker container lifecycle for the candidate sandbox.

The container runs in `network_mode="none"` by default. If an egress allowlist
is configured we add `--add-host` entries — the container can resolve those
hostnames but cannot reach anything else. Even with that, kernel-level
isolation (no shared mounts, no privileged capabilities, read-only rootfs
plus a small workspace tmpfs) is the real safety net.

Exec output is captured as combined stdout/stderr and truncated before being
returned over HTTP. Full output stays inside the sandbox.
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from typing import Any

import docker
from docker.errors import APIError, NotFound

from .config import get_settings

log = logging.getLogger(__name__)

EXEC_OUTPUT_LIMIT = 8 * 1024  # bytes returned per stream


def _client() -> docker.DockerClient:
    s = get_settings()
    if s.docker_host:
        return docker.DockerClient(base_url=s.docker_host)
    return docker.from_env()


@dataclass
class ContainerHandle:
    container_id: str
    name: str


def parse_egress_allowlist(raw: str) -> list[str]:
    if not raw:
        return []
    return [p.strip() for p in raw.split(",") if p.strip()]


def create_container(
    *,
    interview_id: str,
    database_url: str,
) -> ContainerHandle:
    s = get_settings()
    client = _client()

    name = f"leucent-sbx-{interview_id[:8]}"
    extra_hosts = {}
    for entry in parse_egress_allowlist(s.sandbox_egress_allowlist):
        if ":" in entry:
            host, ip = entry.split(":", 1)
            extra_hosts[host] = ip

    container = client.containers.run(
        image=s.sandbox_image,
        name=name,
        detach=True,
        network_mode="none" if not extra_hosts else "bridge",
        extra_hosts=extra_hosts or None,
        mem_limit=s.sandbox_mem_limit,
        cpu_period=100_000,
        cpu_quota=s.sandbox_cpu_quota,
        pids_limit=s.sandbox_pids_limit,
        read_only=True,
        tmpfs={"/workspace": f"size={s.sandbox_workspace_size},mode=1777"},
        environment={
            "DATABASE_URL": database_url,
            "LEUCENT_INTERVIEW_ID": interview_id,
        },
        cap_drop=["ALL"],
        security_opt=["no-new-privileges:true"],
        user="leucent",
        working_dir="/workspace",
        command=["sleep", "infinity"],
        labels={
            "leucent.role": "sandbox",
            "leucent.interview_id": interview_id,
        },
    )
    return ContainerHandle(container_id=container.id, name=name)


async def container_ready(container_id: str) -> None:
    """Wait for a tiny in-container smoke test (`true`) to succeed."""
    deadline_loops = 30
    for _ in range(deadline_loops):
        try:
            res = await asyncio.to_thread(_exec_sync, container_id, ["true"])
            if res["exit_code"] == 0:
                return
        except APIError as exc:
            log.debug("container readiness exec failed: %s", exc)
        await asyncio.sleep(0.5)
    raise RuntimeError("container did not become ready")


def _exec_sync(container_id: str, cmd: list[str]) -> dict[str, Any]:
    client = _client()
    container = client.containers.get(container_id)
    exec_obj = client.api.exec_create(container.id, cmd, stdout=True, stderr=True)
    output = client.api.exec_start(exec_obj["Id"], stream=False)
    inspect = client.api.exec_inspect(exec_obj["Id"])
    text = output.decode("utf-8", errors="replace") if output else ""
    return {
        "exit_code": inspect.get("ExitCode", -1),
        "output": text[-EXEC_OUTPUT_LIMIT:],
    }


async def exec_in(container_id: str, cmd: list[str]) -> dict[str, Any]:
    return await asyncio.to_thread(_exec_sync, container_id, cmd)


async def destroy_container(container_id: str) -> None:
    def _do():
        client = _client()
        try:
            container = client.containers.get(container_id)
            container.remove(force=True)
        except NotFound:
            return

    await asyncio.to_thread(_do)


async def list_workspace(container_id: str, path: str = "/workspace") -> list[dict[str, Any]]:
    res = await exec_in(
        container_id,
        ["sh", "-c", f"find {path} -maxdepth 4 -type f -printf '%p\\t%s\\n'"],
    )
    entries: list[dict[str, Any]] = []
    for line in res["output"].splitlines():
        if "\t" not in line:
            continue
        p, size = line.split("\t", 1)
        try:
            entries.append({"path": p, "size": int(size)})
        except ValueError:
            continue
    return entries


async def read_workspace_file(container_id: str, path: str) -> str:
    res = await exec_in(container_id, ["cat", path])
    if res["exit_code"] != 0:
        raise FileNotFoundError(path)
    return res["output"]


async def write_workspace_file(container_id: str, path: str, content: str) -> None:
    # base64 to keep arbitrary bytes safe inside argv
    import base64

    payload = base64.b64encode(content.encode("utf-8")).decode("ascii")
    cmd = [
        "sh",
        "-c",
        f"mkdir -p \"$(dirname {path})\" && echo {payload} | base64 -d > {path}",
    ]
    res = await exec_in(container_id, cmd)
    if res["exit_code"] != 0:
        raise RuntimeError(f"write failed: {res['output']}")
