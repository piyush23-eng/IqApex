from app.analytics.strategy_engine import StrategySimulationEngine
from app.analytics.strategy_generator import StrategyGenerator


def test_strategy_generator_feasibility_and_fia_rules():
    gen = StrategyGenerator()
    strats = gen.generate_strategies(max_stops=2)

    assert len(strats) >= 5
    for s in strats:
        assert s.is_fia_legal
        assert len(set(s.compound_sequence)) >= 2  # At least 2 distinct compounds
        assert sum(s.stint_lengths) == 53  # Monza total laps


def test_stint_simulation_fuel_decay_and_lap_progression():
    engine = StrategySimulationEngine()
    stints = [
        {"compound": "MEDIUM", "laps": 25},
        {"compound": "HARD", "laps": 28},
    ]
    race_res = engine.simulate_race(
        strategy_id="TEST_1STOP",
        stint_definitions=stints,
    )

    assert race_res.total_race_time_s > 4000.0  # ~75-80 mins in seconds (~4500s)
    assert len(race_res.laps) == 53
    assert race_res.pit_stops_count == 1
    assert race_res.total_pit_loss_s == 24.5

    # Check fuel decreases continuously
    for idx in range(len(race_res.laps) - 1):
        l1 = race_res.laps[idx]
        l2 = race_res.laps[idx + 1]
        assert l1.fuel_remaining_kg >= l2.fuel_remaining_kg
        assert l1.vehicle_mass_kg >= l2.vehicle_mass_kg
        assert l1.cumulative_time_s < l2.cumulative_time_s
