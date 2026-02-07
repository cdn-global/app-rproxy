"""
Routes for PostgreSQL database instance management
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlmodel import Session, select
from typing import Annotated
import logging
import uuid
from datetime import datetime
from app.models import (
    User, DatabaseInstance, DatabaseInstanceCreate, DatabaseInstanceUpdate,
    DatabaseInstancePublic, DatabaseInstancesPublic, UsageRecord
)
from app.api.deps import get_current_user, SessionDep
from app.services.database_provisioner import database_provisioner

logger = logging.getLogger(__name__)

router = APIRouter(tags=["database-instances"])


def record_database_usage(
    session: Session,
    user_id: uuid.UUID,
    instance_id: uuid.UUID,
    storage_gb: float
):
    """Helper function to record database storage usage"""
    usage = UsageRecord(
        user_id=user_id,
        resource_type="database",
        resource_id=instance_id,
        quantity=storage_gb,
        stripe_reported=False,
        timestamp=datetime.utcnow()
    )
    session.add(usage)
    session.commit()


@router.post("/", response_model=DatabaseInstancePublic)
async def create_database_instance(
    instance_data: DatabaseInstanceCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
    background_tasks: BackgroundTasks
) -> DatabaseInstance:
    """Create and provision a new PostgreSQL database instance"""

    # Create instance record in database
    new_instance = DatabaseInstance(
        id=uuid.uuid4(),
        user_id=current_user.id,
        instance_name=instance_data.instance_name,
        postgres_version=instance_data.postgres_version,
        storage_gb=instance_data.storage_gb,
        cpu_cores=instance_data.cpu_cores,
        memory_gb=instance_data.memory_gb,
        status="provisioning",
        connection_string_encrypted="",  # Will be set after provisioning
        created_at=datetime.utcnow()
    )

    session.add(new_instance)
    session.commit()
    session.refresh(new_instance)

    # Provision database in background
    try:
        container_id, encrypted_connection, monthly_rate, storage_rate_per_gb = database_provisioner.provision_database(
            instance_id=new_instance.id,
            user_id=current_user.id,
            instance_name=instance_data.instance_name,
            postgres_version=instance_data.postgres_version,
            storage_gb=instance_data.storage_gb,
            cpu_cores=instance_data.cpu_cores,
            memory_gb=instance_data.memory_gb
        )

        # Update instance with provisioning results
        new_instance.docker_container_id = container_id
        new_instance.connection_string_encrypted = encrypted_connection
        new_instance.monthly_rate = monthly_rate
        new_instance.storage_rate_per_gb = storage_rate_per_gb
        new_instance.status = "running"

        session.add(new_instance)
        session.commit()
        session.refresh(new_instance)

        # Record initial storage usage
        record_database_usage(session, current_user.id, new_instance.id, instance_data.storage_gb)

        logger.info(f"Database instance {new_instance.id} provisioned successfully for user {current_user.id}")

    except Exception as e:
        logger.error(f"Failed to provision database instance {new_instance.id}: {e}")
        new_instance.status = "error"
        session.add(new_instance)
        session.commit()
        raise HTTPException(status_code=500, detail=f"Database provisioning failed: {str(e)}")

    return new_instance


@router.get("/", response_model=DatabaseInstancesPublic)
async def list_database_instances(
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
    skip: int = 0,
    limit: int = 100
) -> DatabaseInstancesPublic:
    """List all database instances for the current user"""
    statement = select(DatabaseInstance).where(
        DatabaseInstance.user_id == current_user.id
    ).offset(skip).limit(limit)

    instances = session.exec(statement).all()
    count = len(instances)

    return DatabaseInstancesPublic(data=list(instances), count=count)


@router.get("/{instance_id}", response_model=DatabaseInstancePublic)
async def get_database_instance(
    instance_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep
) -> DatabaseInstance:
    """Get details of a specific database instance"""
    statement = select(DatabaseInstance).where(
        DatabaseInstance.id == instance_id,
        DatabaseInstance.user_id == current_user.id
    )

    instance = session.exec(statement).first()

    if not instance:
        raise HTTPException(status_code=404, detail="Database instance not found")

    # Update status from Docker
    if instance.docker_container_id:
        current_status = database_provisioner.get_database_status(instance.docker_container_id)
        if current_status != instance.status:
            instance.status = current_status
            session.add(instance)
            session.commit()
            session.refresh(instance)

    return instance


@router.patch("/{instance_id}", response_model=DatabaseInstancePublic)
async def update_database_instance(
    instance_id: uuid.UUID,
    instance_update: DatabaseInstanceUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep
) -> DatabaseInstance:
    """Update database instance details"""
    statement = select(DatabaseInstance).where(
        DatabaseInstance.id == instance_id,
        DatabaseInstance.user_id == current_user.id
    )

    instance = session.exec(statement).first()

    if not instance:
        raise HTTPException(status_code=404, detail="Database instance not found")

    # Update fields
    if instance_update.instance_name is not None:
        instance.instance_name = instance_update.instance_name
    if instance_update.status is not None:
        instance.status = instance_update.status
    if instance_update.storage_gb is not None:
        # Record new storage usage
        old_storage = instance.storage_gb
        new_storage = instance_update.storage_gb
        if new_storage != old_storage:
            record_database_usage(session, current_user.id, instance.id, new_storage)
        instance.storage_gb = new_storage

    session.add(instance)
    session.commit()
    session.refresh(instance)

    return instance


@router.post("/{instance_id}/stop", response_model=DatabaseInstancePublic)
async def stop_database_instance(
    instance_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep
) -> DatabaseInstance:
    """Stop a running database instance"""
    statement = select(DatabaseInstance).where(
        DatabaseInstance.id == instance_id,
        DatabaseInstance.user_id == current_user.id
    )

    instance = session.exec(statement).first()

    if not instance:
        raise HTTPException(status_code=404, detail="Database instance not found")

    if not instance.docker_container_id:
        raise HTTPException(status_code=400, detail="Instance has no container ID")

    # Stop the container
    success = database_provisioner.stop_database(instance.docker_container_id)

    if success:
        instance.status = "stopped"
        session.add(instance)
        session.commit()
        session.refresh(instance)
    else:
        raise HTTPException(status_code=500, detail="Failed to stop database instance")

    return instance


@router.post("/{instance_id}/start", response_model=DatabaseInstancePublic)
async def start_database_instance(
    instance_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep
) -> DatabaseInstance:
    """Start a stopped database instance"""
    statement = select(DatabaseInstance).where(
        DatabaseInstance.id == instance_id,
        DatabaseInstance.user_id == current_user.id
    )

    instance = session.exec(statement).first()

    if not instance:
        raise HTTPException(status_code=404, detail="Database instance not found")

    if not instance.docker_container_id:
        raise HTTPException(status_code=400, detail="Instance has no container ID")

    # Start the container
    success = database_provisioner.start_database(instance.docker_container_id)

    if success:
        instance.status = "running"
        session.add(instance)
        session.commit()
        session.refresh(instance)
    else:
        raise HTTPException(status_code=500, detail="Failed to start database instance")

    return instance


@router.delete("/{instance_id}")
async def delete_database_instance(
    instance_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep
) -> dict:
    """Delete a database instance and its container"""
    statement = select(DatabaseInstance).where(
        DatabaseInstance.id == instance_id,
        DatabaseInstance.user_id == current_user.id
    )

    instance = session.exec(statement).first()

    if not instance:
        raise HTTPException(status_code=404, detail="Database instance not found")

    # Delete the container and volume
    if instance.docker_container_id:
        success = database_provisioner.delete_database(instance.docker_container_id, instance.id)
        if not success:
            logger.warning(f"Failed to delete container for instance {instance_id}")

    # Delete from database
    session.delete(instance)
    session.commit()

    return {"message": "Database instance deleted successfully"}


@router.post("/{instance_id}/backup")
async def backup_database_instance(
    instance_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep
) -> dict:
    """Create a backup of a database instance"""
    statement = select(DatabaseInstance).where(
        DatabaseInstance.id == instance_id,
        DatabaseInstance.user_id == current_user.id
    )

    instance = session.exec(statement).first()

    if not instance:
        raise HTTPException(status_code=404, detail="Database instance not found")

    if not instance.docker_container_id:
        raise HTTPException(status_code=400, detail="Instance has no container ID")

    # Create backup
    backup_file = database_provisioner.backup_database(instance.docker_container_id, instance.id)

    if backup_file:
        return {"message": "Backup created successfully", "backup_file": backup_file}
    else:
        raise HTTPException(status_code=500, detail="Failed to create backup")
