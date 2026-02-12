from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session
from app.models import SubscriptionStatus, User
from typing import Annotated, List
from pydantic import BaseModel
import stripe
from stripe import StripeError
import os
import logging
from datetime import datetime
from app.api.deps import get_current_user, get_db, SessionDep
from app.services.stripe_utils import ensure_stripe_customer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load Stripe API key
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
stripe.api_version = "2023-10-16"  # Use stable version to avoid issues

router = APIRouter(tags=["subscription"])

# Pydantic model for customer response
class CustomerResponse(BaseModel):
    id: str
    email: str | None
    name: str | None
    created: int
    description: str | None

# Pydantic model for subscription response - UPDATED
class SubscriptionResponse(BaseModel):
    id: str
    status: str
    plan_id: str | None
    plan_name: str | None
    product_id: str | None
    product_name: str | None
    current_period_start: int | None
    current_period_end: int | None
    trial_start: int | None
    trial_end: int | None
    cancel_at_period_end: bool
    metadata: dict | None  # The original, full metadata dictionary from the Stripe Product
    enabled_features: List[str]  # A list of features/tags marked as "true" in metadata

# Pydantic model for proxy API access response
class ProxyApiAccessResponse(BaseModel):
    has_access: bool
    message: str | None

@router.get("/customer", response_model=CustomerResponse)
async def get_customer(
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
):
    """
    Fetch the Stripe customer details for the authenticated user.
    """
    logger.info(f"Fetching customer for user: {current_user.email}")

    if not stripe.api_key:
        logger.error("Stripe API key is not configured")
        raise HTTPException(status_code=500, detail="Server configuration error: Missing Stripe API key")

    if not current_user.stripe_customer_id:
        resolved = ensure_stripe_customer(current_user, session)
        session.commit()
        if not resolved:
            raise HTTPException(status_code=404, detail="No Stripe customer associated with this user")

    try:
        customer = stripe.Customer.retrieve(current_user.stripe_customer_id)
        logger.info(f"Retrieved customer: {current_user.stripe_customer_id}")

        return CustomerResponse(
            id=customer.id,
            email=customer.email,
            name=customer.name,
            created=customer.created,
            description=customer.description
        )

    except StripeError as e:
        logger.error(f"Stripe error for user {current_user.email}: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to fetch customer: {str(e)}")
    except Exception as e:
        logger.error(f"Internal server error for user {current_user.email}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# MODIFIED FUNCTION
@router.get("/customer/subscriptions", response_model=List[SubscriptionResponse])
async def get_customer_subscriptions(
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
):
    """
    Fetch all subscriptions for the authenticated user's Stripe customer.
    This includes tier details and a list of enabled features based on product metadata tags set to "true".
    """
    logger.info(f"Fetching subscriptions for user: {current_user.email}")

    if not stripe.api_key:
        logger.error("Stripe API key is not configured")
        raise HTTPException(status_code=500, detail="Server configuration error: Missing Stripe API key")

    if not current_user.stripe_customer_id:
        resolved = ensure_stripe_customer(current_user, session)
        session.commit()
        if not resolved:
            raise HTTPException(status_code=404, detail="No Stripe customer associated with this user")

    try:
        subscriptions = stripe.Subscription.list(
            customer=current_user.stripe_customer_id,
            status="all",
            expand=["data.plan.product"] # Crucial for accessing product metadata
        )
        logger.info(f"Retrieved {len(subscriptions.data)} subscriptions for customer: {current_user.stripe_customer_id}")

        subscription_list = []
        for sub in subscriptions.data:
            # We only care about subscriptions that are, or were, providing a service
            if sub.status not in ["active", "trialing", "past_due", "canceled"]:
                logger.info(f"Skipping subscription {sub.id} with irrelevant status {sub.status}")
                continue

            # Safely access nested plan and product details
            plan = sub.plan
            product = plan.product if plan and hasattr(plan, 'product') else None

            plan_id = plan.id if plan else None
            plan_name = plan.nickname if plan and plan.nickname else None
            product_id = product.id if product else None
            product_name = product.name if product else None
            metadata = product.metadata if product and product.metadata else None

            # --- New Logic: Extract enabled features from metadata ---
            enabled_features = []
            if isinstance(metadata, dict):
                # A feature is considered "enabled" if its metadata key has a value of "true"
                enabled_features = [key for key, value in metadata.items() if value == "true"]

            logger.info(f"Subscription {sub.id} (Status: {sub.status}) has enabled features: {enabled_features}")

            subscription_list.append(
                SubscriptionResponse(
                    id=sub.id,
                    status=sub.status,
                    plan_id=plan_id,
                    plan_name=plan_name,
                    product_id=product_id,
                    product_name=product_name,
                    current_period_start=sub.current_period_start,
                    current_period_end=sub.current_period_end,
                    trial_start=sub.trial_start,
                    trial_end=sub.trial_end,
                    cancel_at_period_end=sub.cancel_at_period_end,
                    metadata=metadata,
                    enabled_features=enabled_features, # Add the new list to the response
                )
            )

        return subscription_list

    except StripeError as e:
        logger.error(f"Stripe error for user {current_user.email}: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to fetch subscriptions: {str(e)}")
    except Exception as e:
        logger.error(f"Internal server error for user {current_user.email}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/subscription-status", response_model=SubscriptionStatus)
async def get_subscription_status(
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
):
    """
    Retrieve the subscription status for the authenticated user from Stripe.
    """
    logger.info(f"Fetching subscription status for user: {current_user.email}")

    if not stripe.api_key:
        logger.error("Stripe API key is not configured")
        raise HTTPException(status_code=500, detail="Server configuration error: Missing Stripe API key")

    if not current_user.stripe_customer_id:
        resolved = ensure_stripe_customer(current_user, session)
        session.commit()
        if not resolved:
            return SubscriptionStatus(
                hasSubscription=False,
                isTrial=False,
                isDeactivated=True
            )

    try:
        subscriptions = stripe.Subscription.list(
            customer=current_user.stripe_customer_id,
            status="all",
            limit=1
        )
        logger.info(f"Retrieved subscriptions for customer: {current_user.stripe_customer_id}")

        if not subscriptions.data:
            logger.info(f"No subscriptions found for customer: {current_user.stripe_customer_id}")
            return SubscriptionStatus(
                hasSubscription=False,
                isTrial=False,
                isDeactivated=True
            )

        subscription = subscriptions.data[0]
        has_subscription = subscription.status in ["active", "trialing", "past_due"]
        is_trial = subscription.status == "trialing"
        is_deactivated = subscription.status in ["canceled", "unpaid", "incomplete_expired"]

        return SubscriptionStatus(
            hasSubscription=has_subscription,
            isTrial=is_trial,
            isDeactivated=is_deactivated
        )

    except StripeError as e:
        logger.error(f"Stripe error for user {current_user.email}: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to fetch subscription status: {str(e)}")
    except Exception as e:
        logger.error(f"Internal server error for user {current_user.email}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/proxy-api/access", response_model=ProxyApiAccessResponse)
async def check_proxy_api_access(
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
):
    """
    Check if the user has access to proxy API features based on the proxy-api tag in subscription metadata.
    """
    logger.info(f"Checking proxy API access for user: {current_user.email}")

    if not stripe.api_key:
        logger.error("Stripe API key is not configured")
        raise HTTPException(status_code=500, detail="Server configuration error: Missing Stripe API key")

    if not current_user.stripe_customer_id:
        resolved = ensure_stripe_customer(current_user, session)
        session.commit()
        if not resolved:
            return ProxyApiAccessResponse(
                has_access=False,
                message="No subscription found. Please subscribe to a plan with proxy API features."
            )

    try:
        subscriptions = stripe.Subscription.list(
            customer=current_user.stripe_customer_id,
            status="all",
            expand=["data.plan.product"]
        )
        logger.info(f"Retrieved {len(subscriptions.data)} subscriptions for customer: {current_user.stripe_customer_id}")

        for sub in subscriptions.data:
            # Log subscription details
            log_details = {
                "subscription_id": sub.id,
                "status": sub.status,
                "current_period_start": getattr(sub, "current_period_start", None),
                "product_id": sub.plan.product.id if sub.plan and sub.plan.product else None,
                "metadata": (
                    sub.plan.product.metadata
                    if sub.plan and sub.plan.product and hasattr(sub.plan.product, "metadata")
                    else None
                )
            }
            logger.info(f"Proxy API check - Subscription details: {log_details}")

            # Check for active subscription with proxy-api tag
            if sub.status in ["active", "trialing"]:
                metadata = (
                    sub.plan.product.metadata
                    if sub.plan and sub.plan.product and hasattr(sub.plan.product, "metadata")
                    else {}
                )
                if metadata.get("proxy-api") == "true":
                    return ProxyApiAccessResponse(
                        has_access=True,
                        message="Access granted to proxy API features."
                    )

        return ProxyApiAccessResponse(
            has_access=False,
            message="Your subscription plan does not include proxy API features. Please upgrade to a proxy-api-enabled plan."
        )

    except StripeError as e:
        logger.error(f"Stripe error for user {current_user.email}: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to check proxy API access: {str(e)}")
    except Exception as e:
        logger.error(f"Internal server error for user {current_user.email}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/serp-api/access", response_model=ProxyApiAccessResponse)
async def check_serp_api_access(
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
):
    """
    Check if the user has access to SERP API features based on a 'serp-api'
    tag in their active, trialing, or past_due subscription's product metadata.
    """
    logger.info(f"Checking SERP API access for user: {current_user.email}")

    # 1. Boilerplate: Check for server and user configuration
    if not stripe.api_key:
        logger.error("Stripe API key is not configured")
        raise HTTPException(status_code=500, detail="Server configuration error: Missing Stripe API key")

    if not current_user.stripe_customer_id:
        resolved = ensure_stripe_customer(current_user, session)
        session.commit()
        if not resolved:
            return ProxyApiAccessResponse(
                has_access=False,
                message="No subscription found. Please subscribe to a plan with SERP API features."
            )

    try:
        # 2. Fetch all subscriptions for the customer to check all relevant statuses.
        # This is more robust than fetching only 'active' and 'trialing' separately.
        subscriptions = stripe.Subscription.list(
            customer=current_user.stripe_customer_id,
            status="all",  # Fetch all statuses and filter locally
            expand=["data.plan.product"], # Crucial for getting product metadata efficiently
        )
        logger.info(f"Found {len(subscriptions.data)} total subscriptions for {current_user.email}. Checking for SERP access.")

        # Define which statuses grant API access. 'past_due' is often included
        # to allow a grace period for payment issues (dunning).
        access_granting_statuses = {"active", "trialing", "past_due"}

        # 3. The Core Logic: Iterate and check subscription status and metadata
        for sub in subscriptions.data:
            # First, efficiently check if the subscription has a status that grants access.
            if sub.status not in access_granting_statuses:
                continue  # Skip canceled, unpaid, incomplete, etc.

            # Safely access the nested product and its metadata
            product = sub.plan.product if sub.plan and hasattr(sub.plan, 'product') else None
            # CORRECTED LOGIC
            # Safely get the metadata value, which will be a string or None
            metadata = product.metadata if product and product.metadata is not None else {}

            # Compare the string from the API to the string "true"
            if metadata.get("serp-api") == "true":
                # This block is now reachable and correctly grants access!
                logger.info(f"SERP API access GRANTED for user {current_user.email} via subscription {sub.id}")
                return ProxyApiAccessResponse(
                    has_access=True,
                    message="Access granted to SERP API features."
                )

        # 4. If the loop completes without returning, no access was found
        logger.warning(f"SERP API access DENIED for user {current_user.email}. No plan with 'serp-api: true' metadata found in an active, trialing, or past_due subscription.")
        return ProxyApiAccessResponse(
            has_access=False,
            message="Your current subscription plan does not include SERP API access. Please upgrade your plan."
        )

    except StripeError as e:
        # Use more specific Stripe error details for better client-side handling and logging
        logger.error(f"Stripe error checking SERP API access for {current_user.email}: {e.user_message or str(e)}")
        raise HTTPException(status_code=e.http_status or 400, detail=e.user_message or "A Stripe error occurred while checking your subscription.")
    except Exception as e:
        # Log the full traceback for internal server errors for easier debugging
        logger.error(f"Internal server error checking SERP API access for {current_user.email}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred.")

#
# NEW DYNAMIC FUNCTION
#
@router.get("/api/access/{feature_name}", response_model=ProxyApiAccessResponse)
async def check_multi_feature_access(
    feature_name: Annotated[str, Path(..., description="The metadata tag to check for access, e.g., 'serp-api' or 'advanced-analytics'.")],
    current_user: Annotated[User, Depends(get_current_user)],
    session: SessionDep,
):
    """
    Check if the user has access to a specific feature based on a corresponding
    tag in their active, trialing, or past_due subscription's product metadata.
    The feature name is provided as a URL path parameter.

    For example, to check for a feature tagged as 'advanced-analytics', the
    endpoint would be `/api/access/advanced-analytics`. Access is granted if the
    product metadata contains `"advanced-analytics": "true"`.
    """
    logger.info(f"Checking access for feature '{feature_name}' for user: {current_user.email}")

    # 1. Boilerplate checks
    if not stripe.api_key:
        logger.error("Stripe API key is not configured")
        raise HTTPException(status_code=500, detail="Server configuration error: Missing Stripe API key")

    if not current_user.stripe_customer_id:
        resolved = ensure_stripe_customer(current_user, session)
        session.commit()
        if not resolved:
            return ProxyApiAccessResponse(
                has_access=False,
                message=f"No subscription found. Please subscribe to a plan with the '{feature_name}' feature."
            )

    try:
        # 2. Fetch subscriptions with expanded product data
        subscriptions = stripe.Subscription.list(
            customer=current_user.stripe_customer_id,
            status="all",
            expand=["data.plan.product"],
        )
        logger.info(f"Found {len(subscriptions.data)} total subscriptions for {current_user.email}. Checking for '{feature_name}' access.")

        access_granting_statuses = {"active", "trialing", "past_due"}

        # 3. Core Logic: Iterate and check for the dynamic feature tag
        for sub in subscriptions.data:
            if sub.status not in access_granting_statuses:
                continue

            # Safely access the product and its metadata
            product = sub.plan.product if sub.plan and hasattr(sub.plan, 'product') else None
            metadata = product.metadata if product and product.metadata is not None else {}
            
            logger.debug(f"Checking subscription {sub.id} (status: {sub.status}) for '{feature_name}' access. Metadata: {metadata}")
            
            # The key dynamic check: Does the metadata contain the feature tag set to "true"?
            if metadata.get(feature_name) == "true":
                logger.info(f"Access to '{feature_name}' GRANTED for user {current_user.email} via subscription {sub.id}")
                return ProxyApiAccessResponse(
                    has_access=True,
                    message=f"Access granted to '{feature_name}' feature."
                )

        # 4. If the loop completes, no access was found
        logger.warning(f"Access to '{feature_name}' DENIED for user {current_user.email}. No valid plan with '{feature_name}: true' metadata found.")
        return ProxyApiAccessResponse(
            has_access=False,
            message=f"Your current subscription plan does not include access to the '{feature_name}' feature. Please upgrade your plan."
        )

    except StripeError as e:
        logger.error(f"Stripe error checking access for '{feature_name}' for {current_user.email}: {e.user_message or str(e)}")
        raise HTTPException(status_code=e.http_status or 400, detail=e.user_message or "A Stripe error occurred.")
    except Exception as e:
        logger.error(f"Internal server error checking access for '{feature_name}' for {current_user.email}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred.")