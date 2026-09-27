import numpy as np
import pandas as pd
import pytest

from app.telemetry.alignment import MultiLapAligner, TimeDeltaCalculator
from app.telemetry.resampling import DistanceResampler


def test_distance_resampling_1m_grid():
    # Irregular spacing
    df = pd.DataFrame(
        {
            "distance": [0.0, 0.81, 1.64, 2.49, 3.31, 5.0],
            "speed": [100.0, 110.0, 120.0, 130.0, 140.0, 160.0],
            "gear": [3, 3, 3, 4, 4, 4],
            "drs": [0, 0, 0, 1, 1, 1],
        }
    )

    res = DistanceResampler.resample(df, distance_step=1.0)
    assert list(res["distance"]) == [0.0, 1.0, 2.0, 3.0, 4.0, 5.0]

    # Continuous channel (speed) interpolated
    assert 100.0 < res["speed"].iloc[1] < 120.0

    # Discrete channels (gear, drs) remain strictly integer
    assert all(isinstance(int(g), int) for g in res["gear"])
    assert set(res["gear"]).issubset({3, 4})
    assert set(res["drs"]).issubset({0, 1})


def test_multi_lap_alignment():
    # Lap A: 0m to 100m
    lap_a = pd.DataFrame(
        {
            "distance": np.linspace(0.0, 100.0, 40),
            "timestamp": np.linspace(0.0, 10.0, 40),
            "speed": np.linspace(150.0, 250.0, 40),
            "throttle": np.full(40, 100.0),
            "brake": np.zeros(40),
            "gear": np.full(40, 5),
        }
    )

    # Lap B: 0m to 100m, slightly slower
    lap_b = pd.DataFrame(
        {
            "distance": np.linspace(0.0, 100.0, 35),
            "timestamp": np.linspace(0.0, 10.5, 35),
            "speed": np.linspace(140.0, 240.0, 35),
            "throttle": np.full(35, 95.0),
            "brake": np.zeros(35),
            "gear": np.full(35, 5),
        }
    )

    aligned = MultiLapAligner.align_laps(
        {"lap_a": lap_a, "lap_b": lap_b},
        channels=["speed", "throttle"],
        distance_step=1.0,
    )

    assert "distance" in aligned.columns
    assert "lap_a_speed" in aligned.columns
    assert "lap_b_speed" in aligned.columns
    assert len(aligned) == 101  # 0 to 100m at 1m step


def test_time_delta_computation():
    # Ref lap: 100m in 2.0s (50 m/s = 180 km/h)
    ref = pd.DataFrame(
        {
            "distance": np.linspace(0.0, 100.0, 50),
            "timestamp": np.linspace(0.0, 2.0, 50),
            "speed": np.full(50, 180.0),
        }
    )

    # Comp lap: 100m in 2.2s (slower by 0.2s)
    comp = pd.DataFrame(
        {
            "distance": np.linspace(0.0, 100.0, 50),
            "timestamp": np.linspace(0.0, 2.2, 50),
            "speed": np.full(50, 163.6),
        }
    )

    comparison = TimeDeltaCalculator.compute(
        reference_df=ref,
        comparison_df=comp,
        reference_lap_id="lap_ref",
        comparison_lap_id="lap_comp",
        distance_step=1.0,
    )

    assert comparison.reference_lap_id == "lap_ref"
    assert comparison.comparison_lap_id == "lap_comp"
    assert comparison.point_count == 101

    # At start distance 0m: time delta is 0
    assert comparison.time_delta[0] == pytest.approx(0.0, abs=1e-3)

    # At finish distance 100m: time delta is +0.2s (comparison was slower)
    assert comparison.time_delta[-1] == pytest.approx(0.2, abs=1e-2)

    # Speed delta: comparison speed is lower (approx -16.4 km/h)
    assert comparison.speed_delta[0] < 0.0
