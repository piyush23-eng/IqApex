from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from app.analytics.vehicle_performance import VehiclePerformanceSimulator


@dataclass
class AeroMonteCarloResult:
    simulation_seed: int
    iterations: int
    mean_lap_time_s: float
    median_lap_time_s: float
    std_dev_lap_time_s: float
    p05_lap_time_s: float
    p10_lap_time_s: float
    p50_lap_time_s: float
    p90_lap_time_s: float
    p95_lap_time_s: float
    p05_downforce_n: float
    p95_downforce_n: float
    mean_downforce_n: float
    bins: list[dict[str, float]]
    scientific_disclaimer: str = (
        "Deterministic Monte Carlo simulation propagating parameter, tyre grip, and aerodynamic "
        "model uncertainty into vehicle lap time estimates."
    )


class AeroMonteCarloEngine:
    """
    Propagates uncertainty from Cl, Cd, tyre grip, vehicle mass, and speed
    into vehicle lap performance distributions.
    """

    @staticmethod
    def run_simulation(
        baseline_cl: float,
        baseline_cd: float,
        cl_std: float = 0.03,
        cd_std: float = 0.02,
        tyre_grip_mean: float = 1.75,
        tyre_grip_std: float = 0.03,
        mass_kg: float = 810.0,
        iterations: int = 500,
        random_seed: int = 42871,
    ) -> AeroMonteCarloResult:
        rng = np.random.default_rng(random_seed)
        sim = VehiclePerformanceSimulator()

        cl_samples = rng.normal(baseline_cl, cl_std, size=iterations)
        cd_samples = rng.normal(baseline_cd, cd_std, size=iterations)
        grip_samples = rng.normal(tyre_grip_mean, tyre_grip_std, size=iterations)

        cl_samples = np.clip(cl_samples, 0.8, 5.0)
        cd_samples = np.clip(cd_samples, 0.4, 2.5)
        grip_samples = np.clip(grip_samples, 1.3, 2.2)

        lap_times = []
        downforces = []

        ref_v_ms = 250.0 / 3.6
        q_ref = 0.5 * 1.225 * (ref_v_ms**2) * 1.60

        for i in range(iterations):
            cl = float(cl_samples[i])
            cd = float(cd_samples[i])
            mu = float(grip_samples[i])

            res = sim.simulate_lap(cl_total=cl, cd_total=cd, mass_kg=mass_kg, tyre_grip_mu=mu)
            lap_times.append(res.modeled_lap_time_s)
            downforces.append(q_ref * cl)

        lt_arr = np.array(lap_times)
        df_arr = np.array(downforces)

        # Histogram binning (20 bins)
        hist, bin_edges = np.histogram(lt_arr, bins=20)
        bins = []
        for b_idx in range(len(hist)):
            bins.append({
                "bin_start": round(float(bin_edges[b_idx]), 3),
                "bin_end": round(float(bin_edges[b_idx + 1]), 3),
                "count": int(hist[b_idx]),
                "frequency": round(float(hist[b_idx] / iterations), 4),
            })

        return AeroMonteCarloResult(
            simulation_seed=random_seed,
            iterations=iterations,
            mean_lap_time_s=round(float(np.mean(lt_arr)), 3),
            median_lap_time_s=round(float(np.median(lt_arr)), 3),
            std_dev_lap_time_s=round(float(np.std(lt_arr, ddof=1)), 3),
            p05_lap_time_s=round(float(np.percentile(lt_arr, 5)), 3),
            p10_lap_time_s=round(float(np.percentile(lt_arr, 10)), 3),
            p50_lap_time_s=round(float(np.percentile(lt_arr, 50)), 3),
            p90_lap_time_s=round(float(np.percentile(lt_arr, 90)), 3),
            p95_lap_time_s=round(float(np.percentile(lt_arr, 95)), 3),
            p05_downforce_n=round(float(np.percentile(df_arr, 5)), 1),
            p95_downforce_n=round(float(np.percentile(df_arr, 95)), 1),
            mean_downforce_n=round(float(np.mean(df_arr)), 1),
            bins=bins,
        )
