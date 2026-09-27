from fastapi import APIRouter, HTTPException

from app.analytics.quality_checker import TelemetryQualityChecker
from app.schemas.responses import LapDetailResponse
from app.services.telemetry_store import DEMO_DATA_LABEL, store

router = APIRouter()


@router.get("/laps/{lap_id}", response_model=LapDetailResponse, tags=["Laps"])
def get_lap(lap_id: str) -> LapDetailResponse:
    """Retrieve lap sector split times, validation status, and data quality check."""
    lap = store.laps.get(lap_id)
    if not lap:
        raise HTTPException(status_code=404, detail=f"Lap '{lap_id}' not found")

    points = store.telemetry_points.get(lap_id, [])
    quality = None
    if points:
        quality = TelemetryQualityChecker.evaluate_lap(lap, points)

    is_demo = lap_id.startswith("lap-demo-")
    label = DEMO_DATA_LABEL if is_demo else "Official trackside lap"

    return LapDetailResponse(
        lap=lap,
        data_label=label,
        telemetry_available=len(points) > 0,
        data_quality=quality,
    )
