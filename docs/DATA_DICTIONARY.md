# ApexIQ Data Dictionary — Core Domain & Telemetry Schema

## 1. Core Canonical Telemetry Channels
All processed telemetry conforms to these standard channel names and engineering units:

| Canonical Channel | Type | Canonical Unit | Typical Aliases | Interpolation Strategy |
| :--- | :--- | :--- | :--- | :--- |
| `timestamp` | `float64` | `s` | `Time`, `timestamp`, `session_time`, `t` | Linear |
| `distance` | `float64` | `m` | `LapDist`, `distance`, `sLap`, `dist` | Spatial Grid Vector |
| `speed` | `float64` | `km/h` | `vCar`, `speed_kph`, `vehicle_speed`, `Speed` | Linear |
| `throttle` | `float64` | `%` | `rThrottlePedal`, `throttle_position`, `aps` | Linear |
| `brake` | `float64` | `%` | `pBrakeF`, `brake`, `brake_pressure`, `Brake` | Linear |
| `gear` | `int32` | `index` | `nGear`, `gear`, `current_gear`, `Gear` | Nearest-Neighbor / Step |
| `rpm` | `int32` | `RPM` | `nEngine`, `rpm`, `engine_rpm`, `EngineSpeed` | Linear |
| `drs` | `int32` | `state` | `drs`, `drs_status`, `drs_active`, `DRS` | Nearest-Neighbor / Step |
| `lateral_acceleration` | `float64` | `G` | `latAccel`, `ay`, `LatG`, `gLat`, `a_y` | Linear |
| `longitudinal_acceleration`| `float64` | `G` | `longAccel`, `ax`, `LongG`, `gLong`, `a_x` | Linear |

## 2. Supported Optional Channels
| Channel | Type | Canonical Unit | Aliases |
| :--- | :--- | :--- | :--- |
| `steering_angle` | `float64` | `deg` | `steer`, `steering`, `handwheel_angle` |
| `wheel_speed_fl` | `float64` | `km/h` | `ws_fl`, `wheelspeed_fl`, `vwheel_fl` |
| `wheel_speed_fr` | `float64` | `km/h` | `ws_fr`, `wheelspeed_fr`, `vwheel_fr` |
| `wheel_speed_rl` | `float64` | `km/h` | `ws_rl`, `wheelspeed_rl`, `vwheel_rl` |
| `wheel_speed_rr` | `float64` | `km/h` | `ws_rr`, `wheelspeed_rr`, `vwheel_rr` |
| `engine_temperature` | `float64` | `degC` | `t_engine`, `engine_temp`, `water_temp` |
| `brake_temperature` | `float64` | `degC` | `t_brake`, `brake_temp`, `disc_temp` |
| `tyre_temperature` | `float64` | `degC` | `t_tyre`, `tyre_temp`, `carcass_temp` |

## 3. Data Lineage Record (`ProcessingRun`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `processing_run_id` | string (UUID) | Unique processing run identifier (`pr-xxxxxxxxxxxx`) |
| `source_file` | string | Original filename uploaded / ingested |
| `source_hash` | string (SHA-256) | 64-character SHA-256 cryptographic digest of the raw source file |
| `processed_at` | string (ISO-8601) | Exact UTC timestamp of pipeline execution |
| `pipeline_version` | string | Ingestion pipeline semantic version (e.g. `2.0.0`) |
| `mapping_version` | string | Configuration version of `channel_mapping.yaml` |
| `status` | string | Processing outcome status (`PASS`, `WARNING`, `FAIL`) |
| `quality_score` | float | Telemetry quality rating ($0.0 - 100.0$) |
| `resampling_resolution` | float | Spatial distance step applied in meters (e.g. `1.0`) |
