# ApexIQ — 3 to 5 Minute Technical Demonstration Script

**Target Audience**: Motorsport Engineers, Technical Directors, Senior Data Scientists.  
**Tone**: Direct, quantitative, scientifically honest. No marketing exaggeration.

---

### [0:00 – 0:30] Introduction & Platform Context
* *"Good morning. Today I am demonstrating **ApexIQ**, an engineering decision-support platform designed to solve a core performance diagnostic challenge in motorsport: when a comparison lap is slower than a reference, where does the deficit originate, which setup parameters govern that loss, and how does adjusting them propagate through aerodynamics, vehicle dynamics, and full race strategy uncertainty?"*
* *"To maintain total scientific integrity, ApexIQ is built on synthetic telemetry and physics-based surrogate models rather than claiming access to confidential team data. The focus is purely on the data engineering, modeling rigor, and decision architecture."*

### [0:30 – 1:15] Telemetry Workstation & Spatial Alignment (F2)
* *"Here in the Telemetry Workstation (**F2**), we inspect two laps from Friday practice at Monza."*
* *"Notice that raw time-domain logs have been normalized and resampled onto a continuous 1.0-meter spatial distance grid along the track centerline using SciPy cubic splines. This ensures speed deltas and continuous time deltas $\Delta t(s)$ are compared at the exact same physical coordinates regardless of vehicle velocity."*
* *"We see a total deficit of **+0.206 s**, with the comparison lap losing speed through Turn 1 and the Variante Ascari."*

### [1:15 – 2:00] Quantitative Lap-Time Phase Decomposition (F3)
* *"Instead of relying on subjective driver debriefs, we switch to Lap Analysis (**F3**)."*
* *"The system classifies every meter into discrete physical phases: Braking, Cornering, Acceleration, and Straight."*
* *"Notice the exact conservation: Cornering accounts for +0.108 s (52.4% of total loss), Acceleration accounts for +0.052 s, Braking +0.031 s, and Straight +0.015 s. The reconciliation residual is 0.0000 s—every millisecond is accounted for."*

### [2:00 – 2:45] Sensitivity & Aerodynamic Surrogate What-If (F5 / F7)
* *"In Sensitivity (**F7**), local parameter Jacobians identify `rear_wing_angle` ($-0.024\text{ s/deg}$) as a primary candidate to recover mid-corner lateral grip."*
* *"Moving to Vehicle Performance (**F5**), we evaluate a what-if: increasing the rear wing flap from 24° to 26° (+2.0°)."*
* *"Our HistGradientBoosting surrogate model predicts a $+139.6\text{ N}$ downforce gain at a $+0.4\text{ N}$ drag penalty. Notice the domain guard: because the query sits inside our Latin Hypercube bounds, it is validated as `INTERPOLATION`. The system provides both 95% Confidence and Prediction intervals."*

### [2:45 – 3:30] Full-Distance Strategy & 1,000-Run Monte Carlo (F9)
* *"In qualifying trim, that extra downforce actually slows the car by $+0.087\text{ s}$ due to Monza's long straights. In a traditional siloed workflow, an engineer might reject the change here."*
* *"However, in Strategy (**F9**), we propagate this setup into our 53-lap race simulation under 2024 FIA Sporting Regulations Article 30.5."*
* *"The extra normal force reduces tyre scrub through Parabolica, lowering degradation by 7.2%. In full race trim, the 1-Stop Medium $\rightarrow$ Hard strategy gains **2.8 seconds**."*
* *"Our vectorized Monte Carlo engine executes 1,000 simulated races in **22.8 ms**, demonstrating a 78.4% win probability against the baseline setup."*

### [3:30 – 4:15] Engineering Decision Support & Invariant Health (F11 / F12)
* *"In Decision Support (**F12**), all findings are synthesized into a coherent recommendation with strict evidence tagging: `OBSERVED` telemetry, `MODELLED` responses, and `SIMULATED` race outcomes."*
* *"Finally, under Model Health (**F11**), engineers can verify system health: 148 automated physical invariant tests, mathematical confirmation that $q(2v) = 4q(v)$, deterministic reproducibility under `seed: 42871`, and zero data leakage."*

### [4:15 – 4:45] Conclusion
* *"To summarize: the goal of ApexIQ is not to pretend to predict an actual F1 Grand Prix. The objective is to demonstrate a production-quality, reproducible workflow for transforming raw telemetry and engineering parameters into quantified, risk-aware decision support."*
