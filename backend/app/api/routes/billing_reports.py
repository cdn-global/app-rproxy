"""
Billing and Usage Reports for LLM API
"""
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select, func, and_
from typing import Annotated, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from app.api.deps import get_current_user, get_current_active_superuser, SessionDep
from app.models import User, LLMUsageLog, LLMModel, LLMProvider

router = APIRouter(prefix="/billing", tags=["billing"])


class UserUsageSummary(BaseModel):
    user_id: str
    user_email: str
    total_requests: int
    total_input_tokens: int
    total_output_tokens: int
    total_tokens: int
    total_cost: float
    models_used: list[str]


class ModelUsageSummary(BaseModel):
    model_id: str
    model_name: str
    provider: str
    total_requests: int
    total_input_tokens: int
    total_output_tokens: int
    total_cost: float


class UsageReport(BaseModel):
    period_start: datetime
    period_end: datetime
    total_users: int
    total_requests: int
    total_tokens: int
    total_cost: float
    by_user: list[UserUsageSummary]
    by_model: list[ModelUsageSummary]


@router.get("/usage/my-usage", response_model=UserUsageSummary)
async def get_my_usage(
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
    days: int = Query(default=30, ge=1, le=365, description="Number of days to look back")
):
    """Get current user's LLM usage summary for billing"""
    since_date = datetime.utcnow() - timedelta(days=days)

    # Get usage logs for current user
    statement = select(LLMUsageLog).where(
        and_(
            LLMUsageLog.user_id == current_user.id,
            LLMUsageLog.created_at >= since_date
        )
    )
    logs = session.exec(statement).all()

    # Calculate summary
    total_requests = len(logs)
    total_input_tokens = sum(log.input_tokens for log in logs)
    total_output_tokens = sum(log.output_tokens for log in logs)
    total_cost = sum(log.total_cost for log in logs)

    # Get unique models used
    model_ids = set(log.model_id for log in logs)
    models_used = []
    for model_id in model_ids:
        model = session.get(LLMModel, model_id)
        if model:
            models_used.append(model.display_name)

    return UserUsageSummary(
        user_id=str(current_user.id),
        user_email=current_user.email,
        total_requests=total_requests,
        total_input_tokens=total_input_tokens,
        total_output_tokens=total_output_tokens,
        total_tokens=total_input_tokens + total_output_tokens,
        total_cost=total_cost,
        models_used=models_used
    )


