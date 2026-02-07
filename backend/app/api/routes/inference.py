"""
Routes for AI model inference with usage tracking
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import Annotated
import logging
import uuid
import time
from datetime import datetime
import httpx
import os
from app.models import (
    User, InferenceModel, ModelUsage, UsageRecord,
    InferenceRequest, InferenceResponse, InferenceModelPublic, InferenceModelsPublic
)
from app.api.deps import get_current_user, get_current_active_superuser, SessionDep
from app.models import InferenceModelCreate

logger = logging.getLogger(__name__)

router = APIRouter(tags=["inference"])


def record_model_usage(
    session: Session,
    user_id: uuid.UUID,
    model_id: uuid.UUID,
    prompt_tokens: int,
    completion_tokens: int,
    total_tokens: int,
    cost: float,
    latency_ms: int
):
    """Helper function to record model usage"""
    # Record detailed model usage
    usage = ModelUsage(
        id=uuid.uuid4(),
        user_id=user_id,
        model_id=model_id,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=total_tokens,
        cost=cost,
        latency_ms=latency_ms,
        timestamp=datetime.utcnow()
    )
    session.add(usage)

    # Record for Stripe billing (convert tokens to 1K units)
    usage_record = UsageRecord(
        user_id=user_id,
        resource_type="inference",
        resource_id=model_id,
        quantity=total_tokens / 1000.0,  # Bill per 1K tokens
        stripe_reported=False,
        timestamp=datetime.utcnow()
    )
    session.add(usage_record)
    session.commit()


@router.get("/models", response_model=InferenceModelsPublic)
async def list_models(
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
    skip: int = 0,
    limit: int = 100
) -> InferenceModelsPublic:
    """List all available inference models"""
    statement = select(InferenceModel).where(
        InferenceModel.is_active == True
    ).offset(skip).limit(limit)

    models = session.exec(statement).all()
    count = len(models)

    return InferenceModelsPublic(data=list(models), count=count)


@router.post("/models/seed")
async def seed_models(
    current_user: Annotated[User, Depends(get_current_active_superuser)],
    session: SessionDep,
) -> dict:
    """Seed default inference models. Superuser only. Idempotent."""
    default_models = [
        # OpenAI Models
        {"name": "GPT-4o", "provider": "openai", "model_id": "gpt-4o", "capabilities": ["chat", "code", "vision"], "pricing_per_1k_tokens": 0.005, "max_tokens": 128000},
        {"name": "GPT-4o Mini", "provider": "openai", "model_id": "gpt-4o-mini", "capabilities": ["chat", "code", "vision"], "pricing_per_1k_tokens": 0.00015, "max_tokens": 128000},
        {"name": "GPT-4 Turbo", "provider": "openai", "model_id": "gpt-4-turbo", "capabilities": ["chat", "code", "vision"], "pricing_per_1k_tokens": 0.01, "max_tokens": 128000},
        {"name": "GPT-4", "provider": "openai", "model_id": "gpt-4", "capabilities": ["chat", "code"], "pricing_per_1k_tokens": 0.03, "max_tokens": 8192},
        {"name": "GPT-3.5 Turbo", "provider": "openai", "model_id": "gpt-3.5-turbo", "capabilities": ["chat", "code"], "pricing_per_1k_tokens": 0.0005, "max_tokens": 16385},
        {"name": "o1", "provider": "openai", "model_id": "o1", "capabilities": ["reasoning", "math", "code"], "pricing_per_1k_tokens": 0.015, "max_tokens": 200000},
        {"name": "o1-mini", "provider": "openai", "model_id": "o1-mini", "capabilities": ["reasoning", "math", "code"], "pricing_per_1k_tokens": 0.003, "max_tokens": 128000},
        {"name": "o3-mini", "provider": "openai", "model_id": "o3-mini", "capabilities": ["reasoning", "math", "code"], "pricing_per_1k_tokens": 0.0011, "max_tokens": 200000},

        # Anthropic Models
        {"name": "Claude Opus 4.6", "provider": "anthropic", "model_id": "claude-opus-4-6", "capabilities": ["chat", "code", "vision", "analysis", "reasoning"], "pricing_per_1k_tokens": 0.015, "max_tokens": 200000},
        {"name": "Claude Sonnet 4.5", "provider": "anthropic", "model_id": "claude-sonnet-4-5-20250929", "capabilities": ["chat", "code", "vision", "analysis"], "pricing_per_1k_tokens": 0.003, "max_tokens": 200000},
        {"name": "Claude Haiku 4.5", "provider": "anthropic", "model_id": "claude-haiku-4-5-20251001", "capabilities": ["chat", "code"], "pricing_per_1k_tokens": 0.0008, "max_tokens": 200000},
        {"name": "Claude 3.5 Sonnet", "provider": "anthropic", "model_id": "claude-3-5-sonnet-20241022", "capabilities": ["chat", "code", "vision", "analysis"], "pricing_per_1k_tokens": 0.003, "max_tokens": 200000},
        {"name": "Claude 3 Opus", "provider": "anthropic", "model_id": "claude-3-opus-20240229", "capabilities": ["chat", "code", "vision", "analysis"], "pricing_per_1k_tokens": 0.015, "max_tokens": 200000},
        {"name": "Claude 3 Haiku", "provider": "anthropic", "model_id": "claude-3-haiku-20240307", "capabilities": ["chat", "code", "vision"], "pricing_per_1k_tokens": 0.00025, "max_tokens": 200000},

        # HuggingFace Models (Open Source)
        {"name": "Llama 3.3 70B", "provider": "huggingface", "model_id": "meta-llama/Llama-3.3-70B-Instruct", "capabilities": ["chat", "code"], "pricing_per_1k_tokens": 0.0009, "max_tokens": 131072},
        {"name": "Llama 3.1 8B", "provider": "huggingface", "model_id": "meta-llama/Llama-3.1-8B-Instruct", "capabilities": ["chat", "code"], "pricing_per_1k_tokens": 0.0001, "max_tokens": 131072},
        {"name": "Llama 3.1 405B", "provider": "huggingface", "model_id": "meta-llama/Llama-3.1-405B-Instruct", "capabilities": ["chat", "code", "reasoning"], "pricing_per_1k_tokens": 0.005, "max_tokens": 131072},
        {"name": "Qwen 2.5 72B", "provider": "huggingface", "model_id": "Qwen/Qwen2.5-72B-Instruct", "capabilities": ["chat", "code", "math"], "pricing_per_1k_tokens": 0.0009, "max_tokens": 131072},
        {"name": "Qwen 2.5 Coder 32B", "provider": "huggingface", "model_id": "Qwen/Qwen2.5-Coder-32B-Instruct", "capabilities": ["code"], "pricing_per_1k_tokens": 0.0004, "max_tokens": 131072},
        {"name": "Mistral 7B", "provider": "huggingface", "model_id": "mistralai/Mistral-7B-Instruct-v0.3", "capabilities": ["chat", "code"], "pricing_per_1k_tokens": 0.0001, "max_tokens": 32768},
        {"name": "Mixtral 8x7B", "provider": "huggingface", "model_id": "mistralai/Mixtral-8x7B-Instruct-v0.1", "capabilities": ["chat", "code"], "pricing_per_1k_tokens": 0.0007, "max_tokens": 32768},
        {"name": "Mixtral 8x22B", "provider": "huggingface", "model_id": "mistralai/Mixtral-8x22B-Instruct-v0.1", "capabilities": ["chat", "code", "reasoning"], "pricing_per_1k_tokens": 0.0012, "max_tokens": 65536},
        {"name": "DeepSeek V3", "provider": "huggingface", "model_id": "deepseek-ai/DeepSeek-V3", "capabilities": ["chat", "code", "math"], "pricing_per_1k_tokens": 0.0014, "max_tokens": 128000},
        {"name": "Gemma 2 27B", "provider": "huggingface", "model_id": "google/gemma-2-27b-it", "capabilities": ["chat", "code"], "pricing_per_1k_tokens": 0.0003, "max_tokens": 8192},
    ]

    created = 0
    skipped = 0
    for m in default_models:
        existing = session.exec(
            select(InferenceModel).where(InferenceModel.model_id == m["model_id"])
        ).first()
        if existing:
            skipped += 1
            continue
        model = InferenceModel(
            id=uuid.uuid4(),
            name=m["name"],
            provider=m["provider"],
            model_id=m["model_id"],
            capabilities=m["capabilities"],
            pricing_per_1k_tokens=m["pricing_per_1k_tokens"],
            max_tokens=m["max_tokens"],
            is_active=True,
            created_at=datetime.utcnow(),
        )
        session.add(model)
        created += 1

    session.commit()
    return {"created": created, "skipped": skipped}


@router.get("/models/{model_id}", response_model=InferenceModelPublic)
async def get_model(
    model_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep
) -> InferenceModel:
    """Get details of a specific model"""
    statement = select(InferenceModel).where(InferenceModel.id == model_id)
    model = session.exec(statement).first()

    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    return model


@router.post("/infer", response_model=InferenceResponse)
async def run_inference(
    request: InferenceRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep
) -> InferenceResponse:
    """
    Run inference on a model and track usage

    This is a proxy endpoint that routes requests to the appropriate model provider
    """
    # Guard: require active infrastructure subscription (superusers bypass)
    if not current_user.has_subscription and not current_user.is_superuser:
        raise HTTPException(
            status_code=402,
            detail="Active infrastructure subscription required. Subscribe at /billing/subscribe first."
        )

    # Get model details
    statement = select(InferenceModel).where(InferenceModel.id == request.model_id)
    model = session.exec(statement).first()

    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    if not model.is_active:
        raise HTTPException(status_code=400, detail="Model is not active")

    # Start timing
    start_time = time.time()

    try:
        # Route to appropriate provider
        if model.provider == "openai":
            result = await _call_openai(model, request)
        elif model.provider == "anthropic":
            result = await _call_anthropic(model, request)
        elif model.provider == "huggingface":
            result = await _call_huggingface(model, request)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported provider: {model.provider}")

        # Calculate latency
        latency_ms = int((time.time() - start_time) * 1000)

        # Calculate cost
        cost = (result["prompt_tokens"] * model.pricing_per_1k_tokens / 1000.0) + \
               (result["completion_tokens"] * model.pricing_per_1k_tokens / 1000.0)

        # Record usage
        record_model_usage(
            session=session,
            user_id=current_user.id,
            model_id=model.id,
            prompt_tokens=result["prompt_tokens"],
            completion_tokens=result["completion_tokens"],
            total_tokens=result["total_tokens"],
            cost=cost,
            latency_ms=latency_ms
        )

        return InferenceResponse(
            id=str(uuid.uuid4()),
            model_id=model.id,
            completion=result["completion"],
            prompt_tokens=result["prompt_tokens"],
            completion_tokens=result["completion_tokens"],
            total_tokens=result["total_tokens"],
            cost=cost,
            latency_ms=latency_ms
        )

    except Exception as e:
        logger.error(f"Inference failed for model {model.id}: {e}")
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")


async def _call_openai(model: InferenceModel, request: InferenceRequest) -> dict:
    """Call OpenAI API"""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise Exception("OpenAI API key not configured")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": model.model_id,
                "messages": [{"role": "user", "content": request.prompt}],
                "max_tokens": request.max_tokens or model.max_tokens,
                "temperature": request.temperature,
                "stream": False
            },
            timeout=60.0
        )

        if response.status_code != 200:
            raise Exception(f"OpenAI API error: {response.text}")

        data = response.json()
        usage = data.get("usage", {})

        return {
            "completion": data["choices"][0]["message"]["content"],
            "prompt_tokens": usage.get("prompt_tokens", 0),
            "completion_tokens": usage.get("completion_tokens", 0),
            "total_tokens": usage.get("total_tokens", 0)
        }


async def _call_anthropic(model: InferenceModel, request: InferenceRequest) -> dict:
    """Call Anthropic API"""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise Exception("Anthropic API key not configured")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json"
            },
            json={
                "model": model.model_id,
                "messages": [{"role": "user", "content": request.prompt}],
                "max_tokens": request.max_tokens or model.max_tokens,
                "temperature": request.temperature
            },
            timeout=60.0
        )

        if response.status_code != 200:
            raise Exception(f"Anthropic API error: {response.text}")

        data = response.json()
        usage = data.get("usage", {})

        return {
            "completion": data["content"][0]["text"],
            "prompt_tokens": usage.get("input_tokens", 0),
            "completion_tokens": usage.get("output_tokens", 0),
            "total_tokens": usage.get("input_tokens", 0) + usage.get("output_tokens", 0)
        }


async def _call_huggingface(model: InferenceModel, request: InferenceRequest) -> dict:
    """Call HuggingFace API"""
    api_key = os.getenv("HUGGINGFACE_API_KEY")
    if not api_key:
        raise Exception("HuggingFace API key not configured")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://api-inference.huggingface.co/models/{model.model_id}",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "inputs": request.prompt,
                "parameters": {
                    "max_new_tokens": request.max_tokens or model.max_tokens,
                    "temperature": request.temperature
                }
            },
            timeout=60.0
        )

        if response.status_code != 200:
            raise Exception(f"HuggingFace API error: {response.text}")

        data = response.json()

        # HuggingFace doesn't return token counts, so estimate
        prompt_tokens = len(request.prompt.split()) * 1.3  # Rough estimate
        completion = data[0].get("generated_text", "") if isinstance(data, list) else data.get("generated_text", "")
        completion_tokens = len(completion.split()) * 1.3

        return {
            "completion": completion,
            "prompt_tokens": int(prompt_tokens),
            "completion_tokens": int(completion_tokens),
            "total_tokens": int(prompt_tokens + completion_tokens)
        }


@router.get("/usage/summary")
async def get_inference_usage_summary(
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
    days: int = 30
) -> dict:
    """Get inference usage summary for the current user"""
    from datetime import timedelta

    since_date = datetime.utcnow() - timedelta(days=days)

    statement = select(ModelUsage).where(
        ModelUsage.user_id == current_user.id,
        ModelUsage.timestamp >= since_date
    )

    usage_records = session.exec(statement).all()

    total_tokens = sum(r.total_tokens for r in usage_records)
    total_cost = sum(r.cost for r in usage_records)
    avg_latency = sum(r.latency_ms for r in usage_records) / len(usage_records) if usage_records else 0

    # Group by model
    by_model = {}
    for record in usage_records:
        model_id = str(record.model_id)
        if model_id not in by_model:
            by_model[model_id] = {
                "tokens": 0,
                "cost": 0,
                "requests": 0
            }
        by_model[model_id]["tokens"] += record.total_tokens
        by_model[model_id]["cost"] += record.cost
        by_model[model_id]["requests"] += 1

    return {
        "period_days": days,
        "total_tokens": total_tokens,
        "total_cost": total_cost,
        "avg_latency_ms": avg_latency,
        "total_requests": len(usage_records),
        "by_model": by_model
    }
