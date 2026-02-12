import logging
import os
import uuid
from datetime import datetime

import sentry_sdk
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute
from starlette.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from app.api.main import api_router
from app.core.config import settings
from app.core.db import engine
from app.models import InferenceModel, RemoteServer, DatabaseInstance, User

logger = logging.getLogger(__name__)


def custom_generate_unique_id(route: APIRoute) -> str:
    return f"{route.tags[0]}-{route.name}"


if settings.SENTRY_DSN and settings.ENVIRONMENT != "local":
    sentry_sdk.init(dsn=str(settings.SENTRY_DSN), enable_tracing=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    generate_unique_id_function=custom_generate_unique_id,
)


# Global exception handler to ensure JSON body is always returned (prevents
# empty-body responses that cause JSON.parse failures on the frontend).
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


# Set all CORS enabled origins
if settings.ENVIRONMENT == "local":
    # Allow all origins in development
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
elif settings.all_cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.all_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.on_event("startup")
def ensure_tables_and_seed():
    """Create missing tables and seed default data on startup."""
    from sqlmodel import SQLModel, text

    # Step 1: Drop orphaned PostgreSQL types that block CREATE TABLE
    try:
        with engine.connect() as conn:
            for tname in [
                "remote_server", "inference_model", "database_instance",
                "usage_record", "provisioning_job", "model_usage",
            ]:
                conn.execute(text(
                    f"DO $$ BEGIN "
                    f"IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='{tname}') "
                    f"AND EXISTS (SELECT 1 FROM pg_type WHERE typname='{tname}') "
                    f"THEN EXECUTE 'DROP TYPE {tname} CASCADE'; END IF; END $$;"
                ))
            conn.commit()
    except Exception as e:
        logger.warning(f"Type cleanup: {e}")

    # Step 2: Create all missing tables
    try:
        SQLModel.metadata.create_all(engine)
        logger.info("Ensured all tables exist")
    except Exception as e:
        logger.error(f"Failed to create tables: {e}")
        return

    # Step 2.5: Fix nik's stale Stripe customer ID
    try:
        import stripe as _stripe
        _stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
        with Session(engine) as session:
            nik = session.exec(
                select(User).where(User.email == "nik@iconluxurygroup.com")
            ).first()
            if nik and nik.stripe_customer_id:
                try:
                    _stripe.Customer.retrieve(nik.stripe_customer_id)
                except Exception:
                    logger.info(f"Stale Stripe ID {nik.stripe_customer_id} for nik, creating new one")
                    customer = _stripe.Customer.create(
                        email=nik.email,
                        name=nik.full_name or "Nik",
                        metadata={"user_id": str(nik.id)},
                    )
                    nik.stripe_customer_id = customer.id
                    nik.has_subscription = True
                    session.add(nik)
                    session.commit()
                    logger.info(f"Created new Stripe customer {customer.id} for nik")
            elif nik and not nik.stripe_customer_id:
                customer = _stripe.Customer.create(
                    email=nik.email,
                    name=nik.full_name or "Nik",
                    metadata={"user_id": str(nik.id)},
                )
                nik.stripe_customer_id = customer.id
                nik.has_subscription = True
                session.add(nik)
                session.commit()
                logger.info(f"Created Stripe customer {customer.id} for nik")
    except Exception as e:
        logger.error(f"Failed to fix Stripe ID: {e}")

    # Step 3: Seed inference models
    default_models = [
        {"name": "GPT-4o", "provider": "openai", "model_id": "gpt-4o", "capabilities": ["chat", "code", "vision"], "pricing_per_1k_tokens": 0.005, "max_tokens": 128000},
        {"name": "GPT-4o Mini", "provider": "openai", "model_id": "gpt-4o-mini", "capabilities": ["chat", "code"], "pricing_per_1k_tokens": 0.00015, "max_tokens": 128000},
        {"name": "Claude Sonnet 4.5", "provider": "anthropic", "model_id": "claude-sonnet-4-5-20250929", "capabilities": ["chat", "code", "vision", "analysis"], "pricing_per_1k_tokens": 0.003, "max_tokens": 200000},
        {"name": "Claude Opus 4.6", "provider": "anthropic", "model_id": "claude-opus-4-6", "capabilities": ["chat", "code", "vision", "analysis", "reasoning"], "pricing_per_1k_tokens": 0.015, "max_tokens": 200000},
        {"name": "Claude Haiku 4.5", "provider": "anthropic", "model_id": "claude-haiku-4-5-20251001", "capabilities": ["chat", "code"], "pricing_per_1k_tokens": 0.0008, "max_tokens": 200000},
        {"name": "Llama 3.3 70B", "provider": "huggingface", "model_id": "meta-llama/Llama-3.3-70B-Instruct", "capabilities": ["chat", "code"], "pricing_per_1k_tokens": 0.0009, "max_tokens": 131072},
        {"name": "Qwen 2.5 72B", "provider": "huggingface", "model_id": "Qwen/Qwen2.5-72B-Instruct", "capabilities": ["chat", "code", "math"], "pricing_per_1k_tokens": 0.0009, "max_tokens": 131072},
    ]
    try:
        with Session(engine) as session:
            if not session.exec(select(InferenceModel).limit(1)).first():
                for m in default_models:
                    session.add(InferenceModel(
                        id=uuid.uuid4(), name=m["name"], provider=m["provider"],
                        model_id=m["model_id"], capabilities=m["capabilities"],
                        pricing_per_1k_tokens=m["pricing_per_1k_tokens"],
                        max_tokens=m["max_tokens"], is_active=True,
                        created_at=datetime.utcnow(),
                    ))
                session.commit()
                logger.info(f"Seeded {len(default_models)} inference models")
    except Exception as e:
        logger.error(f"Failed to seed inference models: {e}")

    # Step 4: Seed fleet servers
    fleet = [
        {"name": "web-use1-01", "cpu_cores": 1, "memory_gb": 2, "hourly_rate": 0.016, "created_at": "2025-07-01", "server_type": "ssh", "aws_region": "us-east-1"},
        {"name": "ml-use1-02", "cpu_cores": 16, "memory_gb": 64, "hourly_rate": 0.624, "created_at": "2025-09-01", "server_type": "gpu", "aws_region": "us-east-1"},
        {"name": "api-use1-03", "cpu_cores": 4, "memory_gb": 4, "hourly_rate": 0.056, "created_at": "2025-09-01", "server_type": "ssh", "aws_region": "us-east-1"},
        {"name": "app-use1-04", "cpu_cores": 4, "memory_gb": 16, "hourly_rate": 0.063, "created_at": "2025-12-01", "server_type": "ssh", "aws_region": "us-east-1"},
        {"name": "data-usw2-05", "cpu_cores": 8, "memory_gb": 4, "hourly_rate": 0.060, "created_at": "2025-09-01", "server_type": "ssh", "aws_region": "us-west-2"},
        {"name": "edge-euw1-06", "cpu_cores": 2, "memory_gb": 8, "hourly_rate": 0.056, "created_at": "2025-09-01", "server_type": "ssh", "aws_region": "eu-west-1"},
    ]
    try:
        with Session(engine) as session:
            owner = session.exec(
                select(User).where(User.email == "nik@iconluxurygroup.com").limit(1)
            ).first()
            if not owner:
                owner = session.exec(select(User).where(User.is_superuser == True).limit(1)).first()
            if not owner:
                logger.warning("No user found, skipping fleet seed")
                return

            # Check if already seeded with current names
            existing = session.exec(
                select(RemoteServer).where(
                    RemoteServer.user_id == owner.id,
                    RemoteServer.name == "web-use1-01",
                )
            ).first()
            if existing:
                logger.info(f"Fleet already seeded for {owner.email}")
                return
            # Delete old seeded servers (name pattern changed)
            old_servers = session.exec(
                select(RemoteServer).where(RemoteServer.user_id == owner.id)
            ).all()
            for s in old_servers:
                session.delete(s)
            if old_servers:
                session.commit()
                logger.info(f"Cleared {len(old_servers)} old fleet servers")

            for s in fleet:
                session.add(RemoteServer(
                    id=uuid.uuid4(), user_id=owner.id, name=s["name"],
                    server_type=s["server_type"], hosting_provider="aws",
                    cpu_cores=s["cpu_cores"], memory_gb=s["memory_gb"],
                    aws_region=s["aws_region"], status="running",
                    hourly_rate=s["hourly_rate"],
                    created_at=datetime.fromisoformat(s["created_at"]),
                ))
            session.commit()
            logger.info(f"Seeded {len(fleet)} fleet servers for {owner.email}")
    except Exception as e:
        logger.error(f"Failed to seed fleet servers: {e}")

    # Step 5: Seed database instances
    databases = [
        {"instance_name": "primary-use1", "postgres_version": "16", "storage_gb": 500, "cpu_cores": 4, "memory_gb": 16, "monthly_rate": 240.0, "storage_rate_per_gb": 0.10, "created_at": "2025-01-15"},
        {"instance_name": "replica-euw1", "postgres_version": "16", "storage_gb": 500, "cpu_cores": 2, "memory_gb": 8, "monthly_rate": 120.0, "storage_rate_per_gb": 0.10, "created_at": "2025-01-20"},
        {"instance_name": "analytics-usw2", "postgres_version": "15", "storage_gb": 1024, "cpu_cores": 8, "memory_gb": 32, "monthly_rate": 480.0, "storage_rate_per_gb": 0.08, "created_at": "2025-02-01"},
    ]
    try:
        with Session(engine) as session:
            owner = session.exec(
                select(User).where(User.email == "nik@iconluxurygroup.com").limit(1)
            ).first()
            if not owner:
                owner = session.exec(select(User).where(User.is_superuser == True).limit(1)).first()
            if not owner:
                return

            existing = session.exec(
                select(DatabaseInstance).where(DatabaseInstance.user_id == owner.id).limit(1)
            ).first()
            if existing:
                logger.info(f"Database instances already seeded for {owner.email}")
                return

            for d in databases:
                session.add(DatabaseInstance(
                    id=uuid.uuid4(), user_id=owner.id,
                    instance_name=d["instance_name"],
                    postgres_version=d["postgres_version"],
                    storage_gb=d["storage_gb"], cpu_cores=d["cpu_cores"],
                    memory_gb=d["memory_gb"], status="running",
                    connection_string_encrypted="seeded",
                    monthly_rate=d["monthly_rate"],
                    storage_rate_per_gb=d["storage_rate_per_gb"],
                    created_at=datetime.fromisoformat(d["created_at"]),
                ))
            session.commit()
            logger.info(f"Seeded {len(databases)} database instances for {owner.email}")
    except Exception as e:
        logger.error(f"Failed to seed database instances: {e}")
