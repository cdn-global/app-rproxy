from fastapi import APIRouter, HTTPException
from sqlmodel import func, select
import uuid
from app.api.deps import CurrentUser, SessionDep
from app.models import LLMModel, LLMModelPublic, LLMModelsPublic, LLMProvider
from app.core.config import settings

router = APIRouter(prefix="/llm-models", tags=["llm-models"])


@router.get("/", response_model=LLMModelsPublic)
def list_llm_models(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
    is_active: bool | None = None,
):
    """List available LLM models with pricing

    Only shows models for providers that have API keys configured
    (either user's personal key or system fallback key)

    Args:
        is_active: Filter by active status. If None, returns all models.
    """
    # Build base query
    count_statement = select(func.count()).select_from(LLMModel)
    statement = (
        select(LLMModel, LLMProvider.name)
        .join(LLMProvider, LLMModel.provider_id == LLMProvider.id)
    )

    # Apply is_active filter only if specified
    if is_active is not None:
        count_statement = count_statement.where(LLMModel.is_active == is_active)
        statement = statement.where(LLMModel.is_active == is_active)

    count = session.exec(count_statement).one()
    statement = statement.offset(skip).limit(limit)
    results = session.exec(statement).all()

    # Helper function to check if API key is valid (not a placeholder)
    def is_valid_api_key(key: str | None) -> bool:
        if not key:
            return False
        # Filter out placeholder values
        placeholder_patterns = [
            "your-key-here",
            "your-actual-key-here",
            "sk-ant-your-key",
            "sk-proj-your-key",
            "your-google-key"
        ]
        return not any(pattern in key for pattern in placeholder_patterns)

    # Helper function to check if API key exists for a provider
    def has_api_key(provider_name: str) -> bool:
        if not current_user:
            # No user logged in, check only system keys
            if provider_name == "anthropic":
                return is_valid_api_key(settings.ANTHROPIC_API_KEY)
            elif provider_name == "openai":
                return is_valid_api_key(settings.OPENAI_API_KEY)
            elif provider_name == "google":
                return is_valid_api_key(settings.GOOGLE_API_KEY)
            return False
        else:
            # User logged in, check user key OR system key
            if provider_name == "anthropic":
                return is_valid_api_key(current_user.anthropic_api_key) or is_valid_api_key(settings.ANTHROPIC_API_KEY)
            elif provider_name == "openai":
                return is_valid_api_key(current_user.openai_api_key) or is_valid_api_key(settings.OPENAI_API_KEY)
            elif provider_name == "google":
                return is_valid_api_key(current_user.google_api_key) or is_valid_api_key(settings.GOOGLE_API_KEY)
            return False

    # Construct model data with provider name, update is_active based on API key availability
    models_data = []
    for model, provider_name in results:
        model_dict = model.model_dump()
        model_dict['provider'] = provider_name

        # Override is_active: model must be active AND have API key configured
        # This shows users which models they can actually use
        model_dict['is_active'] = model.is_active and has_api_key(provider_name)

        models_data.append(LLMModelPublic(**model_dict))

    return LLMModelsPublic(data=models_data, count=len(models_data))


@router.get("/{id}", response_model=LLMModelPublic)
def get_llm_model(session: SessionDep, current_user: CurrentUser, id: uuid.UUID):
    """Get specific LLM model details"""
    model = session.get(LLMModel, id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return model
