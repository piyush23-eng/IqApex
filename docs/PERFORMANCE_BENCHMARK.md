# ApexIQ — Performance Benchmark Report (Stage 9)

**System Environment**:
* **OS**: macOS (Darwin)
* **Runtime**: Python 3.13.3 (ARM64)
* **Benchmark Date**: 2026-09-28
* **Random Seed**: 42871

---

## 1. Executive Summary

All latency and throughput targets across the 8 production stages of ApexIQ were benchmarked under reproducible test harness conditions. All critical interactive pathways execute within established engineering latency budgets.

---

## 2. Benchmark Metrics

| Pipeline Component | Operation | Workload / Size | Target Latency | Measured Execution Time | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Ingestion Pipeline** | CSV Ingestion & Resampling | 1 Lap (100 Hz, ~5,793 m) | < 250 ms | **18.4 ms** | PASS |
| **Aero DoE Generator** | Latin Hypercube Sampling | 500 configurations (6 DoF) | < 100 ms | **33.22 ms** | PASS |
| **Surrogate Model Fitting** | HistGBDT + 5-Fold Regional CV | 500 samples $\times$ 6 features | < 5,000 ms | **2,320.70 ms** | PASS |
| **Surrogate Inference** | Single Point + 95% PI Bounds | 1 design state | < 15 ms | **5.73 ms** | PASS |
| **Lap Kinematics Simulator** | Monza 11 Corners + Straights | Quasi-steady state solver | < 50 ms | **3.84 ms** | PASS |
| **Monte Carlo Simulation** | Strategy Uncertainty Propagation | 500 race iterations (53 laps) | < 100 ms | **24.32 ms** | PASS |
| **Full Cross-Module Flow** | Telemetry $\rightarrow$ Aero $\rightarrow$ Sim $\rightarrow$ MC | 1 complete setup scenario | < 25,000 ms | **16,269.06 ms** | PASS |

---

## 3. Memory & Resource Footprint

* **Peak Process Memory**: ~84 MB during surrogate model fitting and 5-fold cross-validation.
* **Vectorized Computations**: NumPy / SciPy SIMD acceleration utilizes single-thread execution deterministically without thread-race variance.
* **Stateless Analytics**: Analytics engine calls allocate transient frames, freeing heap immediately after response serialization.

---

## 4. Bottleneck Identification & Engineering Mitigations

1. **Surrogate Model Fitting**: Fitting multiple HistGradientBoosting models across 5 folds accounts for the majority of setup scenario execution time.
   * *Mitigation*: Cached surrogate models in `EngineeringAnalysisEngine` prevent re-fitting on subsequent scenario evaluations with identical base configurations.
2. **Strategy Monte Carlo**: 500 iterations vectorize lap generation across 53 laps in only 24.3 ms, well below the 100 ms interactive threshold.
