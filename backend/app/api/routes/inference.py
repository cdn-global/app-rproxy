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
from app.api.deps import get_current_user, SessionDep

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
    # Guard: require active infrastructure subscription
    if not current_user.has_subscription:
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
