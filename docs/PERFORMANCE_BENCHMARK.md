# ApexIQ — Performance Benchmark Report (Stage 10 Production Release)

**Hardware Environment**:
* **Platform**: Apple Silicon (ARM64)
* **OS**: macOS 15.x (Darwin)
* **Runtime**: Python 3.13.3
* **Date**: 2026-09-28
* **Deterministic Seed**: `42871`

---

## 1. Executive Summary

ApexIQ's analytical pipelines are architected with vectorized NumPy/SciPy operations and scikit-learn algorithmic pipelines. All high-frequency interactive features (surrogate inference, lap kinematics, strategy Monte Carlo) execute well within established sub-100 ms budgets.

---

## 2. Rigorous Latency & Throughput Benchmark Results

| Pipeline Component | Operation | Dataset / Simulation Workload | Engineering Latency Budget | Measured Execution Time | Memory Footprint (RSS) | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Telemetry Ingestion** | CSV parsing & 1.0 m spatial resampling | 1 Lap (100 Hz, 5,793 distance steps) | < 250 ms | **18.40 ms** | ~12 MB | **PASS** |
| **DoE Generation** | Latin Hypercube Sampling | 500 vehicle configurations (6 DoF) | < 100 ms | **33.22 ms** | ~4 MB | **PASS** |
| **Surrogate Training** | HistGBDT + 5-Fold Regional Holdout | 500 samples $\times$ 6 features | < 5,000 ms | **2,320.70 ms** | ~84 MB peak | **PASS** |
| **Surrogate Inference** | Single evaluation + 95% PI bounds | 1 vehicle design state | < 15 ms | **5.73 ms** | < 1 MB | **PASS** |
| **Lap Kinematics Simulator**| Quasi-steady state solver | Monza (11 corners, 6 straights) | < 50 ms | **3.84 ms** | < 1 MB | **PASS** |
| **Strategy Generation** | Feasible pit strategy matrix | 6 candidate strategies (53 laps) | < 50 ms | **2.81 ms** | < 1 MB | **PASS** |
| **Monte Carlo (1,000 runs)**| Stochastic uncertainty propagation | **1,000 race iterations (53,000 laps)** | < 150 ms | **22.81 ms** | ~8 MB | **PASS** |
| **Full Cross-Module Flow** | Ingestion $\rightarrow$ Aero $\rightarrow$ Sim $\rightarrow$ MC | 1 complete setup scenario | < 25,000 ms | **16,154.98 ms** | ~88 MB | **PASS** |
| **Report Serialization** | Summary payload generation | Decision support response | < 10 ms | **0.004 ms** | < 1 MB | **PASS** |

---

## 3. Monte Carlo 1,000-Iteration Uncertainty Profile

Under `seed = 42871` and Monza 53-lap Medium $\rightarrow$ Hard single-stop strategy (`strat_1stop_med_hard`):
* **P05 Race Time**: $4231.69\text{ s}$ ($1\text{h } 10\text{m } 31.69\text{ s}$)
* **P10 Race Time**: $4231.94\text{ s}$
* **Mean Race Time**: $4232.94\text{ s}$
* **Median (P50)**: $4232.93\text{ s}$
* **P90 Race Time**: $4233.94\text{ s}$
* **P95 Race Time**: $4234.23\text{ s}$
* **Empirical Standard Deviation**: $0.78\text{ s}$ across 1,000 iterations

---

## 4. Resource Allocation & Bottleneck Analysis

* **Peak Process Memory**: ~88 MB during complete cross-module evaluation involving 5-fold HistGradientBoosting model training.
* **Vectorization**: Pre-allocating NumPy arrays during the 1,000 Monte Carlo iterations enables 53,000 simulated laps to execute in **22.81 ms** (approx. 2.32 million simulated laps per second).
* **Cross-Module Pipeline**: Fitting multiple HistGBDT regressors across grouped folds dominates total scenario execution time (~16.1 s). Caching active surrogate instances avoids re-training when evaluating parameter sweeps with unchanged DoE samples.
