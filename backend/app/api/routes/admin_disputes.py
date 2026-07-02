"""
Admin dispute case management — wraps the Cloudflare D1 Worker.
All endpoints require superuser.
"""
import json
import os
import uuid
from datetime import datetime, timedelta
from typing import Annotated, Any, Optional

import stripe
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlmodel import and_, select

from app.api.deps import SessionDep, get_current_active_superuser
from app.core.config import settings
from app.models import (
    ApiRequestLog,
    LLMModel,
    LLMProvider,
    LLMUsageLog,
    LoginLog,
    User,
    UserApiKey,
)
from app.services import dispute_service

router = APIRouter(prefix="/admin/disputes", tags=["admin-disputes"])

SuperUser = Annotated[User, Depends(get_current_active_superuser)]


# ── Request / response schemas ────────────────────────────────────────────────

class CreateCaseRequest(BaseModel):
    user_email: str
    user_full_name: Optional[str] = None
    user_id: Optional[str] = None
    stripe_charge_id: Optional[str] = None
    stripe_dispute_id: Optional[str] = None
    reason: str = "other"
    disputed_amount_usd: float = 0.0
    currency: str = "USD"
    response_due_date: Optional[str] = None
    notes: Optional[str] = None


class UpdateCaseRequest(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    response_due_date: Optional[str] = None
    stripe_dispute_id: Optional[str] = None
    stripe_charge_id: Optional[str] = None


class SeedRow(BaseModel):
    rows: list[dict]


# ── Case CRUD ─────────────────────────────────────────────────────────────────

@router.get("/")
def list_cases(current_user: SuperUser) -> Any:
    if not os.getenv("DISPUTE_WORKER_URL", settings.DISPUTE_WORKER_URL):
        raise HTTPException(
            status_code=503,
            detail="DISPUTE_WORKER_URL not set. Add it to .env and restart the container.",
        )
    return dispute_service.list_cases()


@router.post("/", status_code=201)
def create_case(body: CreateCaseRequest, current_user: SuperUser) -> Any:
    if not os.getenv("DISPUTE_WORKER_URL", settings.DISPUTE_WORKER_URL):
        raise HTTPException(
            status_code=503,
            detail="DISPUTE_WORKER_URL not set. Add it to .env and restart the container.",
        )
    return dispute_service.create_case({
        **body.model_dump(exclude_none=True),
        "created_by": current_user.email,
    })


@router.get("/{case_id}")
def get_case(case_id: str, current_user: SuperUser) -> Any:
    return dispute_service.get_case(case_id)


@router.patch("/{case_id}")
def update_case(case_id: str, body: UpdateCaseRequest, current_user: SuperUser) -> Any:
    return dispute_service.update_case(case_id, {
        **body.model_dump(exclude_none=True),
        "updated_by": current_user.email,
    })


# ── Events ────────────────────────────────────────────────────────────────────

@router.post("/{case_id}/events", status_code=201)
def add_event(
    case_id: str,
    body: dict,
    current_user: SuperUser,
) -> Any:
    return dispute_service.add_event(
        case_id,
        body.get("event_type", "note"),
        body.get("content", ""),
        current_user.email,
    )


# ── Evidence snapshot ─────────────────────────────────────────────────────────

@router.post("/{case_id}/snapshot", status_code=201)
def generate_snapshot(
    case_id: str,
    current_user: SuperUser,
    session: SessionDep,
    user_id: Optional[str] = Query(default=None),
    days: int = Query(default=365, ge=1, le=3650),
) -> Any:
    """
    Pull all available evidence from PostgreSQL + Stripe and freeze it as a
    JSON snapshot in D1.
    """
    # Resolve user from the dispute case if user_id not provided
    case = dispute_service.get_case(case_id)
    target_user_id = user_id or case.get("user_id")
    if not target_user_id:
        raise HTTPException(status_code=400, detail="Provide user_id query param or set user_id on the dispute case")

    user = session.get(User, uuid.UUID(target_user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    since = datetime.utcnow() - timedelta(days=days)

    # Login logs
    login_rows = session.exec(
        select(LoginLog)
        .where(LoginLog.user_id == user.id)
        .order_by(LoginLog.created_at.desc())
        .limit(200)
    ).all()

    # API keys
    api_keys = session.exec(
        select(UserApiKey).where(UserApiKey.user_id == user.id)
    ).all()

    # Per-request log
    req_logs = session.exec(
        select(ApiRequestLog)
        .where(and_(ApiRequestLog.user_id == user.id, ApiRequestLog.created_at >= since))
        .order_by(ApiRequestLog.created_at.desc())
        .limit(500)
    ).all()

    # LLM usage
    usage_rows = session.exec(
        select(LLMUsageLog)
        .where(and_(LLMUsageLog.user_id == user.id, LLMUsageLog.created_at >= since))
    ).all()
    llm_total_cost = sum(r.total_cost for r in usage_rows)
    llm_total_requests = len(usage_rows)

    # Stripe data
    stripe_charges: list[dict] = []
    stripe_invoices: list[dict] = []
    stripe_subscriptions: list[dict] = []
    if user.stripe_customer_id and os.getenv("STRIPE_SECRET_KEY"):
        stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
        try:
            for ch in stripe.Charge.list(customer=user.stripe_customer_id, limit=50).data:
                checks = {}
                if ch.payment_method_details and ch.payment_method_details.card:
                    c = ch.payment_method_details.card.checks or {}
                    checks = {
                        "cvv_check": getattr(c, "cvc_check", None),
                        "address_postal_check": getattr(c, "address_postal_code_check", None),
                        "address_line1_check": getattr(c, "address_line1_check", None),
                    }
                stripe_charges.append({
                    "id": ch.id,
                    "amount_usd": ch.amount / 100,
                    "currency": ch.currency.upper(),
                    "status": ch.status,
                    "created_at": datetime.fromtimestamp(ch.created).isoformat(),
                    "description": ch.description,
                    "billing_name": ch.billing_details.name if ch.billing_details else None,
                    "billing_email": ch.billing_details.email if ch.billing_details else None,
                    "risk_level": ch.outcome.risk_level if ch.outcome else None,
                    "risk_score": ch.outcome.risk_score if ch.outcome else None,
                    **checks,
                })
            for inv in stripe.Invoice.list(customer=user.stripe_customer_id, limit=24).data:
                stripe_invoices.append({
                    "id": inv.id,
                    "number": inv.number,
                    "amount_paid_usd": inv.amount_paid / 100,
                    "status": inv.status,
                    "period_start": datetime.fromtimestamp(inv.period_start).isoformat(),
                    "period_end": datetime.fromtimestamp(inv.period_end).isoformat(),
                    "invoice_pdf": inv.invoice_pdf,
                })
            for sub in stripe.Subscription.list(customer=user.stripe_customer_id, limit=10).data:
                stripe_subscriptions.append({
                    "id": sub.id,
                    "status": sub.status,
                    "current_period_start": datetime.fromtimestamp(sub.current_period_start).isoformat(),
                    "current_period_end": datetime.fromtimestamp(sub.current_period_end).isoformat(),
                    "canceled_at": datetime.fromtimestamp(sub.canceled_at).isoformat() if sub.canceled_at else None,
                    "trial_start": datetime.fromtimestamp(sub.trial_start).isoformat() if sub.trial_start else None,
                    "trial_end": datetime.fromtimestamp(sub.trial_end).isoformat() if sub.trial_end else None,
                })
        except Exception:
            pass

    snapshot = {
        "user_id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "signup_ip": user.signup_ip,
        "tos_accepted_at": user.tos_accepted_at.isoformat() if user.tos_accepted_at else None,
        "email_verified_at": user.email_verified_at.isoformat() if user.email_verified_at else None,
        "is_active": user.is_active,
        "is_deactivated": user.is_deactivated,
        "has_subscription": user.has_subscription,
        "stripe_customer_id": user.stripe_customer_id,
        "login_logs": [
            {
                "id": str(r.id),
                "email_attempted": r.email_attempted,
                "ip_address": r.ip_address,
                "user_agent": r.user_agent,
                "success": r.success,
                "created_at": r.created_at.isoformat(),
            }
            for r in login_rows
        ],
        "api_keys": [
            {
                "id": str(k.id),
                "name": k.name,
                "key_prefix": k.key_prefix,
                "request_count": k.request_count,
                "last_used_at": k.last_used_at.isoformat() if k.last_used_at else None,
                "last_ip": k.last_ip,
                "is_active": k.is_active,
                "created_at": k.created_at.isoformat(),
            }
            for k in api_keys
        ],
        "api_request_log_sample": [
            {
                "id": str(r.id),
                "api_key_prefix": r.api_key_prefix,
                "ip_address": r.ip_address,
                "endpoint": r.endpoint,
                "status_code": r.status_code,
                "created_at": r.created_at.isoformat(),
            }
            for r in req_logs
        ],
        "llm_total_requests": llm_total_requests,
        "llm_total_cost_usd": llm_total_cost,
        "llm_period_days": days,
        "stripe_charges": stripe_charges,
        "stripe_invoices": stripe_invoices,
        "stripe_subscriptions": stripe_subscriptions,
        "generated_at": datetime.utcnow().isoformat(),
        "generated_by": current_user.email,
    }

    result = dispute_service.store_snapshot(case_id, json.dumps(snapshot), current_user.email)
    return {"snapshot_id": result["id"], "case_id": case_id}


@router.get("/{case_id}/snapshots/{snap_id}")
def get_snapshot(case_id: str, snap_id: str, current_user: SuperUser) -> Any:
    return dispute_service.get_snapshot(case_id, snap_id)


# ── Seed endpoints ────────────────────────────────────────────────────────────

@router.post("/{case_id}/seed/login-events")
def seed_login_events(case_id: str, body: SeedRow, current_user: SuperUser) -> Any:
    return dispute_service.seed_login_events(case_id, body.rows, current_user.email)


@router.post("/{case_id}/seed/api-requests")
def seed_api_requests(case_id: str, body: SeedRow, current_user: SuperUser) -> Any:
    return dispute_service.seed_api_requests(case_id, body.rows, current_user.email)


@router.post("/{case_id}/seed/llm-usage")
def seed_llm_usage(case_id: str, body: SeedRow, current_user: SuperUser) -> Any:
    return dispute_service.seed_llm_usage(case_id, body.rows, current_user.email)


@router.get("/evidence/{user_id}")
def get_user_evidence(
    user_id: str,
    current_user: SuperUser,
    session: SessionDep,
    days: int = Query(default=365, ge=1, le=3650),
) -> Any:
    """
    Standalone evidence endpoint — returns a live EvidencePack for a user
    without creating or storing a dispute case snapshot.
    Used by the admin Evidence Pack panel.
    """
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid user_id")

    user = session.get(User, uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    since = datetime.utcnow() - timedelta(days=days)

    login_rows = session.exec(
        select(LoginLog)
        .where(LoginLog.user_id == uid)
        .order_by(LoginLog.created_at.desc())
        .limit(200)
    ).all()

    api_keys = session.exec(
        select(UserApiKey).where(UserApiKey.user_id == uid)
    ).all()

    req_logs = session.exec(
        select(ApiRequestLog)
        .where(and_(ApiRequestLog.user_id == uid, ApiRequestLog.created_at >= since))
        .order_by(ApiRequestLog.created_at.desc())
        .limit(500)
    ).all()

    usage_rows = session.exec(
        select(LLMUsageLog)
        .where(and_(LLMUsageLog.user_id == uid, LLMUsageLog.created_at >= since))
    ).all()

    stripe_charges: list[dict] = []
    stripe_invoices: list[dict] = []
    stripe_subscriptions: list[dict] = []
    if user.stripe_customer_id and os.getenv("STRIPE_SECRET_KEY"):
        stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
        try:
            for ch in stripe.Charge.list(customer=user.stripe_customer_id, limit=50).data:
                checks = {}
                if ch.payment_method_details and ch.payment_method_details.card:
                    c = ch.payment_method_details.card.checks or {}
                    checks = {
                        "cvv_check": getattr(c, "cvc_check", None),
                        "address_postal_check": getattr(c, "address_postal_code_check", None),
                        "address_line1_check": getattr(c, "address_line1_check", None),
                    }
                stripe_charges.append({
                    "id": ch.id,
                    "amount_usd": ch.amount / 100,
                    "currency": ch.currency.upper(),
                    "status": ch.status,
                    "created_at": datetime.fromtimestamp(ch.created).isoformat(),
                    "billing_name": ch.billing_details.name if ch.billing_details else None,
                    "billing_email": ch.billing_details.email if ch.billing_details else None,
                    "risk_level": ch.outcome.risk_level if ch.outcome else None,
                    "risk_score": ch.outcome.risk_score if ch.outcome else None,
                    **checks,
                })
            for inv in stripe.Invoice.list(customer=user.stripe_customer_id, limit=24).data:
                stripe_invoices.append({
                    "id": inv.id,
                    "number": inv.number,
                    "amount_paid_usd": inv.amount_paid / 100,
                    "status": inv.status,
                    "period_start": datetime.fromtimestamp(inv.period_start).isoformat(),
                    "period_end": datetime.fromtimestamp(inv.period_end).isoformat(),
                    "invoice_pdf": inv.invoice_pdf,
                })
            for sub in stripe.Subscription.list(customer=user.stripe_customer_id, limit=10).data:
                stripe_subscriptions.append({
                    "id": sub.id,
                    "status": sub.status,
                    "current_period_start": datetime.fromtimestamp(sub.current_period_start).isoformat(),
                    "current_period_end": datetime.fromtimestamp(sub.current_period_end).isoformat(),
                    "canceled_at": datetime.fromtimestamp(sub.canceled_at).isoformat() if sub.canceled_at else None,
                    "trial_start": datetime.fromtimestamp(sub.trial_start).isoformat() if sub.trial_start else None,
                    "trial_end": datetime.fromtimestamp(sub.trial_end).isoformat() if sub.trial_end else None,
                })
        except Exception:
            pass

    return {
        "user_id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "signup_ip": user.signup_ip,
        "tos_accepted_at": user.tos_accepted_at.isoformat() if user.tos_accepted_at else None,
        "email_verified_at": user.email_verified_at.isoformat() if user.email_verified_at else None,
        "is_active": user.is_active,
        "is_deactivated": user.is_deactivated,
        "has_subscription": user.has_subscription,
        "stripe_customer_id": user.stripe_customer_id,
        "login_logs": [
            {"id": str(r.id), "email_attempted": r.email_attempted, "ip_address": r.ip_address,
             "user_agent": r.user_agent, "success": r.success, "created_at": r.created_at.isoformat()}
            for r in login_rows
        ],
        "api_keys": [
            {"id": str(k.id), "name": k.name, "key_prefix": k.key_prefix,
             "request_count": k.request_count, "last_used_at": k.last_used_at.isoformat() if k.last_used_at else None,
             "last_ip": k.last_ip, "is_active": k.is_active, "created_at": k.created_at.isoformat()}
            for k in api_keys
        ],
        "api_request_log_sample": [
            {"id": str(r.id), "api_key_prefix": r.api_key_prefix, "ip_address": r.ip_address,
             "endpoint": r.endpoint, "status_code": r.status_code, "created_at": r.created_at.isoformat()}
            for r in req_logs
        ],
        "llm_total_requests": len(usage_rows),
        "llm_total_cost_usd": sum(r.total_cost for r in usage_rows),
        "llm_period_days": days,
        "stripe_charges": stripe_charges,
        "stripe_invoices": stripe_invoices,
        "stripe_subscriptions": stripe_subscriptions,
        "generated_at": datetime.utcnow().isoformat(),
        "generated_by": current_user.email,
    }
    return result


@router.get("/{case_id}/seed/summary")
def seed_summary_route(case_id: str, current_user: SuperUser) -> Any:
    return dispute_service.seed_summary(case_id)


# ── Seed from Stripe ──────────────────────────────────────────────────────────

class SeedFromStripeRequest(BaseModel):
    stripe_customer_id: str
    user_id: Optional[str] = None   # link seeded rows to a user_id


@router.post("/{case_id}/seed/from-stripe", status_code=201)
def seed_from_stripe(
    case_id: str,
    body: SeedFromStripeRequest,
    current_user: SuperUser,
    session: SessionDep,
) -> Any:
    """
    Pull Stripe charges, invoices, subscriptions and customer events for a
    customer and seed them as structured evidence rows in D1.

    Maps:
     - Stripe Charge      → seeded_api_request (proves billing happened)
     - Stripe Invoice line items → seeded_llm_usage (itemized usage proof)
     - Stripe CustomerEvent (logins/updates from Stripe Radar) → seeded_login_event
    """
    sk = os.getenv("STRIPE_SECRET_KEY")
    if not sk:
        raise HTTPException(status_code=503, detail="STRIPE_SECRET_KEY not configured")

    stripe.api_key = sk
    uid = body.user_id

    api_request_rows: list[dict] = []
    llm_usage_rows: list[dict] = []
    login_event_rows: list[dict] = []
    stripe_summary: list[str] = []

    try:
        # ── Charges → seeded_api_request (one row per charge = one billing event)
        charges = stripe.Charge.list(customer=body.stripe_customer_id, limit=100)
        for ch in charges.auto_paging_iter():
            api_request_rows.append({
                "user_id": uid,
                "api_key_prefix": None,
                "ip_address": None,
                "user_agent": f"Stripe charge {ch.id}",
                "endpoint": f"/stripe/charge/{ch.status}",
                "status_code": 200 if ch.status == "succeeded" else 402,
                "created_at": datetime.fromtimestamp(ch.created).isoformat(),
            })

        # ── Invoice line items → seeded_llm_usage (itemized spend proof)
        invoices = stripe.Invoice.list(customer=body.stripe_customer_id, limit=50)
        for inv in invoices.auto_paging_iter():
            line_items = stripe.Invoice.list_line_items(inv.id, limit=100)
            for line in line_items.auto_paging_iter():
                # Map Stripe price metadata to model_name if available
                price = line.price
                model_name = "subscription"
                source = "stripe_invoice"
                if price and price.metadata:
                    model_name = price.metadata.get("model_name", price.nickname or price.id or "subscription")
                elif price and price.nickname:
                    model_name = price.nickname

                # Use quantity as token proxy for metered items
                tokens = int(line.quantity or 0)
                cost = (line.amount / 100)  # cents → USD

                llm_usage_rows.append({
                    "user_id": uid,
                    "model_name": model_name,
                    "source": source,
                    "input_tokens": tokens,
                    "output_tokens": 0,
                    "total_cost": cost,
                    "created_at": datetime.fromtimestamp(
                        inv.period_start if inv.period_start else inv.created
                    ).isoformat(),
                })

        # ── Stripe Radar / Customer events → seeded_login_event
        events = stripe.Event.list(
            type="radar.early_fraud_warning.created",
            limit=100,
        )
        for ev in events.auto_paging_iter():
            obj = ev.data.object
            customer_id = getattr(obj, "charge", None) or getattr(obj, "customer", None)
            if customer_id and customer_id != body.stripe_customer_id:
                continue
            login_event_rows.append({
                "user_id": uid,
                "email_attempted": body.stripe_customer_id,
                "ip_address": None,
                "user_agent": f"Stripe Radar: {ev.type}",
                "success": 0,
                "created_at": datetime.fromtimestamp(ev.created).isoformat(),
            })

        # Also pull customer balance transactions as activity proof
        txns = stripe.Customer.list_balance_transactions(
            body.stripe_customer_id, limit=100
        )
        for txn in txns.auto_paging_iter():
            login_event_rows.append({
                "user_id": uid,
                "email_attempted": body.stripe_customer_id,
                "ip_address": None,
                "user_agent": f"Stripe balance txn: {txn.type} {txn.amount/100:.2f} {txn.currency.upper()}",
                "success": 1,
                "created_at": datetime.fromtimestamp(txn.created).isoformat(),
            })

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=502, detail=f"Stripe API error: {str(e)}")

    # Seed all rows into D1
    results: dict[str, Any] = {}

    if api_request_rows:
        results["charges"] = dispute_service.seed_api_requests(case_id, api_request_rows, current_user.email)
        stripe_summary.append(f"{len(api_request_rows)} charges")

    if llm_usage_rows:
        results["invoice_line_items"] = dispute_service.seed_llm_usage(case_id, llm_usage_rows, current_user.email)
        stripe_summary.append(f"{len(llm_usage_rows)} invoice line items")

    if login_event_rows:
        results["events"] = dispute_service.seed_login_events(case_id, login_event_rows, current_user.email)
        stripe_summary.append(f"{len(login_event_rows)} Stripe events")

    dispute_service.add_event(
        case_id, "seed_import",
        f"Seeded from Stripe customer {body.stripe_customer_id}: {', '.join(stripe_summary) or 'no data found'}",
        current_user.email,
    )

    return {
        "stripe_customer_id": body.stripe_customer_id,
        "seeded": results,
        "summary": stripe_summary,
    }


