import uuid
from typing import Optional
from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel, Column, JSON
from datetime import datetime

# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: Optional[str] = Field(default=None, max_length=255)
    has_subscription: bool = Field(default=False)
    is_trial: bool = Field(default=False)
    is_deactivated: bool = Field(default=False)
    stripe_customer_id: Optional[str] = Field(default=None, nullable=True)  

# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)

class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    full_name: Optional[str] = Field(default=None, max_length=255)

# Properties to receive via API on update
class UserUpdate(UserBase):
    email: Optional[EmailStr] = Field(default=None, max_length=255)
    password: Optional[str] = Field(default=None, min_length=8, max_length=40)

class UserUpdateMe(SQLModel):
    full_name: Optional[str] = Field(default=None, max_length=255)
    email: Optional[EmailStr] = Field(default=None, max_length=255)

class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)

# Database model
class User(UserBase, table=True):
    __tablename__ = "user"  # Changed from "users" to "user"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    expiry_date: Optional[datetime] = Field(default=None)
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)

# Properties to return via API
class UserPublic(UserBase):
    id: uuid.UUID

class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int

class SubscriptionStatus(SQLModel):
    hasSubscription: bool
    isTrial: bool
    isDeactivated: bool


# UserAgent models
class UserAgentBase(SQLModel):
    user_agent: str = Field(unique=True, index=True, max_length=512)
    device: str = Field(default="desktop", max_length=50)
    browser: Optional[str] = Field(default=None, max_length=100)
    os: Optional[str] = Field(default=None, max_length=100)
    percentage: Optional[float] = Field(default=None)

class UserAgentCreate(UserAgentBase):
    pass

class UserAgentUpdate(SQLModel):
    user_agent: Optional[str] = Field(default=None, max_length=512)
    device: Optional[str] = Field(default=None, max_length=50)
    browser: Optional[str] = Field(default=None, max_length=100)
    os: Optional[str] = Field(default=None, max_length=100)
    percentage: Optional[float] = Field(default=None)

class UserAgent(UserAgentBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

class UserAgentPublic(UserAgentBase):
    id: uuid.UUID

class UserAgentsPublic(SQLModel):
    data: list[UserAgentPublic]
    count: int

# Item models
class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=255)

class ItemCreate(ItemBase):
    pass

class ItemUpdate(ItemBase):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)

class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str = Field(max_length=255)
    owner_id: uuid.UUID = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")  # Updated to "user.id"
    owner: Optional[User] = Relationship(back_populates="items")

class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID

class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int

# Miscellaneous
class Message(SQLModel):
    message: str

class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"

class TokenPayload(SQLModel):
    sub: Optional[str] = None

class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)


# ============================================================================
# HOSTING INFRASTRUCTURE MODELS
# ============================================================================

# Usage tracking for Stripe metered billing
class UsageRecord(SQLModel, table=True):
    """Tracks usage for Stripe metered billing"""
    __tablename__ = "usage_record"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    resource_type: str = Field(max_length=50)  # "server", "database", "inference"
    resource_id: uuid.UUID  # ID of the specific resource
    quantity: float  # hours, GB, tokens
    stripe_reported: bool = Field(default=False)
    stripe_usage_record_id: Optional[str] = Field(default=None, max_length=255)
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    # Relationship to user
    user: Optional[User] = Relationship()


class UsageRecordPublic(SQLModel):
    id: uuid.UUID
    user_id: uuid.UUID
    resource_type: str
    resource_id: uuid.UUID
    quantity: float
    stripe_reported: bool
    timestamp: datetime


# Remote server hosting (SSH, GPU, inference servers)
class RemoteServer(SQLModel, table=True):
    """Leased servers for users"""
    __tablename__ = "remote_server"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    name: str = Field(max_length=255)
    server_type: str = Field(max_length=50)  # "ssh", "gpu", "inference"
    hosting_provider: str = Field(default="docker", max_length=50)  # "docker" or "aws"
    cpu_cores: int = Field(default=1)
    memory_gb: int = Field(default=2)
    gpu_type: Optional[str] = Field(default=None, max_length=100)
    status: str = Field(default="provisioning", max_length=50)  # provisioning, running, stopped, terminated, error
    docker_container_id: Optional[str] = Field(default=None, max_length=255)
    # AWS fields
    aws_instance_id: Optional[str] = Field(default=None, max_length=255)
    aws_instance_type: Optional[str] = Field(default=None, max_length=50)
    aws_region: Optional[str] = Field(default=None, max_length=50)
    aws_ami_id: Optional[str] = Field(default=None, max_length=255)
    aws_key_pair_name: Optional[str] = Field(default=None, max_length=255)
    aws_public_ip: Optional[str] = Field(default=None, max_length=50)
    aws_security_group_id: Optional[str] = Field(default=None, max_length=255)
    connection_string_encrypted: Optional[str] = Field(default=None)  # Encrypted connection details
    hourly_rate: float = Field(default=0.0)  # Cost per hour
    created_at: datetime = Field(default_factory=datetime.utcnow)
    stopped_at: Optional[datetime] = Field(default=None)

    # Relationship to user
    user: Optional[User] = Relationship()


