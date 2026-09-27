# Aerodynamic Surrogate Modeling & Validation

## 1. Design of Experiments (DoE): Latin Hypercube Sampling (LHS)

To achieve broad coverage of the 8-dimensional vehicle performance space without clustering artifacts, ApexIQ employs **Latin Hypercube Sampling** (`scipy.stats.qmc.LatinHypercube`):
- Random Seed: `42871` (strictly deterministic).
- Number of configurations: 1,200.
- Stratifies each parameter into $N$ equal-probability intervals, guaranteeing complete marginal distribution exploration.
- Controlled Gaussian noise injected into $C_l$ and $C_d$ to model aerodynamic tunnel turbulence.

## 2. Surrogate Model Architectures

ApexIQ evaluates four candidate surrogate models:
1. **Linear Regression**: Baseline benchmark with normalized feature scaling.
2. **Polynomial Regression (Degree 2)**: Captures non-linear downforce vs angle relationships and cross-terms.
3. **Random Forest Regressor**: 100 estimators, max depth 12.
4. **HistGradientBoostingRegressor (Default)**: Rapid tree boosting with monotonic constraints and robust handling of high-dimensional response surfaces.

## 3. Spatial Cross-Validation & Metric Registry

To prevent spatial data leakage between adjacent DoE samples:
- Parameter space is ordered by primary feature vectors and evaluated via 5-fold cross-validation.
- Models report:
  - $\text{MAE}$
  - $\text{RMSE}$
  - $R^2$ ($> 0.95$ on synthetic DoE)
  - $\text{CV-RMSE}$
  - Residual mean and standard deviation
- Models are cataloged under `VehicleModelMetadata` including SHA-256 fingerprinting of both model weights and dataset contents.
