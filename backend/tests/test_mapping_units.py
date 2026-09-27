import pandas as pd
import pytest

from app.telemetry.mapping import ChannelMappingError, channel_mapper
from app.telemetry.units import UnitNormalizer


def test_channel_mapping_success():
    columns = [
        "Time",
        "LapDist",
        "vCar",
        "rThrottlePedal",
        "pBrakeF",
        "nGear",
        "nEngine",
        "DRS",
        "latAccel",
        "longAccel",
    ]
    mapping, missing = channel_mapper.map_columns(columns, enforce_core=True)
    assert len(missing) == 0
    assert mapping["vCar"] == "speed"
    assert mapping["rThrottlePedal"] == "throttle"
    assert mapping["pBrakeF"] == "brake"
    assert mapping["nGear"] == "gear"
    assert mapping["nEngine"] == "rpm"
    assert mapping["latAccel"] == "lateral_acceleration"
    assert mapping["longAccel"] == "longitudinal_acceleration"
    assert mapping["LapDist"] == "distance"
    assert mapping["Time"] == "timestamp"


def test_channel_mapping_missing_core_raises():
    columns = ["Time", "LapDist", "rThrottlePedal", "nGear"]
    with pytest.raises(ChannelMappingError) as exc_info:
        channel_mapper.map_columns(columns, enforce_core=True)

    err_msg = str(exc_info.value)
    assert "Missing required canonical channels" in err_msg
    assert "speed" in err_msg
    assert "brake" in err_msg


def test_channel_mapping_candidates():
    columns = [
        "Time",
        "LapDist",
        "v_car",
        "Throttle",
        "Brake",
        "Gear",
        "RPM",
        "DRS",
        "LatG",
        "LongG",
    ]
    mapping, missing = channel_mapper.map_columns(columns, enforce_core=True)
    assert len(missing) == 0
    assert mapping["v_car"] == "speed"


def test_unit_normalization_speed_ms_to_kph():
    s = pd.Series([10.0, 50.0, 100.0])
    norm_s, unit, _ = UnitNormalizer.normalize_channel("speed", s, source_unit="m/s")
    assert unit == "km/h"
    assert norm_s.iloc[0] == pytest.approx(36.0)
    assert norm_s.iloc[1] == pytest.approx(180.0)
    assert norm_s.iloc[2] == pytest.approx(360.0)


def test_unit_normalization_distance_km_to_m():
    s = pd.Series([0.5, 1.2, 5.793])
    norm_s, unit, _ = UnitNormalizer.normalize_channel("distance", s, source_unit="km")
    assert unit == "m"
    assert norm_s.iloc[0] == pytest.approx(500.0)
    assert norm_s.iloc[2] == pytest.approx(5793.0)


def test_unit_normalization_throttle_fractional():
    s = pd.Series([0.0, 0.45, 1.0])
    norm_s, unit, _ = UnitNormalizer.normalize_channel(
        "throttle", s, source_unit="fraction"
    )
    assert unit == "%"
    assert norm_s.iloc[1] == pytest.approx(45.0)
    assert norm_s.iloc[2] == pytest.approx(100.0)


def test_unit_normalization_accel_ms2_to_g():
    s = pd.Series([0.0, 9.80665, -19.6133])
    norm_s, unit, _ = UnitNormalizer.normalize_channel(
        "lateral_acceleration", s, source_unit="m/s^2"
    )
    assert unit == "G"
    assert norm_s.iloc[1] == pytest.approx(1.0)
    assert norm_s.iloc[2] == pytest.approx(-2.0)


def test_unit_normalization_ambiguous_generates_warning():
    s = pd.Series([100.0, 200.0])
    _, unit, warnings = UnitNormalizer.normalize_channel(
        "speed", s, source_unit="lightyears/fortnight"
    )
    assert unit == "UNKNOWN"
    assert len(warnings) > 0
    assert "Ambiguous" in warnings[0]
