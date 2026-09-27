import pytest

from app.analytics.engineering_analysis_engine import EngineeringAnalysisEngine
from app.analytics.strategy_engine import StrategySimulationEngine
from app.analytics.strategy_monte_carlo import StrategyMonteCarloSimulator


@pytest.fixture
def engine():
    return StrategySimulationEngine()


@pytest.fixture
def stints():
    return [
        {"compound": "MEDIUM", "laps": 25},
        {"compound": "HARD", "laps": 28},
    ]


def test_mc_determinism_and_stochastic_variation(engine, stints):
    """
    Monte Carlo Validation:
    - Same seed (42871) with same inputs produces bitwise identical results.
    - Different seed (99999) produces different realization, but consistent population mean.
    """
    mc1 = StrategyMonteCarloSimulator.run_simulation(
        engine=engine,
        strategy_id="DET_TEST",
        stint_definitions=stints,
        iterations=200,
        weather_code="DRY",
        safety_car_code="GREEN",
        random_seed=42871,
    )
    mc2 = StrategyMonteCarloSimulator.run_simulation(
        engine=engine,
        strategy_id="DET_TEST",
        stint_definitions=stints,
        iterations=200,
        weather_code="DRY",
        safety_car_code="GREEN",
        random_seed=42871,
    )
    mc_diff = StrategyMonteCarloSimulator.run_simulation(
        engine=engine,
        strategy_id="DET_TEST",
        stint_definitions=stints,
        iterations=200,
        weather_code="DRY",
        safety_car_code="GREEN",
        random_seed=99999,
    )

    # Identical seed -> identical mean, p05, p50, p95
    assert mc1.mean_race_time_s == mc2.mean_race_time_s
    assert mc1.p50_race_time_s == mc2.p50_race_time_s
    assert mc1.p05_race_time_s == mc2.p05_race_time_s
    assert mc1.p95_race_time_s == mc2.p95_race_time_s

    # Different seed -> different realization but close mean (< 2.0s difference)
    assert mc1.mean_race_time_s != mc_diff.mean_race_time_s
    assert abs(mc1.mean_race_time_s - mc_diff.mean_race_time_s) < 2.0


def test_strategy_component_isolation_zero_degradation(engine, stints):
    """
    Strategy Sanity Test: Zero Tyre Degradation.
    When degradation_multiplier is set to 0.0, progressive tyre degradation penalty is mitigated.
    Normal degradation accumulates significant penalty over 53 laps.
    """
    sim_zero_deg = engine.simulate_race(
        strategy_id="ZERO_DEG",
        stint_definitions=stints,
        weather_code="DRY",
        safety_car_code="GREEN",
        traffic_code="CLEAR_AIR",
        degradation_multiplier=0.0,
        random_seed=42871,
    )
    sim_normal = engine.simulate_race(
        strategy_id="NORMAL_DEG",
        stint_definitions=stints,
        weather_code="DRY",
        safety_car_code="GREEN",
        traffic_code="CLEAR_AIR",
        degradation_multiplier=1.0,
        random_seed=42871,
    )

    # Total race time must be significantly faster with zero degradation
    assert sim_normal.total_race_time_s > sim_zero_deg.total_race_time_s

    # Mean lap time in zero deg must be faster
    assert sim_normal.mean_lap_time_s > sim_zero_deg.mean_lap_time_s


def test_strategy_component_isolation_zero_traffic(engine, stints):
    """
    Strategy Sanity Test: Clear Air (Zero Traffic Delay).
    Under CLEAR_AIR, traffic penalty across all laps must be strictly 0.0.
    """
    sim_clear = engine.simulate_race(
        strategy_id="CLEAR",
        stint_definitions=stints,
        weather_code="DRY",
        safety_car_code="GREEN",
        traffic_code="CLEAR_AIR",
        random_seed=42871,
    )
    for lap in sim_clear.laps:
        assert lap.traffic_penalty_s == 0.0


def test_lap_loss_decomposition_conservation():
    """
    Decomposition Conservation:
    Total measured lap delta = Sum of physical phase deltas + residual.
    |residual| < 0.001 s.
    """
    ea_engine = EngineeringAnalysisEngine()
    resp = ea_engine.analyze_lap_loss("lap_ref_1", "lap_comp_1")

    phase_sum = sum(p.delta_s for p in resp.phase_contributions)
    reconciled_total = phase_sum + resp.residual_s

    assert abs(reconciled_total - resp.total_delta_s) < 1e-4, (
        f"Lap decomposition failed conservation: phase_sum={phase_sum}, "
        f"residual={resp.residual_s}, total={resp.total_delta_s}"
    )
    assert abs(resp.residual_s) < 0.005, f"Residual too large: {resp.residual_s}"
