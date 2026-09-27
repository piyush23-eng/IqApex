from fastapi import APIRouter, HTTPException, Query

from app.analytics.quality_checker import TelemetryQualityChecker
from app.schemas.responses import TelemetryResponse
from app.services.telemetry_store import DEMO_DATA_LABEL, store
from app.telemetry.downsampler import downsample_telemetry_lttb

router = APIRouter()


@router.get("/telemetry/{lap_id}", response_model=TelemetryResponse, tags=["Telemetry"])
def get_telemetry(
    lap_id: str,
    downsample: int | None = Query(
        None,
        ge=50,
        le=10000,
        description="Target decimated sample count (LTTB algorithm). If omitted, returns raw sampled stream.",
    ),
) -> TelemetryResponse:
    """
    Retrieve high-frequency multi-channel telemetry points for a given lap.
    Enforces downsampling options to protect client memory footprint.
    """
    points = store.telemetry_points.get(lap_id)
    if points is None:
        raise HTTPException(
            status_code=404,
            detail=f"Telemetry data for lap '{lap_id}' not found in active cache",
        )

    lap = store.laps.get(lap_id)
    quality = TelemetryQualityChecker.evaluate_lap(lap, points)

    raw_len = len(points)
    is_downsampled = False
    return_points = points

    if downsample and downsample < raw_len:
        return_points = downsample_telemetry_lttb(points, downsample)
        is_downsampled = True

    is_demo = lap_id.startswith("lap-demo-")
    label = DEMO_DATA_LABEL if is_demo else "Vehicle telemetry recording"

    return TelemetryResponse(
        lap_id=lap_id,
        data_label=label,
        total_raw_points=raw_len,
        returned_points=len(return_points),
        downsampled=is_downsampled,
        data_quality=quality,
        points=return_points,
    )
