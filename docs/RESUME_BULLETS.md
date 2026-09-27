# ApexIQ — Resume-Ready Technical Contributions

---

### Motorsport / Vehicle Performance Engineering Focus:
* **Engineered an end-to-end vehicle performance decision-support platform** integrating 100 Hz telemetry ingestion, statistical lap-time decomposition, aerodynamic surrogate modeling, and Monte Carlo race strategy simulation.
* **Developed a spatial distance-resampling pipeline** using SciPy cubic splines on a 1.0 m track centerline grid, enabling exact multi-lap synchronization and phase attribution (braking, cornering, acceleration, straight) with $< 10^{-4}\text{ s}$ reconciliation residuals.
* **Trained and validated gradient boosted surrogate models (HistGBDT)** on Latin Hypercube Sampling aerodynamic DoE datasets, achieving $R^2 = 0.993$ on out-of-sample seeds while implementing convex hull extrapolation guards and 95% Prediction Interval inflation.
* **Built a vectorized Monte Carlo race strategy engine** simulating 1,000 53-lap Grand Prix iterations (53,000 simulated laps) in 22.8 ms, quantifying trade-offs between qualifying drag penalties and race-distance tyre degradation under 2024 FIA Sporting Regulations Article 30.5.
* **Implemented an automated scientific validation framework** with 148 automated invariant tests verifying physical conservation laws ($q(2v) = 4q(v)$), numerical stability at near-zero speeds, bitwise deterministic reproducibility (`seed: 42871`), and zero data leakage.

---

### Data Science / Machine Learning Focus:
* **Architected full-stack data science platform (Python, FastAPI, React, TypeScript)** connecting physical telemetry observations with statistical Jacobians and ML surrogate inference.
* **Prevented spatial data leakage** in aerodynamic surrogate training by designing a grouped regional cross-validation scheme (GroupKFold across speed/yaw regimes) and isolating preprocessing inside scikit-learn pipelines.
* **Formalized rigorous uncertainty quantification** distinguishing between Confidence Intervals (epistemic mean error) and Prediction Intervals (aleatoric observation variance) to prevent false overconfidence in vehicle setup optimization.
* **Designed a production-ready asynchronous API service** handling large telemetry payloads with sanitized error handling, cryptographic provenance hashing (SHA-256), and 100% test coverage across core analytical engines.
