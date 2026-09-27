from pydantic import BaseModel, ConfigDict

from app.schemas.domain import Driver, Lap, Run


class CircuitCornerDefinition(BaseModel):
    corner_id: str
    name: str
    turn_number: int
    entry_distance: float
    apex_distance: float
    exit_distance: float
    circuit: str

    model_config = ConfigDict(from_attributes=True)


class CornerMetric(BaseModel):
    corner_id: str
    corner_name: str
    turn_number: int
    entry_distance: float
    apex_distance: float
    exit_distance: float
    ref_entry_speed: float
    comp_entry_speed: float
    entry_speed_delta: float
    ref_min_speed: float
    comp_min_speed: float
    min_speed_delta: float
    ref_apex_distance: float
    comp_apex_distance: float
    ref_exit_speed: float
    comp_exit_speed: float
    exit_speed_delta: float
    ref_braking_point: float | None = None
    comp_braking_point: float | None = None
    braking_point_delta: float | None = None
    ref_throttle_pickup: float | None = None
    comp_throttle_pickup: float | None = None
    throttle_pickup_delta: float | None = None
    ref_corner_time: float
    comp_corner_time: float
    corner_time_delta: float
    cumulative_time_delta_exit: float

    model_config = ConfigDict(from_attributes=True)


class SectorComparison(BaseModel):
    sector: int
    start_distance: float
    end_distance: float
    ref_time: float
    comp_time: float
    delta: float

    model_config = ConfigDict(from_attributes=True)


class LapComparisonSummary(BaseModel):
    reference_lap_id: str
    comparison_lap_id: str
    data_label: str
    reference_driver: Driver | None = None
    comparison_driver: Driver | None = None
    reference_run: Run | None = None
    comparison_run: Run | None = None
    reference_lap: Lap
    comparison_lap: Lap
    reference_quality_score: float
    comparison_quality_score: float
    lap_time_delta: float
    sectors: list[SectorComparison]
    corners: list[CornerMetric]

    model_config = ConfigDict(from_attributes=True)


class AlignedChannelsResponse(BaseModel):
    reference_lap_id: str
    comparison_lap_id: str
    point_count: int
    distance: list[float]
    ref_speed: list[float]
    comp_speed: list[float]
    ref_throttle: list[float]
    comp_throttle: list[float]
    ref_brake: list[float]
    comp_brake: list[float]
    ref_gear: list[int]
    comp_gear: list[int]
    ref_rpm: list[int]
    comp_rpm: list[int]
    ref_drs: list[int]
    comp_drs: list[int]
    ref_lat_g: list[float]
    comp_lat_g: list[float]
    ref_long_g: list[float]
    comp_long_g: list[float]
    time_delta: list[float]
    speed_delta: list[float]

    model_config = ConfigDict(from_attributes=True)
