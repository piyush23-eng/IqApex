# Lap-Time Decomposition Methodology

## 1. Overview and Core Philosophy

In professional vehicle performance engineering, comparing two laps requires answering:
> *"The comparison lap is slower (or faster) than the reference. Where did the lap-time difference originate, and how much difference was accumulated in each distinct performance phase?"*

ApexIQ decomposes lap time strictly through **measured kinematics and spatial accumulation**. The system adheres to the core engineering principle:

$$\text{From Measured Telemetry} \longrightarrow \text{To Measured Performance Decomposition}$$

Subjective statements (e.g. *"driver missed apex"*, *"driver braked too late"*, *"poor setup"*) are strictly avoided. Instead, ApexIQ computes reproducible, traceable numbers:
* *"T1–T2 entry delta was $+0.045\,\text{s}$, apex delta was $+0.082\,\text{s}$ (divergence: $+0.037\,\text{s}$ during braking/turn-in), and exit delta was $+0.071\,\text{s}$ (gain: $-0.011\,\text{s}$ on throttle application)."*

---

## 2. Spatial Resampling and Coordinate Alignment

To perform phase integration independently of vehicle speed differences, raw time-series telemetry is resampled onto a uniform 1.0-meter spatial distance grid $s \in [0, S_{\text{track}}]$:

$$\Delta s = 1.0\,\text{m}$$

For each meter $s_i$, vehicle speed $v(s_i)$ is determined via monotonic cubic Hermite / linear interpolation. The elapsed time differential for traversing step $i$ is:

$$\mathrm{d}t(s_i) = \frac{\Delta s}{v(s_i)}$$

The continuous lap delta between comparison and reference laps is:

$$\Delta t(s) = t_{\text{comp}}(s) - t_{\text{ref}}(s) = \sum_{k=0}^{s} \left( \frac{\Delta s}{v_{\text{comp}}(k)} - \frac{\Delta s}{v_{\text{ref}}(k)} \right)$$

---

## 3. Physical Phase Segmentation

Each 1.0-meter spatial cell is classified into one of four mutually exclusive physical performance phases or an unassigned micro-transition cell:

| Phase | Classification Criteria | Physical Interpretation |
| :--- | :--- | :--- |
| **Braking** | $a_x < -2.0\,\text{m/s}^2$ and $p_{\text{brake}} > 10.0\,\text{bar}$ | Straight-line threshold braking and initial trail-braking deceleration |
| **Cornering** | $\|a_y\| \ge 1.5\,\text{m/s}^2$ | Lateral acceleration limit, turn-in, apex commitment, and lateral scrub |
| **Acceleration** | $a_x > 0.5\,\text{m/s}^2$ and $\text{Throttle} > 50.0\%$ | Longitudinal traction phase out of corner apex to track-out |
| **Straight** | $\|a_y\| < 1.0\,\text{m/s}^2$ and $v \ge 250.0\,\text{km/h}$ | Aerodynamic top speed, DRS deployment, drag vs. power delivery |

Contiguous meters satisfying identical criteria are grouped into segments $[s_{\text{start}}, s_{\text{end}}]$.

---

## 4. Zero-Hidden Residual Reconciliation

In numerical integration across physical boundaries, rounding, boundary transitions, and micro-throttle modulations produce small discrepancies between total lap delta and the sum of phase segments.

**ApexIQ rejects artificial forced closure.** Many commercial tools force phase numbers to add up to the total delta by silently spreading the error. ApexIQ explicitly reports:

$$\text{Residual} = \Delta T_{\text{total}} - \sum_{k \in \{\text{braking, cornering, accel, straight}\}} \Delta T_{k}$$

* **Residual Transparency**: Both the absolute residual ($\Delta t_{\text{residual}}$ in seconds) and the relative proportion ($\%$) are displayed.
* **Engineering Purpose**: Residuals above $0.05\,\text{s}$ indicate transition-zone hunting, unusual sensor jitter, or coasting outside defined thresholds.

---

## 5. Corner Time Growth & Phase Divergence

Every circuit corner $[s_{\text{entry}}, s_{\text{exit}}]$ with geometric apex $s_{\text{apex}}$ is decomposed into two operational zones:

1. **Entry-to-Apex Divergence ($\Delta t_{\text{entry}\rightarrow\text{apex}}$)**:
   $$\Delta t_{\text{entry}\rightarrow\text{apex}} = \Delta t(s_{\text{apex}}) - \Delta t(s_{\text{entry}})$$
   *Positive value*: Comparison lap lost time during the braking and turn-in phase.
   *Negative value*: Comparison lap gained time into the corner.

2. **Apex-to-Exit Divergence ($\Delta t_{\text{apex}\rightarrow\text{exit}}$)**:
   $$\Delta t_{\text{apex}\rightarrow\text{exit}} = \Delta t(s_{\text{exit}}) - \Delta t(s_{\text{apex}})$$
   *Positive value*: Comparison lap lost time during throttle pickup and traction out of the corner.
   *Negative value*: Comparison lap gained time on corner exit.

3. **Total Corner Delta**:
   $$\Delta t_{\text{corner}} = \Delta t(s_{\text{exit}}) - \Delta t(s_{\text{entry}})$$

---

## 6. Sector Decomposition & Reconciliation

For each official timing sector $S_m = [s_{m, \text{start}}, s_{m, \text{end}}]$:

$$\Delta T_{S_m} = \Delta t(s_{m, \text{end}}) - \Delta t(s_{m, \text{start}})$$

The sector delta is reconciled against:
$$\Delta T_{S_m} = \sum_{c \in \text{Corners}(S_m)} \Delta t_c + \Delta T_{\text{straight}, S_m} + \text{Residual}_{S_m}$$

This guarantees total traceability across telemetry channels, track segments, sectors, and the full lap.

---

## 7. Reference Selection Methodology

ApexIQ supports four deterministic reference baseline methodologies:

1. **Selected Lap (`selected_lap`)**: Specific engineer-selected baseline lap (e.g. `lap-demo-02`).
2. **Session Best Valid (`session_best_valid`)**: Fastest valid lap recorded across all drivers in the session.
3. **Driver Best Valid (`driver_best_valid`)**: Fastest valid lap recorded by the comparison lap's driver.
4. **Session Median Valid (`median_valid`)**: Lap whose total time is closest to the session median, representing central tendency pace.
