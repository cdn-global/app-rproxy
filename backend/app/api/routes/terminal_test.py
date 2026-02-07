"""
Terminal testing and diagnostics endpoint
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import Annotated
import logging

from app.models import User, RemoteServer
from app.api.deps import get_current_user, SessionDep

logger = logging.getLogger(__name__)

router = APIRouter(tags=["terminal"])


@router.get("/test/{server_id}")
async def test_terminal_access(
    server_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep
) -> dict:
    """
    Test if terminal access is properly configured for a server

    Returns diagnostic information about:
    - Server status
    - Connection method (Docker/SSH)
    - Required dependencies
    - Potential issues
    """
    # Get server
    statement = select(RemoteServer).where(
        RemoteServer.id == server_id,
        RemoteServer.user_id == current_user.id,
    )
    server = session.exec(statement).first()

    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    diagnostics = {
        "server_id": str(server.id),
        "server_name": server.name,
        "status": server.status,
        "hosting_provider": server.hosting_provider,
        "issues": [],
        "requirements": [],
        "ready": False
    }

    # Check server status
    if server.status != "running":
        diagnostics["issues"].append(f"Server is {server.status}, must be 'running'")

    # Docker-specific checks
    if server.hosting_provider == "docker":
        diagnostics["connection_method"] = "Docker Exec"
        diagnostics["requirements"].append("docker python package installed")

        if not server.docker_container_id:
            diagnostics["issues"].append("No Docker container ID configured")
        else:
            diagnostics["container_id"] = server.docker_container_id

            # Test Docker connection
            try:
                import docker
                client = docker.from_env()
                container = client.containers.get(server.docker_container_id)

                if container.status != "running":
                    diagnostics["issues"].append(f"Container status: {container.status}")
                else:
                    diagnostics["container_status"] = "running"

            except ImportError:
                diagnostics["issues"].append("Docker python package not installed")
            except Exception as e:
                diagnostics["issues"].append(f"Docker error: {str(e)}")

    # AWS-specific checks
    elif server.hosting_provider == "aws":
        diagnostics["connection_method"] = "SSH (asyncssh)"
        diagnostics["requirements"].extend([
            "asyncssh python package installed",
            "SSH private key in connection_string_encrypted",
            "AWS security group allows port 22",
            "Server has public IP address"
        ])

        if not server.aws_public_ip:
            diagnostics["issues"].append("No public IP address configured")
        else:
            diagnostics["public_ip"] = server.aws_public_ip

        if not server.connection_string_encrypted:
            diagnostics["issues"].append("No SSH credentials configured")

        # Check asyncssh
        try:
            import asyncssh
            diagnostics["asyncssh_version"] = asyncssh.__version__
        except ImportError:
            diagnostics["issues"].append("asyncssh package not installed")

    # Overall readiness
    diagnostics["ready"] = len(diagnostics["issues"]) == 0

    return diagnostics


@router.get("/health")
async def terminal_health() -> dict:
    """Check if terminal dependencies are installed"""
    health = {
        "docker": False,
        "asyncssh": False,
        "ready": False
    }

    try:
        import docker
        health["docker"] = True
    except ImportError:
        pass

    try:
        import asyncssh
        health["asyncssh"] = True
    except ImportError:
        pass

    health["ready"] = health["docker"] or health["asyncssh"]

    return health
