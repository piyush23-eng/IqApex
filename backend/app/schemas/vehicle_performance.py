from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class VehicleParameterSpec(BaseModel):
    name: str
    unit: str
    minimum: float
    maximum: float
    step: float
    default: float
    source: str
    description: str


class ParameterListResponse(BaseModel):
    parameters: list[VehicleParameterSpec]
    constants: dict[str, float]
    provenance_label: str = "Synthetic engineering dataset"


class VehicleConfigInput(BaseModel):
    front_wing_angle: float = Field(default=18.0, ge=10.0, le=35.0)
    rear_wing_angle: float = Field(default=24.0, ge=15.0, le=40.0)
    ride_height_front: float = Field(default=32.0, ge=25.0, le=45.0)
    ride_height_rear: float = Field(default=42.0, ge=30.0, le=60.0)
    yaw_angle: float = Field(default=1.5, ge=0.0, le=6.0)
    vehicle_speed: float = Field(default=250.0, ge=80.0, le=355.0)
    tyre_grip: float = Field(default=1.75, ge=1.40, le=2.10)
    mass: float = Field(default=810.0, ge=798.0, le=850.0)


class AeroEvaluationResponse(BaseModel):
    cl: float
    cd: float
    downforce_n: float
    drag_n: float
    lift_to_drag: float
    aero_balance_pct: float
    downforce_pi_95: tuple[float, float]
    drag_pi_95: tuple[float, float]
    domain_status: Literal["INTERPOLATION", "EXTRAPOLATION"]
    model_version: str
    dataset_version: str
    dataset_hash: str
    disclaimer: str
    result_type: Literal["MODELLED", "PHYSICS_ESTIMATE"] = "MODELLED"


class VehicleComparisonRequest(BaseModel):
    baseline: VehicleConfigInput
    scenario: VehicleConfigInput


class PerformanceDeltaItem(BaseModel):
    name: str
    unit: str
    baseline: float
    scenario: float
    delta: float
    uncertainty_95: float


class VehicleComparisonResponse(BaseModel):
    metrics: list[PerformanceDeltaItem]
    modeled_lap_time_baseline_s: float
    modeled_lap_time_scenario_s: float
    modeled_lap_time_delta_s: float
    top_speed_baseline_kph: float
    top_speed_scenario_kph: float
    top_speed_delta_kph: float
    mean_lat_g_baseline: float
    mean_lat_g_scenario: float
    mean_lat_g_delta: float
    baseline_domain: str
    scenario_domain: str
    disclaimer: str


class ParetoPointDTO(BaseModel):
    config_id: str
    front_wing_angle: float
    rear_wing_angle: float
    ride_height_front: float
    ride_height_rear: float
    downforce_n: float
    drag_n: float
    lift_to_drag: float
    aero_balance_pct: float
    is_pareto_optimal: bool
    dominance_rank: int


class ParetoFrontierResponse(BaseModel):
    total_evaluated: int
    pareto_efficient_count: int
    dominated_count: int
    points: list[ParetoPointDTO]
    pareto_frontier: list[ParetoPointDTO]
    disclaimer: str
    scientific_label: str


class ResponseSurface2DVehicleResponse(BaseModel):
    x_feature: str
    y_feature: str
    target: str
    x_values: list[float]
    y_values: list[float]
    z_matrix: list[list[float]]
    interpolation_mask: list[list[bool]]
    observed_x_bounds: list[float]
    observed_y_bounds: list[float]
    model_version: str


class CornerSimulationDTO(BaseModel):
    corner_id: str
    corner_name: str
    turn_number: int
    curvature_radius_m: float
    length_m: float
    downforce_n: float
    normal_load_n: float
    max_lateral_force_n: float
    max_lateral_accel_g: float
    max_corner_speed_kph: float
    transit_time_s: float
    domain_status: str


class StraightSimulationDTO(BaseModel):
    straight_name: str
    start_distance_m: float
    end_distance_m: float
    length_m: float
    entry_speed_kph: float
    exit_speed_kph: float
    top_speed_kph: float
    mean_acceleration_g: float
    transit_time_s: float
    drag_at_exit_n: float


class TrackSimulationResponse(BaseModel):
    modeled_lap_time_s: float
    total_corner_time_s: float
    total_straight_time_s: float
    top_speed_kph: float
    mean_lateral_accel_g: float
    corners: list[CornerSimulationDTO]
    straights: list[StraightSimulationDTO]
    disclaimer: str
    circuit: str = "Autodromo Nazionale Monza"


class AeroMonteCarloRequest(BaseModel):
    config: VehicleConfigInput
    iterations: int = Field(default=500, ge=100, le=5000)
    simulation_seed: int = 42871
    cl_uncertainty: float = 0.03
    cd_uncertainty: float = 0.02


class AeroMonteCarloResponse(BaseModel):
    simulation_seed: int
    iterations: int
    mean_lap_time_s: float
    median_lap_time_s: float
    std_dev_lap_time_s: float
    p05_lap_time_s: float
    p10_lap_time_s: float
    p50_lap_time_s: float
    p90_lap_time_s: float
    p95_lap_time_s: float
    p05_downforce_n: float
    p95_downforce_n: float
    mean_downforce_n: float
    bins: list[dict[str, Any]]
    disclaimer: str
    result_type: str = "MODELLED"
