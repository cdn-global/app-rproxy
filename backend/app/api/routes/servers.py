"""
Routes for remote server management (SSH, GPU, inference servers)
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlmodel import Session, select
from typing import Annotated
import logging
import uuid
from datetime import datetime
from app.models import (
    User, RemoteServer, RemoteServerCreate, RemoteServerUpdate,
    RemoteServerPublic, RemoteServersPublic, UsageRecord,
    ProvisioningJob, ProvisioningJobPublic
)
from app.api.deps import get_current_user, SessionDep
from app.services.server_provisioner import server_provisioner
from app.services.aws_provisioner import aws_provisioner
from app.services.provisioning_jobs import run_aws_provisioning

logger = logging.getLogger(__name__)

router = APIRouter(tags=["servers"])


def record_server_usage(
    session: Session,
    user_id: uuid.UUID,
    server_id: uuid.UUID,
    hours: float
):
    """Helper function to record server usage"""
    usage = UsageRecord(
        user_id=user_id,
        resource_type="server",
        resource_id=server_id,
        quantity=hours,
        stripe_reported=False,
        timestamp=datetime.utcnow()
    )
    session.add(usage)
    session.commit()


@router.post("/", response_model=RemoteServerPublic)
async def create_server(
    server_data: RemoteServerCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
    background_tasks: BackgroundTasks
) -> RemoteServer:
    """Create and provision a new remote server"""

    # Guard: require active infrastructure subscription
    if not current_user.has_subscription:
        raise HTTPException(
            status_code=402,
            detail="Active infrastructure subscription required. Subscribe at /billing/subscribe first."
        )

    # Create server record in database
    new_server = RemoteServer(
        id=uuid.uuid4(),
        user_id=current_user.id,
        name=server_data.name,
        server_type=server_data.server_type,
        hosting_provider=server_data.hosting_provider,
        cpu_cores=server_data.cpu_cores,
        memory_gb=server_data.memory_gb,
        gpu_type=server_data.gpu_type,
        status="provisioning",
        created_at=datetime.utcnow()
    )

    # Set AWS-specific fields on the server record if applicable
    if server_data.hosting_provider == "aws":
        new_server.aws_instance_type = server_data.aws_instance_type
        new_server.aws_region = server_data.aws_region or "us-east-1"

    session.add(new_server)
    session.commit()
    session.refresh(new_server)

    if server_data.hosting_provider == "aws":
        # AWS provisioning takes 30-60s, so run it as a background task.
        # The server is returned immediately with status="provisioning".
        # Clients can poll GET /servers/{id} or GET /jobs/{job_id} for updates.
        background_tasks.add_task(
            run_aws_provisioning,
            server_id=new_server.id,
            user_id=current_user.id,
            server_data=server_data,
            db_url="",  # Uses engine singleton internally
        )

        logger.info(
            f"AWS server {new_server.id} created for user {current_user.id}, "
            f"provisioning in background"
        )
        return new_server

    # Docker provisioning (original synchronous path)
    try:
        container_id, encrypted_connection, hourly_rate = server_provisioner.provision_server(
            server_id=new_server.id,
            user_id=current_user.id,
            name=server_data.name,
            server_type=server_data.server_type,
            cpu_cores=server_data.cpu_cores,
            memory_gb=server_data.memory_gb,
            gpu_type=server_data.gpu_type
        )

        # Update server with provisioning results
        new_server.docker_container_id = container_id
        new_server.connection_string_encrypted = encrypted_connection
        new_server.hourly_rate = hourly_rate
        new_server.status = "running"

        session.add(new_server)
        session.commit()
        session.refresh(new_server)

        logger.info(f"Server {new_server.id} provisioned successfully for user {current_user.id}")

    except Exception as e:
        logger.error(f"Failed to provision server {new_server.id}: {e}")
        new_server.status = "error"
        session.add(new_server)
        session.commit()
        raise HTTPException(status_code=500, detail=f"Server provisioning failed: {str(e)}")

    return new_server


@router.get("/", response_model=RemoteServersPublic)
async def list_servers(
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
    skip: int = 0,
    limit: int = 100
) -> RemoteServersPublic:
    """List all servers for the current user"""
    statement = select(RemoteServer).where(
        RemoteServer.user_id == current_user.id
    ).offset(skip).limit(limit)

    servers = session.exec(statement).all()
    count = len(servers)

    return RemoteServersPublic(data=list(servers), count=count)


@router.get("/jobs/{job_id}", response_model=ProvisioningJobPublic)
async def get_provisioning_job(
    job_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep
) -> ProvisioningJob:
    """Get the status of a provisioning job"""
    statement = select(ProvisioningJob).where(
        ProvisioningJob.id == job_id,
        ProvisioningJob.user_id == current_user.id
    )

    job = session.exec(statement).first()

    if not job:
        raise HTTPException(status_code=404, detail="Provisioning job not found")

    return job


@router.get("/{server_id}", response_model=RemoteServerPublic)
async def get_server(
    server_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep
) -> RemoteServer:
    """Get details of a specific server"""
    statement = select(RemoteServer).where(
        RemoteServer.id == server_id,
        RemoteServer.user_id == current_user.id
    )

    server = session.exec(statement).first()

    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    # Update live status based on hosting provider
    if server.hosting_provider == "aws" and server.aws_instance_id:
        current_status = aws_provisioner.get_server_status(
            server.aws_instance_id, server.aws_region or "us-east-1"
        )
        if current_status != server.status:
            server.status = current_status
            session.add(server)
            session.commit()
            session.refresh(server)
    elif server.docker_container_id:
        # Docker path (original)
        current_status = server_provisioner.get_server_status(server.docker_container_id)
        if current_status != server.status:
            server.status = current_status
            session.add(server)
            session.commit()
            session.refresh(server)

    return server


@router.patch("/{server_id}", response_model=RemoteServerPublic)
async def update_server(
    server_id: uuid.UUID,
    server_update: RemoteServerUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep
) -> RemoteServer:
    """Update server details"""
    statement = select(RemoteServer).where(
        RemoteServer.id == server_id,
        RemoteServer.user_id == current_user.id
    )

    server = session.exec(statement).first()

    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    # Update fields
    if server_update.name is not None:
        server.name = server_update.name
    if server_update.status is not None:
        server.status = server_update.status

    session.add(server)
    session.commit()
    session.refresh(server)

    return server


@router.post("/{server_id}/stop", response_model=RemoteServerPublic)
async def stop_server(
    server_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep
) -> RemoteServer:
    """Stop a running server"""
    statement = select(RemoteServer).where(
        RemoteServer.id == server_id,
        RemoteServer.user_id == current_user.id
    )

    server = session.exec(statement).first()

    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    # Calculate usage hours since last start
    if server.status == "running" and server.created_at:
        hours_running = (datetime.utcnow() - server.created_at).total_seconds() / 3600
        record_server_usage(session, current_user.id, server.id, hours_running)

    if server.hosting_provider == "aws":
        # AWS stop path
        if not server.aws_instance_id:
            raise HTTPException(status_code=400, detail="Server has no AWS instance ID")

        success = aws_provisioner.stop_server(
            server.aws_instance_id, server.aws_region or "us-east-1"
        )
    else:
        # Docker stop path (original)
        if not server.docker_container_id:
            raise HTTPException(status_code=400, detail="Server has no container ID")

        success = server_provisioner.stop_server(server.docker_container_id)

    if success:
        server.status = "stopped"
        server.stopped_at = datetime.utcnow()
        session.add(server)
        session.commit()
        session.refresh(server)
    else:
        raise HTTPException(status_code=500, detail="Failed to stop server")

    return server


@router.post("/{server_id}/start", response_model=RemoteServerPublic)
async def start_server(
    server_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep
) -> RemoteServer:
    """Start a stopped server"""
    statement = select(RemoteServer).where(
        RemoteServer.id == server_id,
        RemoteServer.user_id == current_user.id
    )

    server = session.exec(statement).first()

    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    if server.hosting_provider == "aws":
        # AWS start path
        if not server.aws_instance_id:
            raise HTTPException(status_code=400, detail="Server has no AWS instance ID")

        success = aws_provisioner.start_server(
            server.aws_instance_id, server.aws_region or "us-east-1"
        )
    else:
        # Docker start path (original)
        if not server.docker_container_id:
            raise HTTPException(status_code=400, detail="Server has no container ID")

        success = server_provisioner.start_server(server.docker_container_id)

    if success:
        server.status = "running"
        server.stopped_at = None
        session.add(server)
        session.commit()
        session.refresh(server)
    else:
        raise HTTPException(status_code=500, detail="Failed to start server")

    return server


@router.delete("/{server_id}")
async def delete_server(
    server_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep
) -> dict:
    """Delete a server and its container"""
    statement = select(RemoteServer).where(
        RemoteServer.id == server_id,
        RemoteServer.user_id == current_user.id
    )

    server = session.exec(statement).first()

    if not server:
        raise HTTPException(status_code=404, detail="Server not found")

    # Calculate final usage if server is running
    if server.status == "running" and server.created_at:
        hours_running = (datetime.utcnow() - server.created_at).total_seconds() / 3600
        record_server_usage(session, current_user.id, server.id, hours_running)

    if server.hosting_provider == "aws":
        # AWS terminate path
        if server.aws_instance_id:
            success = aws_provisioner.terminate_server(
                server.aws_instance_id, server.aws_region or "us-east-1"
            )
            if not success:
                logger.warning(f"Failed to terminate AWS instance for server {server_id}")
    else:
        # Docker delete path (original)
        if server.docker_container_id:
            success = server_provisioner.delete_server(server.docker_container_id)
            if not success:
                logger.warning(f"Failed to delete container for server {server_id}")

    # Delete from database
    session.delete(server)
    session.commit()

    return {"message": "Server deleted successfully"}
