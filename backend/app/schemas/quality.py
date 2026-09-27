from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class DataQualityStatus(str, Enum):
    PASS = "PASS"
    WARNING = "WARNING"
    FAIL = "FAIL"


class DataQualityResult(BaseModel):
    status: DataQualityStatus
    quality_score: float = Field(
        ..., ge=0.0, le=100.0, description="Overall quality score from 0.0 to 100.0"
    )
    missing_percentage: float = Field(
        ..., ge=0.0, le=100.0, description="Percentage of missing or null sensor values"
    )
    invalid_percentage: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Percentage of invalid or physically impossible values",
    )
    warnings: list[str] = Field(
        default_factory=list, description="Specific telemetry anomalies detected"
    )

    model_config = ConfigDict(from_attributes=True)
