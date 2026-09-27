# ApexIQ — Analytical & Physical Unit Audit (Stage 9)

**Audit Version**: Stage 9 Hardening  
**Scope**: All physics, vehicle dynamics, aerodynamic, degradation, and statistical formulas across Stages 1–8.  
**Auditor**: Antigravity Autonomous Engineering Agent  
**Status**: VERIFIED & RECONCILED

---

## 1. Dynamic Pressure Equation Resolution

### Prior Typographical Discrepancy
In earlier documentation drafts, the dynamic pressure formula was rendered in some markdown viewers as `12 * rho * v^2` due to an ASCII encoding glitch for the fraction $\frac{1}{2}$.

### Code Implementation Audit
* **File**: `backend/app/analytics/synthetic_aero_generator.py` (Line 106)
  ```python
  # Dynamic pressure: q = 0.5 * rho * v^2
  q = 0.5 * consts["air_density_kg_m3"] * (v_ms**2)
  ```
* **File**: `backend/app/analytics/vehicle_performance.py` (Line 126)
  ```python
  q = 0.5 * self.rho * (v_ms**2)
  ```
* **Conclusion**: The production codebase was **always mathematically correct** ($q = \frac{1}{2}\rho v^2$).
* **Permanent Invariant Verification**: A dedicated unit test in `tests/test_physics_invariants.py::test_dynamic_pressure_scaling` verifies:
  $$q(2v) = 4 \cdot q(v) \pm 10^{-9}$$

---

## 2. Exhaustive Equation & Unit Audit Table

| Module | Physics Equation / Formulation | Inputs & Units | Intermediate & Output Units | Code Location | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Aero** | Dynamic Pressure: $q = \frac{1}{2}\rho v^2$ | $\rho \text{ [kg/m}^3\text{]}$, $v \text{ [m/s]}$ | $q \text{ [Pa or N/m}^2\text{]}$ | `synthetic_aero_generator.py:106` | VERIFIED |
| **Aero** | Aerodynamic Downforce: $F_z = q \cdot S \cdot C_L$ | $q \text{ [Pa]}$, $S \text{ [m}^2\text{]}$, $C_L \text{ [-]}$ | $F_z \text{ [N]}$ | `synthetic_aero_generator.py:146` | VERIFIED |
| **Aero** | Aerodynamic Drag: $F_x = q \cdot S \cdot C_D$ | $q \text{ [Pa]}$, $S \text{ [m}^2\text{]}$, $C_D \text{ [-]}$ | $F_x \text{ [N]}$ | `synthetic_aero_generator.py:147` | VERIFIED |
| **Aero** | Efficiency: $L/D = \frac{C_L}{C_D}$ | $C_L \text{ [-]}$, $C_D \text{ [-]}$ | $L/D \text{ [-]}$ (dimensionless) | `synthetic_aero_generator.py:151` | VERIFIED |
| **Aero** | Aero Balance: $\%F = \frac{F_{z,\text{front}}}{F_z} \cdot 100$ | $F_{z,\text{front}} \text{ [N]}$, $F_z \text{ [N]}$ | $\% \text{ [percentage]}$ | `synthetic_aero_generator.py:153` | VERIFIED |
| **Dynamics** | Corner Max Speed: $v_{\text{corner}} = \sqrt{\frac{\mu \cdot m \cdot g}{m/R - \frac{1}{2}\rho S C_L \mu}}$ | $\mu \text{ [-]}$, $m \text{ [kg]}$, $g \text{ [m/s}^2\text{]}$, $R \text{ [m]}$, $C_L \text{ [-]}$ | $v \text{ [m/s]} \rightarrow \text{[km/h]}$ | `vehicle_performance.py:140` | VERIFIED |
| **Dynamics** | Straight Kinematics: $m \cdot \frac{dv}{dt} = \frac{P \cdot \eta}{v} - F_{\text{drag}} - F_{\text{rr}}$ | $P \text{ [W]}$, $\eta \text{ [-]}$, $F_x \text{ [N]}$, $F_{\text{rr}} \text{ [N]}$ | Acceleration: $[m/s^2]$ | `vehicle_performance.py:180` | VERIFIED |
| **Tyres** | Decay: $\Delta\mu = a \cdot \text{age} + b \cdot \text{age}^2 + c \cdot T_{\text{mult}}$ | $\text{age [laps]}$, $a \text{ [1/lap]}$, $b \text{ [1/lap}^2\text{]}$ | $\mu_{\text{effective}} \text{ [-]}$ | `tyre_model.py:85` | VERIFIED |
| **Strategy** | Fuel Mass Penalty: $\Delta t_{\text{fuel}} = m_{\text{fuel}} \cdot k_{\text{fuel}}$ | $m_{\text{fuel}} \text{ [kg]}$, $k_{\text{fuel}} = 0.033 \text{ [s/kg]}$ | $\Delta t \text{ [s]}$ | `strategy_engine.py:112` | VERIFIED |
| **Decomposition** | Conservation: $\Delta T_{\text{lap}} = \sum \Delta t_{\text{phases}} + \epsilon$ | Time deltas $\text{[s]}$ | Reconciliation residual $\epsilon < 10^{-4}\text{ s}$ | `engineering_analysis_engine.py:140` | VERIFIED |
| **Statistics** | Prediction Interval: $\hat{y} \pm 1.96 \sqrt{\text{Var}(\hat{\mu}) + s^2}$ | $\hat{y} \text{ [N]}$, residual $s \text{ [N]}$ | Lower / Upper bound $\text{[N]}$ | `aero_surrogate.py:175` | VERIFIED |

---

## 3. Compliance Affirmation
All channel definitions strictly adhere to SI units internally ($\text{m}$, $\text{m/s}$, $\text{N}$, $\text{kg}$, $\text{Pa}$, $\text{rad}$ or $\text{deg}$). Conversions to engineering display units ($\text{km/h}$, $\text{bar}$, $\text{mm}$) occur explicitly at serialization boundaries.
