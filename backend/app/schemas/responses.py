from pydantic import BaseModel, ConfigDict

from app.schemas.domain import Driver, Lap, Run, Session, TelemetryPoint
from app.schemas.quality import DataQualityResult


class HealthResponse(BaseModel):
    status: str
    environment: str
    version: str
    database_connected: bool
    timestamp: str

    model_config = ConfigDict(from_attributes=True)


class TelemetryResponse(BaseModel):
    lap_id: str
    data_label: str  # Explicit: "Synthetic demonstration dataset" or "Vehicle telemetry recording"
    total_raw_points: int
    returned_points: int
    downsampled: bool
    data_quality: DataQualityResult | None
    points: list[TelemetryPoint]

    model_config = ConfigDict(from_attributes=True)


class SessionDetailResponse(BaseModel):
    session: Session
    data_label: str
    drivers: list[Driver]
    runs: list[Run]

    model_config = ConfigDict(from_attributes=True)


class RunDetailResponse(BaseModel):
    run: Run
    data_label: str
    driver: Driver | None
    laps: list[Lap]

    model_config = ConfigDict(from_attributes=True)


class LapDetailResponse(BaseModel):
    lap: Lap
    data_label: str
    telemetry_available: bool
    data_quality: DataQualityResult | None

    model_config = ConfigDict(from_attributes=True)
