# Statistical Performance Analysis Methodology

## 1. Overview and Engineering Rationale

Motorsport telemetry data contains intrinsic stochastic variation: track temperature changes, wind gusts, tyre thermal cycles, and micro-variations in driver execution. Treating any single lap as definitive performance ground-truth introduces substantial noise into engineering decisions.

ApexIQ provides a rigorous statistical analysis engine designed to evaluate repeated stint laps, quantify pace stability, fit degradation trends, and test feature correlations with explicit statistical guarantees.

---

## 2. Descriptive Statistics & Repeatability

For a set of $n$ valid stint observations $\{x_1, x_2, \ldots, x_n\}$ (e.g. lap times or sector times):

* **Sample Mean ($\bar{x}$)**:
  $$\bar{x} = \frac{1}{n} \sum_{i=1}^{n} x_i$$
* **Sample Median ($\tilde{x}$ or $Q_2$)**:
  The 50th percentile of sorted observations, robust to non-normal skew.
* **Sample Standard Deviation ($s$)**:
  $$s = \sqrt{\frac{1}{n-1} \sum_{i=1}^{n} (x_i - \bar{x})^2}$$
* **Sample Variance ($s^2$)**:
  Degrees-of-freedom corrected dispersion: $s^2 = \frac{1}{n-1} \sum (x_i - \bar{x})^2$.
* **Percentiles ($P_{10}$ and $P_{90}$)**:
  Empirical boundaries containing the central $80\%$ of performance observations.

---

## 3. Confidence Interval vs. Prediction Interval

A frequent flaw in racing analysis is conflating the uncertainty in *mean pace* with the uncertainty of *the next individual lap*. ApexIQ explicitly differentiates between the two:

### 3.1 95% Confidence Interval for the Mean Pace
Quantifies the precision of the estimated population mean under prevailing vehicle setup and track conditions:

$$\text{CI}_{95\%} = \left[ \bar{x} - t_{n-1, 0.025} \cdot \frac{s}{\sqrt{n}}, \quad \bar{x} + t_{n-1, 0.025} \cdot \frac{s}{\sqrt{n}} \right]$$

As stint length $n$ increases, the standard error $\frac{s}{\sqrt{n}} \to 0$, narrowing the interval towards the true mean pace.

### 3.2 95% Prediction Interval for the Next Single Lap
Quantifies the interval into which the *immediate next valid lap* $x_{n+1}$ is expected to fall with $95\%$ probability:

$$\text{PI}_{95\%} = \left[ \bar{x} - t_{n-1, 0.025} \cdot s \sqrt{1 + \frac{1}{n}}, \quad \bar{x} + t_{n-1, 0.025} \cdot s \sqrt{1 + \frac{1}{n}} \right]$$

Even with infinite historical laps ($n \to \infty$), the prediction interval remains bounded by $\pm 1.96\,s$, capturing intrinsic vehicle-track physical variance.

---

## 4. Transparent Outlier Detection (Tukey's IQR)

Outlier rejection must be traceable. Silently discarding slow laps masks tyre degradation, setup instability, or handling deficits.

### 4.1 Rejection Thresholds
Using the empirical quartiles $Q_1$ (25th percentile) and $Q_3$ (75th percentile):

$$\text{IQR} = Q_3 - Q_1$$
$$\text{Threshold}_{\text{lower}} = Q_1 - 1.5 \cdot \text{IQR}, \quad \text{Threshold}_{\text{upper}} = Q_3 + 1.5 \cdot \text{IQR}$$

### 4.2 Audit Protocol
ApexIQ outputs an `OutlierReport` with:
* Total evaluated samples ($n_{\text{total}}$)
* Clean samples retained for statistical fitting ($n_{\text{included}}$)
* Outliers excluded ($n_{\text{excluded}}$)
* Itemized record of each excluded observation with measured value and classification reason (e.g. *Yellow flag slow zone*, *Traffic in Sector 2*, *Lockup / Off-track*).

---

## 5. Correlation Analysis: Pearson $r$ vs. Spearman $\rho$

To evaluate relationships between vehicle telemetry features (e.g. minimum corner speed vs. sector delta, or tyre age vs. lap time):

* **Pearson Correlation ($r$)**: Measures linear dependency:
  $$r = \frac{\sum (x_i - \bar{x})(y_i - \bar{y})}{\sqrt{\sum (x_i - \bar{x})^2 \sum (y_i - \bar{y})^2}}$$
* **Spearman Rank Correlation ($\rho$)**: Measures monotonic dependency, invariant to nonlinear scaling:
  $$\rho = 1 - \frac{6 \sum d_i^2}{n(n^2 - 1)}$$
* **Statistical Significance**: Two-tailed Student $t$-test testing $H_0: \rho = 0$. Values with $p < 0.05$ are marked as statistically significant.

---

## 6. Ordinary Least Squares (OLS) Degradation Regression

Tyre performance degradation across a stint is modeled via OLS:

$$y_i = \beta_0 + \beta_1 x_i + \epsilon_i, \quad \epsilon_i \sim \mathcal{N}(0, \sigma^2)$$

Where:
* $x_i$: Tyre age or stint lap number.
* $y_i$: Measured lap time or sector duration.
* $\beta_1$: Degradation rate ($\text{s/lap}$).
* $\text{SE}(\hat{\beta}_1)$: Standard error of the degradation rate:
  $$\text{SE}(\hat{\beta}_1) = \frac{s_e}{\sqrt{\sum (x_i - \bar{x})^2}}, \quad s_e = \sqrt{\frac{\sum e_i^2}{n-2}}$$
* **95% Confidence Interval on Degradation Rate**:
  $$\left[ \hat{\beta}_1 - t_{n-2, 0.025} \cdot \text{SE}(\hat{\beta}_1), \quad \hat{\beta}_1 + t_{n-2, 0.025} \cdot \text{SE}(\hat{\beta}_1) \right]$$
* **Coefficient of Determination ($R^2$)**:
  $$R^2 = 1 - \frac{\text{SS}_{\text{res}}}{\text{SS}_{\text{tot}}}$$
* **Residual Diagnostics**: Residual errors $e_i = y_i - \hat{y}_i$ are tabulated to inspect unmodeled trends (such as thermal cliff degradation).

---

## 7. Empirical Parameter Sensitivity Foundation

ApexIQ evaluates preliminary empirical derivatives of lap delta with respect to observed kinematic variance:

$$\frac{\partial \Delta T}{\partial X} \approx \frac{\Delta T_{\text{corner}}}{\Delta X_{\text{apex}}}$$

* **Apex Minimum Speed Sensitivity**: $\text{s} / (\text{km/h})$
* **Braking Distance Sensitivity**: $\text{s} / \text{m}$
* **Throttle Pickup Distance Sensitivity**: $\text{s} / \text{m}$

This empirical baseline provides the direct interface for Stage 5 Vehicle Dynamics and Setup Optimization models.
