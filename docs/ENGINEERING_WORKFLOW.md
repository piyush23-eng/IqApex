# ApexIQ — End-to-End Engineering Diagnostic Workflow

> **Note**: Illustrative synthetic engineering example demonstrating the quantitative progression from raw telemetry traces to full race strategy consequence.

---

## The Workflow Progression

```text
REFERENCE LAP & COMPARISON LAP
             ↓
    +0.206 s LAP DELTA
             ↓
    PHASE DECOMPOSITION
  (Cornering +0.108 s, Acceleration +0.052 s, Braking +0.031 s, Straight +0.015 s)
             ↓
    CANDIDATE SENSITIVITY IDENTIFICATION
  (Rear Wing Angle: -0.024 s/deg, Front Wing Angle: -0.015 s/deg)
             ↓
    ENGINEERING SETUP WHAT-IF
  (Increase Rear Wing Flap: 24.0° -> 26.0°)
             ↓
    AERODYNAMIC SURROGATE RESPONSE
  (Downforce: +139.6 N, Drag: +0.4 N, Aero Balance: -0.2% rearward)
             ↓
    VEHICLE PERFORMANCE SIMULATION
  (Corner transit: -0.042 s, Straight transit: +0.129 s, Net Lap: +0.087 s)
             ↓
    RACE STRATEGY & TYRE DEGRADATION CONSEQUENCE
  (Reduced high-speed tyre sliding reduces degradation by 0.012 s/lap)
             ↓
    1,000-RUN MONTE CARLO UNCERTAINTY
  (P10: 4231.94 s, Mean: 4232.94 s, P90: 4233.94 s)
             ↓
    DECISION SUPPORT SYNTHESIS
```

---

## 1. Step 1: Measured Observation
At Autodromo Nazionale Monza, comparison lap `lap-monza-comp-01` records a total elapsed time of **81.246 s**, representing a **+0.206 s** deficit against reference lap `lap-monza-ref-01` (**81.040 s**).

## 2. Step 2: Phase Decomposition
Decomposition into spatial physical phases reveals that **52.4%** of the loss occurred during Cornering (+0.108 s), with T8–T10 (Variante Ascari) contributing the largest discrete loss (+0.062 s) due to a 3.8 km/h lower minimum corner speed.

## 3. Step 3: Sensitivity Association
Statistical regression against the vehicle parameter Jacobian flags `rear_wing_angle` ($-0.024\text{ s/deg}$) and `ride_height_front` ($-0.008\text{ s/mm}$) as candidate parameters capable of addressing mid-corner lateral grip.

## 4. Step 4: Setup What-If Exploration
The engineer configures a scenario with $+2.0^\circ$ rear wing angle ($24.0^\circ \rightarrow 26.0^\circ$).

## 5. Step 5: Aerodynamic Surrogate Response
The GBDT surrogate predicts:
* Downforce increases by $+139.6\text{ N}$ ($21,159.0\text{ N}$ total).
* Drag increases by $+0.4\text{ N}$ ($11,840.5\text{ N}$ total).
* Feature query is confirmed as `INTERPOLATION` within the Latin Hypercube domain.
* 95% Confidence Interval for the mean delta: $[+0.034\text{ s}, +0.140\text{ s}]$.
* 95% Prediction Interval for a single lap: $[-0.030\text{ s}, +0.204\text{ s}]$.

## 6. Step 6: Vehicle Kinematics Consequence
Simulating a complete lap at Monza with the increased load indicates:
* Corner transit improves by **$-0.042\text{ s}$** due to increased normal force.
* Straight transit degrades by **$+0.129\text{ s}$** due to drag penalties across the long Monza straights (Prima Variante to Curva Grande, Rettifilo Tribune).
* Net single-lap consequence: **$+0.087\text{ s}$** slower in qualifying trim.

## 7. Step 7: Full Race Consequence & Decision Support
However, when propagating this aero setup into the 53-lap race strategy simulation:
* Increased downforce reduces tyre scrub through Ascari and Parabolica.
* Tyre degradation rate on the Medium compound decreases by $7.2\%$.
* Across 53 laps, the reduced tyre cliff offsets the straight-line drag deficit, improving mean race time by **$-2.8\text{ s}$** under the 1-Stop Medium $\rightarrow$ Hard strategy.
* 1,000-run Monte Carlo yields a $78.4\%$ probability of finishing ahead of the baseline setup across stochastic safety car and degradation windows.
