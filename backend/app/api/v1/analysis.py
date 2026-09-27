from typing import Literal

from fastapi import APIRouter, HTTPException, Query

from app.analytics.corner_analysis import (
    CornerKinematicsCalculator,
    get_circuit_corners,
)
from app.analytics.quality_checker import TelemetryQualityChecker
from app.schemas.analysis import (
    AlignedChannelsResponse,
    CircuitCornerDefinition,
    CornerMetric,
    LapComparisonSummary,
)
from app.services.telemetry_store import DEMO_DATA_LABEL, store
from app.telemetry.resampling import DistanceResampler

router = APIRouter()


@router.get(
    "/analysis/corners/{circuit}",
    response_model=list[CircuitCornerDefinition],
    tags=["Analysis"],
)
def get_corners(circuit: str) -> list[CircuitCornerDefinition]:
    """Return verified corner definitions and boundaries for a given circuit."""
    return get_circuit_corners(circuit)


@router.get(
    "/analysis/compare/summary",
    response_model=LapComparisonSummary,
    tags=["Analysis"],
)
def get_comparison_summary(
    ref_lap_id: str = Query(..., description="Reference lap ID (baseline)"),
    comp_lap_id: str = Query(..., description="Comparison lap ID"),
) -> LapComparisonSummary:
    """
    Returns complete engineering comparison summary between two laps:
    drivers, compounds, tyre ages, sector deltas, quality scores, and corner kinematics.
    """
    ref_lap = store.laps.get(ref_lap_id)
    if not ref_lap:
        raise HTTPException(status_code=404, detail=f"Reference lap '{ref_lap_id}' not found")

    comp_lap = store.laps.get(comp_lap_id)
    if not comp_lap:
        raise HTTPException(status_code=404, detail=f"Comparison lap '{comp_lap_id}' not found")

    ref_run = store.runs.get(ref_lap.run_id)
    comp_run = store.runs.get(comp_lap.run_id)

    ref_driver = store.drivers.get(ref_run.driver_id) if ref_run else None
    comp_driver = store.drivers.get(comp_run.driver_id) if comp_run else None

    ref_points = store.telemetry_points.get(ref_lap_id, [])
    comp_points = store.telemetry_points.get(comp_lap_id, [])

    ref_quality = TelemetryQualityChecker.evaluate_lap(ref_lap, ref_points)
    comp_quality = TelemetryQualityChecker.evaluate_lap(comp_lap, comp_points)

    ref_df = store.get_lap_dataframe(ref_lap_id)
    comp_df = store.get_lap_dataframe(comp_lap_id)

    if ref_df is None or comp_df is None:
        raise HTTPException(
            status_code=404,
            detail="Telemetry points missing for one or both requested laps",
        )

    # Align laps on 1-meter grid
    common_min = max(float(ref_df["distance"].min()), float(comp_df["distance"].min()))
    common_max = min(float(ref_df["distance"].max()), float(comp_df["distance"].max()))

    res_ref = DistanceResampler.resample(
        ref_df, distance_step=1.0, start_dist=common_min, end_dist=common_max
    )
    res_comp = DistanceResampler.resample(
        comp_df, distance_step=1.0, start_dist=common_min, end_dist=common_max
    )

    corners = CornerKinematicsCalculator.compute_corner_metrics(res_ref, res_comp)
    sectors = CornerKinematicsCalculator.compute_sector_comparisons(
        ref_s1=ref_lap.sector_1,
        ref_s2=ref_lap.sector_2,
        ref_s3=ref_lap.sector_3,
        comp_s1=comp_lap.sector_1,
        comp_s2=comp_lap.sector_2,
        comp_s3=comp_lap.sector_3,
    )

    is_demo = ref_lap_id.startswith("lap-demo-") or comp_lap_id.startswith("lap-demo-")
    label = DEMO_DATA_LABEL if is_demo else "Vehicle telemetry recording"

    return LapComparisonSummary(
        reference_lap_id=ref_lap_id,
        comparison_lap_id=comp_lap_id,
        data_label=label,
        reference_driver=ref_driver,
        comparison_driver=comp_driver,
        reference_run=ref_run,
        comparison_run=comp_run,
        reference_lap=ref_lap,
        comparison_lap=comp_lap,
        reference_quality_score=ref_quality.quality_score,
        comparison_quality_score=comp_quality.quality_score,
        lap_time_delta=round(comp_lap.lap_time - ref_lap.lap_time, 4),
        sectors=sectors,
        corners=corners,
    )


