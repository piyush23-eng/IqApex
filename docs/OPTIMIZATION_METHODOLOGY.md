# Optimization Methodology & Response Modeling

ApexIQ Stage 5 provides response surface modeling and constrained parameter optimization for race vehicle setups and driving profiles.

---

## 1. Candidate Response Models

ApexIQ evaluates four candidate surrogate model families for every feature-target pair:

1. **Linear Model**:
   $$Y = \beta_0 + \beta_1 X + \epsilon$$
   Used for simple monotonically increasing/decreasing physical dependencies.

2. **Polynomial Model (Degree 2)**:
   $$Y = \beta_0 + \beta_1 X + \beta_2 X^2 + \epsilon$$
   Captures non-linear diminishing returns and parabolic aero balance trade-offs.

3. **Natural Cubic Spline**:
   Cubic B-spline with 3 interior quantiles as knots. Captures complex transition curves without high-order Runge oscillations.

4. **Interaction Response Model (2D Surfaces)**:
   $$Y = \beta_0 + \beta_1 X_1 + \beta_2 X_2 + \beta_{12} (X_1 \cdot X_2) + \beta_{11} X_1^2 + \beta_{22} X_2^2 + \epsilon$$
   Evaluates coupled multi-parameter trade-offs, such as Front Wing Angle vs. Rear Wing Angle.

---

## 2. Grouped Cross-Validation (Run / Stint Level)

A critical flaw in motorsport machine learning is intra-stint data leakage: consecutive laps in the same track run have highly correlated track and tire conditions.

ApexIQ implements **Grouped K-Fold Cross-Validation** (`GroupKFold` / run-based leave-one-group-out):
- Laps from the same stint (e.g. `run-01-baseline`, `run-03-soft-stint`) are kept together strictly in either the training fold or the validation fold.
- The model with the lowest out-of-sample Cross-Validation RMSE is selected automatically.
- Model selection avoids overfitting to single tire stints.

---

## 3. Optimization Scenarios

When exploring optimal parameter values for a target metric (minimizing lap time or maximizing corner apex speed), ApexIQ provides three explicit scenarios:

### 1. Nominal Optimum
$$\min_{X \in \mathcal{D}_{\text{obs}}} \hat{Y}(X)$$
The mathematical unconstrained minimum of the predicted mean response within the observed domain.

### 2. Conservative Scenario (P10–P90 Risk Aversion)
Uses the upper 90th percentile bound of lap time:
$$\min_{X \in \mathcal{D}_{\text{obs}}} \left[ \hat{Y}(X) + 1.28 \cdot \sigma_{\text{pred}}(X) \right]$$
Protects against unfavorable outcomes caused by residual tire or track grip fluctuations.

### 3. Robust Scenario (Uncertainty Regularization)
Explicitly penalizes extrapolation and sparse data regions:
$$\min_{X \in [\text{min\_val}, \text{max\_val}]} \left[ \hat{Y}(X) + \lambda \cdot \sigma_{\text{model}}(X) \right]$$
Where $\lambda = 1.96$ by default. This steers setup recommendations toward regions with dense empirical observation and minimal epistemic uncertainty.

---

## 4. No Causal Claims Guarantee

All optimization endpoints emit an explicit governance disclaimer:
> *"MODELLED RESPONSE: Statistical surrogate estimates based on observed session laps. Not an empirical guarantee of on-track performance. Driver adaptation and physical setup compliance must be validated on-track."*

Every response is marked with metadata indicating:
- `result_type: "OPTIMIZED"` or `"MODELLED"`
- Out-of-sample validation RMSE
- Interpolation vs. extrapolation flag
