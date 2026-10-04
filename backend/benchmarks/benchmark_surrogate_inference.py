"""
Inference latency benchmark for Gradient Boosted Decision Tree (GBDT) aerodynamic surrogates.
Validates that setup what-if evaluation executes within the interactive < 5ms threshold.
"""

import time
import numpy as np
from app.analytics.aero_surrogate import AeroSurrogatePipeline


def benchmark_surrogate_inference(batch_size: int = 1, iterations: int = 200) -> dict:
    pipeline = AeroSurrogatePipeline()
    pipeline.fit_or_load()

    # Generate realistic parameter permutations around nominal Monza aero trim
    np.random.seed(101)
    samples = []
    for _ in range(iterations):
        sample = {
            "front_wing_angle": float(np.clip(18.0 + np.random.normal(0, 2.0), 12.0, 25.0)),
            "rear_wing_angle": float(np.clip(24.0 + np.random.normal(0, 3.0), 15.0, 35.0)),
            "ride_height_front": float(np.clip(32.0 + np.random.normal(0, 2.5), 25.0, 45.0)),
            "ride_height_rear": float(np.clip(70.0 + np.random.normal(0, 4.0), 55.0, 90.0)),
        }
        samples.append(sample)

    durations = []
    for sample in samples:
        t0 = time.perf_counter()
        _pred = pipeline.predict_single(sample)
        t1 = time.perf_counter()
        durations.append((t1 - t0) * 1000.0)  # ms

    durations = np.array(durations)
    return {
        "iterations": iterations,
        "mean_inference_ms": float(np.mean(durations)),
        "p95_inference_ms": float(np.percentile(durations, 95)),
        "p99_inference_ms": float(np.percentile(durations, 99)),
        "max_inference_ms": float(np.max(durations)),
        "interactive_threshold_met": bool(np.percentile(durations, 95) < 5.0),
    }


if __name__ == "__main__":
    results = benchmark_surrogate_inference()
    print("=== GBDT Surrogate Inference Benchmark ===")
    for k, v in results.items():
        print(f"  {k}: {v}")
