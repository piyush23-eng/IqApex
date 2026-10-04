# ApexIQ Telemetry Channel Specification & Data Dictionary

Comprehensive protocol specification for high-frequency telemetry channels streamed from the electronic control unit (ECU) and data acquisition logger.

---

## 1. Core Kinematic & Dynamic Channels

| Channel Key | Physical Name | Unit | Sample Rate | Valid Range | Sign Convention |
|---|---|---|---|---|---|
| `speed` | Vehicle Ground Speed | $\text{km/h}$ | 100 Hz | $[0.0, 375.0]$ | Always $\ge 0$ |
| `throttle` | Throttle Pedal Position | $\%$ | 100 Hz | $[0.0, 100.0]$ | $0 = \text{idle}, 100 = \text{WOT}$ |
| `brake` | Hydraulic Brake Line Pressure | $\text{bar}$ | 100 Hz | $[0.0, 140.0]$ | Threshold $> 10\text{ bar}$ |
| `gear` | Selected Transmission Ratio | integer | 50 Hz | $[1, 8]$ | Neutral / Reverse filtered |
| `rpm` | Internal Combustion Engine RPM | $\text{rpm}$ | 100 Hz | $[4000, 15000]$ | Internal rev limit: 15,000 |
| `drs` | Drag Reduction System Status | binary | 50 Hz | $\{0, 1\}$ | $1 = \text{DRS Wing Open}$ |
| `lat_acc` | Lateral Acceleration ($a_y$) | $g$ | 100 Hz | $[-5.5, +5.5]$ | Positive = Right turn |
| `long_acc` | Longitudinal Acceleration ($a_x$) | $g$ | 100 Hz | $[-5.8, +2.5]$ | Negative = Braking, Positive = Acceleration |
| `steering_angle` | Steering Hand Wheel Angle | $\text{deg}$ | 100 Hz | $[-180.0, +180.0]$ | Positive = Right lock |

---

## 2. Spatial Resampling Schema

Telemetry records persisted to Parquet format undergo uniform distance-domain resampling at $\Delta s = 1.0\text{ meter}$.

### Discretization Protocol
- **Spatial Step**: $\Delta s = 1.0 \text{ m} \pm 0.001\text{ m}$
- **Interpolation Scheme**: Monotonic Cubic Hermite Spline (`PchipInterpolator`) to prevent artificial overshoot around braking thresholds.
- **Reference Zero**: Start-Finish timing beacon transponder center ($s = 0.0\text{ m}$).
