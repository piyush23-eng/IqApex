# ApexIQ — Motorsport Vehicle-Performance Engineering Platform

ApexIQ is an internal engineering workstation and telemetry analytics platform engineered for trackside and factory performance engineers operating in high-downforce single-seater and prototype motorsport categories (Formula 1, WEC Hypercar, Formula 2).

The platform provides a dedicated computational environment for time-series telemetry analysis, vehicle dynamics parameter estimation, corner kinematic decomposition, and setup sensitivity optimization.

---

## 1. Engineering Problem Scope

Trackside performance engineering requires processing high-frequency sensor channels (100 Hz to 1 kHz logging across 200+ vehicle channels) to evaluate:
- Aerodynamic balance, downforce-to-drag metrics, and ride height sensitivity.
- Tyre thermal states, contact patch energy dissipation, and compound degradation rate.
- Kinematic corner phases (braking point, trail braking, apex velocity, throttle pickup progression).
- Driver-to-driver and lap-to-lap delta decomposition (distance-aligned telemetry traces).

Existing commercial tools (e.g., McLaren ATLAS, MoTeC i2 Pro, Cosworth Pi Toolbox, Marelli WinTAX) excel at low-level channel inspection but frequently lack modern, modular pipelines for integrating Python-based vehicle performance models, automated statistical data validation, and distributed cloud/trackside workflows. ApexIQ provides this bridge.

---

## 2. System Architecture

ApexIQ enforces strict multi-tier isolation between data ingestion, validation, analytical processing, and client presentation:

```
[Vehicle Logger / Trackside Stream / Historic Data Store]
                          │
                          ▼
           [Data Ingestion Subsystem]
                          │
                          ▼
          [Data Quality & Validation Engine] 
             ├── Out-of-bounds rejection
             ├── Monotonic timestamp enforcement
             ├── Sampling jitter / gap detection
             └── Telemetry discontinuity alerts
                          │
                          ▼
             [Feature Engineering Layer]
             ├── Distance-based alignment (spatial resampling)
             ├── Corner segment identification
             └── Differential calculations (accel, slip angle)
                          │
                          ▼
        [Performance Models & Analytics Layer]
             ├── Kinematic / Dynamics estimators
             ├── Aero balance mapping
             └── Tyre thermal degradation models
                          │
                          ▼
               [Simulation & Optimization]
             ├── Optimal lap time simulations
             └── Gear ratio / suspension sweep optimizers
                          │
                          ▼
                   [FastAPI Service]
             ├── Strict Pydantic v2 schemas
             ├── Decimation / downsampling engine (LTTB)
             └── Server-side cache
                          │
                          ▼
         [React Desktop Engineering Workstation]
             ├── 1920x1080 / 1440x900 responsive layout
             ├── High-density dark telemetry palette
             ├── Synchronized spatial telemetry graphs
             └── Zero client-side business logic
```

### Architectural Separation Guarantees
- **Frontend / Backend Boundary**: The React UI performs zero domain modeling, filtering, or numerical optimization.
- **Analytics / Presentation Boundary**: Analytics and machine learning modules possess no knowledge of charts, DOM, or rendering APIs.
- **Data Ingestion / Modeling Boundary**: Ingestion sanitizes and validates raw streams; downstream models only receive data with validated `DataQualityResult` contracts.

---

## 3. Technology Stack

### Backend
- **Language**: Python 3.13 / 3.12 with full type annotations.
- **Framework**: FastAPI (high-throughput asynchronous REST endpoints).
- **Validation**: Pydantic v2 (domain-level schema enforcement).
- **Numerical & Scientific Computing**:
  - `NumPy`: Vectorized channel manipulation and matrix operations.
  - `Pandas`: Relational time-series indexing and interval slicing.
  - `SciPy`: Signal filtering (Butterworth, Savitzky-Golay), spatial interpolation, numerical optimization.
  - `scikit-learn`: Linear and non-linear regression for aerodynamic balance fits.
- **Database**: PostgreSQL 16 with schema prepared for continuous time-series logging.
- **Test Framework**: `pytest` and `httpx`.

