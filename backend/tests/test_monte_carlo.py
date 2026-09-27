import numpy as np

from app.analytics.monte_carlo import MonteCarloSimulationService
from app.analytics.response_models import LinearResponseModel


def test_monte_carlo_simulation_and_reproducibility():
    x = np.array([179.0, 180.0, 181.0, 182.0, 183.0, 184.0])
    y = np.array([4.26, 4.24, 4.22, 4.20, 4.18, 4.16])
    model = LinearResponseModel(target_name="corner_time", feature_name="corner_exit_speed")
    model.fit(x, y)

    # Run 1 with seed 42871
    res1 = MonteCarloSimulationService.run_simulation(
        model=model,
        baseline_val=181.2,
        scenario_mean=183.0,
        scenario_std=0.8,
        iterations=5000,
        simulation_seed=42871,
    )

    # Run 2 with same seed 42871
    res2 = MonteCarloSimulationService.run_simulation(
        model=model,
        baseline_val=181.2,
        scenario_mean=183.0,
        scenario_std=0.8,
        iterations=5000,
        simulation_seed=42871,
    )

    # Deterministic reproducibility check
    assert res1.mean_delta == res2.mean_delta
    assert res1.median_delta == res2.median_delta
    assert res1.p05_delta == res2.p05_delta
    assert res1.p95_delta == res2.p95_delta
    assert res1.bins[0].count == res2.bins[0].count

    # Statistics ordering
    assert res1.p05_delta < res1.p50_delta < res1.p95_delta
    assert res1.mean_delta < 0.0  # Speed increase reduces transit time
    assert len(res1.bins) == 25
    assert res1.result_type == "MODELLED"
