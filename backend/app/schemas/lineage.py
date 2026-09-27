from pydantic import BaseModel, ConfigDict, Field

from app.schemas.domain import TelemetryPoint
from app.schemas.quality import DataQualityResult


class TelemetryInspectionResult(BaseModel):
    file_format: str
    row_count: int
    column_count: int
    available_channels: list[str]
    core_channels_found: list[str]
    core_channels_missing: list[str]
    optional_channels_found: list[str]
    detected_units: dict[str, str]
    timestamp_range: list[float] | None = None
    distance_range: list[float] | None = None
    sampling_interval_mean: float | None = None
    estimated_sampling_frequency: float | None = None
    warnings: list[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class ProcessingRun(BaseModel):
    processing_run_id: str
    source_file: str
    source_hash: str
    processed_at: str
    pipeline_version: str = "2.0.0"
    mapping_version: str = "1.0.0"
    status: str
    quality_score: float
    resampling_resolution: float = 1.0

    model_config = ConfigDict(from_attributes=True)


class IngestionResult(BaseModel):
    processing_run_id: str
    session_id: str
    run_id: str
    lap_id: str
    raw_points: int
    resampled_points: int
    data_label: str
    quality: DataQualityResult
    lineage: ProcessingRun
    raw_storage_path: str
    processed_storage_path: str
    points: list[TelemetryPoint] | None = None

    model_config = ConfigDict(from_attributes=True)


class LapComparisonResponse(BaseModel):
    reference_lap_id: str
    comparison_lap_id: str
    point_count: int
    distance: list[float]
    reference_speed: list[float]
    comparison_speed: list[float]
    speed_delta: list[float]
    reference_time: list[float]
    comparison_time: list[float]
    time_delta: list[float]

    model_config = ConfigDict(from_attributes=True)
