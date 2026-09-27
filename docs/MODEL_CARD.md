# ApexIQ — Analytical & Machine Learning Model Cards

**Audit Date**: 2026-09-28 (v1.0.0 Production Release)  
**Scientific Notice**: Synthetic validation does **not** establish real-world predictive accuracy. All models are calibrated for demonstration of motorsport engineering data science workflows.

---

## 1. Aerodynamic Surrogate Model (HistGBDT)

* **Purpose**: Rapidly estimates aerodynamic downforce, parasitic drag, and aero balance across 6 vehicle geometry degrees of freedom without requiring computational fluid dynamics (CFD) solves.
* **Architecture**: Scikit-learn `HistGradientBoostingRegressor` (120 trees, max depth 8, min samples leaf 5).
* **Inputs**:
  * `rear_wing_angle` [12.0, 38.0 deg]
  * `front_wing_angle` [8.0, 28.0 deg]
  * `ride_height_front` [20.0, 50.0 mm]
  * `ride_height_rear` [25.0, 65.0 mm]
  * `yaw_angle` [-2.0, 6.0 deg]
  * `vehicle_speed` [50.0, 370.0 km/h]
* **Outputs**: Downforce [N], Drag [N], Aero Balance [% front], Lift-to-Drag ($L/D$) ratio.
* **Training Data**: 500 configurations generated via Latin Hypercube Sampling (LHS) based on non-linear ground effect and wing stall equations.
* **Validation Method**: GroupKFold regional cross-validation (5 splits partitioned by parameter clusters to prevent spatial leakage).
* **Performance**: Out-of-sample $R^2 = 0.993$, relative $\text{MAE} = 3.46\%$ on independent random seed holdout (`seed=99999`).
* **Uncertainty**: 95% Confidence Interval for mean function; 95% Prediction Interval for individual realizations. Predictor inflates interval by $1.5\times$ to $3.0\times$ when inputs fall outside observed training bounds (`EXTRAPOLATION`).
* **Known Limitations**: Does not resolve aeroelastic deflection, transient wake turbulence, or wheel wake vortex interactions.
* **Not Suitable For**: Physical car manufacturing or real-world aerodynamic homologation.

---

## 2. Vehicle Performance Kinematics Solver

* **Purpose**: Converts aerodynamic force estimates and vehicle mass properties into quasi-steady lap time and sector speed breakdown for Monza.
* **Architecture**: Point-mass equilibrium solver with traction-limited acceleration and normal-force-dependent cornering limits.
* **Inputs**: $C_L$, $C_D$, vehicle mass ($m$), tyre friction coefficient ($\mu$).
* **Outputs**: Corner transit time, straight-line transit time, modeled lap time, corner apex speeds.
* **Validation Method**: Verified against Monza physical geometry (11 corners, 6 straights) ensuring simulated lap times remain within physical thresholds ($50\text{ s} < T_{\text{lap}} < 120\text{ s}$).
* **Known Limitations**: Single-track point mass model; does not account for transient weight transfer, suspension heave/roll stiffness, or differential locking.

---

## 3. Synthetic Tyre Degradation Model

* **Purpose**: Simulates non-linear grip decay, thermal penalties, and graining/cliff progression across stint lengths.
* **Architecture**: Parametric mechanical wear ($\Delta\mu = a \cdot \text{age} + b \cdot \text{age}^2$) combined with weather thermal scaling and cold tire warm-up ramp.
* **Inputs**: Compound code (`SOFT`, `MEDIUM`, `HARD`), stint lap age, track temperature, ambient temperature.
* **Outputs**: Effective friction coefficient ($\mu_{\text{eff}}$), lap time penalty [s], cliff exceeded flag.
* **Performance**: Monotonically non-decreasing wear penalty capped at minimum viable grip floor ($1.45\text{ }\mu$).
* **Known Limitations**: Calibrated empirically; does not represent proprietary viscoelastic rubber hysteresis or tyre carcass pressure buildup.

---

## 4. Race Strategy Simulation Engine

* **Purpose**: Simulates 53-lap race scenarios evaluating pit stop windows, fuel mass burn-off ($-0.033\text{ s/kg}$), traffic loss, and safety car interventions.
* **Regulatory Invariant**: Enforces 2024 FIA Formula One Sporting Regulations Article 30.5 (mandatory use of $\ge 2$ distinct dry slick compounds during dry races).
* **Inputs**: Stint definitions, weather code (`DRY`, `COOL`, `HOT`), safety car regime (`GREEN`, `VSC`, `SC`), traffic density.
* **Outputs**: Total race time [s], lap-by-lap pace, pit delta loss, compound wear history.

---

## 5. Monte Carlo Strategy Uncertainty Simulator

* **Purpose**: Propagates stochastic pit stop duration variability ($\sigma = 0.4\text{ s}$), safety car timing probabilities, and pace variance across 1,000 simulated race iterations.
* **Outputs**: P05, P10, P50, P90, P95 expected race time distributions and comparative win probabilities.
* **Performance**: Vectorized simulation executes 1,000 iterations (53,000 simulated laps) in **22.81 ms**.
* **Reproducibility**: Enforces bitwise determinism under `seed = 42871`.