@router.get("/usage/report", response_model=UsageReport)
async def get_usage_report(
    current_user: Annotated[User, Depends(get_current_active_superuser)],
    session: SessionDep,
    start_date: Optional[datetime] = Query(default=None, description="Start date (UTC)"),
    end_date: Optional[datetime] = Query(default=None, description="End date (UTC)"),
    days: int = Query(default=30, ge=1, le=365, description="Number of days to look back if dates not provided")
):
    """
    Get comprehensive usage report for all users (Admin only)
    Use this to generate invoices and billing reports
    """
    # Determine date range
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=days)

    # Get all usage logs in date range
    statement = select(LLMUsageLog).where(
        and_(
            LLMUsageLog.created_at >= start_date,
            LLMUsageLog.created_at <= end_date
        )
    )
    all_logs = session.exec(statement).all()

    # Overall statistics
    total_requests = len(all_logs)
    total_tokens = sum(log.input_tokens + log.output_tokens for log in all_logs)
    total_cost = sum(log.total_cost for log in all_logs)

    # Group by user
    user_usage = {}
    for log in all_logs:
        user_id = str(log.user_id)
        if user_id not in user_usage:
            user = session.get(User, log.user_id)
            user_usage[user_id] = {
                "user_id": user_id,
                "user_email": user.email if user else "Unknown",
                "requests": 0,
                "input_tokens": 0,
                "output_tokens": 0,
                "cost": 0.0,
                "models": set()
            }

        user_usage[user_id]["requests"] += 1
        user_usage[user_id]["input_tokens"] += log.input_tokens
        user_usage[user_id]["output_tokens"] += log.output_tokens
        user_usage[user_id]["cost"] += log.total_cost

        # Track models used
        model = session.get(LLMModel, log.model_id)
        if model:
            user_usage[user_id]["models"].add(model.display_name)

    # Convert to response format
    by_user = [
        UserUsageSummary(
            user_id=data["user_id"],
            user_email=data["user_email"],
            total_requests=data["requests"],
            total_input_tokens=data["input_tokens"],
            total_output_tokens=data["output_tokens"],
            total_tokens=data["input_tokens"] + data["output_tokens"],
            total_cost=data["cost"],
            models_used=list(data["models"])
        )
        for data in user_usage.values()
    ]

    # Group by model
    model_usage = {}
    for log in all_logs:
        model_id = str(log.model_id)
        if model_id not in model_usage:
            model = session.get(LLMModel, log.model_id)
            provider = session.get(LLMProvider, model.provider_id) if model else None

            model_usage[model_id] = {
                "model_id": model_id,
                "model_name": model.display_name if model else "Unknown",
                "provider": provider.name if provider else "Unknown",
                "requests": 0,
                "input_tokens": 0,
                "output_tokens": 0,
                "cost": 0.0
            }

        model_usage[model_id]["requests"] += 1
        model_usage[model_id]["input_tokens"] += log.input_tokens
        model_usage[model_id]["output_tokens"] += log.output_tokens
        model_usage[model_id]["cost"] += log.total_cost

    # Convert to response format
    by_model = [
        ModelUsageSummary(
            model_id=data["model_id"],
            model_name=data["model_name"],
            provider=data["provider"],
            total_requests=data["requests"],
            total_input_tokens=data["input_tokens"],
            total_output_tokens=data["output_tokens"],
            total_cost=data["cost"]
        )
        for data in model_usage.values()
    ]

    return UsageReport(
        period_start=start_date,
        period_end=end_date,
        total_users=len(user_usage),
        total_requests=total_requests,
        total_tokens=total_tokens,
        total_cost=total_cost,
        by_user=sorted(by_user, key=lambda x: x.total_cost, reverse=True),
        by_model=sorted(by_model, key=lambda x: x.total_cost, reverse=True)
    )


@router.get("/usage/export-csv")
async def export_usage_csv(
    current_user: Annotated[User, Depends(get_current_active_superuser)],
    session: SessionDep,
    start_date: Optional[datetime] = Query(default=None),
    end_date: Optional[datetime] = Query(default=None),
    days: int = Query(default=30, ge=1, le=365)
):
    """Export usage data as CSV for billing/accounting systems"""
    from fastapi.responses import StreamingResponse
    import io
    import csv

    # Determine date range
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=days)

    # Get all usage logs
    statement = select(LLMUsageLog, User, LLMModel, LLMProvider).join(
        User, LLMUsageLog.user_id == User.id
    ).join(
        LLMModel, LLMUsageLog.model_id == LLMModel.id
    ).join(
        LLMProvider, LLMModel.provider_id == LLMProvider.id
    ).where(
        and_(
            LLMUsageLog.created_at >= start_date,
            LLMUsageLog.created_at <= end_date
        )
    )

    results = session.exec(statement).all()

    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)

    # Write header
    writer.writerow([
        "Date",
        "User Email",
        "User ID",
        "Model Name",
        "Provider",
        "Input Tokens",
        "Output Tokens",
        "Total Tokens",
        "Cost (USD)",
        "Conversation ID"
    ])

    # Write data
    for log, user, model, provider in results:
        writer.writerow([
            log.created_at.isoformat(),
            user.email,
            str(log.user_id),
            model.display_name,
            provider.name,
            log.input_tokens,
            log.output_tokens,
            log.input_tokens + log.output_tokens,
            f"{log.total_cost:.6f}",
            str(log.conversation_id) if log.conversation_id else ""
        ])

    # Return as downloadable CSV
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=llm_usage_{start_date.date()}_{end_date.date()}.csv"
        }
    )
