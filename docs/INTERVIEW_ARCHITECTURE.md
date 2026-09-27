# ApexIQ — Technical Interview Architecture & Engineering FAQ

---

### Q1: Why did you build ApexIQ?
**Answer**: Modern motorsport data science is often fractured. Trackside engineers analyze raw telemetry traces in tools like ATLAS or MoTeC, aerodynamicists run CFD maps, and strategists run separate Monte Carlo models. ApexIQ was designed to unify these disciplines into a single quantitative, traceable decision-support platform where an observed telemetry difference can be tied directly to a candidate setup parameter, an aerodynamic surrogate prediction, and a full-distance race outcome.

---

### Q2: Why use synthetic data rather than scraped real F1 timing data?
**Answer**: Real Formula 1 engineering telemetry (100 Hz high-frequency channel data like brake line pressure, suspension potentiometers, and throttle percentage) is strictly proprietary intellectual property. Public timing data (such as FastF1) provides only sector times or low-frequency broadcast GPS approximations. To build a true vehicle performance engineering workstation with exact distance resampling and aerodynamic force trade-offs, procedural synthetic data calibrated to physical equations is far more scientifically honest than pretending that low-resolution public data represents team engineering logs.

---

### Q3: Why use Gradient Boosted Decision Trees (HistGBDT) instead of Deep Neural Networks for the surrogate?
**Answer**:
1. **Sample Efficiency**: In vehicle engineering, generating CFD or wind-tunnel DoE points is computationally expensive. GBDTs excel on tabular datasets with hundreds of samples ($N=500$) where neural networks easily overfit.
2. **Computational Speed**: HistGBDT evaluates inference in under **6 milliseconds**, making it ideal for interactive UI what-if exploration.
3. **Interpretability & Feature Thresholds**: Tree-based splits align cleanly with physical aerodynamic thresholds (such as stall angles and ride-height ground effect decay).

---

### Q4: How did you prevent data leakage during surrogate training?
**Answer**: In aerodynamic datasets, standard random K-Fold cross-validation leaks information because samples adjacent in velocity or angle space share near-identical physics. We implemented **GroupKFold** cross-validation partitioned across aerodynamic parameter clusters (speed and wing angle regimes), ensuring that no configuration tested in validation had neighboring points in training folds. Furthermore, all transformers (`StandardScaler`) were encapsulated within scikit-learn `Pipeline` objects to prevent validation distribution leakage into feature scalers.

---

### Q5: How do you handle uncertainty, and why distinguish between CI and PI?
**Answer**: In engineering decision-making, mistaking the uncertainty of the mean estimate for the uncertainty of a single observation leads to dangerous overconfidence. We explicitly separate:
* **Confidence Interval (CI)**: $\hat{y} \pm 1.96 \cdot \frac{s}{\sqrt{n}}$ measuring epistemic uncertainty in the average surrogate response.
* **Prediction Interval (PI)**: $\hat{y} \pm 1.96 \cdot \sqrt{\frac{s^2}{n} + s^2}$ measuring total variance for an individual lap observation.
When inputs leave the training domain, our extrapolation detector inflates the PI width by $1.5\times$ to $3.0\times$ to explicitly communicate model risk to the engineer.

---

### Q6: How does the lap-time phase decomposition guarantee exact conservation?
**Answer**: Lap time is a line integral of inverse velocity over distance: $T = \int \frac{1}{v(s)} ds$. Because our pipeline resamples telemetry onto a uniform 1.0 m spatial distance grid, the total lap delta is identically equal to the sum of local segment deltas:
$$\Delta T_{\text{lap}} = \sum_{k=1}^N \left( \frac{1}{v_{\text{comp}}(s_k)} - \frac{1}{v_{\text{ref}}(s_k)} \right) \Delta s$$
Partitioning the spatial points into mutually exclusive physical sets (Braking, Cornering, Acceleration, Straight) guarantees exact conservation with zero reconciliation residual ($|\epsilon| < 10^{-4}\text{ s}$).

---

### Q7: How do you distinguish correlation from causation in setup recommendations?
**Answer**: We enforce strict ontology labels throughout the platform:
* `OBSERVED`: Measured directly from telemetry (e.g. speed deltas, brake points).
* `STATISTICAL`: Historical correlation or regression slopes (e.g. parameter Jacobians).
* `MODELLED`: Physics-based or surrogate estimations (e.g. downforce gains, lap simulation).
* `OPTIMIZED`: Algorithmic scenario searches.
* `VALIDATED`: Forbidden unless confirmed against independent, holdout physical testing.
The UI and API never use causal language like *"this parameter caused the deficit"*; instead, they state *"parameter X is associated with mid-corner speed and is estimated to yield Y delta under scenario Z"*.

---

### Q8: What would be the biggest challenge when migrating to real F1 telemetry?
**Answer**: Signal noise, sensor calibration drift (e.g. tyre pressure sensors drifting with temperature), non-linear tyre carcass dynamics, and wind gust crosswinds. The modular adapter architecture in `app.telemetry.adapters` is specifically built to swap in real binary decoders (e.g. ATLAS `.ssm`, Cosworth `.pi`) and run track-specific calibration algorithms without altering the downstream decomposition or strategy modules.
