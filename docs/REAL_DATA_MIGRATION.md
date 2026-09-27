# ApexIQ — Migration Architecture for Real Motorsport Data

**Objective**: Provide a transparent engineering roadmap detailing how ApexIQ transitions from synthetic demonstration datasets to real trackside telemetry and vehicle parameters.

---

## 1. Migration Architecture Overview

ApexIQ was purposefully designed around decoupled adapters and abstract base classes. Replacing synthetic data with real team data requires zero changes to the downstream decomposition, sensitivity, or UI workstation layers:

```text
SYNTHETIC TELEMETRY                    REAL MOTORSPORT SOURCE
         │                                       │
         ▼                                       ▼
[Synthetic Generators]                 [Real Format Adapters]
                                       - ATLAS .ssm / .rec binary adapter
                                       - Cosworth Toolbox / MoTeC .ld adapter
                                       - Direct CAN-bus / MQTT trackside stream
                                                 │
                                                 ▼
                                     [Canonical Channel Mapping]
                                                 │
                                                 ▼
                                    [Sensor Calibration Layer]
                                       - Zero-offset correction
                                       - Filtering (Butterworth low-pass)
                                                 │
                                                 ▼
                                     [Spatial Resampling (1.0 m)]
                                                 │
                                                 ▼
                                    [Downstream Analytical Engines]
```

---

## 2. Component Migration Checklist

| System Component | Current Synthetic Implementation | Real-Data Migration Requirements | Recalibration Scope |
| :--- | :--- | :--- | :--- |
| **Telemetry Ingestion** | CSV and Parquet format adapters | Implement binary C++ / Python wrappers for ATLAS `.ssm` or MoTeC `.ld` | None required downstream; outputs canonical Pydantic models. |
| **Track Centerline** | Synthetic Monza track profile | High-accuracy DGPS or LiDAR track centerline mapping ($\pm 0.05\text{ m}$) | Recalibrate spatial distance spline grid and corner sector markers. |
| **Aero Surrogate** | LHS on synthetic analytical formulas | Ingest actual wind-tunnel or CFD aero maps ($\sim 2,000$ run matrices) | Retrain GBDT regressor; recalibrate feature bounds and confidence intervals. |
| **Vehicle Kinematics** | Single-track point mass model | Multi-body vehicle dynamics (CarMaker / Dymola / Adams) co-simulation | Ingest real suspension stiffness, roll centers, and aero-elastic deflections. |
| **Tyre Degradation** | Empirical quadratic wear formula | Fit Pacejka '96 / MF-Tyre or physical thermomechanical tyre models | Calibrate against trackside infrared pyrometer tyre temperature feeds. |
| **Strategy Simulation** | Static pit loss and weather models | Live pit lane timing loops, GPS sector telemetry, and radar weather feeds | Connect real-time weather radar and dynamic safety car transition matrices. |

---

## 3. Data Governance & Licensing Isolation

When migrating to real data, strict intellectual property barriers must be enforced:
* Real team setup parameters and telemetry must be stored in encrypted, tenant-isolated databases.
* The API layer must enforce cryptographic role-based access control (RBAC) ensuring telemetry is accessible only to authorized engineering personnel.
