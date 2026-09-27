from app.analytics.strategy_engine import StrategySimulationEngine
from app.analytics.strategy_monte_carlo import StrategyMonteCarloSimulator
from app.analytics.synthetic_aero_generator import SyntheticAeroGenerator


def test_percentile_monotonicity_property():
    """
    Mathematical Invariant: For any empirical cumulative distribution,
    quantiles must be monotonically non-decreasing:
    P05 <= P10 <= P50 <= P90 <= P95
    """
    engine = StrategySimulationEngine()
    stints = [
        {"compound": "MEDIUM", "laps": 25},
        {"compound": "HARD", "laps": 28},
    ]
    result = StrategyMonteCarloSimulator.run_simulation(
        engine=engine,
        strategy_id="strat_1stop_med_hard",
        stint_definitions=stints,
        iterations=300,
        weather_code="DRY",
        safety_car_code="GREEN",
        random_seed=42871,
    )

    p05 = result.p05_race_time_s
    p50 = result.p50_race_time_s
    p95 = result.p95_race_time_s

    assert p05 <= p50 <= p95, f"Violation: p05={p05}, p50={p50}, p95={p95}"
    # Mean should be close to median in approximately symmetric simulation error
    assert abs(result.mean_race_time_s - p50) < 10.0


def test_race_simulation_physical_properties():
    """
    Physical Invariants for 53-lap Monza race simulation:
    - fuel_remaining in [0, starting_fuel]
    - tyre_age >= 0
    - race_time > 0
    - lap_time > 0
    - pit_loss >= 0
    """
    engine = StrategySimulationEngine()
    stints = [
        {"compound": "MEDIUM", "laps": 25},
        {"compound": "HARD", "laps": 28},
    ]
    sim = engine.simulate_race(
        strategy_id="strat_1stop_med_hard",
        stint_definitions=stints,
        weather_code="DRY",
        safety_car_code="GREEN",
        traffic_code="LIGHT_TRAFFIC",
        random_seed=42871,
    )

    starting_fuel = 105.0
    assert sim.total_race_time_s > 0.0

    for lap in sim.laps:
        assert lap.lap_number >= 1
        assert lap.lap_time_s > 60.0  # F1 Monza lap is at least ~70s
        assert lap.tyre_age >= 0
        assert 0.0 <= lap.fuel_remaining_kg <= starting_fuel
        assert lap.tyre_penalty_s >= 0.0
        assert lap.traffic_penalty_s >= 0.0
        if lap.is_pit_in_lap:
            assert lap.pit_loss_s > 20.0
        else:
            assert lap.pit_loss_s == 0.0


def test_aero_forces_non_negative_properties():
    """
    Physical Property: For positive speeds and standard angles,
    downforce >= 0 and drag >= 0.
    """
    gen = SyntheticAeroGenerator()
    for rw in [18.0, 22.0, 26.0, 30.0]:
        for fw in [14.0, 18.0, 22.0]:
            out = gen.evaluate_physics(
                rear_wing_angle=rw,
                front_wing_angle=fw,
                ride_height_front=30.0,
                ride_height_rear=70.0,
                yaw_angle=0.0,
                vehicle_speed_kph=200.0,
            )
            assert out["downforce_n"] >= 0.0, f"Negative downforce at rw={rw}, fw={fw}"
            assert out["drag_n"] >= 0.0, f"Negative drag at rw={rw}, fw={fw}"
            assert out["lift_to_drag"] > 0.0
            assert 0.0 < out["aero_balance_pct"] < 100.0
