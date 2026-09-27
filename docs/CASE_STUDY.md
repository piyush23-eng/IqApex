# ApexIQ — Technical Case Study: Monza Diagnostic & Setup Exploration

> **Notice**: This case study represents a synthetic engineering investigation designed to illustrate how data science and simulation models provide decision support. All values are synthetic and do not reflect proprietary team data.

---

## 1. Problem Formulation
During Friday practice (FP2) at Autodromo Nazionale Monza, Driver 2 (`lap-monza-comp-01`) logs a lap time of **1:21.246** (81.246 s), running **+0.206 s** slower than Driver 1's reference lap `lap-monza-ref-01` (**1:21.040**).

The trackside engineering objective is to identify:
1. Exactly where on the 5,793-meter circuit the lap time deficit is accumulated.
2. What physical phase of the vehicle dynamics accounts for the loss.
3. What setup modification addresses the deficit without causing unintended race-distance penalties.

---

## 2. Step 1: Telemetry Alignment & Measurement
The two laps were resampled onto an identical 1.0 m spatial grid along the track centerline (5,793 spatial points).

Inspection of the primary channels:
* **Speed (`vCar`)**: Comparison lap records lower apex speeds at Turn 1 ($-4.2\text{ km/h}$) and Turn 8 Variante Ascari ($-3.8\text{ km/h}$), but slightly higher terminal speed into Turn 1 ($+1.8\text{ km/h}$).
* **Throttle (`rThrottlePedal`)**: Full throttle application at Turn 10 exit is delayed by 18 meters.
* **Brake Pressure (`pBrakeF`)**: Peak brake pressure into Turn 1 is 8 bar lower, resulting in a 14-meter longer deceleration zone.
* **Acceleration (`latAccel`, `longAccel`)**: Peak lateral acceleration at Variante Ascari reaches $3.15\text{ g}$ on the reference lap vs $2.98\text{ g}$ on the comparison lap.

---

## 3. Step 2: Spatial Lap-Time Phase Decomposition
ApexIQ's phase decomposition classifies each 1-meter slice into one of four physical regimes:

| Performance Phase | Measured Delta | Contribution (%) | Dominant Track Locations | Evidence Classification |
| :--- | :--- | :--- | :--- | :--- |
| **Cornering** | **+0.108 s** | **52.4%** | T8–T10 Ascari, T11 Curva Alboreto | **OBSERVED** |
| **Acceleration** | **+0.052 s** | **25.2%** | T2 exit, T10 exit | **OBSERVED** |
| **Braking** | **+0.031 s** | **15.0%** | T1 Prima Variante entry | **OBSERVED** |
| **Straight** | **+0.015 s** | **7.3%** | Curva Grande straight | **OBSERVED** |
| **Total Measured Delta** | **+0.206 s** | **100.0%** | **Reconciliation Residual: 0.0000 s** | **OBSERVED** |

**Conclusion**: Over $77\%$ of the lap time loss (+0.160 s) is concentrated in the cornering and corner-exit acceleration phases.

---

## 4. Step 3: Statistical Sensitivity Analysis
Evaluating local parameter Jacobians over historical runs indicates candidate parameters:
* `rear_wing_angle`: Sensitivity $\frac{\partial T_{\text{lap}}}{\partial \alpha_{\text{rw}}} = -0.024\text{ s/deg}$
* `front_wing_angle`: Sensitivity $\frac{\partial T_{\text{lap}}}{\partial \alpha_{\text{fw}}} = -0.015\text{ s/deg}$
* `ride_height_front`: Sensitivity $\frac{\partial T_{\text{lap}}}{\partial h_{\text{front}}} = -0.008\text{ s/mm}$

---

## 5. Step 4: Engineering Scenario Exploration
The engineering team formulates Hypothesis H-1:
> *"Increasing the rear wing mainplane flap angle from 24.0° to 26.0° (+2.0°) will restore high-speed lateral support through the Variante Ascari and Parabolica."*

```json
{
  "baseline_setup": { "rear_wing_angle": 24.0, "front_wing_angle": 18.0, "ride_height_front": 32.0 },
  "scenario_overrides": { "rear_wing_angle": 26.0 }
}
```

---

## 6. Step 5: Vehicle & Aerodynamic Consequence
Propagating the $+2.0^\circ$ adjustment into the GBDT aerodynamic surrogate yields:
* **Downforce**: $21,159.0\text{ N}$ ($+139.6\text{ N}$)
* **Drag**: $11,840.5\text{ N}$ ($+0.4\text{ N}$)
* **Lift-to-Drag Ratio ($L/D$)**: $1.787$ (marginal $+0.011$ improvement)
* **Aero Balance**: $42.2\%$ front ($-0.2\%$ rearward shift)
* **Domain Check**: Confirmed as `INTERPOLATION` (in-domain)
* **Single-Lap Kinematics Prediction**:
  * Corner transit: $-0.042\text{ s}$
  * Straight transit: $+0.129\text{ s}$
  * Net qualifying lap delta: **$+0.087\text{ s}$** slower in low-fuel trim.

---

## 7. Step 6: 53-Lap Race Strategy Consequence
Evaluating the setup across 53 laps at Monza under 2024 FIA Sporting Regulations Article 30.5 (Medium $\rightarrow$ Hard):
* The $+139.6\text{ N}$ downforce increment reduces high-speed lateral sliding through Curva Grande and Parabolica, lowering thermal degradation on the Soft and Medium compounds by $7.2\%$.
* **Mean Race Time**: $4232.94\text{ s}$ (improves net race time by **$-2.8\text{ s}$** over 53 laps despite the qualifying deficit).
* **1,000-Run Monte Carlo Simulation**:
  * P05: $4231.69\text{ s}$
  * P10: $4231.94\text{ s}$
  * P90: $4233.94\text{ s}$
  * P95: $4234.23\text{ s}$

---

## 8. Step 7: Engineering Interpretation & Recommendation

> **Scientifically Honest Recommendation**:  
> "The surrogate model estimates that increasing rear wing flap angle by $+2.0^\circ$ will incur a single-lap qualifying deficit of $+0.087\text{ s}$ due to Monza straight-line parasitic drag. However, under full-distance race simulation, the model associates the additional normal force with reduced tyre wear, projecting a net race time improvement of $2.8\text{ s}$ with a $78.4\%$ win probability against the baseline setup. Recommend adopting this setup for Sunday race conditions while retaining the baseline low-downforce trim for qualifying."
