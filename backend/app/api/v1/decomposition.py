from typing import Literal

from fastapi import APIRouter, HTTPException, Query

from app.analytics.corner_analysis import MONZA_CORNERS
from app.analytics.decomposition import LapTimeDecomposer
from app.analytics.reference_selector import ReferenceSelectionError, ReferenceSelector
from app.schemas.decomposition import LapDecompositionResult
from app.services.telemetry_store import store
from app.telemetry.resampling import DistanceResampler

router = APIRouter()


@router.get(
    "/analysis/decomposition",
    response_model=LapDecompositionResult,
    tags=["Decomposition"],
)
def get_lap_decomposition(
    comp_lap_id: str = Query(..., description="Comparison lap ID"),
    ref_lap_id: str | None = Query(None, description="Explicit reference lap ID if method=selected_lap"),
    reference_method: Literal[
        "selected_lap", "session_best_valid", "driver_best_valid", "median_valid"
    ] = Query("selected_lap", description="Reference selection methodology"),
    session_id: str = Query("demo-session-monza-2026", description="Active session ID"),
    driver_id: str | None = Query(None, description="Driver ID for driver_best_valid"),
) -> LapDecompositionResult:
    """
    Computes rigorous physical lap-time decomposition:
    Braking, Cornering, Acceleration, and Straight contributions,
    with an explicitly reported non-hidden residual and corner time growth.
    """
    comp_lap = store.laps.get(comp_lap_id)
    if not comp_lap:
        raise HTTPException(status_code=404, detail=f"Comparison lap '{comp_lap_id}' not found")

    try:
        ref_lap, _audit = ReferenceSelector.resolve_reference(
            method=reference_method,
            session_id=session_id,
            driver_id=driver_id,
            selected_lap_id=ref_lap_id,
        )
    except ReferenceSelectionError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    ref_df = store.get_lap_dataframe(ref_lap.lap_id)
    comp_df = store.get_lap_dataframe(comp_lap.lap_id)

    if ref_df is None or comp_df is None:
        raise HTTPException(
            status_code=404,
            detail="Telemetry data missing for one or both requested laps",
        )

    # 1-meter spatial grid resampling over common envelope
    common_min = max(float(ref_df["distance"].min()), float(comp_df["distance"].min()))
    common_max = min(float(ref_df["distance"].max()), float(comp_df["distance"].max()))

    res_ref = DistanceResampler.resample(
        ref_df, distance_step=1.0, start_dist=common_min, end_dist=common_max
    )
    res_comp = DistanceResampler.resample(
        comp_df, distance_step=1.0, start_dist=common_min, end_dist=common_max
    )

    lineage_id = store.lap_lineage.get(ref_lap.lap_id, "pr-demo-baseline-001")

    return LapTimeDecomposer.decompose(
        ref_df=res_ref,
        comp_df=res_comp,
        ref_lap=ref_lap,
        comp_lap=comp_lap,
        corners=MONZA_CORNERS,
        reference_method=reference_method,
        processing_run_id=lineage_id,
    )
