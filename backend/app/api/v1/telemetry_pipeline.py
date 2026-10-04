from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, ConfigDict, Field

from app.analytics.quality_checker import TelemetryQualityChecker
from app.schemas.domain import Lap, TelemetryPoint
from app.schemas.lineage import (
    IngestionResult,
    LapComparisonResponse,
    ProcessingRun,
    TelemetryInspectionResult,
)
from app.schemas.quality import DataQualityResult
from app.schemas.responses import TelemetryResponse
from app.services.telemetry_store import DEMO_DATA_LABEL, store
from app.telemetry.alignment import TimeDeltaCalculator
from app.telemetry.mapping import ChannelMappingError
from app.telemetry.pipeline import TelemetryIngestionPipeline
from app.telemetry.resampling import DistanceResampler
from app.telemetry.units import CANONICAL_UNITS

router = APIRouter()


class CompareRequest(BaseModel):
    reference_lap_id: str = Field(..., description="Canonical reference lap identifier")
    comparison_lap_id: str = Field(..., description="Comparison lap identifier")
    distance_step: float = Field(
        1.0, ge=0.2, le=50.0, description="Spatial resolution in meters"
    )

    model_config = ConfigDict(from_attributes=True)


class ResampleRequest(BaseModel):
    lap_id: str
    distance_step: float = Field(
        1.0, ge=0.2, le=50.0, description="Spatial resolution in meters"
    )

    model_config = ConfigDict(from_attributes=True)


class LapMetadataResponse(BaseModel):
    lap_id: str
    run_id: str
    session_id: str
    data_label: str
    raw_points_count: int
    lineage: ProcessingRun | None

    model_config = ConfigDict(from_attributes=True)


class LapChannelsResponse(BaseModel):
    lap_id: str
    channels: list[str]
    channel_units: dict[str, str]

    model_config = ConfigDict(from_attributes=True)


@router.get(
    "/telemetry/sample-csv",
    tags=["Telemetry Pipeline"],
    summary="Download canonical sample telemetry CSV",
)
def get_sample_telemetry_csv():
    """Return the reference lap sample CSV for quick ingestion testing."""
    candidates = [
        Path("examples/telemetry/reference_lap.csv"),
        Path(__file__).resolve().parents[4] / "examples" / "telemetry" / "reference_lap.csv",
    ]
    for p in candidates:
        if p.exists():
            return FileResponse(
                str(p),
                media_type="text/csv",
                filename="reference_lap.csv",
            )
    raise HTTPException(status_code=404, detail="Sample CSV not found")


@router.post(
    "/telemetry/inspect",
    response_model=TelemetryInspectionResult,
    tags=["Telemetry Pipeline"],
)
async def inspect_telemetry(
    file: Annotated[UploadFile, File()],
) -> TelemetryInspectionResult:
    """
    Inspects a raw CSV or Parquet telemetry file without altering state or persisting.
    Reports row count, column mapping, detected units, sampling frequency, and warnings.
    """
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty (0 bytes)")

    filename = file.filename or "unknown.csv"
    try:
        return TelemetryIngestionPipeline.inspect(content, filename=filename)
    except (ValueError, KeyError, OSError) as e:
        raise HTTPException(status_code=400, detail=f"Inspection failed: {e!s}") from e


@router.post(
    "/telemetry/ingest", response_model=IngestionResult, tags=["Telemetry Pipeline"]
)
async def ingest_telemetry(
    file: Annotated[UploadFile, File()],
    session_id: Annotated[str, Form()] = "demo-session-monza-2026",
    run_id: Annotated[str, Form()] = "run-03-soft-stint",
    lap_id: Annotated[str, Form()] = "lap-ingested-01",
    lap_number: Annotated[int, Form()] = 1,
    lap_time: Annotated[float, Form()] = 80.0,
    resample_step: Annotated[float, Form()] = 1.0,
) -> IngestionResult:
    """
    Executes the end-to-end ingestion pipeline:
    Adapter -> Channel Mapping -> Unit Normalization -> Quality Validation -> 1m Resampling -> Parquet Storage.
    """
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty (0 bytes)")

    filename = file.filename or "uploaded_telemetry.csv"

    # Create dummy or lookup lap metadata
    lap_meta = store.laps.get(lap_id) or Lap(
        lap_id=lap_id,
        run_id=run_id,
        lap_number=lap_number,
        lap_time=lap_time,
        sector_1=round(lap_time * 0.33, 3),
        sector_2=round(lap_time * 0.34, 3),
        sector_3=round(lap_time * 0.33, 3),
        valid=True,
    )

    try:
        res = TelemetryIngestionPipeline.ingest(
            source=content,
            filename=filename,
            session_id=session_id,
            run_id=run_id,
            lap_id=lap_id,
            lap_metadata=lap_meta,
            resample_distance_step=resample_step,
        )

        # Register into in-memory store for subsequent queries
        store.laps[lap_id] = lap_meta
        if res.points:
            store.telemetry_points[lap_id] = res.points
        store.processing_runs[res.processing_run_id] = res.lineage
        store.lap_lineage[lap_id] = res.processing_run_id

        return res
    except (ValueError, KeyError, ChannelMappingError, OSError) as e:
        raise HTTPException(
            status_code=400, detail=f"Ingestion pipeline failure: {e!s}"
        ) from e


