
import pytest

from app.analytics.quality_checker import TelemetryQualityChecker
from app.schemas.domain import Lap, TelemetryPoint
from app.telemetry.pipeline import TelemetryIngestionPipeline


@pytest.fixture
def base_lap_metadata():
    return Lap(
        lap_id="lap-corr-01",
        run_id="run-01",
        lap_number=1,
        lap_time=80.0,
        sector_1=25.0,
        sector_2=30.0,
        sector_3=25.0,
        valid=True,
    )


def test_corruption_missing_required_channels(base_lap_metadata):
    """
    Structural Corruption: Ingesting a CSV missing core channels (e.g. speed, distance)
    must fail cleanly without manufacturing fake data.
    """
    corrupt_csv = "time,throttle,brake\n0.0,100,0\n0.1,100,0\n"
    csv_bytes = corrupt_csv.encode("utf-8")

    with pytest.raises(Exception) as exc_info:
        TelemetryIngestionPipeline.ingest(
            source=csv_bytes,
            filename="missing_channels.csv",
            session_id="sess-01",
            run_id="run-01",
            lap_id="lap-corr-01",
            lap_metadata=base_lap_metadata,
        )
    assert "missing" in str(exc_info.value).lower() or "channel" in str(exc_info.value).lower()


def test_corruption_empty_and_single_row_csv(base_lap_metadata):
    """
    Structural Corruption: Empty CSV or single-row CSV should fail safely.
    """
    empty_csv = b""
    with pytest.raises(Exception): # noqa: B017
        TelemetryIngestionPipeline.ingest(
            source=empty_csv,
            filename="empty.csv",
            session_id="sess-01",
            run_id="run-01",
            lap_id="lap-corr-01",
            lap_metadata=base_lap_metadata,
        )

    single_row_csv = b"time,dist,speed,throttle,brake,gear,rpm,drs,lat_g,long_g\n0.0,0.0,200.0,100,0,6,11000,0,0.0,0.0\n"
    # Single row cannot be resampled across distance
    with pytest.raises(Exception): # noqa: B017
        TelemetryIngestionPipeline.ingest(
            source=single_row_csv,
            filename="single_row.csv",
            session_id="sess-01",
            run_id="run-01",
            lap_id="lap-corr-01",
            lap_metadata=base_lap_metadata,
        )


def test_corruption_reversed_and_duplicate_timestamps(base_lap_metadata):
    """
    Timestamp Corruption: Reversed or duplicate timestamps must be caught by quality auditor.
    """
    points = [
        TelemetryPoint(timestamp=0.0, distance=0.0, speed=200.0, throttle=100.0, brake=0.0, gear=6, rpm=11000, drs=0, lateral_acceleration=0.0, longitudinal_acceleration=0.0),
        TelemetryPoint(timestamp=0.05, distance=10.0, speed=205.0, throttle=100.0, brake=0.0, gear=6, rpm=11200, drs=0, lateral_acceleration=0.0, longitudinal_acceleration=0.0),
        TelemetryPoint(timestamp=0.04, distance=20.0, speed=210.0, throttle=100.0, brake=0.0, gear=6, rpm=11300, drs=0, lateral_acceleration=0.0, longitudinal_acceleration=0.0), # Reversed!
    ]

    res = TelemetryQualityChecker.evaluate_lap(base_lap_metadata, points)
    assert any("timestamp" in w.lower() or "discontinuit" in w.lower() for w in res.warnings)


def test_corruption_decreasing_distance_steps(base_lap_metadata):
    """
    Distance Corruption: Distance decreasing during lap progression.
    """
    points = [
        TelemetryPoint(timestamp=0.0, distance=100.0, speed=200.0, throttle=100.0, brake=0.0, gear=6, rpm=11000, drs=0, lateral_acceleration=0.0, longitudinal_acceleration=0.0),
        TelemetryPoint(timestamp=0.05, distance=110.0, speed=205.0, throttle=100.0, brake=0.0, gear=6, rpm=11200, drs=0, lateral_acceleration=0.0, longitudinal_acceleration=0.0),
        TelemetryPoint(timestamp=0.10, distance=90.0, speed=210.0, throttle=100.0, brake=0.0, gear=6, rpm=11300, drs=0, lateral_acceleration=0.0, longitudinal_acceleration=0.0), # Decreased!
    ]

    res = TelemetryQualityChecker.evaluate_lap(base_lap_metadata, points)
    assert any("negative distance" in w.lower() for w in res.warnings)


def test_corruption_impossible_sensor_boundaries(base_lap_metadata):
    """
    Physics Violations:
    - Speed < 0 or > 450 km/h
    - Throttle < 0 or > 100%
    - Brake < 0
    - Gear < 0 or > 8
    - RPM > 20000
    """
    points = [
        TelemetryPoint(timestamp=0.0, distance=0.0, speed=-25.0, throttle=100.0, brake=0.0, gear=6, rpm=11000, drs=0, lateral_acceleration=0.0, longitudinal_acceleration=0.0), # Negative speed
        TelemetryPoint(timestamp=0.05, distance=10.0, speed=200.0, throttle=140.0, brake=0.0, gear=6, rpm=11000, drs=0, lateral_acceleration=0.0, longitudinal_acceleration=0.0), # Throttle > 100
        TelemetryPoint(timestamp=0.10, distance=20.0, speed=200.0, throttle=100.0, brake=-5.0, gear=6, rpm=11000, drs=0, lateral_acceleration=0.0, longitudinal_acceleration=0.0), # Negative brake
        TelemetryPoint(timestamp=0.15, distance=30.0, speed=200.0, throttle=100.0, brake=0.0, gear=11, rpm=11000, drs=0, lateral_acceleration=0.0, longitudinal_acceleration=0.0), # Gear 11
        TelemetryPoint(timestamp=0.20, distance=40.0, speed=200.0, throttle=100.0, brake=0.0, gear=6, rpm=24000, drs=0, lateral_acceleration=0.0, longitudinal_acceleration=0.0), # RPM 24000
    ]

    res = TelemetryQualityChecker.evaluate_lap(base_lap_metadata, points)
    assert res.invalid_percentage > 0.0
    assert any("sensor boundary" in w.lower() for w in res.warnings)


def test_corruption_unsupported_file_extension():
    """
    Unsupported binary or proprietary format (e.g. ATLAS .ld) must be rejected cleanly.
    """
    with pytest.raises(ValueError) as exc_info:
        TelemetryIngestionPipeline.get_adapter("telemetry.ld")
    assert "unsupported telemetry file extension" in str(exc_info.value).lower()
