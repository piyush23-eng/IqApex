from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np

from app.analytics.strategy_engine import StrategySimulationEngine


@dataclass
class StrategyMonteCarloResult:
    strategy_id: str
    simulation_seed: int
    iterations: int
    mean_race_time_s: float
    median_race_time_s: float
    std_dev_race_time_s: float
    p05_race_time_s: float
    p10_race_time_s: float
    p25_race_time_s: float
    p50_race_time_s: float
    p75_race_time_s: float
    p90_race_time_s: float
    p95_race_time_s: float
    bins: list[dict[str, float]]
    probability_beating_ref: float | None = None
    scientific_disclaimer: str = (
        "Deterministic Monte Carlo strategy simulation propagating stochastic tyre wear rates, "
        "pit stationary delays, and probabilistic traffic delays into race completion times."
    )


class StrategyMonteCarloSimulator:
    """
    Executes deterministic Monte Carlo analysis over race strategies.
    Varied parameters:
    - Tyre degradation slope: N(1.0, 0.08)
    - Pit stop duration: N(24.5, 0.35)
    - Traffic delays
    """

    @staticmethod
    def run_simulation(
        engine: StrategySimulationEngine,
        strategy_id: str,
        stint_definitions: list[dict[str, Any]],
        weather_code: str = "DRY",
        safety_car_code: str = "GREEN",
        traffic_code: str = "LIGHT_TRAFFIC",
        iterations: int = 1000,
        random_seed: int = 42871,
        ref_race_time_s: float | None = None,
    ) -> StrategyMonteCarloResult:
        rng = np.random.default_rng(random_seed)

        # Baseline single deterministic race run
        base_res = engine.simulate_race(
            strategy_id=strategy_id,
            stint_definitions=stint_definitions,
            weather_code=weather_code,
            safety_car_code=safety_car_code,
            traffic_code=traffic_code,
            random_seed=random_seed,
        )
        base_t = base_res.total_race_time_s
        num_stops = base_res.pit_stops_count

        # Stochastically perturb parameters around baseline
        # 1. Tyre wear multiplier per simulation
        deg_mults = rng.normal(1.0, 0.08, size=iterations)
        # 2. Pit stop variance per stop (~N(0, 0.35s))
        pit_deltas = rng.normal(0.0, 0.35 * np.sqrt(max(num_stops, 1)), size=iterations)
        # 3. Traffic variance (~N(0, 0.50s))
        traffic_deltas = rng.normal(0.0, 0.50, size=iterations)

        race_times = []
        for i in range(iterations):
            # Proportional delta from tyre degradation
            # In Monza 53 laps, ~8% deg change alters total race by ~4.5s
            t_deg_delta = (deg_mults[i] - 1.0) * 4.5 * (1.0 + 0.4 * num_stops)
            sim_t = base_t + t_deg_delta + pit_deltas[i] + traffic_deltas[i]
            race_times.append(sim_t)

        t_arr = np.array(race_times)

        # Histogram calculation (25 bins)
        hist, bin_edges = np.histogram(t_arr, bins=25)
        bins = []
        for b_idx in range(len(hist)):
            bins.append({
                "bin_start": round(float(bin_edges[b_idx]), 2),
                "bin_end": round(float(bin_edges[b_idx + 1]), 2),
                "count": int(hist[b_idx]),
                "frequency": round(float(hist[b_idx] / iterations), 4),
            })

        p_beat = None
        if ref_race_time_s is not None:
            p_beat = round(float(np.mean(t_arr < ref_race_time_s)), 4)

        return StrategyMonteCarloResult(
            strategy_id=strategy_id,
            simulation_seed=random_seed,
            iterations=iterations,
            mean_race_time_s=round(float(np.mean(t_arr)), 2),
            median_race_time_s=round(float(np.median(t_arr)), 2),
            std_dev_race_time_s=round(float(np.std(t_arr, ddof=1)), 2),
            p05_race_time_s=round(float(np.percentile(t_arr, 5)), 2),
            p10_race_time_s=round(float(np.percentile(t_arr, 10)), 2),
            p25_race_time_s=round(float(np.percentile(t_arr, 25)), 2),
            p50_race_time_s=round(float(np.percentile(t_arr, 50)), 2),
            p75_race_time_s=round(float(np.percentile(t_arr, 75)), 2),
            p90_race_time_s=round(float(np.percentile(t_arr, 90)), 2),
            p95_race_time_s=round(float(np.percentile(t_arr, 95)), 2),
            bins=bins,
            probability_beating_ref=p_beat,
        )
