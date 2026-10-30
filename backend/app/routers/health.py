from fastapi import APIRouter
from backend.app.schemas import HealthResponse
from backend.app.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health", response_model=HealthResponse)
async def get_health():
    """
    Health check endpoint for container probes, uptime monitoring, and client readiness.
    """
    return HealthResponse(
        ok=True,
        version=settings.VERSION,
        mode=settings.MODE
    )
