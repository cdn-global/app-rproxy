"""
Background job runner for async server provisioning.

Runs in a background thread (via FastAPI BackgroundTasks), so it creates
its own DB session rather than sharing the request-scoped one.
"""
import json
import logging
import uuid
from datetime import datetime

from sqlmodel import Session

from app.core.db import engine
from app.models import ProvisioningJob, RemoteServer
from app.services.aws_provisioner import aws_provisioner
from app.services.server_provisioner import server_provisioner

logger = logging.getLogger(__name__)


def run_aws_provisioning(
    server_id: uuid.UUID,
    user_id: uuid.UUID,
    server_data,
    db_url: str,
) -> None:
    """
    Provision an AWS EC2 instance in the background.

    This function is intended to be called from a FastAPI BackgroundTask.
    It creates its own DB session because background tasks run outside
    the request lifecycle.

    Args:
        server_id: The ID of the RemoteServer record already created.
        user_id: The owning user's ID.
        server_data: The RemoteServerCreate payload from the request.
        db_url: Database URL (unused -- we use the engine singleton, but
                kept for interface compatibility).
    """
    job_id = uuid.uuid4()

    # --- Create the ProvisioningJob record ---
    with Session(engine) as session:
        job = ProvisioningJob(
            id=job_id,
            user_id=user_id,
            resource_type="server",
            resource_id=server_id,
            status="running",
            provider="aws",
            started_at=datetime.utcnow(),
            created_at=datetime.utcnow(),
        )
        session.add(job)
        session.commit()

    logger.info(
        f"Starting AWS provisioning job {job_id} for server {server_id}"
    )

    try:
        # --- Call the AWS provisioner (this blocks for 30-60s) ---
        result = aws_provisioner.provision_server(
            server_id=server_id,
            user_id=user_id,
            name=server_data.name,
            server_type=server_data.server_type,
            aws_instance_type=server_data.aws_instance_type or "t3.micro",
            aws_region=server_data.aws_region or "us-east-1",
            gpu_type=server_data.gpu_type,
        )

        # --- Update the RemoteServer with AWS details ---
        # Package connection data in the JSON format the terminal handler expects
        connection_data = json.dumps({
            "username": "ubuntu",
            "private_key": result["private_key_pem"],
            "port": 22,
        })
        encrypted_connection = server_provisioner.encrypt_connection_string(connection_data)

        with Session(engine) as session:
            server = session.get(RemoteServer, server_id)
            if server:
                server.aws_instance_id = result["instance_id"]
                server.aws_public_ip = result["public_ip"]
                server.aws_instance_type = result["instance_type"]
                server.aws_region = result["region"]
                server.aws_ami_id = result["ami_id"]
                server.aws_key_pair_name = result["key_pair_name"]
                server.aws_security_group_id = result["security_group_id"]
                server.hourly_rate = result["hourly_rate"]
                server.connection_string_encrypted = encrypted_connection
                server.status = "running"
                session.add(server)
                session.commit()

            # --- Mark the job as completed ---
            job = session.get(ProvisioningJob, job_id)
            if job:
                job.status = "completed"
                job.completed_at = datetime.utcnow()
                session.add(job)
                session.commit()

        logger.info(
            f"AWS provisioning job {job_id} completed for server {server_id}"
        )

    except Exception as e:
        logger.error(
            f"AWS provisioning job {job_id} failed for server {server_id}: {e}"
        )

        # --- Mark the server as errored and the job as failed ---
        with Session(engine) as session:
            server = session.get(RemoteServer, server_id)
            if server:
                server.status = "error"
                session.add(server)
                session.commit()

            job = session.get(ProvisioningJob, job_id)
            if job:
                job.status = "failed"
                job.error_message = str(e)
                job.completed_at = datetime.utcnow()
                session.add(job)
                session.commit()
