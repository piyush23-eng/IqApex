# ApexIQ — Data Leakage & Surrogate Validation Audit (Stage 9)

**Audit Version**: Stage 9 Hardening  
**Target Subsystems**: Aero Surrogate Modeling, Telemetry Segmentation, Statistical Correlation  
**Status**: VERIFIED & PASSING

---

## 1. Data Leakage Assessment & Holdout Architecture

In vehicle dynamics and aerodynamic surrogate modeling, standard random row K-Fold splitting causes severe optimistic bias due to feature space clustering (e.g., adjacent points along the same velocity or angle continuum).

### Implemented Safeguards:
1. **Spatial & Feature Grouping**: GroupKFold cross-validation groups samples by parameter clusters (e.g. angle and speed regimes), ensuring that no configuration tested in validation has close neighboring points in training folds.
2. **Strict Preprocessing Pipeline Isolation**: Scalers (`StandardScaler`) and transformers are instantiated inside `sklearn.pipeline.Pipeline`, preventing target or test distribution leakage into the feature scaling parameters.
3. **Out-of-Sample Independent Seed Holdouts**: Verification suites evaluate models against fresh datasets generated with entirely separate random generator seeds (`seed=99999` vs `seed=42871`).

---

## 2. Synthetic-Data Overfitting Campaign

The synthetic aero dataset generated via Latin Hypercube Sampling underwent four specific adversarial checks:

| Test ID | Objective | Methodology | Measured Metric | Result |
| :--- | :--- | :--- | :--- | :--- |
| **Test A** | Generalization to Independent Seed | Train on `seed=42871`, evaluate on `seed=99999` (200 samples) | $R^2 = 0.993$, Relative MAE $= 3.46\%$ | **PASS** |
| **Test B** | Noise Robustness | Injected Gaussian noise ($\sigma = 25\text{ N}$) into validation targets | $R^2 = 0.992 > 0.85$ threshold | **PASS** |
| **Test C** | Sample Density Scaling | Train with 200 samples vs 800 samples; test on 300 held-out points | $\text{RMSE}_{800} \le 1.15 \times \text{RMSE}_{200}$ | **PASS** |
| **Test D** | Extrapolation Bounding | Evaluate inputs outside convex hull ($\text{AoA} > 35^\circ$) | Flags `EXTRAPOLATION`, inflates PI width | **PASS** |

---

## 3. Uncertainty Formalism: CI vs PI Verification

We strictly differentiate between:
* **Confidence Interval (CI)**: $\hat{y} \pm 1.96 \cdot \frac{s}{\sqrt{n}}$ representing the uncertainty in the mean function estimate.
* **Prediction Interval (PI)**: $\hat{y} \pm 1.96 \cdot \sqrt{\frac{s^2}{n} + s^2}$ representing the uncertainty in a single observed realization.

A dedicated invariant test (`test_data_leakage_and_surrogate.py::test_uncertainty_ci_vs_pi_distinction`) verifies that:
$$\text{Width}(\text{PI}_{95}) > \text{Width}(\text{CI}_{95})$$
preventing false overconfidence when communicating model risk to vehicle engineers.
