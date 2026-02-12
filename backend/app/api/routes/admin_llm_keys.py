from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
from pathlib import Path

from app.api.deps import CurrentUser
from app.core.config import settings

router = APIRouter(prefix="/admin/llm-keys", tags=["admin"])


class SystemAPIKeys(BaseModel):
    anthropic_masked: Optional[str] = None
    openai_masked: Optional[str] = None
    google_masked: Optional[str] = None
    anthropic_configured: bool = False
    openai_configured: bool = False
    google_configured: bool = False


class UpdateSystemAPIKeys(BaseModel):
    anthropic_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    google_api_key: Optional[str] = None


def mask_api_key(key: str | None) -> str | None:
    """Mask an API key, showing only first 8 and last 4 characters"""
    if not key or len(key) < 12:
        return None
    return f"{key[:8]}...{key[-4:]}"


def is_valid_api_key(key: str | None) -> bool:
    """Check if API key is valid (not a placeholder)"""
    if not key:
        return False
    placeholder_patterns = [
        "your-key-here",
        "your-actual-key-here",
        "sk-ant-your-key",
        "sk-proj-your-key",
        "your-google-key"
    ]
    return not any(pattern in key for pattern in placeholder_patterns)


@router.get("/", response_model=SystemAPIKeys)
def get_system_api_keys(current_user: CurrentUser):
    """Get system API keys status (superuser only)"""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Superuser access required")
    
    return SystemAPIKeys(
        anthropic_masked=mask_api_key(settings.ANTHROPIC_API_KEY) if is_valid_api_key(settings.ANTHROPIC_API_KEY) else None,
        openai_masked=mask_api_key(settings.OPENAI_API_KEY) if is_valid_api_key(settings.OPENAI_API_KEY) else None,
        google_masked=mask_api_key(settings.GOOGLE_API_KEY) if is_valid_api_key(settings.GOOGLE_API_KEY) else None,
        anthropic_configured=is_valid_api_key(settings.ANTHROPIC_API_KEY),
        openai_configured=is_valid_api_key(settings.OPENAI_API_KEY),
        google_configured=is_valid_api_key(settings.GOOGLE_API_KEY),
    )


@router.patch("/")
def update_system_api_keys(
    keys: UpdateSystemAPIKeys,
    current_user: CurrentUser
):
    """Update system API keys in .env file (superuser only)"""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Superuser access required")
    
    # Find the .env file
    env_path = Path(__file__).parent.parent.parent.parent / ".env"
    
    if not env_path.exists():
        raise HTTPException(status_code=404, detail=".env file not found")
    
    # Read current .env content
    env_content = env_path.read_text()
    
    # Update API keys if provided
    if keys.anthropic_api_key is not None:
        if "ANTHROPIC_API_KEY=" in env_content:
            # Replace existing
            lines = env_content.split('\n')
            for i, line in enumerate(lines):
                if line.startswith("ANTHROPIC_API_KEY="):
                    lines[i] = f"ANTHROPIC_API_KEY={keys.anthropic_api_key}"
                    break
            env_content = '\n'.join(lines)
        else:
            # Add new
            env_content += f"\nANTHROPIC_API_KEY={keys.anthropic_api_key}\n"
        
        # Update settings in memory
        settings.ANTHROPIC_API_KEY = keys.anthropic_api_key
    
    if keys.openai_api_key is not None:
        if "OPENAI_API_KEY=" in env_content:
            lines = env_content.split('\n')
            for i, line in enumerate(lines):
                if line.startswith("OPENAI_API_KEY="):
                    lines[i] = f"OPENAI_API_KEY={keys.openai_api_key}"
                    break
            env_content = '\n'.join(lines)
        else:
            env_content += f"\nOPENAI_API_KEY={keys.openai_api_key}\n"
        
        settings.OPENAI_API_KEY = keys.openai_api_key
    
    if keys.google_api_key is not None:
        if "GOOGLE_API_KEY=" in env_content:
            lines = env_content.split('\n')
            for i, line in enumerate(lines):
                if line.startswith("GOOGLE_API_KEY="):
                    lines[i] = f"GOOGLE_API_KEY={keys.google_api_key}"
                    break
            env_content = '\n'.join(lines)
        else:
            env_content += f"\nGOOGLE_API_KEY={keys.google_api_key}\n"
        
        settings.GOOGLE_API_KEY = keys.google_api_key
    
    # Write back to .env
    env_path.write_text(env_content)
    
    return {
        "message": "System API keys updated successfully",
        "note": "Changes are applied immediately. No restart required."
    }
