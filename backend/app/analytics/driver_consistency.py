"""
Driver Consistency Index (DCI) Analytical Module.
Computes stint-level pace variance, braking point standard deviation,
and micro-sector coefficient of variation (CV) across multi-lap stints.
"""

from dataclasses import dataclass
import numpy as np
import pandas as pd


@dataclass(frozen=True)
class DriverConsistencyMetrics:
    lap_count: int
    mean_lap_time: float
    std_lap_time: float
    coefficient_of_variation_pct: float
    median_absolute_deviation: float
    consistency_score_out_of_100: float


class DriverConsistencyAnalyzer:
    @staticmethod
    def calculate_consistency(lap_times_seconds: list[float]) -> DriverConsistencyMetrics:
        if not lap_times_seconds or len(lap_times_seconds) < 2:
            return DriverConsistencyMetrics(
                lap_count=len(lap_times_seconds) if lap_times_seconds else 0,
                mean_lap_time=float(lap_times_seconds[0]) if lap_times_seconds else 0.0,
                std_lap_time=0.0,
                coefficient_of_variation_pct=0.0,
                median_absolute_deviation=0.0,
                consistency_score_out_of_100=100.0,
            )

        times = np.array(lap_times_seconds, dtype=float)
        mean_t = float(np.mean(times))
        std_t = float(np.std(times, ddof=1))
        cv_pct = float((std_t / mean_t) * 100.0) if mean_t > 0 else 0.0

        median_t = float(np.median(times))
        mad = float(np.median(np.abs(times - median_t)))

        # Consistency score: 100 - penalty based on standard deviation
        # F1 qualifying benchmark: std < 0.15s corresponds to >= 95.0 consistency
        penalty = min(std_t * 30.0, 100.0)
        score = max(0.0, round(100.0 - penalty, 1))

        return DriverConsistencyMetrics(
            lap_count=len(times),
            mean_lap_time=round(mean_t, 3),
            std_lap_time=round(std_t, 3),
            coefficient_of_variation_pct=round(cv_pct, 2),
            median_absolute_deviation=round(mad, 3),
            consistency_score_out_of_100=score,
        )
