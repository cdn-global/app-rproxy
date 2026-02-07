"""
Routes for S3-compatible object storage
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session, select
from typing import Annotated
import logging
import uuid
from datetime import datetime

from app.models import (
    User, StorageBucket, StorageObject,
    StorageBucketCreate, StorageBucketUpdate, StorageBucketPublic, StorageBucketsPublic,
    StorageObjectPublic, StorageObjectsPublic,
    PresignedUploadRequest, PresignedUploadResponse,
    PresignedDownloadRequest, PresignedDownloadResponse,
    UsageRecord
)
from app.api.deps import get_current_user, get_current_active_superuser, SessionDep

logger = logging.getLogger(__name__)

router = APIRouter(tags=["storage"])


@router.get("/buckets", response_model=StorageBucketsPublic)
async def list_buckets(
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
    skip: int = 0,
    limit: int = 100
) -> StorageBucketsPublic:
    """List all storage buckets for the current user"""
    statement = select(StorageBucket).where(
        StorageBucket.user_id == current_user.id,
        StorageBucket.status != "deleted"
    ).offset(skip).limit(limit)

    buckets = session.exec(statement).all()
    count = len(buckets)

    return StorageBucketsPublic(data=list(buckets), count=count)


@router.post("/buckets", response_model=StorageBucketPublic)
async def create_bucket(
    request: StorageBucketCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep
) -> StorageBucket:
    """
    Create a new storage bucket

    Provisions a MinIO or S3 bucket and returns credentials
    """
    # Guard: require active subscription
    if not current_user.has_subscription and not current_user.is_superuser:
        raise HTTPException(
            status_code=402,
            detail="Active infrastructure subscription required"
        )

    # Check for duplicate bucket name
    existing = session.exec(
        select(StorageBucket).where(StorageBucket.bucket_name == request.bucket_name)
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Bucket name '{request.bucket_name}' already exists"
        )

    # Create bucket record
    bucket = StorageBucket(
        id=uuid.uuid4(),
        user_id=current_user.id,
        bucket_name=request.bucket_name,
        region=request.region,
        storage_class=request.storage_class,
        storage_backend=request.storage_backend,
        status="provisioning",
        created_at=datetime.utcnow()
    )
    session.add(bucket)
    session.commit()
    session.refresh(bucket)

    # Provision bucket in background
    from app.services.storage_provisioner import storage_provisioner
    import asyncio

    async def provision():
        try:
            await storage_provisioner.provision_bucket(session, bucket)
        except Exception as e:
            logger.error(f"Bucket provisioning failed: {e}")
            bucket.status = "error"
            session.add(bucket)
            session.commit()

    asyncio.create_task(provision())

    return bucket


@router.get("/buckets/{bucket_id}", response_model=StorageBucketPublic)
async def get_bucket(
    bucket_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep
) -> StorageBucket:
    """Get details of a specific bucket"""
    statement = select(StorageBucket).where(
        StorageBucket.id == bucket_id,
        StorageBucket.user_id == current_user.id
    )
    bucket = session.exec(statement).first()

    if not bucket:
        raise HTTPException(status_code=404, detail="Bucket not found")

    return bucket


@router.patch("/buckets/{bucket_id}", response_model=StorageBucketPublic)
async def update_bucket(
    bucket_id: uuid.UUID,
    request: StorageBucketUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep
) -> StorageBucket:
    """Update bucket settings"""
    statement = select(StorageBucket).where(
        StorageBucket.id == bucket_id,
        StorageBucket.user_id == current_user.id
    )
    bucket = session.exec(statement).first()

    if not bucket:
        raise HTTPException(status_code=404, detail="Bucket not found")

    update_data = request.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(bucket, key, value)

    session.add(bucket)
    session.commit()
    session.refresh(bucket)

    return bucket


@router.delete("/buckets/{bucket_id}")
async def delete_bucket(
    bucket_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep
) -> dict:
    """Delete a storage bucket (soft delete)"""
    statement = select(StorageBucket).where(
        StorageBucket.id == bucket_id,
        StorageBucket.user_id == current_user.id
    )
    bucket = session.exec(statement).first()

    if not bucket:
        raise HTTPException(status_code=404, detail="Bucket not found")

    # Soft delete
    bucket.status = "deleted"
    session.add(bucket)
    session.commit()

    return {"message": f"Bucket {bucket.bucket_name} deleted"}


@router.get("/buckets/{bucket_id}/objects", response_model=StorageObjectsPublic)
async def list_objects(
    bucket_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
    prefix: str = "",
    skip: int = 0,
    limit: int = 100
) -> StorageObjectsPublic:
    """List objects in a bucket"""
    # Verify bucket ownership
    bucket = session.get(StorageBucket, bucket_id)
    if not bucket or bucket.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Bucket not found")

    # Query objects
    statement = select(StorageObject).where(
        StorageObject.bucket_id == bucket_id,
        StorageObject.is_deleted == False
    )

    if prefix:
        statement = statement.where(StorageObject.object_key.startswith(prefix))

    statement = statement.offset(skip).limit(limit)
    objects = session.exec(statement).all()

    return StorageObjectsPublic(data=list(objects), count=len(objects))


@router.post("/buckets/{bucket_id}/presigned-upload", response_model=PresignedUploadResponse)
async def generate_presigned_upload_url(
    bucket_id: uuid.UUID,
    request: PresignedUploadRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep
) -> PresignedUploadResponse:
    """Generate a presigned URL for uploading an object"""
    # Verify bucket ownership
    bucket = session.get(StorageBucket, bucket_id)
    if not bucket or bucket.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Bucket not found")

    if bucket.status != "active":
        raise HTTPException(status_code=400, detail="Bucket is not active")

    from app.services.storage_provisioner import storage_provisioner

    try:
        presigned_url = await storage_provisioner.generate_presigned_upload_url(
            bucket=bucket,
            object_key=request.object_key,
            content_type=request.content_type,
            expires_in=request.expires_in
        )

        return PresignedUploadResponse(
            presigned_url=presigned_url,
            expires_in=request.expires_in,
            object_key=request.object_key,
            bucket_name=bucket.bucket_name
        )
    except Exception as e:
        logger.error(f"Failed to generate presigned upload URL: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/buckets/{bucket_id}/presigned-download", response_model=PresignedDownloadResponse)
async def generate_presigned_download_url(
    bucket_id: uuid.UUID,
    request: PresignedDownloadRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep
) -> PresignedDownloadResponse:
    """Generate a presigned URL for downloading an object"""
    # Verify bucket ownership
    bucket = session.get(StorageBucket, bucket_id)
    if not bucket or bucket.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Bucket not found")

    # Get object metadata
    obj = session.exec(
        select(StorageObject).where(
            StorageObject.bucket_id == bucket_id,
            StorageObject.object_key == request.object_key,
            StorageObject.is_deleted == False
        )
    ).first()

    if not obj:
        raise HTTPException(status_code=404, detail="Object not found")

    from app.services.storage_provisioner import storage_provisioner

    try:
        presigned_url = await storage_provisioner.generate_presigned_download_url(
            bucket=bucket,
            object_key=request.object_key,
            expires_in=request.expires_in
        )

        return PresignedDownloadResponse(
            presigned_url=presigned_url,
            expires_in=request.expires_in,
            object_key=request.object_key,
            size_bytes=obj.size_bytes
        )
    except Exception as e:
        logger.error(f"Failed to generate presigned download URL: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/buckets/{bucket_id}/objects/{object_key:path}")
async def delete_object(
    bucket_id: uuid.UUID,
    object_key: str,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep
) -> dict:
    """Delete an object from a bucket"""
    # Verify bucket ownership
    bucket = session.get(StorageBucket, bucket_id)
    if not bucket or bucket.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Bucket not found")

    # Get object
    obj = session.exec(
        select(StorageObject).where(
            StorageObject.bucket_id == bucket_id,
            StorageObject.object_key == object_key,
            StorageObject.is_deleted == False
        )
    ).first()

    if not obj:
        raise HTTPException(status_code=404, detail="Object not found")

    # Delete from storage backend
    from app.services.storage_provisioner import storage_provisioner

    try:
        await storage_provisioner.delete_object(bucket, object_key)

        # Mark as deleted in DB
        obj.is_deleted = True
        session.add(obj)

        # Update bucket usage
        bucket.storage_gb_used = max(0, bucket.storage_gb_used - (obj.size_bytes / (1024**3)))
        bucket.object_count = max(0, bucket.object_count - 1)
        session.add(bucket)

        session.commit()

        return {"message": f"Object {object_key} deleted"}
    except Exception as e:
        logger.error(f"Failed to delete object: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/usage/summary")
async def get_storage_usage_summary(
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep
) -> dict:
    """Get storage usage summary for the current user"""
    buckets = session.exec(
        select(StorageBucket).where(
            StorageBucket.user_id == current_user.id,
            StorageBucket.status != "deleted"
        )
    ).all()

    total_buckets = len(buckets)
    total_storage_gb = sum(b.storage_gb_used for b in buckets)
    total_objects = sum(b.object_count for b in buckets)
    monthly_cost = sum(b.storage_gb_used * b.monthly_rate_per_gb for b in buckets)

    return {
        "total_buckets": total_buckets,
        "total_storage_gb": round(total_storage_gb, 2),
        "total_objects": total_objects,
        "monthly_cost": round(monthly_cost, 2),
        "by_bucket": [
            {
                "bucket_id": str(b.id),
                "bucket_name": b.bucket_name,
                "storage_gb": round(b.storage_gb_used, 2),
                "objects": b.object_count,
                "monthly_cost": round(b.storage_gb_used * b.monthly_rate_per_gb, 2)
            }
            for b in buckets
        ]
    }