@router.get(
    "/telemetry/{lap_id}/metadata",
    response_model=LapMetadataResponse,
    tags=["Telemetry Pipeline"],
)
def get_lap_telemetry_metadata(lap_id: str) -> LapMetadataResponse:
    """Returns telemetry file metadata and cryptographic processing lineage."""
    lap = store.laps.get(lap_id)
    if not lap:
        raise HTTPException(status_code=404, detail=f"Lap '{lap_id}' not found")

    points = store.telemetry_points.get(lap_id, [])
    pr_id = store.lap_lineage.get(lap_id)
    lineage = store.processing_runs.get(pr_id) if pr_id else None

    run = store.runs.get(lap.run_id)
    session_id = run.session_id if run else "unknown-session"
    is_demo = lap_id.startswith("lap-demo-")

    return LapMetadataResponse(
        lap_id=lap_id,
        run_id=lap.run_id,
        session_id=session_id,
        data_label=DEMO_DATA_LABEL if is_demo else "Vehicle telemetry recording",
        raw_points_count=len(points),
        lineage=lineage,
    )


@router.get(
    "/telemetry/{lap_id}/channels",
    response_model=LapChannelsResponse,
    tags=["Telemetry Pipeline"],
)
def get_lap_channels(lap_id: str) -> LapChannelsResponse:
    """Returns available telemetry channels and canonical units for the lap."""
    points = store.telemetry_points.get(lap_id)
    if points is None:
        raise HTTPException(
            status_code=404, detail=f"Telemetry for lap '{lap_id}' not found"
        )

    channels = [
        "timestamp",
        "distance",
        "speed",
        "throttle",
        "brake",
        "gear",
        "rpm",
        "drs",
        "lateral_acceleration",
        "longitudinal_acceleration",
    ]
    units = {ch: CANONICAL_UNITS.get(ch, "UNKNOWN") for ch in channels}

    return LapChannelsResponse(
        lap_id=lap_id,
        channels=channels,
        channel_units=units,
    )


@router.get(
    "/telemetry/{lap_id}/quality",
    response_model=DataQualityResult,
    tags=["Telemetry Pipeline"],
)
def get_lap_quality(lap_id: str) -> DataQualityResult:
    """Returns the validated DataQualityResult for the given lap."""
    lap = store.laps.get(lap_id)
    if not lap:
        raise HTTPException(status_code=404, detail=f"Lap '{lap_id}' not found")

    points = store.telemetry_points.get(lap_id)
    if points is None:
        raise HTTPException(
            status_code=404, detail=f"Telemetry for lap '{lap_id}' not found"
        )

    return TelemetryQualityChecker.evaluate_lap(lap, points)


@router.get(
    "/telemetry/{lap_id}/aligned",
    response_model=TelemetryResponse,
    tags=["Telemetry Pipeline"],
)
def get_lap_aligned_telemetry(
    lap_id: str,
    distance_step: float = Query(
        1.0, ge=0.5, le=10.0, description="Spatial grid interval in meters"
    ),
) -> TelemetryResponse:
    """Returns canonical telemetry resampled onto a uniform distance grid (default 1.0 meter)."""
    df = store.get_lap_dataframe(lap_id)
    if df is None:
        raise HTTPException(
            status_code=404, detail=f"Telemetry for lap '{lap_id}' not found"
        )

    lap = store.laps.get(lap_id)
    resampled_df = DistanceResampler.resample(df, distance_step=distance_step)

    points: list[TelemetryPoint] = []
    for row in resampled_df.itertuples(index=False):
        points.append(
            TelemetryPoint(
                timestamp=float(row.timestamp),
                distance=float(row.distance),
                speed=float(row.speed),
                throttle=float(row.throttle),
                brake=float(row.brake),
                gear=int(row.gear),
                rpm=int(row.rpm),
                drs=int(row.drs),
                lateral_acceleration=float(row.lateral_acceleration),
                longitudinal_acceleration=float(row.longitudinal_acceleration),
            )
        )

    quality = TelemetryQualityChecker.evaluate_lap(lap, points)
    is_demo = lap_id.startswith("lap-demo-")

    return TelemetryResponse(
        lap_id=lap_id,
        data_label=DEMO_DATA_LABEL if is_demo else "Vehicle telemetry recording",
        total_raw_points=len(df),
        returned_points=len(points),
        downsampled=True,
        data_quality=quality,
        points=points,
    )


@router.post(
    "/telemetry/compare",
    response_model=LapComparisonResponse,
    tags=["Telemetry Pipeline"],
)
def compare_laps(request: CompareRequest) -> LapComparisonResponse:
    """
    Computes spatial multi-lap delta metrics between reference and comparison laps:
    Δt(s) = t_comp(s) - t_ref(s)
    Δv(s) = v_comp(s) - v_ref(s)
    """
    ref_df = store.get_lap_dataframe(request.reference_lap_id)
    if ref_df is None:
        raise HTTPException(
            status_code=404,
            detail=f"Reference lap '{request.reference_lap_id}' not found",
        )

    comp_df = store.get_lap_dataframe(request.comparison_lap_id)
    if comp_df is None:
        raise HTTPException(
            status_code=404,
            detail=f"Comparison lap '{request.comparison_lap_id}' not found",
        )

    try:
        return TimeDeltaCalculator.compute(
            reference_df=ref_df,
            comparison_df=comp_df,
            reference_lap_id=request.reference_lap_id,
            comparison_lap_id=request.comparison_lap_id,
            distance_step=request.distance_step,
        )
    except (ValueError, KeyError, RuntimeError) as e:
        raise HTTPException(status_code=400, detail=f"Comparison failed: {e!s}") from e


@router.post(
    "/telemetry/resample", response_model=TelemetryResponse, tags=["Telemetry Pipeline"]
)
def resample_lap(request: ResampleRequest) -> TelemetryResponse:
    """Resamples an active lap onto a specified spatial distance grid."""
    return get_lap_aligned_telemetry(
        request.lap_id, distance_step=request.distance_step
    )
