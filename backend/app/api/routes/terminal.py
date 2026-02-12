"""
WebSocket terminal endpoint for browser-based SSH access to provisioned servers
"""
from __future__ import annotations

import asyncio
import json
import logging
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlmodel import Session, select

from app.models import RemoteServer, User
from app.core.security import verify_access_token
from app.core.db import engine
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(tags=["terminal"])


async def authenticate_ws(token: Optional[str]) -> Optional[User]:
    """Authenticate WebSocket connection via query param token"""
    if not token:
        return None

    user_id = verify_access_token(token)
    if not user_id:
        return None

    with Session(engine) as session:
        user = session.get(User, user_id)
        return user


@router.websocket("/ws/{server_id}")
async def terminal_websocket(
    websocket: WebSocket,
    server_id: str,
    token: str = Query(default=""),
):
    """
    WebSocket endpoint for interactive terminal sessions.

    - Docker servers: connects via docker exec
    - AWS servers: connects via asyncssh
    """
    # Authenticate
    user = await authenticate_ws(token)
    if not user:
        await websocket.close(code=4001, reason="Unauthorized")
        return

    # Get server
    with Session(engine) as session:
        statement = select(RemoteServer).where(
            RemoteServer.id == server_id,
            RemoteServer.user_id == user.id,
        )
        server = session.exec(statement).first()

    if not server:
        await websocket.close(code=4004, reason="Server not found")
        return

    if server.status != "running":
        await websocket.close(code=4003, reason="Server is not running")
        return

    await websocket.accept()

    try:
        if server.hosting_provider == "docker" and server.docker_container_id:
            await _handle_docker_terminal(websocket, server.docker_container_id)
        elif server.hosting_provider == "aws" and server.aws_public_ip:
            await _handle_ssh_terminal(websocket, server)
        elif settings.ENVIRONMENT == "local":
            # Local dev: provide a real shell via PTY
            await websocket.send_text(f"[dev] No remote endpoint for {server.name}, opening local shell...\r\n")
            await _handle_local_pty(websocket)
        else:
            await websocket.send_text("Error: Server has no connection endpoint configured.\r\n")
            await websocket.close(code=4005, reason="Terminal access not configured")
    except WebSocketDisconnect:
        logger.info(f"Terminal disconnected for server {server_id}")
    except Exception as e:
        logger.error(f"Terminal error for server {server_id}: {e}")
        try:
            await websocket.send_text(f"\r\nError: {str(e)}\r\n")
            await websocket.close()
        except Exception:
            pass


async def _handle_docker_terminal(websocket: WebSocket, container_id: str):
    """Handle terminal for Docker containers using docker exec"""
    import docker

    client = docker.from_env()
    container = client.containers.get(container_id)

    # Create exec instance with TTY
    exec_instance = container.exec_run(
        "/bin/bash",
        stdin=True,
        tty=True,
        socket=True,
        demux=False,
    )

    sock = exec_instance.output
    sock.setblocking(False)

    async def read_from_container():
        """Read output from container and send to WebSocket"""
        loop = asyncio.get_event_loop()
        while True:
            try:
                data = await loop.run_in_executor(None, lambda: sock.recv(4096))
                if not data:
                    break
                await websocket.send_text(data.decode("utf-8", errors="replace"))
            except BlockingIOError:
                await asyncio.sleep(0.01)
            except Exception:
                break

    async def write_to_container():
        """Read input from WebSocket and send to container"""
        while True:
            try:
                data = await websocket.receive_text()
                # Check for resize commands
                try:
                    msg = json.loads(data)
                    if msg.get("type") == "resize":
                        container.resize(msg["rows"], msg["cols"])
                        continue
                except (json.JSONDecodeError, KeyError):
                    pass
                sock.sendall(data.encode("utf-8"))
            except WebSocketDisconnect:
                break
            except Exception:
                break

    # Run both tasks concurrently
    read_task = asyncio.create_task(read_from_container())
    write_task = asyncio.create_task(write_to_container())

    try:
        await asyncio.gather(read_task, write_task, return_exceptions=True)
    finally:
        sock.close()


