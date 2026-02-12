"""
Storage provisioner service for S3-compatible object storage.

Supports two backends:
  - "minio"  : local/self-hosted MinIO
  - "aws-s3" : AWS S3 via system-level credentials (same whitelabel pattern as aws_provisioner)
"""
from __future__ import annotations

import asyncio
import logging
import secrets
import uuid
from datetime import timedelta
from typing import Optional

import boto3
from botocore.config import Config as BotoConfig
from botocore.exceptions import ClientError
from sqlmodel import Session

from app.models import StorageBucket, StorageObject, UsageRecord
from app.core.config import settings

logger = logging.getLogger(__name__)


def _get_s3_client(region: str = "us-east-1"):
    """Return a boto3 S3 client using system-level AWS credentials."""
    return boto3.client(
        "s3",
        region_name=region,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        config=BotoConfig(signature_version="s3v4"),
    )


class StorageProvisioner:
    """
    Provisions and manages S3-compatible storage buckets.
    Routes to MinIO or AWS S3 based on bucket.storage_backend.
    """

    def __init__(self):
        self.minio_endpoint = settings.MINIO_ENDPOINT or "localhost:9000"
        self.minio_access_key = settings.MINIO_ROOT_USER or "minioadmin"
        self.minio_secret_key = settings.MINIO_ROOT_PASSWORD or "minioadmin"
        self.minio_secure = settings.MINIO_USE_SSL or False

    # ── helpers ──────────────────────────────────────────────────────────

    def _get_minio_client(self):
        from minio import Minio
        return Minio(
            self.minio_endpoint,
            access_key=self.minio_access_key,
            secret_key=self.minio_secret_key,
            secure=self.minio_secure,
        )

    # ── provision ────────────────────────────────────────────────────────

    async def provision_bucket(self, session: Session, bucket: StorageBucket) -> None:
        if bucket.storage_backend == "aws-s3":
            await self._provision_aws(session, bucket)
        else:
            await self._provision_minio(session, bucket)

    async def _provision_aws(self, session: Session, bucket: StorageBucket) -> None:
        """Provision an S3 bucket on AWS using system credentials."""
        try:
            region = bucket.region or "us-east-1"
            s3 = _get_s3_client(region)
            bucket_name = bucket.bucket_name.lower().replace("_", "-")

            create_kwargs: dict = {"Bucket": bucket_name}
            if region != "us-east-1":
                create_kwargs["CreateBucketConfiguration"] = {
                    "LocationConstraint": region
                }

            try:
                s3.create_bucket(**create_kwargs)
                logger.info(f"Created AWS S3 bucket: {bucket_name}")
            except ClientError as e:
                code = e.response["Error"]["Code"]
                if code in ("BucketAlreadyOwnedByYou", "BucketAlreadyExists"):
                    logger.info(f"AWS S3 bucket already exists: {bucket_name}")
                else:
                    raise

            # Generate IAM-scoped credentials would go here in production;
            # for now, store endpoint info so the UI knows it's AWS-managed.
            bucket.endpoint_url = f"https://s3.{region}.amazonaws.com"
            bucket.access_key = f"aws-managed-{secrets.token_urlsafe(8)}"
            bucket.secret_key_encrypted = secrets.token_urlsafe(32)
            bucket.status = "active"

            session.add(bucket)
            session.commit()
            logger.info(f"AWS bucket {bucket_name} provisioned successfully")

        except Exception as e:
            logger.error(f"Failed to provision AWS bucket {bucket.bucket_name}: {e}")
            bucket.status = "error"
            session.add(bucket)
            session.commit()
            raise

    async def _provision_minio(self, session: Session, bucket: StorageBucket) -> None:
        """Provision a bucket in MinIO (original path)."""
        try:
            client = self._get_minio_client()
            bucket_name = bucket.bucket_name.lower().replace("_", "-")

            if not client.bucket_exists(bucket_name):
                client.make_bucket(bucket_name)
                logger.info(f"Created MinIO bucket: {bucket_name}")
            else:
                logger.info(f"MinIO bucket already exists: {bucket_name}")

            access_key = f"user-{secrets.token_urlsafe(12)}"
            secret_key = secrets.token_urlsafe(32)

            bucket.access_key = access_key
            bucket.secret_key_encrypted = secret_key
            bucket.endpoint_url = f"http{'s' if self.minio_secure else ''}://{self.minio_endpoint}"
            bucket.status = "active"

            session.add(bucket)
            session.commit()
            logger.info(f"MinIO bucket {bucket_name} provisioned successfully")

        except Exception as e:
            logger.error(f"Failed to provision MinIO bucket {bucket.bucket_name}: {e}")
            bucket.status = "error"
            session.add(bucket)
            session.commit()
            raise

    # ── presigned URLs ───────────────────────────────────────────────────

    async def generate_presigned_upload_url(
        self,
        bucket: StorageBucket,
        object_key: str,
        content_type: Optional[str] = None,
        expires_in: int = 3600,
    ) -> str:
        if bucket.storage_backend == "aws-s3":
            s3 = _get_s3_client(bucket.region)
            params: dict = {
                "Bucket": bucket.bucket_name,
                "Key": object_key,
            }
            if content_type:
                params["ContentType"] = content_type
            return s3.generate_presigned_url(
                "put_object", Params=params, ExpiresIn=expires_in
            )

        client = self._get_minio_client()
        return client.presigned_put_object(
            bucket.bucket_name, object_key, expires=timedelta(seconds=expires_in)
        )

    async def generate_presigned_download_url(
        self,
        bucket: StorageBucket,
        object_key: str,
        expires_in: int = 3600,
    ) -> str:
        if bucket.storage_backend == "aws-s3":
            s3 = _get_s3_client(bucket.region)
            return s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": bucket.bucket_name, "Key": object_key},
                ExpiresIn=expires_in,
            )

        client = self._get_minio_client()
        return client.presigned_get_object(
            bucket.bucket_name, object_key, expires=timedelta(seconds=expires_in)
        )

    # ── object ops ───────────────────────────────────────────────────────

    async def delete_object(self, bucket: StorageBucket, object_key: str) -> None:
        if bucket.storage_backend == "aws-s3":
            s3 = _get_s3_client(bucket.region)
            s3.delete_object(Bucket=bucket.bucket_name, Key=object_key)
            logger.info(f"Deleted object {object_key} from AWS bucket {bucket.bucket_name}")
            return

        client = self._get_minio_client()
        client.remove_object(bucket.bucket_name, object_key)
        logger.info(f"Deleted object {object_key} from MinIO bucket {bucket.bucket_name}")

    async def delete_bucket(self, bucket: StorageBucket) -> None:
        if bucket.storage_backend == "aws-s3":
            s3 = _get_s3_client(bucket.region)
            # Empty the bucket first
            paginator = s3.get_paginator("list_objects_v2")
            for page in paginator.paginate(Bucket=bucket.bucket_name):
                for obj in page.get("Contents", []):
                    s3.delete_object(Bucket=bucket.bucket_name, Key=obj["Key"])
            s3.delete_bucket(Bucket=bucket.bucket_name)
            logger.info(f"Deleted AWS bucket {bucket.bucket_name}")
            return

        client = self._get_minio_client()
        objects = client.list_objects(bucket.bucket_name, recursive=True)
        for obj in objects:
            client.remove_object(bucket.bucket_name, obj.object_name)
        client.remove_bucket(bucket.bucket_name)
        logger.info(f"Deleted MinIO bucket {bucket.bucket_name}")

    # ── usage sync ───────────────────────────────────────────────────────

    async def sync_bucket_usage(self, session: Session, bucket: StorageBucket) -> None:
        total_size_bytes = 0
        object_count = 0

        try:
            if bucket.storage_backend == "aws-s3":
                s3 = _get_s3_client(bucket.region)
                paginator = s3.get_paginator("list_objects_v2")
                for page in paginator.paginate(Bucket=bucket.bucket_name):
                    for obj in page.get("Contents", []):
                        total_size_bytes += obj["Size"]
                        object_count += 1
            else:
                client = self._get_minio_client()
                objects = client.list_objects(bucket.bucket_name, recursive=True)
                for obj in objects:
                    total_size_bytes += obj.size
                    object_count += 1

            storage_gb = total_size_bytes / (1024 ** 3)
            bucket.storage_gb_used = storage_gb
            bucket.object_count = object_count
            session.add(bucket)

            usage_record = UsageRecord(
                user_id=bucket.user_id,
                resource_type="storage",
                resource_id=bucket.id,
                quantity=storage_gb,
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