### Frontend
- **Framework**: React 18 with Vite build pipeline.
- **Type System**: TypeScript (strict mode enabled, zero implicit `any`).
- **Styling**: Tailwind CSS configured with a low-strain, dark neutral workstation palette.
- **Charting**: Plotly.js / engineering-grade canvas renderers.
- **Component Icons**: Lucide React.

### Infrastructure & Tooling
- **Containerization**: Docker Compose (`db`, `backend`, `frontend`).
- **Formatting & Linting**: ESLint, Prettier, Ruff.

---

## 4. Current Development Stage: Foundation (Stage 1)

This repository currently implements **Stage 1 (Platform Foundation)**:
- Core domain schemas (`Session`, `Driver`, `Run`, `Lap`, `TelemetryPoint`, `Corner`) synchronized across Python and TypeScript.
- Data Quality Validation engine (`DataQualityResult`) identifying timestamp anomalies, discontinuities, and physical threshold violations.
- REST API foundation exposing health, sessions, runs, laps, and telemetry queries.
- Desktop-first engineering workstation shell featuring:
  - Persistent Engineering Context Bar (Session, Circuit, Driver, Run, Tyre, Reference, Data Status).
  - Compact left navigation with full module taxonomy.
  - Overview workspace containing structural placeholders for upcoming analytical modules.
  - System status and diagnostics bar.
- Test coverage for API routes and quality evaluation logic.

---

## 5. Data Philosophy & Integrity

A core tenet of ApexIQ is strict data integrity:
1. **No Silent Extrapolation**: When sensor channels suffer dropouts or noise exceeding tolerances, the system explicitly flags warnings rather than interpolating silently.
2. **Deterministic Processing**: All downsampling algorithms (e.g., Largest Triangle Three Buckets or Min-Max decimation) are deterministic and preserve extreme values (peak lateral acceleration, minimum apex speed, peak brake pressure).
3. **Audit Trail**: Every analyzed lap retains its raw data quality report detailing missing percentages and invalid intervals.

---

## 6. Synthetic vs. Real Telemetry Boundary

To ensure engineering credibility, ApexIQ enforces a clear boundary between real telemetry and synthetic test datasets:
- **No Fabricated Realism**: Modules do not generate random fluctuations and label them as live car data.
- **Explicit Labeling**: Where synthetic or simulation datasets are loaded for verification or demonstration, all API responses and UI headers explicitly state:
  `"Synthetic demonstration dataset"`
- **Uninitialized State**: In the absence of an ingested dataset, analytical modules display uninitialized states (`"Waiting for telemetry"`, `"No analysis available"`) rather than dummy numbers.

---

## 7. Planned Analytical Modules (Roadmap)

Following the Stage 1 foundation, the subsequent analytical engines will be introduced:
1. **Telemetry & Lap Trace Engine**: High-frequency multi-channel spatial viewer (Speed, Throttle, Brake, Gear, RPM, Lateral/Longitudinal G, Steering Angle) synchronized across multiple driver laps.
2. **Corner Kinematic Decomposition**: Automated segmentation of braking, turn-in, apex, and throttle application phases with corner-by-corner delta tables.
3. **Tyre Degradation & Thermal Analysis**: Surface vs. carcass temperature estimation, degradation slope calculation, and stint longevity projections.
4. **Aerodynamic Map Regression**: Ride height sensitivity modeling ($C_L$ and $C_D$ surfaces across front/rear ride height envelopes).
5. **Driver Comparison & Friction Circle**: $G-G$ diagram overlay, velocity differential traces, and driving style envelope comparison.
6. **Lap Time Simulation & Sensitivity**: Quasi-static point-mass and bicycle model solvers for setup sensitivity analysis ($d\text{LapTime}/d\text{Balance}$, $d\text{LapTime}/d\text{Wing}$).

---

## 8. Development Setup

### Prerequisites
- Node.js >= 20.x
- Python >= 3.12 (Python 3.13 recommended)
- Docker & Docker Compose (optional for local standalone run)

### Running Locally

#### 1. Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Backend API will be accessible at `http://localhost:8000`. Swagger documentation is available at `http://localhost:8000/docs`.

#### 2. Frontend
```bash
cd frontend
npm install # or pnpm install
npm run dev
```
Workstation interface will be accessible at `http://localhost:5173`.

### Running with Docker Compose
```bash
docker-compose up --build
```
