# Multi-Objective Optimization & Pareto Methodology

## 1. Multi-Objective Aerodynamic Conflict

Motorsport vehicle performance is fundamentally characterized by conflicting objectives:
1. **Maximize Downforce ($D$)**: Increases cornering speed ($v_{\text{corner},\max}$) and braking capability.
2. **Minimize Drag ($F_{\text{drag}}$)**: Increases straight-line top speed ($v_{\text{top}}$) and longitudinal acceleration.

## 2. Pareto Frontier Definition

A setup configuration $\mathbf{x}_A$ is said to **dominate** configuration $\mathbf{x}_B$ if and only if:
1. $\mathbf{x}_A$ achieves downforce greater than or equal to $\mathbf{x}_B$: $D(\mathbf{x}_A) \ge D(\mathbf{x}_B)$, AND
2. $\mathbf{x}_A$ produces drag less than or equal to $\mathbf{x}_B$: $F_{\text{drag}}(\mathbf{x}_A) \le F_{\text{drag}}(\mathbf{x}_B)$, AND
3. At least one of the inequalities is strictly satisfied.

The set of all non-dominated configurations forms the **Pareto Frontier**.

## 3. Engineering Guidance

- **No Arbitrary "Aero Score"**: ApexIQ strictly rejects creating a single composite setup score. The optimal balance between downforce and drag depends heavily on circuit profile (Monza low-downforce vs Monaco maximum-downforce).
- **Trade-Off Audit**: Engineers inspect side-by-side trade-offs between configurations, observing the exact delta in corner transit time versus straight transit time.
