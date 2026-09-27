from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class StintDefinitionInput(BaseModel):
    compound: str
    laps: int = Field(ge=5, le=53)


class RaceSimulationRequest(BaseModel):
    strategy_id: str = "STRAT_CUSTOM"
    stints: list[StintDefinitionInput]
    weather: str = "DRY"
    safety_car: str = "GREEN"
    traffic: str = "LIGHT_TRAFFIC"
    cl_total: float | None = None
    cd_total: float | None = None


class SimulatedLapDTO(BaseModel):
    lap_number: int
    stint_number: int
    compound: str
    tyre_age: int
    fuel_remaining_kg: float
    vehicle_mass_kg: float
    effective_grip: float
    base_lap_time_s: float
    tyre_penalty_s: float
    fuel_effect_s: float
    traffic_penalty_s: float
    interruption_penalty_s: float
    lap_time_s: float
    cumulative_time_s: float
    is_pit_in_lap: bool
    pit_loss_s: float


class StintSimulationDTO(BaseModel):
    stint_number: int
    compound: str
    start_lap: int
    end_lap: int
    stint_length: int
    total_stint_time_s: float
    mean_lap_time_s: float
    start_tyre_age: int
    end_tyre_age: int
    laps: list[SimulatedLapDTO]


class RaceSimulationResponse(BaseModel):
    strategy_id: str
    total_race_time_s: float
    mean_lap_time_s: float
    pit_stops_count: int
    total_pit_loss_s: float
    stints: list[StintSimulationDTO]
    laps: list[SimulatedLapDTO]
    weather_scenario: str
    safety_car_scenario: str
    traffic_scenario: str
    scientific_disclaimer: str


class FeasibleStrategyDTO(BaseModel):
    strategy_id: str
    name: str
    pit_stops_count: int
    compound_sequence: list[str]
    stint_lengths: list[int]
    pit_laps: list[int]
    is_fia_legal: bool
    summary: str


class StrategyListResponse(BaseModel):
    total_strategies: int
    strategies: list[FeasibleStrategyDTO]
    circuit: str
    total_laps: int
    provenance_label: str = "Synthetic engineering dataset"


class StrategyMonteCarloRequest(BaseModel):
    strategy_id: str
    stints: list[StintDefinitionInput]
    weather: str = "DRY"
    safety_car: str = "GREEN"
    traffic: str = "LIGHT_TRAFFIC"
    iterations: int = Field(default=1000, ge=100, le=5000)
    simulation_seed: int = 42871
    ref_race_time_s: float | None = None


class StrategyMonteCarloResponse(BaseModel):
    strategy_id: str
    simulation_seed: int
    iterations: int
    mean_race_time_s: float
    median_race_time_s: float
    std_dev_race_time_s: float
    p05_race_time_s: float
    p10_race_time_s: float
    p25_race_time_s: float
    p50_race_time_s: float
    p75_race_time_s: float
    p90_race_time_s: float
    p95_race_time_s: float
    bins: list[dict[str, Any]]
    probability_beating_ref: float | None
    scientific_disclaimer: str


class StrategyAttributionDTO(BaseModel):
    factor_name: str
    delta_s: float
    description: str


class StrategyComparisonResponse(BaseModel):
    baseline_id: str
    scenario_id: str
    delta_race_time_s: float
    delta_pit_loss_s: float
    delta_mean_lap_time_s: float
    baseline_race_time_s: float
    scenario_race_time_s: float
    baseline_stops: int
    scenario_stops: int
    attribution: list[StrategyAttributionDTO]
    residual_s: float
    disclaimer: str = "Additive counterfactual strategy attribution. Assumptions documented."


class PitWindowSensitivityRequest(BaseModel):
    stints: list[StintDefinitionInput]
    stint_index: int = 0
    offsets: list[int] = [-3, -2, -1, 0, 1, 2, 3]


class PitWindowItemDTO(BaseModel):
    pit_lap_offset: int
    scheduled_pit_lap: int
    actual_pit_lap: int
    modelled_race_time_s: float
    delta_race_time_s: float
    p95_race_time_s: float
    final_tyre_age: int


class PitWindowResponse(BaseModel):
    scheduled_pit_lap: int
    sensitivity_curve: list[PitWindowItemDTO]
    disclaimer: str = "Pit window sensitivity analysis. Not an absolute optimum guarantee."


class CompoundCurveItemDTO(BaseModel):
    tyre_age: int
    effective_grip: float
    lap_time_penalty_s: float
    thermal_penalty_s: float
    is_cliff_exceeded: bool


class CompoundCurveResponse(BaseModel):
    compound: str
    max_viable_laps: int
    curve: list[CompoundCurveItemDTO]


class ScenarioMatrixRequest(BaseModel):
    stints: list[StintDefinitionInput]


class ScenarioMatrixCellDTO(BaseModel):
    safety_car_scenario: str
    weather_scenario: str
    modelled_race_time_s: float
    delta_from_baseline_s: float


class ScenarioMatrixResponse(BaseModel):
    baseline_race_time_s: float
    scenarios: list[ScenarioMatrixCellDTO]
