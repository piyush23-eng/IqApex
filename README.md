# IqApex
### Motorsport Data Science & Vehicle Dynamics Engineering Decision Platform

[![Python](https://img.shields.io/badge/Python-3.13-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-teal.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3-cyan.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-148%20Passed%20(100%25)-emerald.svg)](backend/tests/)
[![Deterministic](https://img.shields.io/badge/Seed-42871-purple.svg)](docs/REPRODUCIBILITY.md)
[![License](https://img.shields.io/badge/License-MIT-gray.svg)](LICENSE)

---

## Overview

**IqApex** is a motorsport data science platform engineered to answer the fundamental performance engineering problem:

> *"Where did the lap-time delta originate, which vehicle setup parameters govern that phase, and how do setup adjustments propagate through aerodynamic forces, vehicle kinematics, and full-distance race strategy risk?"*

The system unifies trackside telemetry analysis, aerodynamic surrogate modeling, vehicle dynamics sensitivity, and stochastic race strategy into a single quantitative pipeline. Every calculation is governed by statistical uncertainty bounds (95% CI vs. PI), grouped cross-validation to prevent data leakage, and exact mathematical conservation.

> **Transparency & Domain Scope**: IqApex operates on synthetic calibration telemetry, synthetic aerodynamic polar maps, and quasi-steady vehicle dynamics models. It does **not** rely on or expose confidential Formula 1 team intellectual property, wind tunnel datasets, or proprietary tyre supplier telemetry.

---

## System Architecture

```text
               RAW TELEMETRY (CSV / Columnar Parquet)
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ 1. SPATIAL RESAMPLING & ALIGNMENT ENGINE                    │
 │  • Distance-based cubic spline interpolation (1.0m grid)    │
 │  • Spatial coordinate matching across 5,793m (Monza)        │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ 2. KINEMATIC LAP-TIME DECOMPOSITION                         │
 │  • Physical phase segmentation: Braking, Entry, Apex, Exit  │
 │  • Conservation law: ∑Δt_phases + Residual ≡ Δt_lap         │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ 3. SURROGATE MODELING & SENSITIVITY GRADIENTS               │
 │  • GroupKFold cross-validation grouped by tyre stint        │
 │  • 95% Confidence (Epistemic) vs. 95% Prediction (Aleatoric)│
 │  • Analytical Jacobians: ∂Δt / ∂X                           │
 │  • Extrapolation detection with quadratic barrier penalty   │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ 4. MULTI-OBJECTIVE PARETO OPTIMIZATION                      │
 │  • Trade-off solver: min(Lap Time) vs. max(Straight Speed)  │
 │  • Constraints: Downforce Balance (CoP), Ride Height Bounds │
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ 5. STOCHASTIC RACE STRATEGY SIMULATION (N = 10,000)         │
 │  • Mass burn progression (-1.75 kg/lap @ +0.035 s/kg)       │
 │  • Non-linear thermal tyre degradation curves               │
 │  • Pit window sensitivity & Safety Car probability quantiles│
 └──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ 6. CYBER MATRIX HUD & ENGINEERING DECISION SUPPORT          │
 │  • Solid Cobalt Blue (#0062FF) vs. Pure White (#FFFFFF) HUD │
 │  • Synchronized 60fps canvas telemetry & 360° radar track map│
 │  • Automated Markdown audit generation with SHA-256 hashes  │
 └─────────────────────────────────────────────────────────────┘
```

---

## Core Technical Capabilities

### 1. Spatial Telemetry Alignment (1.0m Uniform Grid)
Telemetry traces sampled across time ($100\text{ Hz}$) cannot be directly compared across laps due to speed differentials and varying braking points. IqApex resamples channels onto an exact 1.0m distance grid ($s \in [0, 5793\text{m}]$) using cubic splines, enabling direct spatial overlay and kinematic differentiation ($\Delta v(s), \Delta t(s)$).

### 2. Physical Lap-Time Decomposition & Residual Reconciliation
Lap time deltas are decomposed into distinct physical phases:
- **Braking & Entry Deceleration**: Longitudinal deceleration and trail-braking transition.
- **Corner Apex**: Minimum lateral grip speed ($v_{\text{apex}}$) and mechanical grip balance.
- **Corner Exit**: Throttle pickup point and traction-limited acceleration.
- **Straightlines**: Aerodynamic drag resistance ($C_D A$) and power unit deployment.

Numerical conservation is strictly enforced:
$$\sum_{k=1}^{N_{\text{phases}}} \Delta t_k + \Delta t_{\text{residual}} = \Delta t_{\text{total}}$$
Any unexplained delta is explicitly surfaced as an unmodeled residual rather than silently absorbed.

### 3. Machine Learning Surrogates with Anti-Leakage Validation
- **Model Classes**: Polynomial Response Surfaces, Smoothing Splines, and `HistGradientBoostingRegressor`.
- **Data Leakage Prevention**: Enforces `GroupKFold` cross-validation grouped strictly by stint run IDs. Laps from the same physical run never appear across training and test folds.
- **Uncertainty Bounds**: Computes parametric 95% Confidence Intervals (epistemic model uncertainty) and 95% Prediction Intervals (epistemic + aleatoric residual tyre scatter $\sigma_{\text{res}}^2$).
- **Extrapolation Barrier Penalty**: When setup parameters exceed observed test boundaries, an analytical quadratic penalty $\lambda (x - x_{\text{bound}})^2$ inflates the uncertainty band and prevents false algorithmic optima.

### 4. Multi-Objective Constrained Optimization
Solves non-linear Pareto frontiers balancing conflicting performance goals:
- **Objective 1**: Minimize corner transit time (requires high downforce $C_L A$).
- **Objective 2**: Maximize straightline terminal velocity (requires low aerodynamic drag $C_D A$).
- **Subject to**: Aerodynamic center-of-pressure balance ($\text{CoP}_{\text{aero}} \in [41.5\%, 43.5\%]$) and ground-clearance ride height limits.

### 5. Monte Carlo Strategy & Degradation Engine (N = 10,000)
- **Mass Burn Rate**: $-1.75\text{ kg/lap}$ yielding an empirical sensitivity of $+0.035\text{ s/kg}$.
- **Non-Linear Tyre Cliff**: Multi-phase degradation:
  $$d(l) = d_0 + \alpha \cdot l + \beta \cdot l^\gamma$$
- **Stochastic Risk Quantiles**: 10,000 vectorized Monte Carlo iterations output P05 (optimistic), P50 (median), and P95 (pessimistic) race completion times, pit window loss curves, and undercut probability margins.

### 6. Solid White & Blue Cyber Matrix Workstation Interface
- **Palette**: Solid Cobalt Blue (`#0062FF`), Solid Pure White (`#FFFFFF`), Laser Cyan (`#00F0FF`), and Cyber Navy (`#030712`).
- **Telemetry Visuals**: Reference lap (HAM #44) rendered in Electric Blue; Comparison lap (LEC #16) rendered in Pure White.
- **Hardware Telemetry Overlay**: 60fps dual-buffer canvas rendering with sub-pixel distance cursor, split gain/loss delta area shading, and interactive 360° radar track map with real-time sector zoom synchronization.

---

## Verification & Test Evidence

The platform includes an automated testing harness containing **148 automated tests** covering physics invariants, numerical stability, and API contracts:

```bash
backend/.venv/bin/pytest backend/tests/ -v
```

```text
==================================== Summary ====================================
backend/tests/test_physics_invariants.py ......... PASSED
backend/tests/test_data_leakage_and_surrogate.py . PASSED
backend/tests/test_decomposition.py .............. PASSED
backend/tests/test_resampling_alignment.py ....... PASSED
backend/tests/test_response_models.py ............ PASSED
backend/tests/test_vehicle_performance.py ........ PASSED
backend/tests/test_strategy_analytics.py ......... PASSED
backend/tests/test_quality.py .................... PASSED
backend/tests/test_telemetry_corruption.py ....... PASSED
backend/tests/test_api_security_contracts.py ..... PASSED
====================== 148 passed, 8 warnings in 224.42s ======================
```

### Invariant Checks Verified:
1. **Dynamic Pressure Monotonicity**: Aerodynamic downforce and drag strictly scale with $v^2$ ($q = \frac{1}{2} \rho v^2$).
2. **Fuel Mass Reduction**: Vehicle mass decreases monotonically with lap progression, reducing transit times.
3. **Induced Drag Scaling**: Induced drag increases proportionally with downforce coefficient squared ($C_{Di} \propto C_L^2$).
4. **Conservation of Time Loss**: Decomposition residuals sum to exactly 0.000s under identical reference conditions.
5. **Bitwise Reproducibility**: Fixed simulation seed `42871` produces identical Monte Carlo quantiles across separate operating environments.

---

## Technology Stack

| Layer | Technologies | Purpose |
| :--- | :--- | :--- |
| **Backend Core** | Python 3.13, FastAPI, Uvicorn | Asynchronous high-throughput REST API with Pydantic v2 schemas |
| **Scientific Computing** | NumPy, SciPy | 1.0m spatial spline interpolation, numerical kinematics, ODE integration |
| **Machine Learning** | scikit-learn | HistGradientBoosting, GroupKFold cross-validation, Latin Hypercube DoE |
| **Data Storage** | PyArrow, Parquet, CSV | Immutable columnar telemetry storage with SHA-256 hash lineage |
| **Frontend Workstation** | React 18, TypeScript 5, Vite | High-frequency reactive engineering user interface |
| **Styling & HUD** | TailwindCSS, Custom Canvas 2D | Solid White/Blue matrix theme, scanline shaders, 60fps graphs |
| **Quality & Assurance** | pytest, Ruff, ESLint | 148 automated tests, static typing, and schema compliance |

---

## Quick Start Guide

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** and **npm**
- **Git**

### 1. Clone Repository
```bash
git clone https://github.com/piyush23-eng/IqApex.git
cd IqApex
```

### 2. Backend Setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The FastAPI documentation will be available at `http://localhost:8000/docs`.

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5180`** in your browser.

---

## Audit Documentation

Detailed documentation is available in the [`docs/`](docs/) directory:

- [ARCHITECTURE.md](docs/ARCHITECTURE.md): Service structure, component boundaries, and API schemas.
- [VALIDATION_MATRIX.md](docs/VALIDATION_MATRIX.md): 10-category verification audit for all 148 test suites.
- [DATA_LEAKAGE_AUDIT.md](docs/DATA_LEAKAGE_AUDIT.md): Cross-validation partitioning strategy to prevent train/test bleed.
- [UNIT_AUDIT.md](docs/UNIT_AUDIT.md): Mathematical derivations and SI unit reconciliation proofs.
- [REPRODUCIBILITY.md](docs/REPRODUCIBILITY.md): Determinism specifications and SHA-256 provenance tracking.
- [CASE_STUDY.md](docs/CASE_STUDY.md): Diagnostic walkthrough analyzing a +0.206s lap deficit at Monza.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
