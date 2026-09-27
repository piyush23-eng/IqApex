# ApexIQ — Portfolio Descriptions

---

### 1. One-Line Summary (GitHub Tagline / Header)
> An engineering decision-support platform connecting telemetry analysis, statistical lap-time decomposition, aerodynamic surrogate modeling, and Monte Carlo race strategy simulation.

---

### 2. 50-Word Description (Portfolio Cards)
> ApexIQ is a motorsport data science platform that unifies trackside telemetry analysis with physics-based modeling. It ingests 100 Hz logger data onto a uniform spatial grid, decomposes lap-time deltas into physical phases with exact conservation, evaluates aerodynamic setup what-ifs via GBDT surrogates, and quantifies race strategy uncertainty via 1,000-run Monte Carlo simulation.

---

### 3. 150-Word Description (Job Applications & Cover Letters)
> ApexIQ is an engineering decision-support platform designed to bridge the gap between trackside telemetry analysis and vehicle performance engineering. Addressing the diagnostic challenge of where lap-time differences originate, the platform resamples 100 Hz vehicle logs onto a uniform 1.0-meter spatial distance grid, performs exact lap-time phase decomposition (braking, cornering, acceleration, straight), and calculates local parameter Jacobians.
>
> Setup hypotheses are evaluated through a HistGradientBoosting aerodynamic surrogate model trained on Latin Hypercube Sampling DoE datasets, complete with extrapolation guards and 95% Confidence and Prediction intervals. The resulting vehicle kinematics propagate into a 53-lap regulation-constrained race strategy simulator (2024 FIA Sporting Regulations Article 30.5) featuring non-linear tyre degradation. A vectorized Monte Carlo engine executes 1,000 simulated race iterations in 22 ms, providing trackside engineers with quantified, risk-aware setup recommendations backed by full cryptographic provenance (SHA-256) and 148 automated invariant tests.

---

### 4. Technical Summary (For Engineering Reviewers)
> ApexIQ demonstrates end-to-end data engineering and scientific computing in motorsport:
> * **Data Architecture**: Decoupled format adapters (CSV/Parquet), canonical channel mapping, cubic spline spatial distance resampling.
> * **Statistical Computing**: Linear phase decomposition with zero reconciliation residual ($\epsilon < 10^{-4}\text{ s}$), parametric sensitivity matrices.
> * **Machine Learning**: Gradient boosted decision tree (HistGBDT) surrogate modeling with spatial GroupKFold cross-validation to prevent leakage ($R^2 = 0.993$), explicit CI vs PI uncertainty formulation, and out-of-domain extrapolation detection.
> * **Kinematic Simulation**: Quasi-steady point-mass cornering and straight-line ODE solvers.
> * **Stochastic Modeling**: 1,000-iteration vectorized Monte Carlo race strategy simulator with non-linear tyre cliff degradation.
> * **Code Quality**: 148 automated pytest tests, Ruff linting, TypeScript static type verification, and bitwise deterministic reproducibility under `seed: 42871`.
