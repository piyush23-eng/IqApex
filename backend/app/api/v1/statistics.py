from typing import Literal

from fastapi import APIRouter, HTTPException, Query

from app.analytics.corner_analysis import MONZA_CORNERS
from app.analytics.statistics import StatisticsEngine
from app.schemas.decomposition import (
    CorrelationResult,
    RegressionResult,
    RepeatedLapsStatisticsResponse,
    SensitivityItem,
)
from app.services.telemetry_store import store
from app.telemetry.resampling import DistanceResampler

router = APIRouter()


@router.get(
    "/analysis/statistics/repeated-laps",
    response_model=RepeatedLapsStatisticsResponse,
    tags=["Statistics"],
)
def get_repeated_laps_statistics(
    session_id: str = Query("demo-session-monza-2026", description="Session identifier"),
    driver_id: str | None = Query(None, description="Optional driver filter"),
    metric: Literal["lap_time", "sector_1", "sector_2", "sector_3"] = Query(
        "lap_time", description="Target metric for distribution"
    ),
) -> RepeatedLapsStatisticsResponse:
    """
    Computes statistical distribution across repeated stint laps:
    mean, median, std dev, P10, P90, 95% Confidence Interval,
    and transparent outlier audit reporting.
    """
    session_runs = [r for r in store.runs.values() if r.session_id == session_id]
    if driver_id:
        session_runs = [r for r in session_runs if r.driver_id == driver_id]

    run_ids = {r.run_id for r in session_runs}
    laps = [l for l in store.laps.values() if l.run_id in run_ids and l.valid]

    if not laps:
        raise HTTPException(
            status_code=404, detail=f"No valid laps found for session '{session_id}'"
        )

    # Extract metric values
    vals: list[float] = []
    obs_ids: list[str] = []
    for l in laps:
        val = getattr(l, metric, None)
        if val is not None:
            vals.append(float(val))
            obs_ids.append(f"{l.lap_id} (L{l.lap_number})")

    # Detect outliers
    outliers = StatisticsEngine.detect_outliers(vals, observation_ids=obs_ids, method="iqr")

    # Compute descriptive stats on included set (or all if none excluded)
    included_vals = [
        vals[i]
        for i in range(len(vals))
        if obs_ids[i] not in {o["id"] for o in outliers.excluded_observations}
    ]
    if not included_vals:
        included_vals = vals

    desc = StatisticsEngine.compute_descriptive_stats(
        included_vals, metric_name=metric, confidence_level=0.95
    )

    return RepeatedLapsStatisticsResponse(
        session_id=session_id,
        driver_id=driver_id,
        metric=metric,
        descriptive=desc,
        outliers=outliers,
    )


@router.get(
    "/analysis/statistics/correlation",
    response_model=CorrelationResult,
    tags=["Statistics"],
)
def get_correlation(
    session_id: str = Query("demo-session-monza-2026", description="Session identifier"),
    feature_x: Literal["sector_1", "sector_2", "sector_3", "tyre_age"] = Query(
        "sector_1", description="Feature X"
    ),
    feature_y: Literal["lap_time", "sector_2", "sector_3"] = Query(
        "lap_time", description="Feature Y"
    ),
) -> CorrelationResult:
    """
    Computes Pearson r and Spearman rho correlations with sample counts and p-values.
    Does not assume or imply causality.
    """
    session_runs = {r.run_id: r for r in store.runs.values() if r.session_id == session_id}
    laps = [l for l in store.laps.values() if l.run_id in session_runs and l.valid]

    if len(laps) < 3:
        raise HTTPException(
            status_code=400, detail="Insufficient valid laps in session for correlation analysis"
        )

    x_vals: list[float] = []
    y_vals: list[float] = []

    for l in laps:
        run = session_runs.get(l.run_id)
        if feature_x == "tyre_age":
            x_val = float(run.tyre_age + l.lap_number - 1) if run else float(l.lap_number)
        else:
            x_val = float(getattr(l, feature_x, 0.0))

        y_val = float(getattr(l, feature_y, 0.0))

        x_vals.append(x_val)
        y_vals.append(y_val)

    return StatisticsEngine.compute_correlation(
        x_vals=x_vals,
        y_vals=y_vals,
        feat_x=feature_x,
        feat_y=feature_y,
    )


@router.get(
    "/analysis/statistics/regression",
    response_model=RegressionResult,
    tags=["Statistics"],
)
def get_linear_regression(
    session_id: str = Query("demo-session-monza-2026", description="Session identifier"),
    feature_metric: Literal["tyre_age", "sector_1", "sector_2"] = Query(
        "tyre_age", description="Independent variable (X)"
    ),
    target_metric: Literal["lap_time", "sector_2", "sector_3"] = Query(
        "lap_time", description="Dependent variable (Y)"
    ),
    driver_id: str | None = Query(None, description="Optional driver filter"),
) -> RegressionResult:
    """
    Computes OLS linear regression (e.g. tyre degradation model):
    slope, intercept, std error, 95% confidence interval on slope, R², and residual diagnostics.
    """
    session_runs = {r.run_id: r for r in store.runs.values() if r.session_id == session_id}
    if driver_id:
        session_runs = {rid: r for rid, r in session_runs.items() if r.driver_id == driver_id}

    laps = [l for l in store.laps.values() if l.run_id in session_runs and l.valid]

    if len(laps) < 3:
        raise HTTPException(
            status_code=400, detail="Insufficient samples for linear regression analysis"
        )

    x_vals: list[float] = []
    y_vals: list[float] = []
    obs_ids: list[str] = []

    for l in laps:
        run = session_runs.get(l.run_id)
        if feature_metric == "tyre_age":
            x_val = float(run.tyre_age + l.lap_number - 1) if run else float(l.lap_number)
        else:
            x_val = float(getattr(l, feature_metric, 0.0))

        y_val = float(getattr(l, target_metric, 0.0))

        x_vals.append(x_val)
        y_vals.append(y_val)
        obs_ids.append(f"Lap {l.lap_number}")

    return StatisticsEngine.compute_linear_regression(
        x_vals=x_vals,
        y_vals=y_vals,
        obs_ids=obs_ids,
        target_metric=target_metric,
        feat_metric=feature_metric,
    )


@router.get(
    "/analysis/statistics/sensitivity",
    response_model=list[SensitivityItem],
    tags=["Statistics"],
)
def get_sensitivity(
    ref_lap_id: str = Query("lap-demo-02", description="Reference lap ID"),
    comp_lap_id: str = Query("lap-demo-03", description="Comparison lap ID"),
) -> list[SensitivityItem]:
    """
    Evaluates preliminary parameter sensitivity:
    Observed variation and relationship to corner/sector time deltas.
    """
    ref_df = store.get_lap_dataframe(ref_lap_id)
    comp_df = store.get_lap_dataframe(comp_lap_id)

    if ref_df is None or comp_df is None:
        raise HTTPException(status_code=404, detail="Telemetry not found for requested laps")

    res_ref = DistanceResampler.resample(ref_df, distance_step=1.0)
    res_comp = DistanceResampler.resample(comp_df, distance_step=1.0)

    return StatisticsEngine.compute_sensitivity(
        corners=MONZA_CORNERS,
        ref_df=res_ref,
        comp_df=res_comp,
    )
