from datetime import datetime, timezone

from fastapi import APIRouter

from app.core.config import settings
from app.schemas.responses import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["Diagnostics"])
def get_health() -> HealthResponse:
    """Return platform operational status and environment diagnostics."""
    return HealthResponse(
        status="OPERATIONAL",
        environment=settings.ENVIRONMENT,
        version="0.1.0",
        database_connected=True,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
