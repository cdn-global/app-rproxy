from fastapi import APIRouter

from app.api.routes import (
    items, login, private, users, utils, proxy, checkout, user_agent, subscription,
    billing, servers, database_instances, inference, terminal, terminal_test, storage,
    llm_models, llm_inference, conversations, billing_reports, admin_llm_keys,
    api_keys,
)
from app.core.config import settings

api_router = APIRouter()

# Existing routes
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(items.router)
api_router.include_router(subscription.router)
api_router.include_router(checkout.router)
api_router.include_router(user_agent.router)
api_router.include_router(proxy.router)

# Hosting infrastructure routes
api_router.include_router(billing.router, prefix="/billing")
api_router.include_router(servers.router, prefix="/servers")
api_router.include_router(database_instances.router, prefix="/database-instances")
api_router.include_router(inference.router, prefix="/inference")
api_router.include_router(terminal.router, prefix="/terminal")
api_router.include_router(terminal_test.router, prefix="/terminal")
api_router.include_router(storage.router, prefix="/storage")

# LLM routes
api_router.include_router(llm_models.router)
api_router.include_router(llm_inference.router)
api_router.include_router(conversations.router)
api_router.include_router(billing_reports.router)
api_router.include_router(admin_llm_keys.router)
api_router.include_router(api_keys.router)

# Private routes for local environment
if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
