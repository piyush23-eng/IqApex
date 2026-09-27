from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

import numpy as np

from app.analytics.response_models import BaseResponseModel


@dataclass
class HistogramBin:
    bin_start: float
    bin_end: float
    count: int
    frequency: float


@dataclass
class MonteCarloDistributionResult:
    simulation_seed: int
    iterations: int
    parameter_name: str
    target_name: str
    baseline_value: float
    scenario_mean: float
    scenario_std: float
    mean_delta: float
    median_delta: float
    std_dev_delta: float
    p05_delta: float
    p10_delta: float
    p50_delta: float
    p90_delta: float
    p95_delta: float
    bins: list[HistogramBin]
    result_type: Literal["MODELLED"] = "MODELLED"
    disclaimer: str = "MODELLED output based on fitted response and Gaussian uncertainty propagation. Not track-validated."


class MonteCarloSimulationService:
    """Reusable deterministic Monte Carlo uncertainty propagation service."""

    @classmethod
    def run_simulation(
        cls,
        model: BaseResponseModel,
        baseline_val: float,
        scenario_mean: float,
        scenario_std: float,
        iterations: int = 10000,
        simulation_seed: int = 42871,
        include_residual_variance: bool = True,
        n_bins: int = 25,
    ) -> MonteCarloDistributionResult:
        # Deterministic RNG
        rng = np.random.default_rng(simulation_seed)

        # 1. Sample input parameter distribution
        x_samples = rng.normal(loc=scenario_mean, scale=max(1e-4, scenario_std), size=iterations)

        # 2. Evaluate model predictions
        base_pred = model.predict(np.array([baseline_val]))[0]
        y_predictions = model.predict(x_samples)

        # 3. Add residual model variance if requested
        if include_residual_variance and model.residual_std > 1e-6:
            residuals = rng.normal(loc=0.0, scale=model.residual_std, size=iterations)
            y_outcomes = y_predictions + residuals
        else:
            y_outcomes = y_predictions

        # 4. Deltas relative to baseline
        deltas = y_outcomes - base_pred

        # 5. Distribution statistics
        mean_d = float(np.mean(deltas))
        median_d = float(np.median(deltas))
        std_d = float(np.std(deltas, ddof=1))

        p05 = float(np.percentile(deltas, 5))
        p10 = float(np.percentile(deltas, 10))
        p50 = float(np.percentile(deltas, 50))
        p90 = float(np.percentile(deltas, 90))
        p95 = float(np.percentile(deltas, 95))

        # 6. Generate Histogram bins
        counts, bin_edges = np.histogram(deltas, bins=n_bins)
        bins: list[HistogramBin] = []
        for i in range(len(counts)):
            bins.append(
                HistogramBin(
                    bin_start=round(float(bin_edges[i]), 4),
                    bin_end=round(float(bin_edges[i + 1]), 4),
                    count=int(counts[i]),
                    frequency=round(float(counts[i] / iterations), 4),
                )
            )

        return MonteCarloDistributionResult(
            simulation_seed=simulation_seed,
            iterations=iterations,
            parameter_name=model.feature_names[0],
            target_name=model.target_name,
            baseline_value=round(baseline_val, 3),
            scenario_mean=round(scenario_mean, 3),
            scenario_std=round(scenario_std, 3),
            mean_delta=round(mean_d, 4),
            median_delta=round(median_d, 4),
            std_dev_delta=round(std_d, 4),
            p05_delta=round(p05, 4),
            p10_delta=round(p10, 4),
            p50_delta=round(p50, 4),
            p90_delta=round(p90, 4),
            p95_delta=round(p95, 4),
            bins=bins,
            result_type="MODELLED",
        )
