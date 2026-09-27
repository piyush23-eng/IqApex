from pathlib import Path
from typing import Any

import yaml
from pydantic import BaseModel, ConfigDict


class BrakingThresholds(BaseModel):
    min_brake_pressure: float = 5.0
    deceleration_threshold: float = -0.5

    model_config = ConfigDict(from_attributes=True)


class AccelerationThresholds(BaseModel):
    min_throttle: float = 15.0
    longitudinal_accel_threshold: float = 0.2

    model_config = ConfigDict(from_attributes=True)


class CorneringThresholds(BaseModel):
    lateral_accel_threshold: float = 1.0
    entry_margin_meters: float = 20.0
    exit_margin_meters: float = 25.0

    model_config = ConfigDict(from_attributes=True)


class OutlierThresholds(BaseModel):
    method: str = "iqr"
    iqr_multiplier: float = 1.5
    z_score_threshold: float = 2.5
    min_samples: int = 4

    model_config = ConfigDict(from_attributes=True)


class ConfidenceThresholds(BaseModel):
    confidence_level: float = 0.95
    min_samples_ci: int = 3

    model_config = ConfigDict(from_attributes=True)


class SensitivityThresholds(BaseModel):
    speed_step_kmh: float = 1.0
    distance_step_m: float = 5.0

    model_config = ConfigDict(from_attributes=True)


class PerformanceThresholds(BaseModel):
    braking: BrakingThresholds = BrakingThresholds()
    acceleration: AccelerationThresholds = AccelerationThresholds()
    cornering: CorneringThresholds = CorneringThresholds()
    outliers: OutlierThresholds = OutlierThresholds()
    confidence: ConfidenceThresholds = ConfidenceThresholds()
    sensitivity: SensitivityThresholds = SensitivityThresholds()

    model_config = ConfigDict(from_attributes=True)


_CONFIG_PATH = Path(__file__).parent / "performance_thresholds.yaml"


def load_performance_thresholds(config_path: Path | None = None) -> PerformanceThresholds:
    path = config_path or _CONFIG_PATH
    if not path.exists():
        return PerformanceThresholds()

    with open(path, encoding="utf-8") as f:
        data: dict[str, Any] = yaml.safe_load(f) or {}

    return PerformanceThresholds.model_validate(data)


# Global singleton instance for thresholds
PERF_CONFIG = load_performance_thresholds()
