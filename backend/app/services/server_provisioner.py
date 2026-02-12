"""
Server provisioning service for remote servers (SSH, GPU, inference)
"""
import base64
import docker
import hashlib
import logging
import secrets
import uuid
from typing import Optional
from datetime import datetime
from cryptography.fernet import Fernet
from app.models import RemoteServer
from app.core.config import settings

logger = logging.getLogger(__name__)


def _derive_fernet_key() -> bytes:
    """Derive a stable Fernet key from SECRET_KEY so we can always decrypt."""
    digest = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    return base64.urlsafe_b64encode(digest)


class ServerProvisioner:
    """Handles provisioning and management of remote servers"""

    def __init__(self):
        try:
            self.docker_client = docker.from_env()
        except Exception as e:
            logger.error(f"Failed to initialize Docker client: {e}")
            self.docker_client = None
        self._fernet = Fernet(_derive_fernet_key())

    def encrypt_connection_string(self, plaintext: str) -> str:
        """Encrypt a connection JSON string."""
        return self._fernet.encrypt(plaintext.encode()).decode()

    def decrypt_connection_string(self, encrypted: str) -> str:
        """Decrypt a connection JSON string."""
        return self._fernet.decrypt(encrypted.encode()).decode()

    def calculate_hourly_rate(self, server_type: str, cpu_cores: int, memory_gb: int, gpu_type: Optional[str] = None) -> float:
        """Calculate hourly rate based on server specs"""
        base_rates = {
            "ssh": 0.05,  # $0.05/hour base
            "gpu": 0.50,  # $0.50/hour base
            "inference": 0.30  # $0.30/hour base
        }

        base = base_rates.get(server_type, 0.05)
        cpu_cost = cpu_cores * 0.02  # $0.02 per core per hour
        memory_cost = memory_gb * 0.01  # $0.01 per GB per hour

        gpu_cost = 0.0
        if gpu_type:
            gpu_costs = {
                "T4": 0.35,
                "V100": 2.50,
                "A100": 4.00,
                "H100": 8.00
            }
            gpu_cost = gpu_costs.get(gpu_type, 1.00)

        return base + cpu_cost + memory_cost + gpu_cost

    def provision_server(
        self,
        server_id: uuid.UUID,
        user_id: uuid.UUID,
        name: str,
        server_type: str,
        cpu_cores: int,
        memory_gb: int,
        gpu_type: Optional[str] = None
    ) -> tuple[str, str, float]:
        """
        Provision a new server container

        Returns: (container_id, encrypted_connection_string, hourly_rate)
        """
        if not self.docker_client:
            raise Exception("Docker client not available")

        hourly_rate = self.calculate_hourly_rate(server_type, cpu_cores, memory_gb, gpu_type)

        # Generate SSH credentials
        ssh_password = secrets.token_urlsafe(32)
        ssh_port = 2222  # Internal port, will be mapped

        # Container configuration based on server type
        container_name = f"server-{server_id}"

        if server_type == "ssh":
            image = "linuxserver/openssh-server:latest"
            environment = {
                "PUID": "1000",
                "PGID": "1000",
                "PASSWORD_ACCESS": "true",
                "USER_PASSWORD": ssh_password,
                "USER_NAME": f"user_{user_id}"
            }
            ports = {f"{ssh_port}/tcp": None}  # Random host port
        elif server_type == "gpu":
            image = "nvidia/cuda:12.0-runtime-ubuntu22.04"
            environment = {
                "PASSWORD": ssh_password
            }
            ports = {f"{ssh_port}/tcp": None}
            # Add GPU support
            device_requests = [
                docker.types.DeviceRequest(count=-1, capabilities=[['gpu']])
            ] if gpu_type else []
        else:  # inference
            image = "ubuntu:22.04"
            environment = {
                "PASSWORD": ssh_password
            }
            ports = {f"{ssh_port}/tcp": None}
            device_requests = []

        try:
            # Create and start container
            logger.info(f"Creating container for server {server_id}")
            container = self.docker_client.containers.run(
                image,
                name=container_name,
                detach=True,
                environment=environment,
                ports=ports,
                mem_limit=f"{memory_gb}g",
                cpu_count=cpu_cores,
                device_requests=device_requests if server_type in ["gpu", "inference"] else None,
                labels={
                    "managed_by": "app-rproxy",
                    "user_id": str(user_id),
                    "server_id": str(server_id),
                    "server_type": server_type
                }
            )

            # Get assigned host port
            container.reload()
            host_port = None
            if container.attrs['NetworkSettings']['Ports']:
                port_mappings = container.attrs['NetworkSettings']['Ports'].get(f"{ssh_port}/tcp")
                if port_mappings and len(port_mappings) > 0:
                    host_port = port_mappings[0]['HostPort']

            if not host_port:
                host_port = "2222"  # Fallback

            # Create connection string
            connection_string = f"ssh://user_{user_id}:{ssh_password}@localhost:{host_port}"

            # Encrypt connection string
            encrypted_connection = self.encrypt_connection_string(connection_string)

            logger.info(f"Successfully provisioned server {server_id} (container: {container.id})")

            return container.id, encrypted_connection, hourly_rate

        except Exception as e:
            logger.error(f"Failed to provision server {server_id}: {e}")
            raise Exception(f"Server provisioning failed: {str(e)}")

    def stop_server(self, container_id: str) -> bool:
        """Stop a running server"""
        if not self.docker_client:
            raise Exception("Docker client not available")

        try:
            container = self.docker_client.containers.get(container_id)
            container.stop()
            logger.info(f"Stopped container {container_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to stop container {container_id}: {e}")
            return False

    def start_server(self, container_id: str) -> bool:
        """Start a stopped server"""
        if not self.docker_client:
            raise Exception("Docker client not available")

        try:
            container = self.docker_client.containers.get(container_id)
            container.start()
            logger.info(f"Started container {container_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to start container {container_id}: {e}")
            return False

    def delete_server(self, container_id: str) -> bool:
        """Delete a server container"""
        if not self.docker_client:
            raise Exception("Docker client not available")

        try:
            container = self.docker_client.containers.get(container_id)
            container.stop()
            container.remove()
            logger.info(f"Deleted container {container_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete container {container_id}: {e}")
            return False

    def get_server_status(self, container_id: str) -> str:
        """Get current status of a server"""
        if not self.docker_client:
            return "error"

        try:
            container = self.docker_client.containers.get(container_id)
            return container.status  # running, stopped, etc.
        except Exception as e:
            logger.error(f"Failed to get status for container {container_id}: {e}")
            return "error"


# Singleton instance
server_provisioner = ServerProvisioner()
