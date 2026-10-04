import pytest
from app.analytics.driver_consistency import DriverConsistencyAnalyzer


def test_driver_consistency_minimal_laps():
    metrics = DriverConsistencyAnalyzer.calculate_consistency([81.250])
    assert metrics.lap_count == 1
    assert metrics.std_lap_time == 0.0
    assert metrics.consistency_score_out_of_100 == 100.0


def test_driver_consistency_stable_stint():
    # 5 closely matched laps within 0.10s standard deviation
    laps = [80.520, 80.550, 80.490, 80.530, 80.510]
    metrics = DriverConsistencyAnalyzer.calculate_consistency(laps)
    
    assert metrics.lap_count == 5
    assert metrics.std_lap_time < 0.05
    assert metrics.consistency_score_out_of_100 >= 95.0
    assert metrics.coefficient_of_variation_pct < 0.1


def test_driver_consistency_erratic_stint():
    # Erratic laps with traffic / lockups
    laps = [80.500, 83.200, 79.900, 84.500, 81.100]
    metrics = DriverConsistencyAnalyzer.calculate_consistency(laps)
    
    assert metrics.lap_count == 5
    assert metrics.std_lap_time > 1.0
    assert metrics.consistency_score_out_of_100 < 80.0
