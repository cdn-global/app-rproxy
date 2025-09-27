from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Header, Request
from typing import Annotated, Dict, List, Optional
from pydantic import BaseModel, HttpUrl
import httpx
import logging
import asyncio
import time
import random
import uuid
import os
from datetime import datetime, timedelta
from app.api.deps import SessionDep, CurrentUser
from app.models import User
from app.core.security import generate_api_key, verify_api_key
from sqlalchemy.orm import Session
from sqlmodel import SQLModel, Field
from uuid import UUID, uuid4
from app.utils import generate_test_email, send_email
from bs4 import BeautifulSoup
from urllib.parse import quote_plus, unquote, parse_qs

# Configure logging based on environment
log_level = logging.INFO if os.getenv("ENV") == "production" else logging.DEBUG
logging.basicConfig(level=log_level)
logger = logging.getLogger(__name__)

# REGION_ENDPOINTS dictionary
REGION_ENDPOINTS = {
    "us-east": [
        "https://us-east4-proxy1-454912.cloudfunctions.net/main",
        "https://us-east1-proxy1-454912.cloudfunctions.net/main",
        "https://us-east5-proxy2-455013.cloudfunctions.net/main"
    ],
    "us-west": [
        "https://us-west1-proxy1-454912.cloudfunctions.net/main",
        "https://us-west3-proxy1-454912.cloudfunctions.net/main",
        "https://us-west4-proxy1-454912.cloudfunctions.net/main",
        "https://us-west2-proxy2-455013.cloudfunctions.net/main"
    ],
    "us-central": [
        "https://us-central1-proxy1-454912.cloudfunctions.net/main",
        "https://us-central1-proxy2-455013.cloudfunctions.net/main",
        "https://us-south1-proxy3-455013.cloudfunctions.net/main"
    ],
    "northamerica-northeast": [
        "https://northamerica-northeast1-proxy2-455013.cloudfunctions.net/main",
        "https://northamerica-northeast2-proxy2-455013.cloudfunctions.net/main"
    ],
    "southamerica": [
        "https://southamerica-west1-proxy1-454912.cloudfunctions.net/main",
        "https://southamerica-east1-proxy3-455013.cloudfunctions.net/main",
        "https://southamerica-west1-proxy3-455013.cloudfunctions.net/main"
    ],
    "asia": [
        "https://asia-east1-proxy6-455014.cloudfunctions.net/main",
        "https://asia-northeast2-proxy6-455014.cloudfunctions.net/main"
    ],
    "australia": [
        "https://australia-southeast1-proxy3-455013.cloudfunctions.net/main",
        "https://australia-southeast2-proxy3-455013.cloudfunctions.net/main"
    ],
    "europe": [
        "https://europe-north1-proxy4-455014.cloudfunctions.net/main",
        "https://europe-southwest1-proxy4-455014.cloudfunctions.net/main",
        "https://europe-west1-proxy4-455014.cloudfunctions.net/main",
        "https://europe-west4-proxy4-455014.cloudfunctions.net/main",
        "https://europe-west6-proxy4-455014.cloudfunctions.net/main",
        "https://europe-west8-proxy4-455014.cloudfunctions.net/main",
        "https://europe-west12-proxy5-455014.cloudfunctions.net/main",
        "https://europe-west2-proxy5-455014.cloudfunctions.net/main",
        "https://europe-west3-proxy5-455014.cloudfunctions.net/main",
        "https://europe-west6-proxy5-455014.cloudfunctions.net/main",
        "https://europe-west9-proxy5-455014.cloudfunctions.net/main",
        "https://europe-west10-proxy6-455014.cloudfunctions.net/main"
    ],
    "middle-east": [
        "https://me-central1-proxy6-455014.cloudfunctions.net/main",
        "https://me-west1-proxy6-455014.cloudfunctions.net/main"
    ]
}

