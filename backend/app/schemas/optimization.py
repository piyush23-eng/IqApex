from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class ParameterDefinitionSchema(BaseModel):
    name: str
    unit: str
    minimum: float
    maximum: float
    step: float
    source: Literal["telemetry", "metadata", "session", "proxy"]
    allowed_perturbation: tuple[float, float]
    description: str


class ModelMetricsSchema(BaseModel):
    mae: float
    rmse: float
    r_squared: float
    cv_rmse: float
    sample_count: int
    residual_mean: float
    residual_std: float
    shapiro_p_value: float | None = None


class ModelMetadataSchema(BaseModel):
    model_id: str
    model_type: Literal["linear", "polynomial", "spline", "interaction"]
    features: list[str]
    target: str
    training_dataset: str
    validation_methodology: str
    training_timestamp: str
    pipeline_version: str
    metrics: ModelMetricsSchema
    observed_domain: dict[str, tuple[float, float]]
    model_hash: str
    training_data_type: str = "Synthetic demonstration dataset"


class ObservedDataPointSchema(BaseModel):
    lap_id: str
    x_val: float
    y_val: float


class ResponseCurvePointSchema(BaseModel):
    x: float
    y_modelled: float
    ci_95_lower: float
    ci_95_upper: float
    pi_95_lower: float
    pi_95_upper: float
    is_extrapolation: bool


class ResponseCurveResponse(BaseModel):
    parameter_name: str
    target_name: str
    baseline_x: float
    baseline_y: float
    scenario_x: float
    scenario_y: float
    predicted_delta: float
    uncertainty_95: float
    domain_status: Literal["INTERPOLATION", "EXTRAPOLATION"]
    extrapolation_warning: str | None = None
    observed_range: tuple[float, float]
    points: list[ResponseCurvePointSchema]
    observed_data: list[ObservedDataPointSchema]
    model_metadata: ModelMetadataSchema
    provenance: dict[str, Any]


class ResponseSurface2DResponse(BaseModel):
    feature_x1: str
    feature_x2: str
    target_name: str
    x1_values: list[float]
    x2_values: list[float]
    z_matrix: list[list[float]]
    interpolation_mask: list[list[bool]]
    observed_x1_range: tuple[float, float]
    observed_x2_range: tuple[float, float]
    observed_scatter: list[dict[str, Any]]
    model_metadata: ModelMetadataSchema
    provenance: dict[str, Any]


class LocalSensitivitySchema(BaseModel):
    parameter_name: str
    target_name: str
    baseline_value: float
    perturbation_unit: float
    predicted_delta: float
    local_derivative: float
    uncertainty_95: float
    observed_range: tuple[float, float]
    sample_count: int
    model_type: str
    model_validation_status: str
    result_type: Literal["MODELLED"] = "MODELLED"


class SweepPointSchema(BaseModel):
    parameter_value: float
    predicted_target: float
    predicted_delta: float
    uncertainty_95: float
    is_extrapolation: bool
    distance_from_observed_range: float


class ParameterSweepResponse(BaseModel):
    parameter_name: str
    target_name: str
    unit: str
    baseline_value: float
    baseline_target: float
    observed_range: tuple[float, float]
    points: list[SweepPointSchema]
    model_metadata: ModelMetadataSchema
    result_type: Literal["MODELLED"] = "MODELLED"


class HistogramBinSchema(BaseModel):
    bin_start: float
    bin_end: float
    count: int
    frequency: float


class MonteCarloSimulationRequest(BaseModel):
    parameter_name: str = "corner_exit_speed"
    target_name: str = "corner_time"
    baseline_value: float = 181.2
    scenario_mean: float = 183.0
    scenario_std: float = 0.8
    iterations: int = Field(default=10000, ge=100, le=100000)
    simulation_seed: int = Field(default=42871)
    include_residual_variance: bool = True
    session_id: str = "demo-session-monza-2026"
    corner_id: str = "T9"


class MonteCarloSimulationResponse(BaseModel):
    simulation_seed: int
    iterations: int
    parameter_name: str
    target_name: str
    baseline_value: float
    scenario_mean: float
    scenario_std: float
    mean_delta: float
    median_delta: float
    std_dev_delta: float
    p05_delta: float
    p10_delta: float
    p50_delta: float
    p90_delta: float
    p95_delta: float
    bins: list[HistogramBinSchema]
    result_type: Literal["MODELLED"] = "MODELLED"
    disclaimer: str
    provenance: dict[str, Any]


class ConstrainedOptimizationRequest(BaseModel):
    parameter_name: str = "corner_exit_speed"
    target_name: str = "corner_time"
    baseline_value: float = 181.2
    allow_extrapolation: bool = False
    robust_penalty_lambda: float = Field(default=1.0, ge=0.0, le=5.0)
    session_id: str = "demo-session-monza-2026"
    corner_id: str = "T9"


class ScenarioOutcomeSchema(BaseModel):
    name: str
    scenario_type: Literal["NOMINAL", "CONSERVATIVE", "ROBUST"]
    parameter_value: float
    predicted_target: float
    predicted_delta: float
    uncertainty_95: float
    data_domain: Literal["INTERPOLATION", "EXTRAPOLATION"]
    is_extrapolation: bool
    constraints_satisfied: bool
    description: str


class ConstrainedOptimizationResponse(BaseModel):
    parameter_name: str
    target_name: str
    unit: str
    baseline_value: float
    baseline_target: float
    observed_range: tuple[float, float]
    configured_bounds: tuple[float, float]
    scenarios: list[ScenarioOutcomeSchema]
    model_version: str
    validation_rmse: float
    result_type: Literal["OPTIMIZED"] = "OPTIMIZED"
    disclaimer: str
    provenance: dict[str, Any]
