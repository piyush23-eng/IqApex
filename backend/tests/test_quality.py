from app.analytics.quality_checker import TelemetryQualityChecker
from app.schemas.domain import Lap, TelemetryPoint
from app.schemas.quality import DataQualityStatus


def create_clean_lap_and_telemetry():
    # 20 Hz nominal logging across 85.0s lap = 1700 samples (dt = 0.05s)
    lap = Lap(
        lap_id="lap-clean-01",
        run_id="run-01",
        lap_number=1,
        lap_time=85.0,
        sector_1=28.0,
        sector_2=29.0,
        sector_3=28.0,
        valid=True,
    )
    dt = 0.05  # 20 Hz acquisition rate
    n_points = int(lap.lap_time / dt) + 1
    track_len = 5000.0
    ds = track_len / (n_points - 1)

    points = []
    for i in range(n_points):
        t = round(i * dt, 4)
        s = round(i * ds, 2)
        points.append(
            TelemetryPoint(
                timestamp=t,
                distance=s,
                speed=220.0,
                throttle=100.0,
                brake=0.0,
                gear=6,
                rpm=11500,
                drs=0,
                lateral_acceleration=1.5,
                longitudinal_acceleration=0.2,
            )
        )
    return lap, points


def test_clean_telemetry_quality():
    lap, points = create_clean_lap_and_telemetry()
    res = TelemetryQualityChecker.evaluate_lap(lap, points)
    assert res.status == DataQualityStatus.PASS, (
        f"Expected PASS but got {res.status} with warnings: {res.warnings}"
    )
    assert res.quality_score >= 95.0
    assert len(res.warnings) == 0


def test_duplicate_timestamps_detection():
    lap, points = create_clean_lap_and_telemetry()
    # Inject duplicate timestamp at index 10
    points[10].timestamp = points[9].timestamp
    res = TelemetryQualityChecker.evaluate_lap(lap, points)
    assert any("duplicate timestamps" in w.lower() for w in res.warnings)


def test_invalid_lap_times():
    lap, points = create_clean_lap_and_telemetry()
    # Sector sum mismatch: 20+20+20 = 60, but lap_time = 85
    lap.sector_1 = 20.0
    lap.sector_2 = 20.0
    lap.sector_3 = 20.0
    res = TelemetryQualityChecker.evaluate_lap(lap, points)
    assert any("sector sum discrepancy" in w.lower() for w in res.warnings)


def test_impossible_sensor_values():
    lap, points = create_clean_lap_and_telemetry()
    # Inject impossible speed and rpm
    points[5].speed = 520.0  # Impossible F1 speed
    points[6].rpm = 25000  # Impossible rpm
    points[7].gear = 12  # Non-existent gear
    res = TelemetryQualityChecker.evaluate_lap(lap, points)
    assert any("sensor boundary violations" in w.lower() for w in res.warnings)
    assert res.invalid_percentage > 0.0


def test_discontinuity_and_negative_distance():
    lap, points = create_clean_lap_and_telemetry()
    # Large time gap jump (> 0.25s)
    points[20].timestamp = points[19].timestamp + 0.6
    # Negative distance jump
    points[30].distance = points[29].distance - 50.0
    res = TelemetryQualityChecker.evaluate_lap(lap, points)
    assert any("discontinuities" in w.lower() for w in res.warnings)
    assert any("negative distance" in w.lower() for w in res.warnings)


def test_empty_telemetry():
    lap, _ = create_clean_lap_and_telemetry()
    res = TelemetryQualityChecker.evaluate_lap(lap, [])
    assert res.status == DataQualityStatus.FAIL
    assert res.quality_score == 0.0
    assert res.missing_percentage == 100.0
