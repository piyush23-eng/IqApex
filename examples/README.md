# ApexIQ — Demonstration Dataset & Configurations

**Scope**: Offline reproducible engineering demonstration files.  
**Provenance**: Strictly synthetic data generated for software validation and portfolio review.  
**Disclaimer**: NOT real F1 team telemetry, wind-tunnel measurements, or confidential race data.

---

## 1. Directory Structure

```text
examples/
├── telemetry/
│   ├── reference_lap.csv            # 500-step canonical reference lap at Autodromo Nazionale Monza
│   └── comparison_lap.csv           # 500-step comparison lap showing entry/apex speed deltas
├── configurations/
│   └── monza_low_drag_setup.json    # Baseline vs Scenario vehicle aerodynamic & kinematic parameters
├── strategy/
│   └── monza_race_strategy.json     # Regulation-constrained 1-stop vs 2-stop strategy parameters (53 laps)
└── expected_outputs/
    └── monza_analysis_expected.json # Target reconciliation residuals, sensitivity deltas, and MC quantiles
```

---

## 2. Telemetry Generation & Channel Mapping

The example telemetry files represent 100 Hz logged channels:
* `Time`: Lap elapsed time (seconds)
* `LapDist`: Lap spatial distance along track centerline (meters)
* `vCar`: GPS/wheel-speed velocity (km/h)
* `rThrottlePedal`: Throttle pedal position [0, 100%]
* `pBrakeF`: Hydraulic brake system pressure [0, 100 bar]
* `nGear`: Engaged transmission gear ratio [1–8]
* `nEngine`: Internal combustion engine crankshaft speed [RPM]
* `DRS`: Drag Reduction System state [0: Closed, 1: Open]
* `latAccel`: Measured body lateral acceleration [g]
* `longAccel`: Measured body longitudinal acceleration [g]

The comparison lap demonstrates a synthetic **+0.206 s** lap deficit originating primarily in T1 (Variante del Rettifilo) braking and T4 (Curva Grande) apex transit.

---

## 3. How to Run the Demo Workflow

From the repository root, simply execute:
```bash
make demo
```
This executes the end-to-end analytical pipeline on this sample dataset and prints the reconciled phase breakdown, surrogate prediction interval, and Monte Carlo uncertainty.