async def _handle_ssh_terminal(websocket: WebSocket, server: RemoteServer):
    """Handle terminal for AWS servers via SSH using asyncssh"""
    try:
        import asyncssh
    except ImportError:
        await websocket.send_text("Error: asyncssh not installed\r\n")
        await websocket.close()
        return

    # Decrypt private key from connection_string_encrypted
    from app.services.server_provisioner import server_provisioner

    try:
        connection_data = json.loads(
            server_provisioner.decrypt_connection_string(
                server.connection_string_encrypted
            )
        )
    except Exception as e:
        await websocket.send_text(f"Error decrypting credentials: {e}\r\n")
        await websocket.close()
        return

    host = server.aws_public_ip
    username = connection_data.get("username", "ubuntu")
    private_key_pem = connection_data.get("private_key", "")

    if not private_key_pem:
        await websocket.send_text("Error: No SSH key available\r\n")
        await websocket.close()
        return

    try:
        private_key = asyncssh.import_private_key(private_key_pem)
        conn = await asyncssh.connect(
            host,
            username=username,
            client_keys=[private_key],
            known_hosts=None,
        )
    except Exception as e:
        await websocket.send_text(f"SSH connection failed: {e}\r\n")
        await websocket.close()
        return

    try:
        process = await conn.create_process(
            term_type="xterm-256color",
            term_size=(80, 24),
        )

        async def read_from_ssh():
            """Read SSH output and send to WebSocket"""
            while True:
                try:
                    data = await process.stdout.read(4096)
                    if not data:
                        break
                    await websocket.send_text(data)
                except Exception:
                    break

        async def write_to_ssh():
            """Read WebSocket input and send to SSH"""
            while True:
                try:
                    data = await websocket.receive_text()
                    # Handle resize
                    try:
                        msg = json.loads(data)
                        if msg.get("type") == "resize":
                            process.change_terminal_size(
                                msg.get("cols", 80), msg.get("rows", 24)
                            )
                            continue
                    except (json.JSONDecodeError, KeyError):
                        pass
                    process.stdin.write(data)
                except WebSocketDisconnect:
                    break
                except Exception:
                    break

        read_task = asyncio.create_task(read_from_ssh())
        write_task = asyncio.create_task(write_to_ssh())

        await asyncio.gather(read_task, write_task, return_exceptions=True)
    finally:
        conn.close()


async def _handle_local_pty(websocket: WebSocket):
    """Spawn a local PTY shell and bridge it to the WebSocket (dev only)."""
    import fcntl
    import os
    import pty
    import select as _select
    import struct
    import termios

    master_fd, slave_fd = pty.openpty()

    pid = os.fork()
    if pid == 0:
        # Child: become session leader, attach to slave PTY, exec shell
        os.close(master_fd)
        os.setsid()
        fcntl.ioctl(slave_fd, termios.TIOCSCTTY, 0)
        os.dup2(slave_fd, 0)
        os.dup2(slave_fd, 1)
        os.dup2(slave_fd, 2)
        os.close(slave_fd)
        os.execvp("/bin/bash", ["/bin/bash", "--login"])

    # Parent
    os.close(slave_fd)

    loop = asyncio.get_event_loop()

    def _blocking_read():
        """Block until data is available on the PTY master, then read it."""
        while True:
            ready, _, _ = _select.select([master_fd], [], [], 0.5)
            if ready:
                return os.read(master_fd, 4096)
            # Timeout — check if child is still alive
            try:
                result = os.waitpid(pid, os.WNOHANG)
                if result[0] != 0:
                    return b""
            except ChildProcessError:
                return b""

    async def read_from_pty():
        while True:
            try:
                data = await loop.run_in_executor(None, _blocking_read)
                if not data:
                    break
                await websocket.send_text(data.decode("utf-8", errors="replace"))
            except OSError:
                break
            except Exception:
                break

    async def write_to_pty():
        while True:
            try:
                data = await websocket.receive_text()
                try:
                    msg = json.loads(data)
                    if msg.get("type") == "resize":
                        winsize = struct.pack(
                            "HHHH", msg.get("rows", 24), msg.get("cols", 80), 0, 0
                        )
                        fcntl.ioctl(master_fd, termios.TIOCSWINSZ, winsize)
                        continue
                except (json.JSONDecodeError, KeyError):
                    pass
                os.write(master_fd, data.encode("utf-8"))
            except WebSocketDisconnect:
                break
            except Exception:
                break

    read_task = asyncio.create_task(read_from_pty())
    write_task = asyncio.create_task(write_to_pty())

    try:
        await asyncio.gather(read_task, write_task, return_exceptions=True)
    finally:
        os.close(master_fd)
        try:
            os.kill(pid, 9)
            os.waitpid(pid, 0)
        except OSError:
            pass
