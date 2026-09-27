# Performance Sensitivity Engine

ApexIQ Stage 5 introduces the **Performance Sensitivity & Engineering Optimization Engine**.

## 1. Engineering Philosophy

In motorsport performance engineering, sensitivity analysis answers the fundamental engineering question:
> *"If a measurable performance parameter changes by $\Delta X$, what does the validated model estimate will happen to lap time, sector time, or corner performance $\Delta Y$?"*

To maintain technical credibility:
- **No Causal Claims**: We explicitly label statistical and regression relationships as `MODELLED RESPONSE` or `STATISTICAL ASSOCIATION`. We never claim that altering a single proxy channel in isolation guarantees on-track lap time reduction.
- **Local Derivatives**: Sensitivity is quantified as the partial derivative evaluated at the nominal operating baseline:
  $$\frac{\partial Y}{\partial X}\Bigg|_{X = X_0}$$
- **Ontological Categorization**: Every output is labeled under one of the five ApexIQ lifecycle states:
  1. `OBSERVED`: Measured on-car telemetry channels.
  2. `ASSOCIATION`: Statistical cross-correlation across repeated laps.
  3. `MODELLED`: Evaluated using response surfaces with analytical confidence/prediction intervals.
  4. `OPTIMIZED`: Algorithmic parameter exploration under strict physical and data domain bounds.
  5. `VALIDATED`: Verified against out-of-sample physical runs using grouped cross-validation.

---

## 2. Parameter Registry (`parameter_registry.yaml`)

The parameter registry strictly classifies vehicle and driver inputs into two tiers:

### Tier 1: Directly Controllable Vehicle Parameters
* Parameters that the race engineer or driver adjusts directly.
* Examples:
  - `wing_angle_front_deg`: Front Wing Flap Angle ($[10.0^\circ, 35.0^\circ]$)
  - `wing_angle_rear_deg`: Rear Wing Flap Angle ($[15.0^\circ, 40.0^\circ]$)
  - `brake_bias_pct`: Brake Pressure Bias ($[52.0\%, 62.0\%]$)
  - `differential_entry_pct`: Mid-Corner Diff Pre-load ($[40.0\%, 80.0\%]$)
  - `tire_pressure_fl_psi`: Cold/Hot Set Tire Pressures ($[18.0, 26.0\text{ psi}]$)
  - `ballast_longitudinal_pos_mm`: Weight distribution trim ($[-150, +150\text{ mm}]$)

### Tier 2: Measurable Proxy Channels (Driver/Car Kinematics)
* Performance markers that can be influenced but not dialed directly on a setup sheet.
* Explicitly flagged in UI with `is_proxy: true` and warning: *"Measurable proxy channel — not directly dialed on setup sheet"*.
* Examples:
  - `brake_initiation_point_m`: Longitudinal braking point relative to corner apex
  - `apex_minimum_speed_kph`: Minimum mid-corner speed ($V_{\text{min}}$)
  - `throttle_application_point_m`: Exit throttle pickup location
  - `peak_longitudinal_decel_g`: Peak braking deceleration capability

---

## 3. Local Derivative Computation

For any target metric $Y$ and input $X$:
1. A baseline operating point $X_0$ is chosen from the selected lap or session median.
2. A two-sided finite perturbation step $h = \max(0.01 \cdot (X_{\max} - X_{\min}), 10^{-4})$ is applied.
3. The local gradient is computed:
   $$\frac{\partial Y}{\partial X} \approx \frac{\hat{Y}(X_0 + h) - \hat{Y}(X_0 - h)}{2h}$$
4. The 95% Confidence Interval for the slope is calculated analytically from the covariance matrix of the model parameters.
