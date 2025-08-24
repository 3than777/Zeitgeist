from fastapi import APIRouter, Depends
from typing import Dict, Any
import logging

from app.config import get_settings
from app.services.polygon_service import PolygonService
from app.services.openai_service import OpenAIService

router = APIRouter()
logger = logging.getLogger(__name__)
settings = get_settings()

@router.get("/")
async def health_check() -> Dict[str, Any]:
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "version": settings.version,
        "service": settings.project_name
    }

@router.get("/ready")
async def readiness_check() -> Dict[str, Any]:
    """Readiness check with external service validation"""
    services_status = {
        "polygon": await check_polygon_health(),
        "openai": await check_openai_health(),
    }
    
    all_healthy = all(s["healthy"] for s in services_status.values())
    
    return {
        "ready": all_healthy,
        "services": services_status
    }

async def check_polygon_health() -> Dict[str, Any]:
    """Check Polygon.io API health"""
    try:
        async with PolygonService() as polygon:
            # Try to get data for a common ticker
            await polygon.get_current_price("AAPL")
        return {"healthy": True, "message": "Connected"}
    except Exception as e:
        logger.error(f"Polygon health check failed: {e}")
        return {"healthy": False, "message": str(e)}

async def check_openai_health() -> Dict[str, Any]:
    """Check OpenAI API health"""
    try:
        async with OpenAIService() as openai:
            # Simple test prompt
            await openai.complete("Test", system_prompt="Reply with OK")
        return {"healthy": True, "message": "Connected"}
    except Exception as e:
        logger.error(f"OpenAI health check failed: {e}")
        return {"healthy": False, "message": str(e)}