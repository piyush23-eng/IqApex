# ApexIQ — Stage 6: Vehicle Performance & Aerodynamic Surrogate Modeling

> [!IMPORTANT]
> **Scientific Integrity & Governance:**
> All aerodynamic data in this system is derived from a **Synthetic Engineering Dataset** and evaluated through a **Physics-Based Synthetic Model**. It must NEVER be represented as proprietary Formula 1 CFD, wind-tunnel, vehicle-dynamics, or team data.

---

## 1. Engineering Objective

Stage 6 bridges data science, response surface modeling, and vehicle dynamics:

```
ENGINEERING PARAMETERS
(Front/Rear Wing, Ride Height F/R, Yaw, Speed, Grip, Mass)
          ↓
AERODYNAMIC / VEHICLE RESPONSE
(Dynamic Pressure q = 0.5 * rho * v^2, Ground Effect Decay, Induced Drag)
          ↓
SURROGATE MODEL
(Linear, Polynomial, Random Forest, Gradient Boosting with 5-Fold Spatial CV)
          ↓
UNCERTAINTY
(Epistemic Residual Variance + Domain Extrapolation Penalty + 95% Prediction Interval)
          ↓
PERFORMANCE TRADE-OFF & PARETO FRONTIER
(Maximize Downforce vs Minimize Drag; Dominance Ranking)
          ↓
LAP-TIME CONSEQUENCE
(Monza Track-Segment Model: Lateral Grip Equilibrium + Forward Straight-Line Integration)
```

---

## 2. Parameter Registry & Physical Definitions

Primary variables configured in `backend/app/analytics/synthetic_aero_config.yaml`:

| Parameter | Unit | Range | Step | Default | Source | Description |
|---|---|---|---|---|---|---|
| `front_wing_angle` | deg | [10.0, 35.0] | 0.5 | 18.0 | DIRECT INPUT | Front wing flap angle of attack |
| `rear_wing_angle` | deg | [15.0, 40.0] | 0.5 | 24.0 | DIRECT INPUT | Rear wing mainplane & flap combined angle |
| `ride_height_front`| mm | [25.0, 45.0] | 0.5 | 32.0 | DIRECT INPUT | Front splitter clearance above reference ground plane |
| `ride_height_rear` | mm | [30.0, 60.0] | 0.5 | 42.0 | DIRECT INPUT | Rear diffuser throat clearance |
| `yaw_angle` | deg | [0.0, 6.0] | 0.2 | 1.5 | DIRECT INPUT | Vehicle aerodynamic slip angle |
| `vehicle_speed` | km/h | [80.0, 355.0] | 5.0 | 250.0 | DIRECT INPUT | Freestream velocity |
| `tyre_grip` | scalar | [1.40, 2.10] | 0.02 | 1.75 | DIRECT INPUT | Tyre friction coefficient $\mu$ |
| `mass` | kg | [798.0, 850.0] | 1.0 | 810.0 | DIRECT INPUT | Car mass including driver and fuel |

---

## 3. Physical Models & Kinematics

### 1. Dynamic Pressure & Aerodynamic Forces
$$q = \frac{1}{2} \rho v^2$$
$$D = q \cdot S \cdot C_l$$
$$F_{\text{drag}} = q \cdot S \cdot C_d$$
Where:
- $\rho = 1.225\text{ kg/m}^3$ (standard sea-level atmospheric air density)
- $S = 1.60\text{ m}^2$ (frontal/planform aerodynamic reference area)
- $C_l = C_{l,\text{front}} + C_{l,\text{rear}} + C_{l,\text{floor}}$
- $C_d = C_{d,0} + k \cdot C_l^2$ (parasite drag + induced drag)

### 2. Underfloor Ground Effect Suction
Peak suction occurs at an optimal ride height ($h_0 = 30.0\text{ mm}$), decaying exponentially as ride height deviates:
$$\eta_{\text{ground}} = \exp\left(-\gamma \cdot |h_f - h_0|\right)$$
With an aerodynamic rake expansion benefit ($h_r - h_f$).

### 3. Cornering Lateral Grip Equilibrium
For each corner complex with curvature radius $R$:
$$F_{\text{lat},\max} = \mu \cdot (m g + D(v))$$
Equating centrifugal force $\frac{m v^2}{R}$ with lateral grip yields:
$$v_{\text{corner},\max} = \sqrt{\frac{\mu \cdot m \cdot g}{\frac{m}{R} - \mu \cdot \frac{1}{2} \rho S C_l}}$$
$$a_{\text{lat},\max} = \frac{F_{\text{lat},\max}}{m}$$

### 4. Straight-Line Forward Numerical Integration
Along each straight segment, net longitudinal force is integrated using forward Euler steps ($dt = 50\text{ ms}$):
$$F_{\text{drive}}(v) = \min\left(\frac{P \cdot \eta_{\text{drive}}}{v}, F_{\text{traction},\max}\right)$$
$$F_{\text{net}} = F_{\text{drive}}(v) - F_{\text{drag}}(v) - F_{\text{rolling}}$$
$$a = \frac{F_{\text{net}}}{m}$$
