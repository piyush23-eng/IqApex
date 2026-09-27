# ApexIQ — Synthetic Data Governance & Dataset Specifications

**Dataset Release**: v1.0.0  
**Data Policy**: Strictly synthetic engineering datasets generated for software verification, architecture demonstration, and data science portfolio presentation.

---

## 1. Synthetic Telemetry Dataset

* **Origin**: Procedural physics generator calibrated to Autodromo Nazionale Monza centerline coordinates.
* **Generation Method**: Forward Euler numerical integration with traction and aerodynamic constraints.
* **Sampling Rate**: Resampled onto a uniform 1.0 m spatial distance grid (5,793 distance steps per lap).
* **Variables**:
  * `time`: Continuous elapsed lap duration [s]
  * `distance`: Cumulative spatial distance along track [m]
  * `speed`: Vehicle velocity [km/h]
  * `throttle`: Throttle application [0–100%]
  * `brake`: Hydraulic line pressure [0–100 bar]
  * `gear`: Transmission ratio [1–8]
  * `rpm`: Engine crankshaft speed [RPM]
  * `drs`: Drag reduction system state [0 or 1]
  * `lat_g`: Lateral acceleration [g]
  * `long_g`: Longitudinal acceleration [g]
* **Intended Use**: Multi-lap alignment, delta calculation, and spatial phase decomposition.
* **Non-Intended Use**: Vehicle component fatigue life analysis or structural stress testing.

---

## 2. Aerodynamic Design of Experiments (DoE) Dataset

* **Origin**: Parametric ground effect and aerofoil stall model evaluated via Latin Hypercube Sampling (LHS).
* **Sample Count**: 500 vehicle configurations across 6 degrees of freedom.
* **Seed**: `42871` (Bitwise reproducible).
* **Variables**:
  * Inputs: `front_wing_angle` (deg), `rear_wing_angle` (deg), `ride_height_front` (mm), `ride_height_rear` (mm), `yaw_angle` (deg), `vehicle_speed` (km/h).
  * Targets: `downforce_n` (N), `drag_n` (N), `lift_to_drag` (-), `aero_balance_pct` (%).
* **Known Limitations**: Synthetic mathematical formulation; does not resolve fluid compressibility or boundary layer separation.

---

## 3. Synthetic Tyre Parameters

* **Origin**: Quadratic degradation model based on public Pirelli compound classifications (Soft C5, Medium C4, Hard C3).
* **Variables**: Compound code, initial peak friction ($\mu_0 \in [1.80, 2.15]$), linear decay rate ($a$), quadratic cliff rate ($b$), thermal sensitivity multiplier ($c$).
* **Limitations**: Does not represent tyre thermal degradation dynamics or graining recovery.

---

## 4. Synthetic Race Scenarios

* **Origin**: 2024 FIA Formula One Sporting Regulations Article 30.5 constraint suite applied to Monza (53 laps, 305 km race distance).
* **Variables**: Lap count, pit stop windows, baseline pit delta ($24.0\text{ s}$ under green flag, $14.5\text{ s}$ under VSC, $11.0\text{ s}$ under Safety Car).