# ProxyEndpointManager class
class ProxyEndpointManager:
    def __init__(self):
        self.endpoints = REGION_ENDPOINTS
        self.endpoint_ids = {
            region: {f"{region}_{i}": url for i, url in enumerate(urls)}
            for region, urls in REGION_ENDPOINTS.items()
        }

    def get_endpoints(self, region: str) -> List[str]:
        return self.endpoints.get(region, [])

    def get_endpoint_id(self, region: str, url: str) -> Optional[str]:
        for endpoint_id, endpoint_url in self.endpoint_ids.get(region, {}).items():
            if endpoint_url == url:
                return endpoint_id
        return None

endpoint_manager = ProxyEndpointManager()
router = APIRouter(tags=["proxy"], prefix="/proxy")

# Model definitions
class APIToken(SQLModel, table=True):
    __tablename__ = "apitoken"
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    token: str = Field(unique=True)
    user_id: UUID = Field(foreign_key="user.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    is_active: bool = Field(default=True)
    request_count: int = Field(default=0)

class RegionsResponse(BaseModel):
    regions: List[str]

class APIKeyResponse(BaseModel):
    key_preview: str
    created_at: str
    expires_at: str
    is_active: bool
    request_count: int

class ProxyStatus(BaseModel):
    region: str
    is_healthy: bool
    avg_response_time: float
    healthy_endpoints: int
    total_endpoints: int
    last_checked: datetime

class ProxyStatusResponse(BaseModel):
    statuses: List[ProxyStatus]

class ProxyRequest(BaseModel):
    url: HttpUrl

class ProxyResponse(BaseModel):
    result: str
    public_ip: str
    device_id: str
    region_used: str

class SerpResult(BaseModel):
    position: int
    title: str
    link: str
    snippet: str

class SerpResponse(BaseModel):
    search_engine: str
    search_query: str
    region_used: str
    organic_results: List[SerpResult]

# Health check, SERP parsers, SUPPORTED_ENGINES
async def check_proxy_health(endpoint: str, region: str) -> Dict:
    start_time = time.time()
    endpoint_id = endpoint_manager.get_endpoint_id(region, endpoint) or "unknown"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{endpoint}/health")
            response.raise_for_status()
            response_time = time.time() - start_time
            logger.debug(f"Health check succeeded for proxy {endpoint_id} in {region}")
            return {"region": region, "is_healthy": True, "response_time": response_time, "last_checked": datetime.utcnow(), "endpoint": endpoint}
    except (httpx.ConnectError, httpx.TimeoutException) as e:
        logger.error(f"Network error during health check for proxy {endpoint_id} in {region}: {str(e)}")
        return {"region": region, "is_healthy": False, "response_time": time.time() - start_time, "last_checked": datetime.utcnow(), "endpoint": endpoint}
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error during health check for proxy {endpoint_id} in {region}: {e.response.status_code} {str(e)}")
        return {"region": region, "is_healthy": False, "response_time": time.time() - start_time, "last_checked": datetime.utcnow(), "endpoint": endpoint}
    except Exception as e:
        logger.error(f"Unexpected error during health check for proxy {endpoint_id} in {region}: {str(e)}")
        return {"region": region, "is_healthy": False, "response_time": time.time() - start_time, "last_checked": datetime.utcnow(), "endpoint": endpoint}

def parse_google_serp(html: str) -> List[SerpResult]:
    soup = BeautifulSoup(html, "lxml")
    results = []
    for i, el in enumerate(soup.select("div.g"), start=1):
        title_tag = el.select_one("h3")
        link_tag = el.select_one("a")
        snippet_tag = el.select_one("div[data-sncf='1']") or el.select_one(".VwiC3b")
        if title_tag and link_tag and link_tag.get("href"):
            results.append(SerpResult(position=i, title=title_tag.text, link=link_tag.get("href"), snippet=snippet_tag.text if snippet_tag else ""))
    return results

def parse_bing_serp(html: str) -> List[SerpResult]:
    soup = BeautifulSoup(html, "lxml")
    results = []
    for i, el in enumerate(soup.select("li.b_algo"), start=1):
        title_tag = el.select_one("h2 a")
        snippet_tag = el.select_one(".b_caption p")
        if title_tag and title_tag.get("href"):
            results.append(SerpResult(position=i, title=title_tag.text, link=title_tag.get("href"), snippet=snippet_tag.text if snippet_tag else ""))
    return results

def parse_duckduckgo_serp(html: str) -> List[SerpResult]:
    soup = BeautifulSoup(html, "lxml")
    results = []
    for i, el in enumerate(soup.select(".result"), start=1):
        title_tag = el.select_one(".result__a")
        snippet_tag = el.select_one(".result__snippet")
        link = ""
        if title_tag and title_tag.get("href"):
            raw_href = title_tag.get("href")
            if raw_href and "uddg=" in raw_href:
                try:
                    parsed_url = parse_qs(raw_href.split("?", 1)[1])
                    link = unquote(parsed_url.get("uddg", [""])[0])
                except (IndexError, KeyError):
                    link = raw_href
            else:
                link = raw_href
            results.append(SerpResult(position=i, title=title_tag.text, link=link, snippet=snippet_tag.text.strip() if snippet_tag else ""))
    return results

SUPPORTED_ENGINES = {
    "google": {"base_url": "https://www.google.com/search?q={query}&hl=en&gl=us", "parser": parse_google_serp},
    "bing": {"base_url": "https://www.bing.com/search?q={query}&cc=US", "parser": parse_bing_serp},
    "duckduckgo": {"base_url": "https://html.duckduckgo.com/html/?q={query}", "parser": parse_duckduckgo_serp},
}

async def verify_api_token(
    session: SessionDep,
    x_api_key: Annotated[str, Header()],
) -> User:
    logger.debug(f"Verifying API key: {x_api_key[:8]}...")
    token_data = verify_api_key(x_api_key)
    if not token_data or "user_id" not in token_data:
        logger.warning(f"Invalid API key provided: {x_api_key[:8]}...")
        raise HTTPException(status_code=401, detail="Invalid API key")
    user_id_from_token = token_data["user_id"]
    user = session.get(User, user_id_from_token)
    if not user or not user.is_active:
        logger.warning(f"API key valid, but user is invalid or inactive. User ID: {user_id_from_token}")
        raise HTTPException(status_code=401, detail="Invalid or inactive user")
    is_in_trial = user.is_trial and user.expiry_date and user.expiry_date > datetime.utcnow()
    if not user.has_subscription and not is_in_trial:
        logger.warning(f"User {user.email} lacks active subscription or trial.")
        raise HTTPException(status_code=403, detail="Active subscription or trial required")
    logger.debug(f"API key verified for user: {user.email}")
    return user

@router.post("/generate-api-key", response_model=dict)
async def generate_user_api_key(session: SessionDep, current_user: CurrentUser):
    logger.debug(f"Generating API key for user: {current_user.email}")
    is_in_trial = current_user.is_trial and current_user.expiry_date and current_user.expiry_date > datetime.utcnow()
    if not current_user.has_subscription and not is_in_trial:
        logger.info(f"User {current_user.email} lacks active subscription or trial")
        raise HTTPException(status_code=403, detail="Active subscription or trial required")
    try:
        api_key = generate_api_key(user_id=str(current_user.id))
        token = APIToken(user_id=current_user.id, token=api_key, expires_at=datetime.utcnow() + timedelta(days=365))
        session.add(token)
        session.commit()
        session.refresh(token)
        logger.info(f"API key generated for user: {current_user.email}")
        return {"api_key": api_key}
    except Exception as e:
        logger.error(f"Failed to generate API key for user {current_user.email}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate API key")

@router.get("/regions", response_model=RegionsResponse)
async def list_regions(user: Annotated[User, Depends(verify_api_token)]):
    logger.debug(f"Listing regions for user: {user.email}")
    return RegionsResponse(regions=list(endpoint_manager.endpoints.keys()))

@router.get("/status", response_model=ProxyStatusResponse)
async def get_proxy_status(region: str, user: Annotated[User, Depends(verify_api_token)]):
    logger.debug(f"Checking proxy status for region: {region}, user: {user.email}")
    if region not in endpoint_manager.endpoints:
        logger.info(f"Invalid region: {region}")
        raise HTTPException(status_code=400, detail="Invalid region. Use /regions to list available regions")
    endpoints = endpoint_manager.get_endpoints(region)
    status_tasks = [check_proxy_health(endpoint, region) for endpoint in endpoints]
    results = await asyncio.gather(*status_tasks)
    healthy_count = sum(1 for r in results if r["is_healthy"])
    total_count = len(endpoints)
    avg_response_time = sum(r["response_time"] for r in results) / total_count if total_count > 0 else 0.0
    status = ProxyStatus(
        region=region,
        is_healthy=healthy_count > 0,
        avg_response_time=avg_response_time,
        healthy_endpoints=healthy_count,
        total_endpoints=total_count,
        last_checked=results[0]["last_checked"] if results else datetime.utcnow()
    )
    return ProxyStatusResponse(statuses=[status])

async def proxy_fetch_logic(
    request: Request,
    session: SessionDep,
    region: str,
    proxy_request: ProxyRequest,
    user: User,
    x_api_key: str,
    background_tasks: BackgroundTasks,
) -> ProxyResponse:
    logger.debug(f"Proxy fetch request for URL '{proxy_request.url}' in region: {region}, user: {user.email}")
    if region not in endpoint_manager.endpoints:
        raise HTTPException(status_code=400, detail="Invalid region. Use /regions to list available regions")

    token = session.query(APIToken).filter(APIToken.token == x_api_key).first()
    if not token:
        logger.error(f"API key passed verification but not found in DB for user {user.id}. Possible data inconsistency.")
        raise HTTPException(status_code=401, detail="API key is invalid or has been deactivated.")

    # Define screenshot request as a background task
    async def perform_screenshot_request():
        screenshot_url = f"https://autoparse-41617314059.us-east4.run.app/screenshot?url={quote_plus(str(proxy_request.url))}"
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    screenshot_url,
                    headers={"accept": "application/json", "User-Agent": request.headers.get("user-agent", "DataProxy-Internal-Fetcher/1.0")}
                )
                response.raise_for_status()
                data = response.json()
                logger.info(f"Background screenshot request successful for URL: {proxy_request.url}")
                if data.get("result"):
                    html_preview = data.get("result")[:200]
                    logger.debug(f"Background HTML Preview for {proxy_request.url}: {html_preview}")
        except httpx.ConnectError as e:
            logger.error(f"Network error during background screenshot for URL {proxy_request.url}: {str(e)}")
        except httpx.TimeoutException as e:
            logger.error(f"Timeout during background screenshot for URL {proxy_request.url}: {str(e)}")
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error during background screenshot for URL {proxy_request.url}: {e.response.status_code} {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error during background screenshot for URL {proxy_request.url}: {str(e)}")

    # Schedule screenshot request as a background task
    background_tasks.add_task(perform_screenshot_request)

    # Proxy fetch logic with retry mechanism
    async def try_endpoint(endpoint: str, attempt_region: str, max_retries: int = 3) -> Optional[Dict]:
        endpoint_id = endpoint_manager.get_endpoint_id(attempt_region, endpoint) or "unknown"
        for attempt in range(1, max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    response = await client.post(
                        f"{endpoint}/fetch",
                        json={"url": str(proxy_request.url)},
                        headers={"User-Agent": request.headers.get("user-agent", "DataProxy-Internal-Fetcher/1.0")}
                    )
                    response.raise_for_status()
                    data = response.json()
                    logger.info(f"Proxy fetch successful in {attempt_region} (endpoint: {endpoint_id}, attempt: {attempt})")
                    if data.get("result"):
                        html_preview = data.get("result")[:200]
                        logger.debug(f"HTML Preview for {proxy_request.url}: {html_preview}")
                    return data
            except httpx.ConnectError as e:
                logger.error(f"Network error during proxy fetch in {attempt_region} (endpoint: {endpoint_id}, attempt: {attempt}): {str(e)}")
                if attempt == max_retries:
                    logger.warning(f"Max retries reached for {endpoint_id} in {attempt_region}")
                    return None
                await asyncio.sleep(1.0 * attempt)  # Exponential backoff
            except httpx.TimeoutException as e:
                logger.error(f"Timeout during proxy fetch in {attempt_region} (endpoint: {endpoint_id}, attempt: {attempt}): {str(e)}")
                if attempt == max_retries:
                    logger.warning(f"Max retries reached for {endpoint_id} in {attempt_region}")
                    return None
                await asyncio.sleep(1.0 * attempt)
            except httpx.HTTPStatusError as e:
                logger.error(f"HTTP error during proxy fetch in {attempt_region} (endpoint: {endpoint_id}, attempt: {attempt}): {e.response.status_code} {str(e)}")
                return None
            except Exception as e:
                logger.error(f"Unexpected error during proxy fetch in {attempt_region} (endpoint: {endpoint_id}, attempt: {attempt}): {str(e)}")
                return None
        return None

    regions_to_try = [region] + [r for r in random.sample(list(endpoint_manager.endpoints.keys()), len(endpoint_manager.endpoints)) if r != region]
    for current_region in regions_to_try:
        endpoints = endpoint_manager.get_endpoints(current_region)
        health_tasks = [check_proxy_health(endpoint, current_region) for endpoint in endpoints]
        try:
            health_results = await asyncio.gather(*health_tasks, return_exceptions=True)
            healthy_endpoints = [r["endpoint"] for r in health_results if isinstance(r, dict) and r.get("is_healthy")]
        except Exception as e:
            logger.error(f"Health check failed for region {current_region}: {str(e)}")
            continue

        if not healthy_endpoints:
            logger.warning(f"No healthy endpoints in region: {current_region}. Trying next region.")
            continue

        random.shuffle(healthy_endpoints)
        for endpoint in healthy_endpoints:
            data = await try_endpoint(endpoint, current_region)
            if data:
                token.request_count += 1
                session.commit()
                return ProxyResponse(
                    result=data.get("result", ""),
                    public_ip=data.get("public_ip", "unknown"),
                    device_id=data.get("device_id", "unknown"),
                    region_used=current_region,
                )

    logger.error(f"All proxy fetch attempts failed for user {user.email} across all available regions.")
    raise HTTPException(status_code=503, detail="No healthy proxy endpoints available across all regions.")

@router.post("/fetch", response_model=ProxyResponse)
async def proxy_fetch(
    request: Request,
    session: SessionDep,
    region: str,
    proxy_request: ProxyRequest,
    user: Annotated[User, Depends(verify_api_token)],
    x_api_key: Annotated[str, Header()],
    background_tasks: BackgroundTasks,  # Added to match original
):
    return await proxy_fetch_logic(request, session, region, proxy_request, user, x_api_key, background_tasks)

@router.get("/serp", response_model=SerpResponse)
async def serp_fetch(
    request: Request,
    session: SessionDep,
    q: str,
    region: str,
    user: Annotated[User, Depends(verify_api_token)],
    x_api_key: Annotated[str, Header()],
    background_tasks: BackgroundTasks,
    engine: str = "google",
):
    """
    Fetches a search engine results page (SERP), parses it, and returns structured data.
    """
    logger.debug(f"SERP request for query '{q}' via {engine} in {region} for user {user.email}")
    if engine not in SUPPORTED_ENGINES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported engine '{engine}'. Supported: {list(SUPPORTED_ENGINES.keys())}",
        )
    engine_config = SUPPORTED_ENGINES[engine]
    search_url = engine_config["base_url"].format(query=quote_plus(q))
    proxy_request = ProxyRequest(url=search_url)
    try:
        proxy_response = await proxy_fetch_logic(
            request=request, session=session, region=region,
            proxy_request=proxy_request, user=user, x_api_key=x_api_key, background_tasks=background_tasks
        )
    except HTTPException as e:
        logger.error(f"Proxy fetch logic failed during SERP request: {e.detail}")
        raise e
    html_content = proxy_response.result
    parser_func = engine_config["parser"]
    try:
        organic_results = parser_func(html_content)
        if not organic_results:
            logger.warning(f"Parser for '{engine}' found 0 results for query '{q}'. HTML may have changed.")
        else:
            logger.info(f"Successfully parsed {len(organic_results)} results for query '{q}'")
    except Exception as e:
        logger.error(f"Failed to parse SERP HTML for query '{q}': {e}")
        raise HTTPException(status_code=500, detail="Failed to parse search engine response.")
    return SerpResponse(
        search_engine=engine,
        search_query=q,
        region_used=proxy_response.region_used,
        organic_results=organic_results,
    )

FRONT_PREVIEW_LENGTH = 8
END_PREVIEW_LENGTH = 8

@router.get("/api-keys", response_model=List[APIKeyResponse])
async def list_user_api_keys(session: SessionDep, current_user: CurrentUser):
    logger.debug(f"Listing API keys for user: {current_user.email}")
    api_tokens = session.query(APIToken).filter(
        APIToken.user_id == current_user.id,
        APIToken.is_active == True
    ).all()
    return [
        APIKeyResponse(
            key_preview=f"{token.token[:FRONT_PREVIEW_LENGTH]}...{token.token[-END_PREVIEW_LENGTH:]}",
            created_at=token.created_at.isoformat(),
            expires_at=token.expires_at.isoformat(),
            is_active=token.is_active,
            request_count=token.request_count
        )
        for token in api_tokens
    ]

@router.delete("/api-keys/{key_preview}", status_code=204)
async def delete_api_key(
    key_preview: str,
    session: SessionDep,
    current_user: CurrentUser,
    background_tasks: BackgroundTasks
):
    logger.debug(f"Deleting API key with preview: {key_preview}, user: {current_user.email}")
    if '...' not in key_preview:
        raise HTTPException(status_code=400, detail="Invalid key_preview format. Expected 'start...end'")
    key_start = key_preview.split('...')[0]
    token = session.query(APIToken).filter(
        APIToken.user_id == current_user.id,
        APIToken.token.like(f"{key_start}%"),
        APIToken.is_active == True
    ).first()
    if not token:
        logger.info(f"API key deletion attempted but not found. User: {current_user.id}, Preview: {key_preview}")
        raise HTTPException(status_code=404, detail="API key not found")
    token_data = {
        "token_preview": f"{token.token[:FRONT_PREVIEW_LENGTH]}...{token.token[-END_PREVIEW_LENGTH:]}",
        "request_count": token.request_count
    }
    session.delete(token)
    session.commit()
    def send_deletion_notification():
        try:
            html_content = f"""
            <html><body>
                <h1>API Key Deletion Notification</h1>
                <p>An API Key has been deleted by user {current_user.email} (ID: {current_user.id}).</p>
                <p><strong>Deleted Key Preview:</strong> {token_data['token_preview']}</p>
                <p><strong>Total Requests on Key:</strong> {token_data['request_count']}</p>
                <p><strong>Deletion Time:</strong> {datetime.utcnow().isoformat()} UTC</p>
            </body></html>
            """
            send_email(
                email_to="internal@ROAMINGPROXY.com",
                subject=f"API Key Deletion - User {current_user.id}",
                html_content=html_content
            )
            logger.info(f"Deletion notification sent for token {token_data['token_preview']}")
        except Exception as e:
            logger.error(f"Error sending deletion notification email: {e}")
    background_tasks.add_task(send_deletion_notification)
    logger.info(f"API key with preview {key_preview} deleted for user: {current_user.email}")
    return None