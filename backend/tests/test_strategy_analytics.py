from app.analytics.strategy_analytics import StrategyAnalyticsService
from app.analytics.strategy_engine import StrategySimulationEngine
from app.analytics.strategy_monte_carlo import StrategyMonteCarloSimulator


def test_strategy_monte_carlo_reproducibility_and_quantiles():
    engine = StrategySimulationEngine()
    stints = [
        {"compound": "MEDIUM", "laps": 25},
        {"compound": "HARD", "laps": 28},
    ]

    mc1 = StrategyMonteCarloSimulator.run_simulation(
        engine=engine,
        strategy_id="TEST_MC",
        stint_definitions=stints,
        iterations=200,
        random_seed=42871,
    )
    mc2 = StrategyMonteCarloSimulator.run_simulation(
        engine=engine,
        strategy_id="TEST_MC",
        stint_definitions=stints,
        iterations=200,
        random_seed=42871,
    )

    assert mc1.mean_race_time_s == mc2.mean_race_time_s
    assert mc1.p05_race_time_s < mc1.p50_race_time_s < mc1.p95_race_time_s
    assert len(mc1.bins) == 25


def test_pit_window_sensitivity_offsets():
    engine = StrategySimulationEngine()
    stints = [
        {"compound": "MEDIUM", "laps": 25},
        {"compound": "HARD", "laps": 28},
    ]

    pit_win = StrategyAnalyticsService.evaluate_pit_window(
        engine=engine,
        stint_definitions=stints,
        stint_index_to_vary=0,
        lap_offsets=[-2, 0, 2],
    )

    assert len(pit_win) == 3
    # Offset 0 delta should be exactly 0.0
    zero_offset = next(p for p in pit_win if p.pit_lap_offset == 0)
    assert zero_offset.delta_race_time_s == 0.0
