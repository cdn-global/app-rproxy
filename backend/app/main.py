import logging
import uuid
from datetime import datetime

import sentry_sdk
from fastapi import FastAPI
from fastapi.routing import APIRoute
from starlette.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from app.api.main import api_router
from app.core.config import settings
from app.core.db import engine
from app.models import InferenceModel

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
# Set all CORS enabled origins
if settings.all_cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.all_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.on_event("startup")
def seed_inference_models():
    """Auto-seed default inference models if table is empty."""
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
            existing = session.exec(select(InferenceModel).limit(1)).first()
            if existing:
                return
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
