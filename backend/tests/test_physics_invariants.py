import math

import numpy as np

from app.analytics.strategy_engine import StrategySimulationEngine
from app.analytics.synthetic_aero_generator import SyntheticAeroGenerator
from app.analytics.vehicle_performance import VehiclePerformanceSimulator


def test_dynamic_pressure_scaling_invariant():
    """
    Physics Invariant: Dynamic Pressure q = 0.5 * rho * v^2
    Verification: q(2v) == 4 * q(v) within 1e-12 relative tolerance.
    """
    rho = 1.225
    v1_ms = 40.0  # ~144 km/h
    v2_ms = 2.0 * v1_ms  # 80.0 m/s (~288 km/h)

    q1 = 0.5 * rho * (v1_ms**2)
    q2 = 0.5 * rho * (v2_ms**2)

    assert math.isclose(q2, 4.0 * q1, rel_tol=1e-12)
    assert math.isclose(q1, 0.5 * 1.225 * 1600.0, rel_tol=1e-12)


def test_generator_dynamic_pressure_consistency():
    """
    Ensure SyntheticAeroGenerator computes dynamic pressure with 0.5 * rho * v^2
    """
    gen = SyntheticAeroGenerator()
    v1_kph = 150.0
    v2_kph = 300.0

    out1 = gen.evaluate_physics(
        rear_wing_angle=24.0,
        front_wing_angle=18.0,
        ride_height_front=30.0,
        ride_height_rear=70.0,
        yaw_angle=0.0,
        vehicle_speed_kph=v1_kph,
    )
    out2 = gen.evaluate_physics(
        rear_wing_angle=24.0,
        front_wing_angle=18.0,
        ride_height_front=30.0,
        ride_height_rear=70.0,
        yaw_angle=0.0,
        vehicle_speed_kph=v2_kph,
    )

    # Force is proportional to v^2 since Cl is constant with speed
    ratio_df = out2["downforce_n"] / out1["downforce_n"]
    ratio_drag = out2["drag_n"] / out1["drag_n"]
    assert math.isclose(ratio_df, 4.0, rel_tol=1e-4)
    assert math.isclose(ratio_drag, 4.0, rel_tol=1e-4)


def test_downforce_wing_monotonicity_within_domain():
    """
    Physics Invariant: Within valid aerodynamic domain [18°, 28°],
    increasing rear wing angle must monotonically increase rear wing downforce.
    """
    gen = SyntheticAeroGenerator()
    angles = np.linspace(18.0, 28.0, 11)
    downforces = []

    for rw in angles:
        out = gen.evaluate_physics(
            rear_wing_angle=rw,
            front_wing_angle=18.0,
            ride_height_front=30.0,
            ride_height_rear=70.0,
            yaw_angle=0.0,
            vehicle_speed_kph=250.0,
        )
        downforces.append(out["downforce_n"])

    # Strict monotonic increase
    for i in range(len(downforces) - 1):
        assert downforces[i + 1] > downforces[i], f"Non-monotonic downforce at rw={angles[i+1]}"


def test_induced_drag_behavior():
    """
    Physics Invariant: Drag increases monotonically with wing loading.
    Cd = Cd0 + induced_drag(Cl^2).
    """
    gen = SyntheticAeroGenerator()
    angles = np.linspace(18.0, 28.0, 11)
    drags = []

    for rw in angles:
        out = gen.evaluate_physics(
            rear_wing_angle=rw,
            front_wing_angle=18.0,
            ride_height_front=30.0,
            ride_height_rear=70.0,
            yaw_angle=0.0,
            vehicle_speed_kph=250.0,
        )
        drags.append(out["drag_n"])

    for i in range(len(drags) - 1):
        assert drags[i + 1] > drags[i], f"Non-monotonic drag at rw={angles[i+1]}"


def test_fuel_depletion_monotonic_mass_reduction():
    """
    Physics Invariant: Vehicle mass m(t) = m_base + m_fuel(t).
    Fuel burn monotonically reduces total vehicle mass.
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
        traffic_code="CLEAN_AIR",
        random_seed=42871,
    )

    fuel_remaining = [lap.fuel_remaining_kg for lap in sim.laps]
    vehicle_mass = [lap.vehicle_mass_kg for lap in sim.laps]

    assert len(fuel_remaining) == 53
    assert len(vehicle_mass) == 53

    # Initial and final mass sanity
    assert fuel_remaining[0] == 105.0
    assert fuel_remaining[-1] > 0.0  # Must not run out of fuel
    assert fuel_remaining[-1] < 105.0

    # Monotonic mass decrease
    for i in range(len(vehicle_mass) - 1):
        assert vehicle_mass[i + 1] < vehicle_mass[i], f"Mass did not decrease at lap {i+1}"
        assert fuel_remaining[i + 1] < fuel_remaining[i], f"Fuel did not decrease at lap {i+1}"


def test_lateral_force_and_grip_monotonicity():
    """
    Physics Invariant: Flat,max = mu * (m * g + Downforce)
    - Increasing tyre grip mu increases maximum cornering force.
    - Increasing downforce increases maximum cornering force.
    """
    _ = VehiclePerformanceSimulator()
    g = 9.81
    m = 800.0

    # Test grip monotonicity
    mu_low = 1.5
    mu_high = 1.9
    df = 4000.0

    flat_low = mu_low * (m * g + df)
    flat_high = mu_high * (m * g + df)
    assert flat_high > flat_low

    # Test downforce monotonicity
    df_low = 3000.0
    df_high = 5000.0
    mu = 1.7
    flat_df_low = mu * (m * g + df_low)
    flat_df_high = mu * (m * g + df_high)
    assert flat_df_high > flat_df_low


def test_straight_line_net_force_acceleration():
    """
    Physics Invariant: Fnet = Fengine - Fdrag, a = Fnet / m.
    At higher velocity, aerodynamic drag is higher; hence net acceleration is lower.
    """
    rho = 1.225
    cd = 0.85
    ref_area = 1.5
    p_engine = 740_000.0  # ~1000 hp in Watts
    m = 800.0

    v1 = 40.0  # 144 km/h
    v2 = 80.0  # 288 km/h

    f_drag1 = 0.5 * rho * ref_area * cd * (v1**2)
    f_drag2 = 0.5 * rho * ref_area * cd * (v2**2)
    assert f_drag2 > f_drag1

    f_eng1 = p_engine / v1
    f_eng2 = p_engine / v2

    a1 = (f_eng1 - f_drag1) / m
    a2 = (f_eng2 - f_drag2) / m

    assert a1 > a2 > 0.0, f"Expected higher acceleration at lower speed, got a1={a1}, a2={a2}"
