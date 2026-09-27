# ApexIQ Data Dictionary — Core Domain Objects

## 1. Session
| Field | Type | Description |
| :--- | :--- | :--- |
| `session_id` | string (UUID/slug) | Unique identifier for the track session |
| `event_name` | string | Official Grand Prix or test event designation |
| `circuit` | string | Track name |
| `session_type` | string | FP1, FP2, FP3, Q, SQ, R |
| `date` | string (ISO-8601) | Date of session occurrence |
| `weather` | string | Ambient conditions description |
| `track_temperature` | float (°C) | Track surface thermal reading |

## 2. Driver
| Field | Type | Description |
| :--- | :--- | :--- |
| `driver_id` | string | Unique driver identifier |
| `name` | string | Driver full name |
| `team` | string | Constructor team name |
| `car_number` | integer | Vehicle competition number |

## 3. Run
| Field | Type | Description |
| :--- | :--- | :--- |
| `run_id` | string | Track outing identifier |
| `session_id` | string | Parent session foreign key |
| `driver_id` | string | Driver foreign key |
| `compound` | string | Tyre compound specification (e.g., C3, C4, INTERMEDIATE) |
| `tyre_age` | integer | Total laps completed on current tyre set |
| `run_type` | string | Outing classification (Installation, Aero Test, Long Run, Quali Sim) |
| `start_time` | string (ISO-8601) | Run pit lane exit timestamp |
| `end_time` | string (ISO-8601) | Run pit lane entry timestamp |

## 4. Lap
| Field | Type | Description |
| :--- | :--- | :--- |
| `lap_id` | string | Unique lap identifier |
| `run_id` | string | Parent run foreign key |
| `lap_number` | integer | Stint lap counter index |
| `lap_time` | float (s) | Elapsed lap time |
| `sector_1` | float (s) | Sector 1 split time |
| `sector_2` | float (s) | Sector 2 split time |
| `sector_3` | float (s) | Sector 3 split time |
| `valid` | boolean | Track limits and marshaling legality flag |

## 5. TelemetryPoint
| Field | Type | Units | Physical Bounds |
| :--- | :--- | :--- | :--- |
| `timestamp` | float | seconds (s) | Monotonically increasing |
| `distance` | float | meters (m) | [0, Circuit Length] |
| `speed` | float | km/h | [0.0, 395.0] |
| `throttle` | float | % | [0.0, 100.0] |
| `brake` | float | % / bar | [0.0, 150.0] |
| `gear` | integer | index | [-1, 8] |
| `rpm` | integer | rev/min | [0, 16000] |
| `drs` | integer | state | {0, 1} |
| `lateral_acceleration` | float | g ($9.81\text{ m/s}^2$) | [-6.5, 6.5] |
| `longitudinal_acceleration` | float | g ($9.81\text{ m/s}^2$) | [-6.5, 3.5] |

## 6. Corner
| Field | Type | Description |
| :--- | :--- | :--- |
| `corner_id` | string | Unique corner identifier (e.g., T1, T2) |
| `name` | string | Official corner nomenclature |
| `entry_distance` | float (m) | Braking / initiation distance marker |
| `apex_distance` | float (m) | Geometric/kinematic minimum speed point |
| `exit_distance` | float (m) | Corner exit / full throttle resumption distance |
| `entry_speed` | float (km/h) | Speed at entry marker |
| `minimum_speed` | float (km/h) | Speed at apex |
| `exit_speed` | float (km/h) | Speed at exit marker |
| `braking_point` | float (m) | Initial brake application distance |
| `throttle_application` | float (m) | Initial throttle pickup distance |
