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
from app.api.deps import get_current_user, get_current_active_superuser, SessionDep
from app.services.usage_reporter import report_pending_usage
from app.services.stripe_utils import ensure_stripe_customer

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
        resolved = ensure_stripe_customer(current_user, session)
        session.commit()
        if not resolved:
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


@router.post("/setup-products")
async def setup_stripe_products(
    current_user: Annotated[User, Depends(get_current_active_superuser)],
) -> dict:
    """
    Create Stripe Products + metered Prices for infrastructure billing.
    Superuser only. Run once to bootstrap Stripe, then put the price IDs in .env.
    """
    products = []

    # 1. Server Hours
    server_product = stripe.Product.create(
        name="Server Hours",
        description="Metered billing for remote server compute hours",
        metadata={"resource_type": "server"},
    )
    server_price = stripe.Price.create(
        product=server_product.id,
        currency="usd",
        recurring={
            "interval": "month",
            "usage_type": "metered",
            "aggregate_usage": "sum",
        },
        unit_amount=10,  # $0.10 per hour
        billing_scheme="per_unit",
    )
    products.append({
        "name": "Server Hours",
        "product_id": server_product.id,
        "price_id": server_price.id,
        "env_key": "STRIPE_SERVER_HOURS_PRICE_ID",
    })

    # 2. Database Storage (GB-months)
    db_product = stripe.Product.create(
        name="Database Storage",
        description="Metered billing for managed database storage (GB-months)",
        metadata={"resource_type": "database"},
    )
    db_price = stripe.Price.create(
        product=db_product.id,
        currency="usd",
        recurring={
            "interval": "month",
            "usage_type": "metered",
            "aggregate_usage": "sum",
        },
        unit_amount=5,  # $0.05 per GB
        billing_scheme="per_unit",
    )
    products.append({
        "name": "Database Storage",
        "product_id": db_product.id,
        "price_id": db_price.id,
        "env_key": "STRIPE_DB_STORAGE_PRICE_ID",
    })

    # 3. API Tokens (per 1K tokens)
    api_product = stripe.Product.create(
        name="Inference API Tokens",
        description="Metered billing for LLM inference API usage (per 1K tokens)",
        metadata={"resource_type": "inference"},
    )
    api_price = stripe.Price.create(
        product=api_product.id,
        currency="usd",
        recurring={
            "interval": "month",
            "usage_type": "metered",
            "aggregate_usage": "sum",
        },
        unit_amount=1,  # $0.01 per 1K tokens
        billing_scheme="per_unit",
    )
    products.append({
        "name": "Inference API Tokens",
        "product_id": api_product.id,
        "price_id": api_price.id,
        "env_key": "STRIPE_API_TOKENS_PRICE_ID",
    })

    return {
        "message": "Products and metered prices created in Stripe",
        "products": products,
        "instructions": "Add these price IDs to your .env file",
    }


@router.post("/report-all")
async def report_all_usage(
    current_user: Annotated[User, Depends(get_current_active_superuser)],
) -> dict:
    """
    Admin endpoint to trigger batch usage reporting for ALL users.
    Reports all unreported UsageRecords to Stripe.
    """
    results = report_pending_usage()
    return results


@router.post("/subscribe")
async def subscribe_to_infrastructure(
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
) -> dict:
    """
    Create a Stripe subscription with the 3 metered price items.
    User can then create resources, billed at period end.
    """
    if not current_user.stripe_customer_id:
        resolved = ensure_stripe_customer(current_user, session)
        session.commit()
        if not resolved:
            raise HTTPException(
                status_code=400,
                detail="No Stripe customer ID. Complete account setup first.",
            )

    # Check for existing active subscription
    existing = stripe.Subscription.list(
        customer=current_user.stripe_customer_id,
        status="active",
        limit=1,
    )
    if existing.data:
        return {
            "message": "Already subscribed",
            "subscription_id": existing.data[0].id,
        }

    # Gather metered price IDs
    price_ids = [
        os.getenv("STRIPE_SERVER_HOURS_PRICE_ID"),
        os.getenv("STRIPE_DB_STORAGE_PRICE_ID"),
        os.getenv("STRIPE_API_TOKENS_PRICE_ID"),
    ]
    price_ids = [p for p in price_ids if p]

    if not price_ids:
        raise HTTPException(
            status_code=500,
            detail="Metered price IDs not configured. Admin must run /billing/setup-products first.",
        )

    items = [{"price": pid} for pid in price_ids]

    try:
        subscription = stripe.Subscription.create(
            customer=current_user.stripe_customer_id,
            items=items,
            payment_behavior="default_incomplete",
            expand=["latest_invoice.payment_intent"],
        )

        # Update user record
        current_user.has_subscription = True
        session.add(current_user)
        session.commit()

        return {
            "message": "Infrastructure subscription created",
            "subscription_id": subscription.id,
            "status": subscription.status,
            "client_secret": (
                subscription.latest_invoice.payment_intent.client_secret
                if subscription.latest_invoice
                and subscription.latest_invoice.payment_intent
                else None
            ),
        }
    except stripe.StripeError as e:
        logger.error(f"Failed to create subscription for user {current_user.id}: {e}")
        raise HTTPException(status_code=400, detail=str(e))