class RemoteServerCreate(SQLModel):
    name: str = Field(max_length=255)
    server_type: str = Field(max_length=50)
    hosting_provider: str = Field(default="docker", max_length=50)  # "docker" or "aws"
    cpu_cores: int = Field(default=1, ge=1, le=96)
    memory_gb: int = Field(default=2, ge=1, le=768)
    gpu_type: Optional[str] = Field(default=None, max_length=100)
    # AWS-specific options
    aws_instance_type: Optional[str] = Field(default=None, max_length=50)
    aws_region: Optional[str] = Field(default="us-east-1", max_length=50)


class RemoteServerUpdate(SQLModel):
    name: Optional[str] = Field(default=None, max_length=255)
    status: Optional[str] = Field(default=None, max_length=50)


class RemoteServerPublic(SQLModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    server_type: str
    hosting_provider: str
    cpu_cores: int
    memory_gb: int
    gpu_type: Optional[str]
    status: str
    aws_instance_type: Optional[str]
    aws_region: Optional[str]
    aws_public_ip: Optional[str]
    hourly_rate: float
    created_at: datetime
    stopped_at: Optional[datetime]


class RemoteServersPublic(SQLModel):
    data: list[RemoteServerPublic]
    count: int


# Provisioning job tracking
class ProvisioningJob(SQLModel, table=True):
    """Tracks async provisioning jobs so users can poll for status"""
    __tablename__ = "provisioning_job"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    resource_type: str = Field(max_length=50)  # "server", "database"
    resource_id: uuid.UUID  # The server or database instance ID
    status: str = Field(default="pending", max_length=50)  # pending, running, completed, failed
    provider: str = Field(max_length=50)  # "docker", "aws"
    error_message: Optional[str] = Field(default=None)
    started_at: Optional[datetime] = Field(default=None)
    completed_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    user: Optional[User] = Relationship()


class ProvisioningJobPublic(SQLModel):
    id: uuid.UUID
    user_id: uuid.UUID
    resource_type: str
    resource_id: uuid.UUID
    status: str
    provider: str
    error_message: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime


# Database instance hosting
class DatabaseInstance(SQLModel, table=True):
    """Managed PostgreSQL instances"""
    __tablename__ = "database_instance"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    instance_name: str = Field(max_length=255)
    postgres_version: str = Field(default="16", max_length=10)
    storage_gb: int = Field(default=10)
    cpu_cores: int = Field(default=1)
    memory_gb: int = Field(default=2)
    status: str = Field(default="provisioning", max_length=50)  # provisioning, running, stopped, error
    docker_container_id: Optional[str] = Field(default=None, max_length=255)
    connection_string_encrypted: str  # Encrypted connection string with credentials
    monthly_rate: float = Field(default=0.0)  # Base monthly rate
    storage_rate_per_gb: float = Field(default=0.0)  # Additional cost per GB
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationship to user
    user: Optional[User] = Relationship()


class DatabaseInstanceCreate(SQLModel):
    instance_name: str = Field(max_length=255)
    postgres_version: str = Field(default="16", max_length=10)
    storage_gb: int = Field(default=10, ge=1, le=1000)
    cpu_cores: int = Field(default=1, ge=1, le=16)
    memory_gb: int = Field(default=2, ge=1, le=128)


class DatabaseInstanceUpdate(SQLModel):
    instance_name: Optional[str] = Field(default=None, max_length=255)
    status: Optional[str] = Field(default=None, max_length=50)
    storage_gb: Optional[int] = Field(default=None, ge=1, le=1000)


class DatabaseInstancePublic(SQLModel):
    id: uuid.UUID
    user_id: uuid.UUID
    instance_name: str
    postgres_version: str
    storage_gb: int
    cpu_cores: int
    memory_gb: int
    status: str
    monthly_rate: float
    storage_rate_per_gb: float
    created_at: datetime


class DatabaseInstancesPublic(SQLModel):
    data: list[DatabaseInstancePublic]
    count: int


# Inference model catalog
class InferenceModel(SQLModel, table=True):
    """Available inference models"""
    __tablename__ = "inference_model"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(max_length=255)
    provider: str = Field(max_length=100)  # "openai", "anthropic", "huggingface", "self-hosted"
    model_id: str = Field(max_length=255)  # e.g., "gpt-4", "claude-3-opus"
    capabilities: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    pricing_per_1k_tokens: float = Field(default=0.0)
    max_tokens: int = Field(default=4096)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class InferenceModelCreate(SQLModel):
    name: str = Field(max_length=255)
    provider: str = Field(max_length=100)
    model_id: str = Field(max_length=255)
    capabilities: list[str] = Field(default_factory=list)
    pricing_per_1k_tokens: float = Field(default=0.0)
    max_tokens: int = Field(default=4096)
    is_active: bool = Field(default=True)


class InferenceModelPublic(SQLModel):
    id: uuid.UUID
    name: str
    provider: str
    model_id: str
    capabilities: list[str]
    pricing_per_1k_tokens: float
    max_tokens: int
    is_active: bool


class InferenceModelsPublic(SQLModel):
    data: list[InferenceModelPublic]
    count: int


# Model usage tracking
class ModelUsage(SQLModel, table=True):
    """Tracks inference API usage"""
    __tablename__ = "model_usage"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    model_id: uuid.UUID = Field(foreign_key="inference_model.id", nullable=False)
    prompt_tokens: int = Field(default=0)
    completion_tokens: int = Field(default=0)
    total_tokens: int = Field(default=0)
    cost: float = Field(default=0.0)
    latency_ms: int = Field(default=0)
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: Optional[User] = Relationship()
    model: Optional[InferenceModel] = Relationship()


class ModelUsagePublic(SQLModel):
    id: uuid.UUID
    user_id: uuid.UUID
    model_id: uuid.UUID
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    cost: float
    latency_ms: int
    timestamp: datetime


# Inference API request/response models
class InferenceRequest(SQLModel):
    model_id: uuid.UUID
    prompt: str
    max_tokens: Optional[int] = Field(default=None)
    temperature: Optional[float] = Field(default=0.7, ge=0.0, le=2.0)
    stream: bool = Field(default=False)


class InferenceResponse(SQLModel):
    id: str
    model_id: uuid.UUID
    completion: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    cost: float
    latency_ms: int


# ============================================================================
# OBJECT STORAGE MODELS
# ============================================================================

# Storage bucket (S3-like)
class StorageBucket(SQLModel, table=True):
    """S3-compatible object storage buckets"""
    __tablename__ = "storage_bucket"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    bucket_name: str = Field(max_length=255, unique=True, index=True)
    region: str = Field(default="us-east-1", max_length=50)
    storage_class: str = Field(default="standard", max_length=50)  # standard, glacier, intelligent
    status: str = Field(default="active", max_length=50)  # active, archived, deleted
    storage_backend: str = Field(default="minio", max_length=50)  # "minio" or "aws-s3"
    # MinIO/S3 credentials
    access_key: Optional[str] = Field(default=None, max_length=255)
    secret_key_encrypted: Optional[str] = Field(default=None)
    endpoint_url: Optional[str] = Field(default=None, max_length=512)
    # Usage and pricing
    storage_gb_used: float = Field(default=0.0)
    object_count: int = Field(default=0)
    monthly_rate_per_gb: float = Field(default=0.023)  # $0.023/GB like S3
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: Optional[User] = Relationship()


class StorageBucketCreate(SQLModel):
    bucket_name: str = Field(max_length=255, min_length=3)
    region: str = Field(default="us-east-1", max_length=50)
    storage_class: str = Field(default="standard", max_length=50)
    storage_backend: str = Field(default="minio", max_length=50)


class StorageBucketUpdate(SQLModel):
    bucket_name: Optional[str] = Field(default=None, max_length=255)
    storage_class: Optional[str] = Field(default=None, max_length=50)
    status: Optional[str] = Field(default=None, max_length=50)


class StorageBucketPublic(SQLModel):
    id: uuid.UUID
    user_id: uuid.UUID
    bucket_name: str
    region: str
    storage_class: str
    status: str
    storage_backend: str
    endpoint_url: Optional[str]
    storage_gb_used: float
    object_count: int
    monthly_rate_per_gb: float
    created_at: datetime


class StorageBucketsPublic(SQLModel):
    data: list[StorageBucketPublic]
    count: int


# Storage object metadata
class StorageObject(SQLModel, table=True):
    """Metadata for stored objects"""
    __tablename__ = "storage_object"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    bucket_id: uuid.UUID = Field(foreign_key="storage_bucket.id", nullable=False)
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    object_key: str = Field(max_length=1024)  # S3 key path
    size_bytes: int = Field(default=0)
    content_type: Optional[str] = Field(default=None, max_length=255)
    etag: Optional[str] = Field(default=None, max_length=255)
    storage_class: str = Field(default="standard", max_length=50)
    is_deleted: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_modified: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: Optional[User] = Relationship()


class StorageObjectPublic(SQLModel):
    id: uuid.UUID
    bucket_id: uuid.UUID
    object_key: str
    size_bytes: int
    content_type: Optional[str]
    etag: Optional[str]
    storage_class: str
    created_at: datetime
    last_modified: datetime


class StorageObjectsPublic(SQLModel):
    data: list[StorageObjectPublic]
    count: int


# Upload request/response models
class PresignedUploadRequest(SQLModel):
    bucket_id: uuid.UUID
    object_key: str
    content_type: Optional[str] = Field(default=None)
    expires_in: int = Field(default=3600, ge=1, le=604800)  # 1 second to 7 days


class PresignedUploadResponse(SQLModel):
    presigned_url: str
    expires_in: int
    object_key: str
    bucket_name: str


class PresignedDownloadRequest(SQLModel):
    bucket_id: uuid.UUID
    object_key: str
    expires_in: int = Field(default=3600, ge=1, le=604800)


class PresignedDownloadResponse(SQLModel):
    presigned_url: str
    expires_in: int
    object_key: str
    size_bytes: int