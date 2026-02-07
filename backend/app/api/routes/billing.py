"""
Billing routes for metered usage reporting to Stripe
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import Annotated
import stripe
import os
import logging
from datetime import datetime, timedelta
from app.models import User, UsageRecord, UsageRecordPublic
from app.api.deps import get_current_user, SessionDep

logger = logging.getLogger(__name__)

# Configure Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
stripe.api_version = "2023-10-16"

router = APIRouter(tags=["billing"])


@router.post("/usage/report")
async def report_usage_to_stripe(
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep
) -> dict:
    """
    Report unreported usage records to Stripe for metered billing

    This endpoint batches all unreported usage and sends it to Stripe.
    Should be called periodically (hourly/daily) by a background job.
    """
    if not current_user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="User does not have a Stripe customer ID")

    # Get user's subscription
    try:
        subscriptions = stripe.Subscription.list(
            customer=current_user.stripe_customer_id,
            status="active",
            limit=1
        )

        if not subscriptions.data:
            raise HTTPException(status_code=400, detail="No active subscription found")

        subscription = subscriptions.data[0]

    except stripe.StripeError as e:
        logger.error(f"Failed to get subscription for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get subscription")

    # Get unreported usage records for this user
    statement = select(UsageRecord).where(
        UsageRecord.user_id == current_user.id,
        UsageRecord.stripe_reported == False
    )
    usage_records = session.exec(statement).all()

    if not usage_records:
        return {"message": "No usage to report", "records_reported": 0}

    # Group usage by resource type
    usage_by_type = {}
    for record in usage_records:
        if record.resource_type not in usage_by_type:
            usage_by_type[record.resource_type] = 0
        usage_by_type[record.resource_type] += record.quantity

    # Map resource types to Stripe metered price IDs
    # These should be configured in your Stripe dashboard
    price_id_mapping = {
        "server": os.getenv("STRIPE_SERVER_HOURS_PRICE_ID"),
        "database": os.getenv("STRIPE_DB_STORAGE_PRICE_ID"),
        "inference": os.getenv("STRIPE_API_TOKENS_PRICE_ID")
    }

    reported_count = 0

    # Report usage to Stripe for each resource type
    for resource_type, quantity in usage_by_type.items():
        price_id = price_id_mapping.get(resource_type)

        if not price_id:
            logger.warning(f"No price ID configured for resource type: {resource_type}")
            continue

        # Find the subscription item for this price
        subscription_item = None
        for item in subscription['items']['data']:
            if item['price']['id'] == price_id:
                subscription_item = item
                break

        if not subscription_item:
            logger.warning(f"Subscription item not found for price {price_id}")
            continue

        try:
            # Report usage to Stripe
            usage_record = stripe.SubscriptionItem.create_usage_record(
                subscription_item['id'],
                quantity=int(quantity),
                timestamp=int(datetime.utcnow().timestamp()),
                action='increment'
            )

            logger.info(f"Reported {quantity} units of {resource_type} usage to Stripe for user {current_user.id}")
            reported_count += 1

        except stripe.StripeError as e:
            logger.error(f"Failed to report {resource_type} usage to Stripe: {e}")
            continue

    # Mark all usage records as reported
    for record in usage_records:
        record.stripe_reported = True
        session.add(record)

    session.commit()

    return {
        "message": "Usage reported successfully",
        "records_reported": len(usage_records),
        "resource_types": list(usage_by_type.keys())
    }


@router.get("/usage/unreported", response_model=list[UsageRecordPublic])
async def get_unreported_usage(
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep
) -> list[UsageRecord]:
    """Get all unreported usage records for the current user"""
    statement = select(UsageRecord).where(
        UsageRecord.user_id == current_user.id,
        UsageRecord.stripe_reported == False
    ).order_by(UsageRecord.timestamp.desc())

    usage_records = session.exec(statement).all()
    return list(usage_records)


@router.get("/usage/history", response_model=list[UsageRecordPublic])
async def get_usage_history(
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
    days: int = 30
) -> list[UsageRecord]:
    """Get usage history for the current user"""
    since_date = datetime.utcnow() - timedelta(days=days)

    statement = select(UsageRecord).where(
        UsageRecord.user_id == current_user.id,
        UsageRecord.timestamp >= since_date
    ).order_by(UsageRecord.timestamp.desc())

    usage_records = session.exec(statement).all()
    return list(usage_records)


@router.get("/usage/summary")
async def get_usage_summary(
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
    days: int = 30
) -> dict:
    """Get usage summary grouped by resource type"""
    since_date = datetime.utcnow() - timedelta(days=days)

    statement = select(UsageRecord).where(
        UsageRecord.user_id == current_user.id,
        UsageRecord.timestamp >= since_date
    )

    usage_records = session.exec(statement).all()

    # Group by resource type
    summary = {}
    for record in usage_records:
        if record.resource_type not in summary:
            summary[record.resource_type] = {
                "total_quantity": 0,
                "reported_quantity": 0,
                "unreported_quantity": 0,
                "record_count": 0
            }

        summary[record.resource_type]["total_quantity"] += record.quantity
        summary[record.resource_type]["record_count"] += 1

        if record.stripe_reported:
            summary[record.resource_type]["reported_quantity"] += record.quantity
        else:
            summary[record.resource_type]["unreported_quantity"] += record.quantity

    return {
        "period_days": days,
        "summary": summary
    }
