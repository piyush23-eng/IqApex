# Non-Linear Tyre Degradation Model

> **GOVERNANCE NOTICE**:
> **SYNTHETIC ENGINEERING DATASET** — **MODELLED SCENARIO — NOT REAL F1 RACE DATA**.
> The tyre model is a phenomenological representation combining linear wear, non-linear thermal degradation, and cold-tyre warmup dynamics.

---

## 1. Mathematical Formulation

The effective friction coefficient $\mu(\text{age})$ for compound $c \in \{\text{Soft}, \text{Medium}, \text{Hard}\}$ at lap age $a$ is:

$$\mu(a) = \mu_0(c) - a \cdot \text{deg}_a(c) - a^2 \cdot \text{deg}_b(c) - \Delta \mu_{\text{thermal}}(a) + \Delta \mu_{\text{warmup}}(a)$$

Where:
- $\mu_0(c)$: Peak fresh tyre mechanical grip coefficient.
- $\text{deg}_a(c)$: Linear wear coefficient (abrasive wear).
- $\text{deg}_b(c)$: Quadratic degradation coefficient (structural rubber hysteresis loss & core breakdown).
- $\Delta \mu_{\text{thermal}}(a) = \max(0, a - L_{\text{thermal}}) \cdot r_{\text{thermal}} \cdot \gamma_{\text{weather}}$: Thermal degradation penalty past threshold $L_{\text{thermal}}$.
- $\Delta \mu_{\text{warmup}}(a) = -\max(0, L_{\text{warmup}} - a) \cdot 0.04$: Temporary grip deficit during cold out-lap and warmup.

---

## 2. Compound Specifications

| Parameter | Soft (C3) | Medium (C2) | Hard (C1) | Units |
| :--- | :--- | :--- | :--- | :--- |
| **Initial Grip ($\mu_0$)** | 1.82 | 1.74 | 1.66 | dimensionless |
| **Linear Deg ($a$)** | 0.0075 | 0.0042 | 0.0022 | $\text{lap}^{-1}$ |
| **Quadratic Deg ($b$)** | 0.00038 | 0.00018 | 0.00008 | $\text{lap}^{-2}$ |
| **Thermal Threshold** | 14 | 20 | 28 | laps |
| **Thermal Rate** | 0.0045 | 0.0025 | 0.0012 | $\text{lap}^{-1}$ |
| **Warmup Laps** | 2 | 2 | 3 | laps |
| **Cliff Lap ($L_{\text{viable}}$)** | 22 | 34 | 46 | laps |
| **Minimum Viable Grip** | 1.35 | 1.30 | 1.25 | dimensionless |

---

## 3. Coupling to Vehicle Lap Time

The degradation in friction coefficient $\Delta \mu(a) = \mu_0 - \mu(a)$ directly modulates the vehicle's cornering and longitudinal acceleration capabilities:

$$a_{y, \text{max}}(a) = \mu(a) \cdot g + \frac{\frac{1}{2}\rho C_L A v^2}{m(l)}$$

The resulting lap-time penalty $\Delta t_{\text{tyre}}(a)$ is derived from the sensitivity relation established in Stage 5:

$$\Delta t_{\text{tyre}}(a) = S_{\mu} \cdot (\mu_0 - \mu(a))$$

Where $S_{\mu} \approx 6.8\text{ s} / \Delta \mu$ at Monza. Past the tyre cliff $L_{\text{viable}}$, an exponential penalty is incurred simulating extreme rubber blister and graining.
