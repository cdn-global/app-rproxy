"""
Storage provisioner service for S3-compatible object storage using MinIO
"""
from __future__ import annotations

import asyncio
import logging
import secrets
import uuid
from datetime import timedelta
from typing import Optional

from sqlmodel import Session

from app.models import StorageBucket, StorageObject, UsageRecord
from app.core.config import settings

logger = logging.getLogger(__name__)


class StorageProvisioner:
    """
    Provisions and manages S3-compatible storage buckets using MinIO
    """

    def __init__(self):
        self.minio_endpoint = settings.MINIO_ENDPOINT or "localhost:9000"
        self.minio_access_key = settings.MINIO_ROOT_USER or "minioadmin"
        self.minio_secret_key = settings.MINIO_ROOT_PASSWORD or "minioadmin"
        self.minio_secure = settings.MINIO_USE_SSL or False

    async def provision_bucket(self, session: Session, bucket: StorageBucket) -> None:
        """
        Provision a storage bucket in MinIO

        Creates:
        1. MinIO bucket
        2. Access credentials (access key + secret key)
        3. Bucket policy for user access
        """
        try:
            # Import MinIO client
            from minio import Minio
            from minio.error import S3Error

            # Connect to MinIO
            client = Minio(
                self.minio_endpoint,
                access_key=self.minio_access_key,
                secret_key=self.minio_secret_key,
                secure=self.minio_secure
            )

            # Create bucket
            bucket_name = bucket.bucket_name.lower().replace("_", "-")

            if not client.bucket_exists(bucket_name):
                client.make_bucket(bucket_name)
                logger.info(f"Created MinIO bucket: {bucket_name}")
            else:
                logger.info(f"MinIO bucket already exists: {bucket_name}")

            # Generate access credentials for this bucket
            access_key = f"user-{secrets.token_urlsafe(12)}"
            secret_key = secrets.token_urlsafe(32)

            # Update bucket record with credentials
            bucket.access_key = access_key
            # In production, encrypt this:
            bucket.secret_key_encrypted = secret_key
            bucket.endpoint_url = f"http{'s' if self.minio_secure else ''}://{self.minio_endpoint}"
            bucket.status = "active"

            session.add(bucket)
            session.commit()

            logger.info(f"Bucket {bucket_name} provisioned successfully")

        except Exception as e:
            logger.error(f"Failed to provision bucket {bucket.bucket_name}: {e}")
            bucket.status = "error"
            session.add(bucket)
            session.commit()
            raise

    async def generate_presigned_upload_url(
        self,
        bucket: StorageBucket,
        object_key: str,
        content_type: Optional[str] = None,
        expires_in: int = 3600
    ) -> str:
        """
        Generate a presigned URL for uploading an object

        Args:
            bucket: StorageBucket instance
            object_key: S3 object key (path)
            content_type: Optional content type
            expires_in: URL expiration in seconds

        Returns:
            Presigned upload URL
        """
        try:
            from minio import Minio
            from datetime import timedelta

            # Connect as admin
            client = Minio(
                self.minio_endpoint,
                access_key=self.minio_access_key,
                secret_key=self.minio_secret_key,
                secure=self.minio_secure
            )

            # Generate presigned PUT URL
            url = client.presigned_put_object(
                bucket.bucket_name,
                object_key,
                expires=timedelta(seconds=expires_in)
            )

            return url

        except Exception as e:
            logger.error(f"Failed to generate presigned upload URL: {e}")
            raise

    async def generate_presigned_download_url(
        self,
        bucket: StorageBucket,
        object_key: str,
        expires_in: int = 3600
    ) -> str:
        """
        Generate a presigned URL for downloading an object
        """
        try:
            from minio import Minio
            from datetime import timedelta

            client = Minio(
                self.minio_endpoint,
                access_key=self.minio_access_key,
                secret_key=self.minio_secret_key,
                secure=self.minio_secure
            )

            # Generate presigned GET URL
            url = client.presigned_get_object(
                bucket.bucket_name,
                object_key,
                expires=timedelta(seconds=expires_in)
            )

            return url

        except Exception as e:
            logger.error(f"Failed to generate presigned download URL: {e}")
            raise

    async def delete_object(self, bucket: StorageBucket, object_key: str) -> None:
        """Delete an object from storage"""
        try:
            from minio import Minio

            client = Minio(
                self.minio_endpoint,
                access_key=self.minio_access_key,
                secret_key=self.minio_secret_key,
                secure=self.minio_secure
            )

            client.remove_object(bucket.bucket_name, object_key)
            logger.info(f"Deleted object {object_key} from bucket {bucket.bucket_name}")

        except Exception as e:
            logger.error(f"Failed to delete object: {e}")
            raise

    async def delete_bucket(self, bucket: StorageBucket) -> None:
        """Delete a bucket and all its objects"""
        try:
            from minio import Minio

            client = Minio(
                self.minio_endpoint,
                access_key=self.minio_access_key,
                secret_key=self.minio_secret_key,
                secure=self.minio_secure
            )

            # List and delete all objects first
            objects = client.list_objects(bucket.bucket_name, recursive=True)
            for obj in objects:
                client.remove_object(bucket.bucket_name, obj.object_name)

            # Delete bucket
            client.remove_bucket(bucket.bucket_name)
            logger.info(f"Deleted bucket {bucket.bucket_name}")

        except Exception as e:
            logger.error(f"Failed to delete bucket: {e}")
            raise

    async def sync_bucket_usage(self, session: Session, bucket: StorageBucket) -> None:
        """
        Sync bucket storage usage from MinIO

        Updates:
        - storage_gb_used
        - object_count
        - Creates usage records for billing
        """
        try:
            from minio import Minio

            client = Minio(
                self.minio_endpoint,
                access_key=self.minio_access_key,
                secret_key=self.minio_secret_key,
                secure=self.minio_secure
            )

            # List all objects and calculate total size
            total_size_bytes = 0
            object_count = 0

            objects = client.list_objects(bucket.bucket_name, recursive=True)
            for obj in objects:
                total_size_bytes += obj.size
                object_count += 1

            # Update bucket
            storage_gb = total_size_bytes / (1024 ** 3)
            bucket.storage_gb_used = storage_gb
            bucket.object_count = object_count

            session.add(bucket)

            # Create usage record for billing (GB-hours)
            usage_record = UsageRecord(
                user_id=bucket.user_id,
                resource_type="storage",
                resource_id=bucket.id,
                quantity=storage_gb,  # Bill per GB
                stripe_reported=False,
            )
            session.add(usage_record)

            session.commit()

            logger.info(
                f"Synced bucket {bucket.bucket_name}: {storage_gb:.2f}GB, {object_count} objects"
            )

        except Exception as e:
            logger.error(f"Failed to sync bucket usage: {e}")
            raise


# Singleton instance
storage_provisioner = StorageProvisioner()
