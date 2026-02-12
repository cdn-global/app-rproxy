"""
Stripe customer resolution utilities.

Ensures every local User is mapped to exactly one Stripe Customer,
looking up existing customers by email before creating new ones.
"""
import os
import logging
import stripe
from typing import Optional

logger = logging.getLogger(__name__)

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")


def find_stripe_customer_by_email(email: str) -> Optional[str]:
    """
    Search Stripe for an existing customer with the given email.
    Returns the stripe customer id if found, None otherwise.
    """
    try:
        customers = stripe.Customer.list(email=email, limit=1)
        if customers.data:
            customer = customers.data[0]
            logger.info(f"Found existing Stripe customer {customer.id} for email {email}")
            return customer.id
    except stripe.StripeError as e:
        logger.error(f"Stripe error searching customer by email {email}: {e}")
    return None


def ensure_stripe_customer(
    user,
    session,
    *,
    name: Optional[str] = None,
) -> Optional[str]:
    """
    Guarantee that ``user`` has a valid ``stripe_customer_id``.

    Resolution order:
      1. Return the existing id when already set on the user.
      2. Search Stripe by the user's email – reuse if found.
      3. Create a brand-new Stripe Customer as a last resort.

    On success the user row is updated and flushed (caller must commit).
    Returns the stripe_customer_id, or None if Stripe is unavailable.
    """
    if user.stripe_customer_id:
        return user.stripe_customer_id

    if not stripe.api_key:
        logger.warning("Stripe API key not configured – skipping customer resolution")
        return None

    email = user.email
    display_name = name or getattr(user, "full_name", None) or email.split("@")[0]

    # Step 2 – look for an existing Stripe customer by email
    existing_id = find_stripe_customer_by_email(email)
    if existing_id:
        user.stripe_customer_id = existing_id
        session.add(user)
        session.flush()
        logger.info(f"Mapped existing Stripe customer {existing_id} to user {email}")
        return existing_id

    # Step 3 – create a new Stripe customer
    try:
        customer = stripe.Customer.create(
            email=email,
            name=display_name,
            metadata={"user_id": str(user.id)},
        )
        user.stripe_customer_id = customer.id
        session.add(user)
        session.flush()
        logger.info(f"Created new Stripe customer {customer.id} for user {email}")
        return customer.id
    except stripe.StripeError as e:
        logger.error(f"Failed to create Stripe customer for {email}: {e}")
        return None
