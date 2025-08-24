from typing import Annotated
from fastapi import Depends, HTTPException, Header
from app.config import get_settings

settings = get_settings()

async def verify_api_key(x_api_key: Annotated[str | None, Header()] = None):
    """Verify API key if configured"""
    # For now, API key verification is optional
    # In production, implement proper API key management
    return True

async def get_current_user(api_key_valid: bool = Depends(verify_api_key)):
    """Get current user from API key"""
    if not api_key_valid:
        raise HTTPException(status_code=403, detail="Invalid API key")
    return {"user_id": "default"}