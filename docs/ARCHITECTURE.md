# ApexIQ — System Architecture & Component Specification

**System Revision**: v1.0.0 Production Release  
**Platform**: F1 Vehicle Performance & Engineering Decision-Support Platform  
**Target Domain**: Trackside & Performance Data Science

---

## 1. High-Level Architectural Diagram

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   FRONTEND (React 18 + TypeScript + Vite)              │
│  - Synchronized Workstation (F2)      - Lap Decomposition (F3)         │
│  - Aero / Kinematics Trade-off (F5)   - Strategy Monte Carlo (F9)      │
│  - Invariant Health (F11)             - Decision Support (F12)         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST (Pydantic DTOs)
┌───────────────────────────────────▼────────────────────────────────────┐
│                    FASTAPI APPLICATION SERVICE LAYER                   │
│  /api/v1/telemetry        /api/v1/lap_analysis     /api/v1/sensitivity  │
│  /api/v1/vehicle_perf     /api/v1/strategy         /api/v1/analysis    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                       SCIENTIFIC ANALYTICS ENGINES                     │
│  ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────┐ │
│  │ Telemetry Pipeline    │ │ Lap Decomposition     │ │ Sensitivity   │ │
│  │ - 1.0 m Distance Grid │ │ - Phase Attribution   │ │ - Jacobians   │ │
│  │ - Sensor Bounds Check │ │ - Exact Conservation  │ │ - Ridge / OLS │ │
│  └───────────────────────┘ └───────────────────────┘ └───────────────┘ │
│  ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────┐ │
│  │ Aero Surrogate        │ │ Vehicle Kinematics    │ │ Strategy & MC │ │
│  │ - HistGradientBoost   │ │ - Quasi-Steady Solver │ │ - 1,000 Runs  │ │
│  │ - Extrapolation Guard │ │ - Downforce vs Drag   │ │ - FIA Art 30.5│ │
│  └───────────────────────┘ └───────────────────────┘ └───────────────┘ │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                     PERSISTENCE & DATA STORAGE                         │
│  - Raw / Resampled Telemetry (Parquet)                                 │
│  - Metadata & Session State (PostgreSQL / In-Memory Catalog)           │
│  - Deterministic DoE Datasets (CSV + SHA-256 Provenance)               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Subsystems & Responsibilities

### 2.1 Ingestion & Normalization (`app.telemetry`)
* **Format Adapters**: Decoupled reader architecture (`CsvFormatAdapter`, `ParquetFormatAdapter`) that ingests raw logger streams without imposing proprietary vendor file dependencies.
* **Channel Mapping**: Strict canonical naming resolver (`vCar` $\rightarrow$ `speed`, `pBrakeF` $\rightarrow$ `brake`). Missing mandatory core channels trigger structured `ChannelMappingError` exceptions.
* **Spatial Resampling**: Converts time-domain samples to a uniform 1.0 m spatial distance grid along the track centerline using SciPy cubic splines, enabling direct multi-lap overlay regardless of speed variances.

### 2.2 Telemetry Workstation & Lap Decomposition (`app.analytics.lap_decomposition`)
* **Synchronized Alignment**: Computes continuous spatial lap deltas $\Delta t(s) = t_{\text{comp}}(s) - t_{\text{ref}}(s)$.
* **Phase Decomposition**: Segregates the lap into four discrete physical phases:
  1. *Braking*: Longitudinal deceleration threshold active ($a_x < -0.5\text{ g}$).
  2. *Cornering*: Lateral acceleration dominant ($|a_y| > 1.0\text{ g}$).
  3. *Acceleration*: Throttle pedal application exit phase ($r_{\text{throttle}} > 60\%$).
  4. *Straight*: Near-zero curvature and full throttle ($|a_y| < 0.5\text{ g}, r_{\text{throttle}} > 95\%$).
* **Reconciliation Invariant**: Exact conservation is enforced:
  $$\Delta T_{\text{lap}} = \sum_{p \in \text{Phases}} \Delta t_p + \epsilon, \quad |\epsilon| < 10^{-4}\text{ s}$$

### 2.3 Aerodynamic Surrogate Modeling (`app.analytics.aero_surrogate`)
* **Latin Hypercube Sampling**: 500-point DoE exploring front/rear flap angles, front/rear ride heights, yaw angle, and vehicle speed.
* **Surrogate Regressor**: Scikit-learn `HistGradientBoostingRegressor` evaluated using grouped 5-fold cross-validation across aerodynamic regimes to prevent spatial leakage.
* **Extrapolation Bounding**: Predictor queries inspect the convex hull of training features. Queries outside observed ranges are flagged as `EXTRAPOLATION`, inflating the 95% Prediction Interval to prevent false engineering overconfidence.

### 2.4 Vehicle Performance Kinematics (`app.analytics.vehicle_performance`)
* **Quasi-Steady Solver**: Solves corner equilibrium velocity balancing tyre friction limits against normal aerodynamic load:
  $$v_{\text{corner}} = \sqrt{\frac{\mu \cdot m \cdot g}{m/R - \frac{1}{2}\rho S C_L \mu}}$$
* **Straight-Line Accelerations**: Integrates power-limited and traction-limited acceleration accounting for rolling resistance and aerodynamic drag:
  $$m \frac{dv}{dt} = \frac{P \cdot \eta}{v} - \frac{1}{2}\rho S C_D v^2 - C_{\text{rr}} m g$$

### 2.5 Race Strategy & Monte Carlo Engine (`app.analytics.strategy_engine`)
* **Regulation Constraints**: Enforces 2024 FIA Formula One Sporting Regulations Article 30.5 (mandatory use of $\ge 2$ distinct dry slick compounds during dry races).
* **Non-Linear Tyre Degradation**: Models quadratic cliff wear and ambient/track thermal sensitivities.
* **Uncertainty Propagation**: 1,000-iteration vectorized Monte Carlo simulator generating P05, P10, P50, P90, P95 expected race time distributions.
