from typing import Any

from pydantic import BaseModel, ConfigDict


class ProvenanceMetadata(BaseModel):
    reference_lap_id: str
    comparison_lap_id: str
    spatial_grid_resolution_m: float = 1.0
    processing_run_id: str
    pipeline_version: str = "2.0.0"
    methodology: str = "Spatial distance-aligned 1m integration"

    model_config = ConfigDict(from_attributes=True)


class PhaseContribution(BaseModel):
    phase_name: str
    category: str  # "braking", "cornering", "acceleration", "straight"
    start_distance: float
    end_distance: float
    distance_span: float
    ref_duration: float
    comp_duration: float
    delta_time: float
    percentage_of_total: float | None = None
    confidence: str = "High"

    model_config = ConfigDict(from_attributes=True)


class CornerTimeGrowth(BaseModel):
    corner_id: str
    corner_name: str
    turn_number: int
    entry_distance: float
    apex_distance: float
    exit_distance: float
    entry_delta_time: float
    apex_delta_time: float
    exit_delta_time: float
    entry_to_apex_growth: float
    apex_to_exit_growth: float
    total_corner_delta: float

    model_config = ConfigDict(from_attributes=True)


class SectorDecomposition(BaseModel):
    sector: int
    start_distance: float
    end_distance: float
    total_delta: float
    corner_contributions: dict[str, float]
    straight_contribution: float
    sector_residual: float

    model_config = ConfigDict(from_attributes=True)


class WaterfallStep(BaseModel):
    step_index: int
    label: str
    category: str  # "baseline", "corner", "straight", "residual", "total"
    start_time: float
    increment: float
    end_time: float
    distance_range: str

    model_config = ConfigDict(from_attributes=True)


class LapDecompositionResult(BaseModel):
    reference_lap_id: str
    comparison_lap_id: str
    data_label: str
    reference_method: str
    total_lap_delta: float
    braking_delta: float
    cornering_delta: float
    acceleration_delta: float
    straight_delta: float
    residual: float  # Explicitly calculated & non-hidden
    phases: list[PhaseContribution]
    corners_growth: list[CornerTimeGrowth]
    sectors: list[SectorDecomposition]
    waterfall_steps: list[WaterfallStep]
    provenance: ProvenanceMetadata

    model_config = ConfigDict(from_attributes=True)


class DescriptiveStatistics(BaseModel):
    metric: str
    sample_count: int
    mean: float
    median: float
    std_dev: float
    variance: float
    p10: float
    p90: float
    ci_95_lower: float
    ci_95_upper: float
    prediction_interval_lower: float
    prediction_interval_upper: float

    model_config = ConfigDict(from_attributes=True)


class OutlierReport(BaseModel):
    method: str
    total_samples: int
    included_count: int
    excluded_count: int
    threshold_lower: float | None = None
    threshold_upper: float | None = None
    excluded_observations: list[dict[str, Any]] = []

    model_config = ConfigDict(from_attributes=True)


class CorrelationResult(BaseModel):
    feature_x: str
    feature_y: str
    pearson_r: float
    pearson_p_value: float
    spearman_rho: float
    spearman_p_value: float
    sample_count: int
    is_significant_005: bool

    model_config = ConfigDict(from_attributes=True)


class RegressionResidual(BaseModel):
    observation_id: str
    actual: float
    predicted: float
    residual: float

    model_config = ConfigDict(from_attributes=True)


class RegressionResult(BaseModel):
    target_metric: str
    feature_metric: str
    slope: float
    intercept: float
    slope_std_error: float
    ci_95_slope_lower: float
    ci_95_slope_upper: float
    r_squared: float
    sample_count: int
    residual_std: float
    heteroscedasticity_p_value: float | None = None
    residuals: list[RegressionResidual] = []

    model_config = ConfigDict(from_attributes=True)


class SensitivityItem(BaseModel):
    feature: str
    baseline_value: float
    observed_variation_std: float
    lap_delta_sensitivity_per_unit: float
    sector_delta_sensitivity_per_unit: float
    sample_count: int
    uncertainty_p_value: float

    model_config = ConfigDict(from_attributes=True)


class RepeatedLapsStatisticsResponse(BaseModel):
    session_id: str
    driver_id: str | None = None
    metric: str
    descriptive: DescriptiveStatistics
    outliers: OutlierReport

    model_config = ConfigDict(from_attributes=True)
