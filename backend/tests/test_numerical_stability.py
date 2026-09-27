import math

from app.analytics.strategy_engine import StrategySimulationEngine
from app.analytics.synthetic_aero_generator import SyntheticAeroGenerator
from app.analytics.tyre_model import SyntheticTyreModel
from app.analytics.vehicle_performance import VehiclePerformanceSimulator


def test_division_by_zero_and_near_zero_speeds():
    """
    Test that calculating aero forces and time at near-zero speeds (v -> 0)
    never results in ZeroDivisionError, Inf, or NaN.
    """
    gen = SyntheticAeroGenerator()
    zero_speeds = [0.0, 1e-9, 1e-6, 0.01, 1.0]

    for v in zero_speeds:
        out = gen.evaluate_physics(
            front_wing_angle=18.0,
            rear_wing_angle=24.0,
            ride_height_front=30.0,
            ride_height_rear=42.0,
            yaw_angle=0.0,
            vehicle_speed_kph=v,
        )
        downforce = float(out["downforce_n"])
        drag = float(out["drag_n"])
        assert not math.isnan(downforce)
        assert not math.isinf(downforce)
        assert not math.isnan(drag)
        assert not math.isinf(drag)
        assert downforce >= 0.0
        assert drag >= 0.0


def test_extreme_aerodynamic_coefficients_stability():
    """
    Evaluate aerodynamic equations across realistic upper and lower operational limits.
    """
    gen = SyntheticAeroGenerator()

    # Extreme low AoA, high ride height
    min_forces = gen.evaluate_physics(
        front_wing_angle=10.0,
        rear_wing_angle=15.0,
        ride_height_front=45.0,
        ride_height_rear=70.0,
        yaw_angle=15.0,
        vehicle_speed_kph=350.0,
    )
    # Extreme high AoA, minimum ride height
    max_forces = gen.evaluate_physics(
        front_wing_angle=35.0,
        rear_wing_angle=40.0,
        ride_height_front=25.0,
        ride_height_rear=50.0,
        yaw_angle=0.0,
        vehicle_speed_kph=350.0,
    )

    for out in [min_forces, max_forces]:
        downforce = float(out["downforce_n"])
        drag = float(out["drag_n"])
        assert not math.isnan(downforce)
        assert not math.isinf(downforce)
        assert not math.isnan(drag)
        assert not math.isinf(drag)
        assert downforce > 0.0
        assert drag > 0.0


def test_tyre_model_extreme_laps_and_wear():
    """
    Test tyre wear calculation across tyre life up to lap 60.
    Ensure grip never becomes negative or NaN, and progressive wear accumulates post warm-up.
    """
    model = SyntheticTyreModel()
    compounds = ["SOFT", "MEDIUM", "HARD"]

    for comp in compounds:
        cfg = model.compounds[comp]
        # Inspect behavior post warm-up (laps > warmup_laps)
        prev_penalty = 0.0
        for lap in range(cfg.warmup_laps + 1, 60):
            t_state = model.evaluate_grip(compound_code=comp, tyre_age=lap)

            assert not math.isnan(t_state.degradation_penalty_s)
            assert not math.isinf(t_state.degradation_penalty_s)
            assert t_state.degradation_penalty_s >= 0.0
            # Degradation penalty increases monotonically until cliff minimum grip is reached
            assert t_state.degradation_penalty_s >= prev_penalty - 1e-9

            assert not math.isnan(t_state.effective_grip)
            assert not math.isinf(t_state.effective_grip)
            assert 0.0 < t_state.effective_grip <= 2.5

            prev_penalty = t_state.degradation_penalty_s


def test_vehicle_simulator_extreme_parameters():
    """
    Test vehicle kinematics simulation with minimum and maximum aerodynamic loads.
    """
    sim = VehiclePerformanceSimulator()

    loads = [
        (2.0, 0.6),    # Low downforce, low drag
        (4.5, 1.2),    # High downforce, high drag
        (1.0, 0.3),    # Ultra-low
        (5.5, 1.6),    # Extreme high
    ]

    for cl, cd in loads:
        res = sim.simulate_lap(cl_total=cl, cd_total=cd, mass_kg=800.0, tyre_grip_mu=1.75)

        assert not math.isnan(res.modeled_lap_time_s)
        assert not math.isinf(res.modeled_lap_time_s)
        assert 50.0 < res.modeled_lap_time_s < 120.0  # Physically plausible lap time at Monza

        assert not math.isnan(res.total_corner_time_s)
        assert not math.isnan(res.total_straight_time_s)
        assert res.total_corner_time_s > 0.0
        assert res.total_straight_time_s > 0.0
        # Total modeled lap time accounts for corner transit, straight transit, and chicane transition overhead
        assert res.modeled_lap_time_s >= res.total_corner_time_s + res.total_straight_time_s


def test_strategy_engine_extreme_weather_and_safety_car():
    """
    Ensure strategy engine handles all discrete operational states cleanly.
    """
    engine = StrategySimulationEngine()
    stints = [
        {"compound": "MEDIUM", "laps": 25},
        {"compound": "HARD", "laps": 28},
    ]
    weathers = ["DRY", "COOL", "HOT"]
    safety_cars = ["GREEN", "VSC", "SC"]
    traffics = ["CLEAR_AIR", "LIGHT_TRAFFIC", "HEAVY_TRAFFIC"]

    for w in weathers:
        for sc in safety_cars:
            for tr in traffics:
                res = engine.simulate_race(
                    strategy_id="strat_1stop_med_hard",
                    stint_definitions=stints,
                    weather_code=w,
                    safety_car_code=sc,
                    traffic_code=tr,
                    random_seed=42871,
                )
                assert not math.isnan(res.total_race_time_s)
                assert not math.isinf(res.total_race_time_s)
                assert 3500.0 < res.total_race_time_s < 7000.0
                assert len(res.laps) == 53
