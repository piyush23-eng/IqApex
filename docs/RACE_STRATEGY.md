# Race Strategy & Scenario Simulation

> **GOVERNANCE NOTICE**:
> **SYNTHETIC ENGINEERING DATASET** — **MODELLED SCENARIO — NOT REAL F1 RACE DATA**.
> All lap times, tyre degradation curves, pit loss values, and traffic delays are synthetic engineering estimates coupled to the physical vehicle performance model.

---

## 1. Executive Overview

Stage 7 implements an engineering-grade race strategy decision analysis system for ApexIQ.
The system solves the fundamental motorsport strategy problem:

$$\min_{\mathcal{S}} \mathbb{E}\left[T_{\text{race}}(\mathcal{S})\right] \quad \text{subject to FIA sporting regulations and stint feasibility}$$

Where:
- $\mathcal{S} = \{(\text{compound}_i, L_i)\}_{i=1}^N$ is a stint allocation sequence.
- $N$ is the number of stints ($N-1$ pit stops).
- $\sum_{i=1}^N L_i = 53$ (Monza Grand Prix scheduled distance).
- FIA 2-compound rule: $|\{\text{compound}_i\}| \ge 2$.

---

## 2. Strategy Decomposition

For any strategy $\mathcal{S}$ compared to a baseline strategy $\mathcal{S}_0$, the total race time difference is decomposed into additive physical mechanisms:

$$\Delta T_{\text{race}} = \Delta T_{\text{pit}} + \Delta T_{\text{tyre}} + \Delta T_{\text{traffic}} + \Delta T_{\text{interruption}} + \text{Residual}$$

Where:
1. **$\Delta T_{\text{pit}}$**: Direct pit stop time lost in pit lane transition and stationary service.
   - Green flag pit loss: $24.5\text{ s}$
   - Virtual Safety Car (VSC) pit loss: $14.5\text{ s}$
   - Full Safety Car (SC) pit loss: $11.5\text{ s}$
2. **$\Delta T_{\text{tyre}}$**: Differential tyre degradation penalty accumulated across stints:
   $$\Delta T_{\text{tyre}} = \sum_{l=1}^{53} \Delta t_{\text{tyre}}(c(l), \text{age}(l)) - \sum_{l=1}^{53} \Delta t_{\text{tyre}, 0}(c_0(l), \text{age}_0(l))$$
3. **$\Delta T_{\text{traffic}}$**: Track position and out-of-sequence traffic interference penalties.
4. **$\Delta T_{\text{interruption}}$**: Neutralization speed delta benefits during VSC or SC periods.
5. **$\text{Residual}$**: Higher-order non-linear coupling interactions (fuel-mass vs tyre grip non-linearities).

---

## 3. Pit Window Sensitivity & Overcut/Undercut Dynamics

The engine evaluates pit lap timing sensitivity over a discrete window:

$$\Delta L_{\text{pit}} \in \{-3, -2, -1, 0, +1, +2, +3\}$$

- **Undercut ($\Delta L_{\text{pit}} < 0$)**: Pitting early provides fresh tyre pace advantage immediately, but subjects the car to longer stint 2 wear and higher risk of exceeding the tyre cliff.
- **Overcut ($\Delta L_{\text{pit}} > 0$)**: Extending the initial stint preserves late-race tyre performance at the expense of slower laps on aged rubber prior to the stop.

---

## 4. Deterministic Monte Carlo Simulation

Uncertainty is evaluated using $M = 1,000$ deterministic runs with fixed seed `42871`:
- Tyre wear variance: $\sigma_{\text{wear}} = 12\%$
- Pit stop service noise: $\sigma_{\text{pit}} = 0.8\text{ s}$
- Traffic delay noise: $\sigma_{\text{traffic}} = 0.25\text{ s/lap}$

Quantiles extracted:
- **P05**: Optimistic race completion time (clean air, optimal tyre life, flawless pit stops).
- **P50**: Median expected race outcome.
- **P95**: Pessimistic risk bound (heavy traffic, severe thermal wear, extended pit stops).
- **$P(\text{Beat Reference})$**: Empirical probability $\frac{1}{M}\sum_{k=1}^M \mathbb{I}(T_k < T_{\text{ref}})$.
