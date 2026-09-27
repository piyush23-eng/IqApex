from pydantic import BaseModel, ConfigDict


class Session(BaseModel):
    session_id: str
    event_name: str
    circuit: str
    session_type: str
    date: str
    weather: str
    track_temperature: float

    model_config = ConfigDict(from_attributes=True)


class Driver(BaseModel):
    driver_id: str
    name: str
    team: str
    car_number: int

    model_config = ConfigDict(from_attributes=True)


class Run(BaseModel):
    run_id: str
    session_id: str
    driver_id: str
    compound: str
    tyre_age: int
    run_type: str
    start_time: str
    end_time: str

    model_config = ConfigDict(from_attributes=True)


class Lap(BaseModel):
    lap_id: str
    run_id: str
    lap_number: int
    lap_time: float
    sector_1: float
    sector_2: float
    sector_3: float
    valid: bool

    model_config = ConfigDict(from_attributes=True)


class TelemetryPoint(BaseModel):
    timestamp: float
    distance: float
    speed: float
    throttle: float
    brake: float
    gear: int
    rpm: int
    drs: int
    lateral_acceleration: float
    longitudinal_acceleration: float

    model_config = ConfigDict(from_attributes=True)


class Corner(BaseModel):
    corner_id: str
    name: str
    entry_distance: float
    apex_distance: float
    exit_distance: float
    entry_speed: float
    minimum_speed: float
    exit_speed: float
    braking_point: float
    throttle_application: float

    model_config = ConfigDict(from_attributes=True)
