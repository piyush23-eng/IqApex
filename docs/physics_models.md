# ApexIQ Physics & Mathematical Specification

This document details the governing equations, aerodynamic invariants, and physical models enforced throughout the ApexIQ vehicle dynamics and telemetry platform.

---

## 1. Aerodynamic Response Surfaces

Downforce and aerodynamic drag scale quadratically with vehicle airspeed $v$:

$$F_{\text{downforce}}(v) = \frac{1}{2} \rho v^2 S C_L(\alpha_{\text{front}}, \alpha_{\text{rear}}, h_{\text{front}}, h_{\text{rear}})$$

$$F_{\text{drag}}(v) = \frac{1}{2} \rho v^2 S C_D(\alpha_{\text{front}}, \alpha_{\text{rear}}, h_{\text{front}}, h_{\text{rear}})$$

Where:
- $\rho = 1.225 \text{ kg/m}^3$ (Standard ambient air density at sea level)
- $S \approx 1.60 \text{ m}^2$ (Effective frontal area)
- $\alpha_{\text{front}}, \alpha_{\text{rear}}$ are the front and rear wing flap angles in degrees
- $h_{\text{front}}, h_{\text{rear}}$ are dynamic front and rear ride heights in millimeters

### Aerodynamic Balance (Center of Pressure)
The Center of Pressure (CoP) aero balance determines high-speed handling neutrality:

$$\text{AeroBalance}_{\text{front}} = \frac{F_{z,\text{front}}}{F_{z,\text{front}} + F_{z,\text{rear}}} \times 100\%$$

---

## 2. Non-Linear Tyre Degradation Model

ApexIQ models Pirelli tyre wear using a two-stage thermal-mechanical wear equation:

$$\Delta t_{\text{wear}}(N) = \beta_1 N + \beta_2 N^2 + \epsilon_N$$

Where:
- $N$ is stint tyre age in completed laps
- $\beta_1$ represents base mechanical rubber shear loss ($\approx 0.088\text{ s/lap}$)
- $\beta_2$ models thermal graining and blistering runaway ($> 0$)
- $\epsilon_N \sim \mathcal{N}(0, \sigma^2)$ captures driver pace scatter and traffic interference

---

## 3. Spatial Distance Resampling Integration

To eliminate clock desynchronization between laps of different duration, telemetry channels $y(t)$ are resampled onto an invariant spatial coordinate $s \in [0, L_{\text{circuit}}]$ with uniform $\Delta s = 1.0\text{ m}$:

$$s(t) = \int_0^t v(\tau) d\tau$$

Time delta accumulation is computed along the spatial domain:

$$\Delta t(s) = \int_0^s \left(\frac{1}{v_{\text{comp}}(\xi)} - \frac{1}{v_{\text{ref}}(\xi)}\right) d\xi$$

This ensures that corner entry, apex minimum velocity, and throttle pickup points align with millimetric precision across laps.
