"""
Background usage reporter: queries unreported UsageRecords, groups by user+type,
reports to Stripe via SubscriptionItem.create_usage_record(), marks reported.
"""
from __future__ import annotations

import logging
import os
from datetime import datetime

import stripe
from sqlmodel import Session, select

from app.models import User, UsageRecord
from app.core.db import engine

logger = logging.getLogger(__name__)

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")


def report_pending_usage() -> dict:
    """
    Query all unreported UsageRecords, group by user + resource_type,
    report to Stripe, and mark as reported.

    Returns summary of what was reported.
    """
    price_id_mapping = {
        "server": os.getenv("STRIPE_SERVER_HOURS_PRICE_ID"),
        "database": os.getenv("STRIPE_DB_STORAGE_PRICE_ID"),
        "inference": os.getenv("STRIPE_API_TOKENS_PRICE_ID"),
    }

    results = {
        "total_records": 0,
        "reported_records": 0,
        "failed_records": 0,
        "users_processed": 0,
        "errors": [],
    }

    with Session(engine) as session:
        # Get all unreported usage
        statement = select(UsageRecord).where(
            UsageRecord.stripe_reported == False
        ).order_by(UsageRecord.user_id)

        records = session.exec(statement).all()
        results["total_records"] = len(records)

        if not records:
            logger.info("No unreported usage records found")
            return results

        # Group by user_id and resource_type
        grouped: dict[tuple, list[UsageRecord]] = {}
        for record in records:
            key = (str(record.user_id), record.resource_type)
            if key not in grouped:
                grouped[key] = []
            grouped[key].append(record)

        processed_users = set()

        for (user_id_str, resource_type), user_records in grouped.items():
            processed_users.add(user_id_str)

            # Get user's Stripe info
            user = session.get(User, user_id_str)
            if not user or not user.stripe_customer_id:
                logger.warning(f"User {user_id_str} has no Stripe customer ID, skipping")
                results["failed_records"] += len(user_records)
                continue

            price_id = price_id_mapping.get(resource_type)
            if not price_id:
                logger.warning(f"No price ID for resource type: {resource_type}")
                results["failed_records"] += len(user_records)
                continue

            # Sum quantities
            total_quantity = sum(r.quantity for r in user_records)

            try:
                # Find active subscription
                subscriptions = stripe.Subscription.list(
                    customer=user.stripe_customer_id,
                    status="active",
                    limit=1,
                )

                if not subscriptions.data:
                    logger.warning(f"No active subscription for user {user_id_str}")
                    results["failed_records"] += len(user_records)
                    continue

                subscription = subscriptions.data[0]

                # Find the subscription item for this price
                subscription_item = None
                for item in subscription["items"]["data"]:
                    if item["price"]["id"] == price_id:
                        subscription_item = item
                        break

                if not subscription_item:
                    logger.warning(
                        f"No subscription item for price {price_id} "
                        f"(user {user_id_str}, type {resource_type})"
                    )
                    results["failed_records"] += len(user_records)
                    continue

                # Report usage to Stripe
                usage_record = stripe.SubscriptionItem.create_usage_record(
                    subscription_item["id"],
                    quantity=int(total_quantity),
                    timestamp=int(datetime.utcnow().timestamp()),
                    action="increment",
                )

                logger.info(
                    f"Reported {total_quantity} units of {resource_type} "
                    f"for user {user_id_str} (stripe_usage_id={usage_record.id})"
                )

                # Mark records as reported
                for record in user_records:
                    record.stripe_reported = True
                    record.stripe_usage_record_id = usage_record.id
                    session.add(record)

                results["reported_records"] += len(user_records)

            except stripe.StripeError as e:
                logger.error(
                    f"Stripe error reporting {resource_type} for user {user_id_str}: {e}"
                )
                results["failed_records"] += len(user_records)
                results["errors"].append(str(e))
            except Exception as e:
                logger.error(
                    f"Error reporting {resource_type} for user {user_id_str}: {e}"
                )
                results["failed_records"] += len(user_records)
                results["errors"].append(str(e))

        session.commit()
        results["users_processed"] = len(processed_users)

    return results
