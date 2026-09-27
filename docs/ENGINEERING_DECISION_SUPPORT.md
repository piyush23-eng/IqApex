# ApexIQ Stage 8: Engineering Decision Support Architecture

## 1. Engineering Motivation & Scope
In professional motorsport engineering, isolated analytical calculations (such as an aerodynamic surrogate curve or a standalone lap simulation) fail to answer the true operational question:

> *"If we modify a set of vehicle parameters, what happens across the entire performance chain—from telemetry reconciliation through aerodynamic balance, vehicle kinematics, and 53-lap race strategy, and what is the scientific uncertainty surrounding this decision?"*

Stage 8 unites Stages 1 through 7 into a single, cohesive, reproducible **Engineering Decision Support Layer**.

---

## 2. The Cross-Module Pipeline

```text
OBSERVATION (Stage 2/3 Telemetry)
    ↓
MEASUREMENT (Stage 4 Lap Loss Decomposition)
    ↓
STATISTICAL EVIDENCE (Stage 4 Phase Attribution)
    ↓
ENGINEERING HYPOTHESIS (Candidate Parameter Sensitivity)
    ↓
PARAMETER / SETUP CHANGE (What-If Configuration)
    ↓
VEHICLE PERFORMANCE CONSEQUENCE (Stage 6 Aero Surrogate + Kinematics)
    ↓
RACE / STRATEGY CONSEQUENCE (Stage 7 53-Lap Simulation + Monte Carlo)
    ↓
UNCERTAINTY BOUNDS (95% CI on Mean, 95% PI on Lap Time)
    ↓
REPRODUCIBLE REPORT & DECISION
```

---

## 3. Strict Evidence Taxonomy
To maintain scientific integrity and prevent misleading claims, ApexIQ enforces an immutable hierarchy of evidence classifications:

| Evidence Type | Semantic Definition | Validation Provenance Rule |
| :--- | :--- | :--- |
| `OBSERVED` | Directly measured physical telemetry from on-car sensors. | Reconciled against raw channel streams. |
| `STATISTICAL_ASSOCIATION` | Empirical correlations derived from historical data. | Non-causal phrasing mandatory; correlation $\neq$ causation. |
| `MODELLED` | Estimated via physics-based or surrogate ML models. | Model assumptions and training domains must be stated. |
| `SCENARIO` | Simulated hypothetical "what-if" configuration. | Never presented as an achieved outcome. |
| `OPTIMIZATION` | Mathematical extremum on a Pareto trade-off frontier. | Constrained by prescribed boundary conditions. |
| `VALIDATED` | Independently verified against physical test track data. | **Forbidden on synthetic datasets** without explicit real-world validation provenance. |

---

## 4. Domain Validity & Extrapolation Governance
Surrogate models are trained within specific geometric and kinematic ranges. When evaluating setups:
- `OBSERVED_DOMAIN`: Parameters match empirical session baselines.
- `INTERPOLATION`: Parameters fall strictly within the minimum and maximum convex hull of the training Design of Experiments (DoE).
- `EXTRAPOLATION`: Parameter exceeds DoE bounds; uncertainty bands are inflated by $1.8\times$ and explicit warning banners are presented.
- `OUT_OF_BOUNDS`: Parameter exceeds physical chassis geometry limits; scenario is flagged as unfeasible.

---

## 5. Non-Causal Reporting Language
ApexIQ strictly prohibits anthropomorphic and unverified causal claims.
- **Forbidden**: *"Driver brakes too late at Turn 9"*, *"Wing angle caused 0.4s loss"*.
- **Mandatory**: *"Turn 9 minimum corner speed was 4.2 km/h lower; candidate sensitivity indicates rear-wing trim exhibits modelled sensitivity within the observed configuration domain."*
