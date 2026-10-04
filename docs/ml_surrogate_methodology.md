# Machine Learning Surrogate Methodology & Experimental Design

This technical report describes the Machine Learning and surrogate modeling techniques applied within ApexIQ to accelerate aerodynamic and setup optimization.

---

## 1. Motivation: The Computational Bottleneck

High-fidelity Computational Fluid Dynamics (CFD) and trackside wind-tunnel simulations require hours per parameter point. For real-time pit-wall engineering, decisions must be made in **< 10 seconds** between practice sessions or during virtual safety car windows.

ApexIQ solves this by training a fast, physics-constrained **Gradient Boosted Decision Tree (GBDT)** surrogate over a Latin Hypercube Design of Experiments (DOE) space.

---

## 2. Latin Hypercube Sampling (LHS)

To uniformly sample the 4-dimensional aero parameter space without clustering, LHS divides each parameter's range into $M$ equiprobable intervals:

- $\alpha_{\text{front}} \in [12.0^\circ, 25.0^\circ]$ (Front wing flap angle)
- $\alpha_{\text{rear}} \in [15.0^\circ, 35.0^\circ]$ (Rear wing flap angle)
- $h_{\text{front}} \in [25.0\text{ mm}, 45.0\text{ mm}]$ (Front dynamic ride height)
- $h_{\text{rear}} \in [55.0\text{ mm}, 90.0\text{ mm}]$ (Rear dynamic ride height)

Each interval is sampled exactly once per dimension, maximizing multidimensional coverage.

---

## 3. Physics Invariant Guarantees

Pure black-box regressors often produce non-physical artifacts. ApexIQ enforces:
1. **$v^2$ Quadratic Scaling**: Aerodynamic forces must scale with dynamic pressure $q = \frac{1}{2} \rho v^2$.
2. **Monotonicity Constraints**: Increasing wing angle must strictly produce non-negative additional drag ($\frac{\partial F_{\text{drag}}}{\partial \alpha_{\text{rear}}} \ge 0$).
3. **Bounded Extrapolation Warning**: An uncertainty penalty flag (`EXTRAPOLATION_DOMAIN`) is triggered when query points lie outside the convex hull of training data.
