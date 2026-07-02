"""
Client for the Cloudflare D1 dispute-worker.
FastAPI calls the Worker over HTTPS; all requests are authenticated with
X-Worker-Secret matching settings.SECRET_KEY.
"""
from typing import Any, Optional
import httpx
from app.core.config import settings

_WORKER_URL = getattr(settings, "DISPUTE_WORKER_URL", "")


def _headers() -> dict[str, str]:
    return {"X-Worker-Secret": settings.SECRET_KEY, "Content-Type": "application/json"}


def _client() -> httpx.Client:
    return httpx.Client(base_url=_WORKER_URL, headers=_headers(), timeout=15)


# ── Cases ─────────────────────────────────────────────────────────────────────

def create_case(payload: dict[str, Any]) -> dict:
    with _client() as c:
        r = c.post("/cases", json=payload)
        r.raise_for_status()
        return r.json()


def list_cases() -> list[dict]:
    with _client() as c:
        r = c.get("/cases")
        r.raise_for_status()
        return r.json()


def get_case(case_id: str) -> dict:
    with _client() as c:
        r = c.get(f"/cases/{case_id}")
        r.raise_for_status()
        return r.json()


def update_case(case_id: str, payload: dict[str, Any]) -> dict:
    with _client() as c:
        r = c.patch(f"/cases/{case_id}", json=payload)
        r.raise_for_status()
        return r.json()


# ── Events & snapshots ────────────────────────────────────────────────────────

def add_event(case_id: str, event_type: str, content: str, created_by: Optional[str] = None) -> dict:
    with _client() as c:
        r = c.post(f"/cases/{case_id}/events", json={
            "event_type": event_type,
            "content": content,
            "created_by": created_by,
        })
        r.raise_for_status()
        return r.json()


def store_snapshot(case_id: str, snapshot_json: str, generated_by: Optional[str] = None) -> dict:
    with _client() as c:
        r = c.post(f"/cases/{case_id}/snapshots", json={
            "snapshot_json": snapshot_json,
            "generated_by": generated_by,
        })
        r.raise_for_status()
        return r.json()


def get_snapshot(case_id: str, snap_id: str) -> dict:
    with _client() as c:
        r = c.get(f"/cases/{case_id}/snapshots/{snap_id}")
        r.raise_for_status()
        return r.json()


# ── Seed ──────────────────────────────────────────────────────────────────────

def seed_login_events(case_id: str, rows: list[dict], seeded_by: Optional[str] = None) -> dict:
    with _client() as c:
        r = c.post(f"/cases/{case_id}/seed/login-events", json={"rows": rows, "seeded_by": seeded_by})
        r.raise_for_status()
        return r.json()


def seed_api_requests(case_id: str, rows: list[dict], seeded_by: Optional[str] = None) -> dict:
    with _client() as c:
        r = c.post(f"/cases/{case_id}/seed/api-requests", json={"rows": rows, "seeded_by": seeded_by})
        r.raise_for_status()
        return r.json()


def seed_llm_usage(case_id: str, rows: list[dict], seeded_by: Optional[str] = None) -> dict:
    with _client() as c:
        r = c.post(f"/cases/{case_id}/seed/llm-usage", json={"rows": rows, "seeded_by": seeded_by})
        r.raise_for_status()
        return r.json()


def seed_summary(case_id: str) -> dict:
    with _client() as c:
        r = c.get(f"/cases/{case_id}/seed/summary")
        r.raise_for_status()
        return r.json()
