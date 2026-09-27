from app.analytics.aero_tradeoff import AeroTradeOffEngine
from app.analytics.synthetic_aero_generator import SyntheticAeroGenerator
from app.analytics.vehicle_performance import VehiclePerformanceSimulator


def test_vehicle_performance_corner_and_lap_simulation():
    sim = VehiclePerformanceSimulator()
    res = sim.simulate_lap(cl_total=3.2, cd_total=1.1, mass_kg=810.0, tyre_grip_mu=1.75)

    assert 70.0 < res.modeled_lap_time_s < 100.0  # Monza lap time typically ~80s
    assert len(res.corners) == 11
    assert len(res.straights) == 5
    assert res.top_speed_kph > 300.0
    assert res.mean_lateral_accel_g > 2.0


def test_pareto_frontier_computation():
    gen = SyntheticAeroGenerator()
    df, _ = gen.generate_doe_dataset(sample_count=100, random_seed=42871)

    pareto_res = AeroTradeOffEngine.compute_pareto_frontier(df, max_points=100)
    assert pareto_res.total_evaluated == 100
    assert pareto_res.pareto_efficient_count > 0
    assert len(pareto_res.pareto_frontier) == pareto_res.pareto_efficient_count
    
    # Check that in the pareto frontier, higher downforce requires higher drag
    for i in range(len(pareto_res.pareto_frontier) - 1):
        p1 = pareto_res.pareto_frontier[i]
        p2 = pareto_res.pareto_frontier[i+1]
        assert p2.drag_n >= p1.drag_n
        assert p2.downforce_n >= p1.downforce_n
