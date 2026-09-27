# Uncertainty Quantification & Monte Carlo Methodology

In professional engineering workstations, deterministic point estimates without error bounds are fundamentally untrustworthy. ApexIQ Stage 5 rigorously separates and visualizes two forms of uncertainty.

---

## 1. Confidence Intervals (Epistemic) vs. Prediction Intervals (Aleatoric)

### 95% Confidence Interval (Mean Response)
Represents the uncertainty in the estimation of the regression surface itself:
$$\text{CI}_{95\%}(X) = \hat{Y}(X) \pm t_{n-p, 0.975} \cdot s \sqrt{\mathbf{x}^T (\mathbf{X}^T \mathbf{X})^{-1} \mathbf{x}}$$
Where:
- $\mathbf{x}$ is the feature vector for input point $X$.
- $(\mathbf{X}^T \mathbf{X})^{-1}$ is the parameter covariance matrix.
- $s$ is the residual standard error $\sqrt{\frac{\sum (y_i - \hat{y}_i)^2}{n - p}}$.

### 95% Prediction Interval (Individual Lap Response)
Represents where an individual lap will fall, accounting for both model uncertainty and inherent lap-to-lap physical variance (traffic, wind, tire degradation):
$$\text{PI}_{95\%}(X) = \hat{Y}(X) \pm t_{n-p, 0.975} \cdot s \sqrt{1 + \mathbf{x}^T (\mathbf{X}^T \mathbf{X})^{-1} \mathbf{x}}$$

In ApexIQ charts:
- The **dark blue band** visualizes the 95% Confidence Interval of the mean response.
- The **light blue dashed band** visualizes the 95% Prediction Interval for individual laps.

---

## 2. Domain Classification: Interpolation vs. Extrapolation

A model cannot reliably extrapolate outside the convex hull of its training domain:
- **Interpolation**: $X \in [X_{\min}^{\text{obs}}, X_{\max}^{\text{obs}}]$. Marked as valid empirical territory.
- **Extrapolation**: $X < X_{\min}^{\text{obs}}$ or $X > X_{\max}^{\text{obs}}$.
  - The UI highlights the curve in **dashed amber** beyond the domain vertical lines.
  - A prominent banner warns: *"EXTRAPOLATION WARNING: Evaluated outside observed parameter range [X_min, X_max]"*.

---

## 3. Deterministic Monte Carlo Simulation

To test setup parameter variability (such as tire pressure bleed or driver braking inconsistency), ApexIQ provides a Monte Carlo simulator:

1. **Deterministic Random Seed**:
   Fixed at `simulation_seed: 42871` by default to ensure 100% reproducible engineering reports across teams.

2. **Input Perturbation**:
   Draws $N$ samples (default 1,000) from a Gaussian distribution:
   $$X^{(i)} \sim \mathcal{N}(\mu_{\text{scenario}}, \sigma_{\text{scenario}}^2)$$

3. **Combined Variance**:
   If `include_residual_variance: true`, each simulated lap includes residual error:
   $$Y^{(i)} = \hat{Y}(X^{(i)}) + \epsilon^{(i)}, \quad \epsilon^{(i)} \sim \mathcal{N}(0, s^2)$$

4. **Statistical Quantiles**:
   Calculates P05, P10, P50 (median), P90, P95, mean, and standard deviation of $\Delta Y = Y^{(i)} - Y_{\text{baseline}}$.
   Rendered in an SVG histogram with median and quantile indicators.
