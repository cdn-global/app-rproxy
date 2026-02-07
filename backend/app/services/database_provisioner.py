"""
Database provisioning service for PostgreSQL instances
"""
import docker
import logging
import secrets
import uuid
from typing import Optional
from datetime import datetime
from cryptography.fernet import Fernet
from app.models import DatabaseInstance
from app.core.config import settings

logger = logging.getLogger(__name__)

class DatabaseProvisioner:
    """Handles provisioning and management of PostgreSQL database instances"""

    def __init__(self):
        try:
            self.docker_client = docker.from_env()
        except Exception as e:
            logger.error(f"Failed to initialize Docker client: {e}")
            self.docker_client = None

    def _generate_encryption_key(self) -> bytes:
        """Generate encryption key for connection strings"""
        return Fernet.generate_key()

    def _encrypt_connection_string(self, connection_string: str, key: bytes) -> str:
        """Encrypt connection string"""
        f = Fernet(key)
        return f.encrypt(connection_string.encode()).decode()

    def _decrypt_connection_string(self, encrypted: str, key: bytes) -> str:
        """Decrypt connection string"""
        f = Fernet(key)
        return f.decrypt(encrypted.encode()).decode()

    def calculate_monthly_rate(self, storage_gb: int, cpu_cores: int, memory_gb: int) -> tuple[float, float]:
        """
        Calculate monthly rate and per-GB storage rate

        Returns: (base_monthly_rate, storage_rate_per_gb)
        """
        # Base monthly rate: $5 + $2 per CPU core + $1 per GB memory
        base_rate = 5.0 + (cpu_cores * 2.0) + (memory_gb * 1.0)

        # Storage rate: $0.10 per GB per month
        storage_rate_per_gb = 0.10

        return base_rate, storage_rate_per_gb

    def provision_database(
        self,
        instance_id: uuid.UUID,
        user_id: uuid.UUID,
        instance_name: str,
        postgres_version: str,
        storage_gb: int,
        cpu_cores: int,
        memory_gb: int
    ) -> tuple[str, str, float, float]:
        """
        Provision a new PostgreSQL database instance

        Returns: (container_id, encrypted_connection_string, monthly_rate, storage_rate_per_gb)
        """
        if not self.docker_client:
            raise Exception("Docker client not available")

        monthly_rate, storage_rate_per_gb = self.calculate_monthly_rate(storage_gb, cpu_cores, memory_gb)

        # Generate database credentials
        db_password = secrets.token_urlsafe(32)
        db_user = f"user_{str(user_id).replace('-', '_')}"
        db_name = instance_name.replace("-", "_").replace(" ", "_").lower()

        # Container configuration
        container_name = f"db-{instance_id}"
        postgres_port = 5432

        try:
            # Create and start container
            logger.info(f"Creating PostgreSQL container for instance {instance_id}")

            container = self.docker_client.containers.run(
                f"postgres:{postgres_version}",
                name=container_name,
                detach=True,
                environment={
                    "POSTGRES_USER": db_user,
                    "POSTGRES_PASSWORD": db_password,
                    "POSTGRES_DB": db_name,
                    "PGDATA": "/var/lib/postgresql/data/pgdata"
                },
                ports={f"{postgres_port}/tcp": None},  # Random host port
                mem_limit=f"{memory_gb}g",
                cpu_count=cpu_cores,
                volumes={
                    f"db-{instance_id}-data": {
                        "bind": "/var/lib/postgresql/data",
                        "mode": "rw"
                    }
                },
                labels={
                    "managed_by": "app-rproxy",
                    "user_id": str(user_id),
                    "instance_id": str(instance_id),
                    "instance_name": instance_name,
                    "storage_gb": str(storage_gb)
                },
                shm_size="256m"  # Shared memory for PostgreSQL
            )

            # Get assigned host port
            container.reload()
            host_port = None
            if container.attrs['NetworkSettings']['Ports']:
                port_mappings = container.attrs['NetworkSettings']['Ports'].get(f"{postgres_port}/tcp")
                if port_mappings and len(port_mappings) > 0:
                    host_port = port_mappings[0]['HostPort']

            if not host_port:
                host_port = "5432"  # Fallback

            # Create connection string
            connection_string = f"postgresql://{db_user}:{db_password}@localhost:{host_port}/{db_name}"

            # Encrypt connection string
            encryption_key = self._generate_encryption_key()
            encrypted_connection = self._encrypt_connection_string(connection_string, encryption_key)

            logger.info(f"Successfully provisioned database instance {instance_id} (container: {container.id})")

            return container.id, encrypted_connection, monthly_rate, storage_rate_per_gb

        except Exception as e:
            logger.error(f"Failed to provision database instance {instance_id}: {e}")
            raise Exception(f"Database provisioning failed: {str(e)}")

    def stop_database(self, container_id: str) -> bool:
        """Stop a running database instance"""
        if not self.docker_client:
            raise Exception("Docker client not available")

        try:
            container = self.docker_client.containers.get(container_id)
            container.stop()
            logger.info(f"Stopped database container {container_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to stop database container {container_id}: {e}")
            return False

    def start_database(self, container_id: str) -> bool:
        """Start a stopped database instance"""
        if not self.docker_client:
            raise Exception("Docker client not available")

        try:
            container = self.docker_client.containers.get(container_id)
            container.start()
            logger.info(f"Started database container {container_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to start database container {container_id}: {e}")
            return False

    def delete_database(self, container_id: str, instance_id: uuid.UUID) -> bool:
        """Delete a database instance and its data"""
        if not self.docker_client:
            raise Exception("Docker client not available")

        try:
            # Stop and remove container
            container = self.docker_client.containers.get(container_id)
            container.stop()
            container.remove()

            # Remove volume
            volume_name = f"db-{instance_id}-data"
            try:
                volume = self.docker_client.volumes.get(volume_name)
                volume.remove()
                logger.info(f"Removed volume {volume_name}")
            except Exception as ve:
                logger.warning(f"Failed to remove volume {volume_name}: {ve}")

            logger.info(f"Deleted database container {container_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete database container {container_id}: {e}")
            return False

    def get_database_status(self, container_id: str) -> str:
        """Get current status of a database instance"""
        if not self.docker_client:
            return "error"

        try:
            container = self.docker_client.containers.get(container_id)
            return container.status  # running, stopped, etc.
        except Exception as e:
            logger.error(f"Failed to get status for database container {container_id}: {e}")
            return "error"

    def backup_database(self, container_id: str, instance_id: uuid.UUID) -> Optional[str]:
        """Create a backup of a database instance"""
        if not self.docker_client:
            raise Exception("Docker client not available")

        try:
            container = self.docker_client.containers.get(container_id)

            # Generate backup filename
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            backup_file = f"backup_{instance_id}_{timestamp}.sql"

            # Execute pg_dump inside container
            exec_result = container.exec_run(
                f"pg_dumpall -U postgres > /tmp/{backup_file}",
                workdir="/tmp"
            )

            if exec_result.exit_code == 0:
                logger.info(f"Created backup {backup_file} for instance {instance_id}")
                return backup_file
            else:
                logger.error(f"Backup failed: {exec_result.output.decode()}")
                return None

        except Exception as e:
            logger.error(f"Failed to backup database {container_id}: {e}")
            return None


# Singleton instance
database_provisioner = DatabaseProvisioner()
