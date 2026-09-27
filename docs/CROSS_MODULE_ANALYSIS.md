# ApexIQ Cross-Module Analysis Methodology

## 1. Lap Loss Attribution & Decomposition Reconciliation
Given a Reference Lap ($L_{\text{ref}}$) and a Comparison Lap ($L_{\text{comp}}$), the total measured lap delta is:
$$\Delta T_{\text{lap}} = T_{\text{comp}} - T_{\text{ref}}$$

The decomposition partitions $\Delta T_{\text{lap}}$ across three physical phases:
1. **Corner Entry (Braking & Trail)**: $\Delta t_{\text{entry}}$
2. **Mid-Corner (Apex & Minimum Speed)**: $\Delta t_{\text{apex}}$
3. **Corner Exit (Traction & Acceleration)**: $\Delta t_{\text{exit}}$
4. **Straightline / Full-Throttle Drag Phase**: $\Delta t_{\text{straight}}$

The decomposition engine strictly enforces exact numerical reconciliation:
$$\Delta T_{\text{lap}} = \sum_{p} \Delta t_p + \epsilon_{\text{residual}}$$
Where $|\epsilon_{\text{residual}}| < 0.001\text{ s}$.

---

## 2. Parameter Propagation through Surrogate & Kinematics
When an engineer proposes a setup modification:
$$\mathbf{x}_{\text{scenario}} = \mathbf{x}_{\text{baseline}} + \Delta \mathbf{x}$$

1. **Aerodynamic Surrogate (`GradientBoostingRegressor`)**:
   Estimates total downforce ($F_z$), drag ($F_x$), lift-to-drag ($L/D$), and aerodynamic balance ($\%F$).
2. **Vehicle Kinematics Simulator**:
   Simulates Monza quasi-steady cornering and straight-line acceleration profiles:
   $$\Delta t_{\text{corner}} = f(F_z, \mu, m)$$
   $$\Delta t_{\text{straight}} = f(F_x, P_{\text{engine}}, m)$$
   $$\Delta T_{\text{modeled}} = \Delta t_{\text{corner}} + \Delta t_{\text{straight}}$$

---

## 3. Coupling to 53-Lap Race Strategy
A qualifying lap improvement does not guarantee race performance. Aerodynamic load alters tyre energy dissipation and thermal degradation:
1. Increased downforce reduces high-speed sliding work, mitigating thermal tyre degradation per lap:
   $$\Delta \kappa_{\text{deg}} = -\alpha \cdot \Delta C_L$$
2. High drag increases fuel consumption rate and straightline vulnerability.
3. The 53-lap Monza race simulation evaluates compound transitions (e.g. Medium $\to$ Hard) and executes 1,000 Monte Carlo iterations to establish:
   - Expected race time delta ($\Delta T_{\text{race}}$)
   - 5th percentile ($P_{05}$), median ($P_{50}$), and 95th percentile ($P_{95}$) race completion windows.
