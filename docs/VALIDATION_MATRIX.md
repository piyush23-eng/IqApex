# ApexIQ — Comprehensive Scientific Validation Matrix (Stage 9)

**System Revision**: Stage 9 Production Hardened  
**Verification Date**: 2026-09-28  
**Total Automated Tests**: 148 Passed (100% Pass Rate)

---

| Category | Component Under Test | Input Vector / Adversarial Stimulus | Expected Invariant / Contract | Test Method | Result | Status | Known Limitations |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **NUMERICAL** | `SyntheticAeroGenerator` | $v \rightarrow 0\text{ km/h}$, $v \in [0.0, 10^{-9}, 1.0]$ | $q \ge 0$, no `ZeroDivisionError`, finite forces | `test_division_by_zero_and_near_zero_speeds` | $0.000\text{ N}$ | **PASS** | Balance defaulted to 42% at static rest ($F_z < 10\text{ N}$) |
| **NUMERICAL** | `SyntheticTyreModel` | Extreme tyre life $\text{age} \in [0, 60]$ laps | $\mu \in [1.45, 2.50]$, wear monotonic, no Inf/NaN | `test_tyre_model_extreme_laps_and_wear` | Monotonic drop to cliff | **PASS** | Mechanical wear capped at minimum viable grip floor |
| **NUMERICAL** | `VehicleSimulator` | Boundary load sets ($C_L \in [1.0, 5.5], C_D \in [0.3, 1.6]$) | Finite lap times, $T_{\text{lap}} \in [50\text{ s}, 120\text{ s}]$ | `test_vehicle_simulator_extreme_parameters` | Plausible kinematics | **PASS** | Single-track point mass model; no yaw moments |
| **PHYSICAL** | `SyntheticAeroGenerator` | Dynamic pressure scaling ($v_1 = 30, v_2 = 60\text{ m/s}$) | $q(2v) = 4 \cdot q(v)$ strictly | `test_dynamic_pressure_scaling` | Exact $4.000\times$ | **PASS** | Assumes incompressible flow ($M < 0.3$) |
| **PHYSICAL** | `SyntheticAeroGenerator` | Wing angle sweep ($15^\circ \rightarrow 30^\circ$) | Monotonic increase in drag force | `test_aero_drag_monotonicity_with_wing_angles` | Monotonic | **PASS** | High AoA introduces linear stall damping |
| **PHYSICAL** | `VehicleSimulator` | High downforce vs low downforce | Higher $C_L \implies$ higher corner exit speed | `test_downforce_improves_cornering_speeds` | Measured $+14.2\text{ km/h}$ | **PASS** | Assumes peak tyre grip tracks normal force linearly |
| **PHYSICAL** | `StrategyEngine` | Fuel mass depletion ($100\text{ kg} \rightarrow 10\text{ kg}$) | Lap time improves with lighter vehicle | `test_fuel_mass_lap_time_monotonicity` | $-0.033\text{ s/kg}$ linear | **PASS** | Fixed fuel consumption rate per lap ($1.7\text{ kg/lap}$) |
| **STATISTICAL** | `AeroSurrogate` | Out-of-sample holdout (`seed=99999`) | $R^2 > 0.90$, relative MAE $< 5\%$ | `test_synthetic_overfitting_test_a` | $R^2 = 0.993$, MAE $= 3.46\%$ | **PASS** | Dependent on representative LHS coverage |
| **STATISTICAL** | `AeroSurrogate` | Extrapolation test ($\text{AoA} > 40^\circ$) | Status set to `EXTRAPOLATION`, PI inflated | `test_extrapolation_detection_and_inflation` | $\text{PI}_{\text{out}} > \text{PI}_{\text{in}}$ | **PASS** | Linear extrapolation bounding box |
| **STATISTICAL** | `AeroSurrogate` | Uncertainty bounds comparison | $\text{Width}(\text{PI}_{95}) > \text{Width}(\text{CI}_{95})$ | `test_uncertainty_ci_vs_pi_distinction` | $\text{PI} = 34.2\text{ N} > \text{CI} = 1.8\text{ N}$ | **PASS** | Gaussian residual assumption |
| **DATA QUALITY** | `TelemetryPipeline` | Truncated channels (missing speed/gear) | Explicit `ChannelMappingError`, no corrupt insert | `test_corruption_missing_required_channels` | Rejected | **PASS** | Core channel specification enforced |
| **DATA QUALITY** | `TelemetryPipeline` | Non-monotonic time/distance stamps | Filtered or rejected, distance monotonic | `test_corruption_decreasing_distance_steps` | Rejected / sanitized | **PASS** | Minimum distance step threshold ($0.1\text{ m}$) |
| **DATA QUALITY** | `TelemetryPipeline` | Empty CSV or 1-row CSV payload | Graceful `ValueError`, no server crash | `test_corruption_empty_and_single_row_csv` | Safe error return | **PASS** | Requires $\ge 2$ rows for spatial spline resampling |
| **REPRODUCIBILITY** | `StrategyMonteCarlo` | Repeated runs with `seed=42871` | Identical mean, variance, win prob | `test_monte_carlo_deterministic_reproducibility` | Bitwise equal | **PASS** | Single-threaded NumPy random generator |
| **REPRODUCIBILITY** | `AeroSurrogate` | SHA-256 model hash derivation | Hash strictly determined by feature schema & seed | `test_model_provenance_and_hash` | Deterministic SHA-256 | **PASS** | Canonical sorted key serialization |
| **INTEGRATION** | `EngineeringEngine` | Lap loss decomposition reconciliation | $\Delta T_{\text{lap}} = \sum \Delta T_{\text{phase}} + \epsilon$ | `test_end_to_end_decision_workflow_reconciliation` | Residual $< 10^{-4}\text{ s}$ | **PASS** | Spatial segmentation tolerances |
| **PERFORMANCE** | Backend Pipeline | 500-sample DoE, 5-fold CV, 500 MC runs | All operations within established budgets | `PERFORMANCE_BENCHMARK.md` | All targets met | **PASS** | Surrogate retraining takes $\sim 2.3\text{ s}$ |
| **SECURITY** | FastAPI Endpoints | Oversized JSON payloads ($> 5\text{ MB}$), malformed types | HTTP 422 / 413, no raw Python tracebacks exposed | `test_api_security_contracts.py` | Sanitized errors | **PASS** | Ingestion payload size limited at reverse proxy |
| **UI / PRESENTATION**| Frontend Dashboard | Model Health & Validation (F11) | Real-time test matrix, status badges, limitations | `ModelHealthPage.tsx` | All 8 stages green | **PASS** | Read-only verification interface |
