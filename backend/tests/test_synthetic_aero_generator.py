import pandas as pd

from app.analytics.synthetic_aero_generator import SyntheticAeroGenerator


def test_synthetic_aero_generator_constants_and_params():
    gen = SyntheticAeroGenerator()
    assert gen.constants["air_density_kg_m3"] == 1.225
    assert gen.constants["reference_area_m2"] == 1.60
    assert "front_wing_angle" in gen.parameters
    assert "rear_wing_angle" in gen.parameters
    assert "ride_height_front" in gen.parameters
    assert "tyre_grip" in gen.parameters


def test_deterministic_seed_reproducibility():
    gen = SyntheticAeroGenerator()
    df1, meta1 = gen.generate_doe_dataset(sample_count=200, random_seed=42871)
    df2, meta2 = gen.generate_doe_dataset(sample_count=200, random_seed=42871)

    assert meta1.dataset_hash == meta2.dataset_hash
    pd.testing.assert_frame_equal(df1, df2)


def test_physics_equations_monotonicity_and_bounds():
    gen = SyntheticAeroGenerator()
    
    # Test increasing front wing angle increases Cl and Cd
    p_low = gen.evaluate_physics(
        front_wing_angle=12.0,
        rear_wing_angle=20.0,
        ride_height_front=30.0,
        ride_height_rear=40.0,
        yaw_angle=0.0,
        vehicle_speed_kph=250.0,
    )
    p_high = gen.evaluate_physics(
        front_wing_angle=22.0,
        rear_wing_angle=20.0,
        ride_height_front=30.0,
        ride_height_rear=40.0,
        yaw_angle=0.0,
        vehicle_speed_kph=250.0,
    )

    assert p_high["cl"] > p_low["cl"]
    assert p_high["cd"] > p_low["cd"]
    assert p_high["downforce_n"] > p_low["downforce_n"]
    assert p_high["drag_n"] > p_low["drag_n"]
    assert p_high["aero_balance_pct"] > p_low["aero_balance_pct"]

    # Test dynamic pressure proportionality: doubling speed roughly quadruples forces
    p_spd1 = gen.evaluate_physics(15.0, 20.0, 30.0, 40.0, 0.0, 150.0)
    p_spd2 = gen.evaluate_physics(15.0, 20.0, 30.0, 40.0, 0.0, 300.0)
    ratio = p_spd2["downforce_n"] / p_spd1["downforce_n"]
    assert 3.8 < ratio < 4.2
