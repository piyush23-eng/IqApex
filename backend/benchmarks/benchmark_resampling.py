"""
Performance benchmark for 1.0m spatial distance resampling and telemetry alignment.
Ensures resampling latency meets the < 50ms pit-wall live stream processing budget.
"""

import time
import numpy as np
import pandas as pd
from app.telemetry.resampling import DistanceResampler


def generate_benchmark_trace(num_points: int = 12000) -> pd.DataFrame:
    """Generates synthetic high-frequency raw telemetry trace (100Hz)."""
    np.random.seed(42)
    timestamps = np.linspace(0, 80.0, num_points)
    speed = 250.0 + 80.0 * np.sin(timestamps * 0.1) + np.random.normal(0, 1.0, num_points)
    distance = np.cumsum(speed / 3.6 * (80.0 / num_points))
    
    return pd.DataFrame({
        "timestamp": timestamps,
        "distance": distance,
        "speed": speed,
        "throttle": np.clip(0.5 + 0.5 * np.sin(timestamps * 0.15), 0, 1) * 100,
        "brake": np.clip(np.random.exponential(5, num_points), 0, 120),
        "gear": np.random.randint(1, 9, num_points),
        "lat_acc": 2.5 * np.sin(timestamps * 0.2),
        "long_acc": 1.5 * np.cos(timestamps * 0.2),
    })


def run_resampling_benchmark(iterations: int = 50) -> dict:
    df = generate_benchmark_trace()
    start_dist = float(df["distance"].min())
    end_dist = float(df["distance"].max())

    durations = []
    for _ in range(iterations):
        t0 = time.perf_counter()
        _resampled = DistanceResampler.resample(
            df, distance_step=1.0, start_dist=start_dist, end_dist=end_dist
        )
        t1 = time.perf_counter()
        durations.append((t1 - t0) * 1000.0)  # ms

    durations = np.array(durations)
    return {
        "iterations": iterations,
        "mean_ms": float(np.mean(durations)),
        "median_ms": float(np.median(durations)),
        "p95_ms": float(np.percentile(durations, 95)),
        "p99_ms": float(np.percentile(durations, 99)),
        "max_ms": float(np.max(durations)),
        "budget_passed": bool(np.percentile(durations, 95) < 50.0),
    }


if __name__ == "__main__":
    results = run_resampling_benchmark()
    print("=== Resampling Performance Benchmark ===")
    for k, v in results.items():
        print(f"  {k}: {v}")