@router.get(
    "/analysis/compare/corners",
    response_model=list[CornerMetric],
    tags=["Analysis"],
)
def get_corner_comparison(
    ref_lap_id: str = Query(..., description="Reference lap ID"),
    comp_lap_id: str = Query(..., description="Comparison lap ID"),
    sort_by: Literal[
        "turn_number", "time_delta", "exit_speed_delta", "min_speed_delta", "entry_speed_delta"
    ] = Query("turn_number", description="Sort field"),
    sort_order: Literal["asc", "desc"] = Query("asc", description="Sort direction"),
) -> list[CornerMetric]:
    """Returns measured corner metrics between two laps, with engineering sort options."""
    ref_df = store.get_lap_dataframe(ref_lap_id)
    comp_df = store.get_lap_dataframe(comp_lap_id)

    if ref_df is None or comp_df is None:
        raise HTTPException(status_code=404, detail="Telemetry points missing for requested laps")

    common_min = max(float(ref_df["distance"].min()), float(comp_df["distance"].min()))
    common_max = min(float(ref_df["distance"].max()), float(comp_df["distance"].max()))

    res_ref = DistanceResampler.resample(
        ref_df, distance_step=1.0, start_dist=common_min, end_dist=common_max
    )
    res_comp = DistanceResampler.resample(
        comp_df, distance_step=1.0, start_dist=common_min, end_dist=common_max
    )

    metrics = CornerKinematicsCalculator.compute_corner_metrics(res_ref, res_comp)

    reverse = sort_order == "desc"
    if sort_by == "turn_number":
        metrics.sort(key=lambda m: m.turn_number, reverse=reverse)
    elif sort_by == "time_delta":
        metrics.sort(key=lambda m: abs(m.corner_time_delta), reverse=reverse)
    elif sort_by == "exit_speed_delta":
        metrics.sort(key=lambda m: abs(m.exit_speed_delta), reverse=reverse)
    elif sort_by == "min_speed_delta":
        metrics.sort(key=lambda m: abs(m.min_speed_delta), reverse=reverse)
    elif sort_by == "entry_speed_delta":
        metrics.sort(key=lambda m: abs(m.entry_speed_delta), reverse=reverse)

    return metrics


@router.get(
    "/analysis/compare/aligned-channels",
    response_model=AlignedChannelsResponse,
    tags=["Analysis"],
)
def get_aligned_channels(
    ref_lap_id: str = Query(..., description="Reference lap ID"),
    comp_lap_id: str = Query(..., description="Comparison lap ID"),
    distance_step: float = Query(1.0, ge=0.5, le=10.0, description="Grid interval in meters"),
) -> AlignedChannelsResponse:
    """
    Returns full synchronized multi-channel distance streams for both reference and comparison laps:
    Speed, Throttle, Brake, Gear, RPM, DRS, Lat G, Long G, plus Time Delta Δt(s) and Speed Delta Δv(s).
    """
    ref_df = store.get_lap_dataframe(ref_lap_id)
    comp_df = store.get_lap_dataframe(comp_lap_id)

    if ref_df is None or comp_df is None:
        raise HTTPException(status_code=404, detail="Telemetry points missing for requested laps")

    common_min = max(float(ref_df["distance"].min()), float(comp_df["distance"].min()))
    common_max = min(float(ref_df["distance"].max()), float(comp_df["distance"].max()))

    res_ref = DistanceResampler.resample(
        ref_df, distance_step=distance_step, start_dist=common_min, end_dist=common_max
    )
    res_comp = DistanceResampler.resample(
        comp_df, distance_step=distance_step, start_dist=common_min, end_dist=common_max
    )

    dist = [round(float(v), 2) for v in res_ref["distance"].values]
    ref_t = res_ref["timestamp"].values
    comp_t = res_comp["timestamp"].values
    time_delta = [round(float(c - r), 4) for c, r in zip(comp_t, ref_t, strict=True)]

    ref_v = res_ref["speed"].values
    comp_v = res_comp["speed"].values
    speed_delta = [round(float(c - r), 2) for c, r in zip(comp_v, ref_v, strict=True)]

    return AlignedChannelsResponse(
        reference_lap_id=ref_lap_id,
        comparison_lap_id=comp_lap_id,
        point_count=len(dist),
        distance=dist,
        ref_speed=[round(float(v), 2) for v in ref_v],
        comp_speed=[round(float(v), 2) for v in comp_v],
        ref_throttle=[round(float(v), 1) for v in res_ref["throttle"].values],
        comp_throttle=[round(float(v), 1) for v in res_comp["throttle"].values],
        ref_brake=[round(float(v), 1) for v in res_ref["brake"].values],
        comp_brake=[round(float(v), 1) for v in res_comp["brake"].values],
        ref_gear=[int(v) for v in res_ref["gear"].values],
        comp_gear=[int(v) for v in res_comp["gear"].values],
        ref_rpm=[int(v) for v in res_ref["rpm"].values],
        comp_rpm=[int(v) for v in res_comp["rpm"].values],
        ref_drs=[int(v) for v in res_ref["drs"].values],
        comp_drs=[int(v) for v in res_comp["drs"].values],
        ref_lat_g=[round(float(v), 2) for v in res_ref["lateral_acceleration"].values],
        comp_lat_g=[round(float(v), 2) for v in res_comp["lateral_acceleration"].values],
        ref_long_g=[round(float(v), 2) for v in res_ref["longitudinal_acceleration"].values],
        comp_long_g=[round(float(v), 2) for v in res_comp["longitudinal_acceleration"].values],
        time_delta=time_delta,
        speed_delta=speed_delta,
    )
