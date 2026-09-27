# ApexIQ
### Motorsport Vehicle Performance & Engineering Decision-Support Platform

[![Python](https://img.shields.io/badge/Python-3.13-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-teal.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.0-cyan.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-148%20Passed-emerald.svg)](backend/tests/)
[![Deterministic](https://img.shields.io/badge/Seed-42871-purple.svg)](docs/REPRODUCIBILITY.md)
[![License](https://img.shields.io/badge/License-MIT-gray.svg)](LICENSE)

---

## 1. Overview

**ApexIQ** is an engineering decision-support platform designed to address the central diagnostic and vehicle setup challenges in modern motorsport data science:

> *"The comparison lap is slower than the reference lap. Where did the lap-time delta originate, which vehicle setup parameters govern that performance phase, and how does adjusting those parameters propagate through aerodynamic forces, vehicle kinematics, and full-distance race strategy uncertainty?"*

Traditional motorsport analysis is frequently fragmented into disconnected silos: trackside engineers inspect raw telemetry traces, aerodynamicists evaluate wind-tunnel and CFD maps, vehicle dynamists run point-mass lap simulations, and race strategists run standalone Monte Carlo models. ApexIQ unifies these disciplines into a coherent, quantitative, and scientifically governed analytical workflow.

The platform deliberately emphasizes scientific honesty and rigorous causality management. Measured observations from telemetry are mathematically isolated from statistical associations, ML surrogate estimates, and physics simulations. Extrapolation detection safeguards alert engineers when setup explorations leave the validated surrogate domain, while 95% Confidence and Prediction Intervals quantify model epistemic and aleatoric uncertainty before operational decisions are reached.

> [!NOTE]  
> **Scientific & Regulatory Disclaimer**: ApexIQ is an independent engineering portfolio project built on synthetic telemetry, synthetic aerodynamic maps, simplified vehicle physics, and synthetic race parameters. It does **NOT** use, imply access to, or represent confidential Formula 1 team telemetry, wind-tunnel maps, or proprietary tyre data.

---

## 2. Analytical Architecture & Workflow

```text
       RAW TELEMETRY (CSV / Parquet)
                    │
                    ▼
     INGESTION & DATA QUALITY ENGINE
  (Validation • Unit Normalization • 1.0 m Spline Resampling)
                    │
                    ▼
    SYNCHRONIZED TELEMETRY WORKSTATION
   (Multi-Lap Alignment • Delta Time • Corner Segmentation)
                    │
                    ▼
       STATISTICAL LAP DECOMPOSITION
   (Phase Attribution • Entry / Apex / Exit • Exact Conservation)
                    │
                    ▼
   SENSITIVITY & SETUP EXPLORATION
  (Local Gradient Jacobians • Candidate Sensitive Parameters)
                    │
                    ▼
   AERO SURROGATE MODEL (HistGBDT)
  (LHS Synthetic DoE • 95% PI Bounds • Extrapolation Inflation)
                    │
                    ▼
  VEHICLE PERFORMANCE SIMULATOR
  (Quasi-Steady Kinematics • Downforce / Drag Trade-Offs)
                    │
                    ▼
   RACE STRATEGY SIMULATION (Monza 53 Laps)
  (FIA Sporting Reg Art 30.5 Compliant • Non-Linear Tyre Degradation)
                    │
                    ▼
 MONTE CARLO UNCERTAINTY PROPAGATION
  (1,000 Iterations • P05 / P50 / P95 Quantiles • Win Probability)
                    │
                    ▼
 ENGINEERING DECISION SUPPORT & MODEL HEALTH
  (Audit Provenance • SHA-256 Hashes • Invariant Health Dashboard)
```

---

## 3. Technology Stack

### Backend & Analytics
* **Python 3.13**: High-performance core runtime.
* **FastAPI**: Asynchronous REST API service layer with strictly typed Pydantic v2 schemas.
* **NumPy & SciPy**: Vectorized quasi-steady lap kinematics, cubic distance spline interpolation, and ODE solvers.
* **scikit-learn**: HistGradientBoostingRegressor, Random Forest, GroupKFold regional holdout validation, and Latin Hypercube Sampling DoE.
* **pytest**: 148 automated invariant, property-based, numerical stability, and security tests.
* **Ruff**: Ultra-fast linting and code style enforcement.

### Frontend & User Interface
* **React 18 & TypeScript**: Strongly typed, high-performance motorsport engineering workstation.
* **Vite**: Rapid development tooling and optimized production bundling.
* **Tailwind CSS**: Dense dark-mode engineering design language inspired by telemetry workstations (Wintax, MoTeC, ATLAS).
* **Lucide React**: Clean technical iconography.
* **ESLint**: Strict code quality verification.

### Data & Infrastructure
* **Parquet & CSV**: High-speed columnar and raw delimited telemetry storage.
* **PostgreSQL (Optional)**: Persistent metadata catalog and session storage via asyncpg.
* **Docker & Docker Compose**: Multi-container containerized deployment (`apexiq-backend`, `apexiq-frontend`, `apexiq-db`).

---

## 4. Quick Start & One-Command Demo

### Prerequisites
* Python 3.11+
* Node.js 18+ and npm
* Git

### Instant Offline Demonstration
Clone the repository and run the end-to-end analytical demonstration in a single command:

```bash
# 1. Clone repository
git clone https://github.com/baleshwarpandit/apexiq.git
cd apexiq

# 2. Run the one-command demonstration
make demo
```

The script will ingest a 500-step synthetic telemetry lap at Monza, execute exact phase decomposition, evaluate aerodynamic surrogate sensitivity, run 1,000 Monte Carlo race simulations, and output a reconciled engineering decision report with full provenance in sub-second execution time.

### Launching the Full Engineering Workstation

#### Backend API Service
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend Workstation Interface
```bash
cd frontend
npm install
npm run dev
```

Open your browser at `http://localhost:5173`. Use function hotkeys (**F1–F12**) to toggle between workstation modules:
* **F1**: Overview & Session Context
* **F2**: Synchronized Telemetry Analysis
* **F3**: Lap-Time Phase Decomposition
* **F5**: Vehicle Performance & Aero Trade-offs
* **F7**: Sensitivity Modeling
* **F8**: Multi-Parameter Setup Optimization
* **F9**: Race Strategy Simulation & Monte Carlo
* **F11**: Model Health & Invariant Verification Dashboard
* **F12**: Cross-Module Decision Support

---

## 5. Technical Documentation & Audits

| Document | Purpose & Description |
| :--- | :--- |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Component architecture, API contracts, data flows, and subsystem boundaries. |
| [ENGINEERING_WORKFLOW.md](docs/ENGINEERING_WORKFLOW.md) | Step-by-step trace of a complete performance diagnostic and setup scenario. |
| [CASE_STUDY.md](docs/CASE_STUDY.md) | In-depth technical case study diagnosing a +0.206 s lap deficit at Monza. |
| [MODEL_CARD.md](docs/MODEL_CARD.md) | Specifications, inputs, training schemas, and limitations for all 6 core models. |
| [DATA_CARD.md](docs/DATA_CARD.md) | Provenance, sampling bounds, and generation methodology for synthetic datasets. |
| [VALIDATION_MATRIX.md](docs/VALIDATION_MATRIX.md) | 10-category verification matrix covering 148 automated invariant tests. |
| [UNIT_AUDIT.md](docs/UNIT_AUDIT.md) | Exhaustive formula audit and SI unit reconciliation across all physical equations. |
| [DATA_LEAKAGE_AUDIT.md](docs/DATA_LEAKAGE_AUDIT.md) | Regional cross-validation holdout architecture and Tests A–D for surrogate overfitting. |
| [REPRODUCIBILITY.md](docs/REPRODUCIBILITY.md) | Determinism guide, `seed: 42871` specification, and SHA-256 canonical hashing. |
| [PERFORMANCE_BENCHMARK.md](docs/PERFORMANCE_BENCHMARK.md) | Actual latency measurements across 1,000 Monte Carlo runs and full pipelines. |
| [LOCAL_SETUP.md](docs/LOCAL_SETUP.md) | Comprehensive local and Docker container deployment guide. |
| [INTERVIEW_ARCHITECTURE.md](docs/INTERVIEW_ARCHITECTURE.md) | Technical Q&A guide for motorsport and data science engineering discussions. |
| [REAL_DATA_MIGRATION.md](docs/REAL_DATA_MIGRATION.md) | Roadmap for migrating from synthetic models to real vehicle and track telemetry. |

---

## 6. Verification & Quality Gates

ApexIQ enforces strict automated quality standards across every commit:

```bash
# Run 148 automated backend tests
pytest backend/tests/ -q

# Run Python linter & code style checks
ruff check backend/app backend/tests

# Run frontend TypeScript static type validation
cd frontend && npm run type-check

# Run frontend ESLint validation
cd frontend && npm run lint

# Build production Vite bundle
cd frontend && npm run build
```

**Quality Status**:
* **Automated Unit & Invariant Tests**: **148 Passed / 0 Failed (100% Pass Rate)**
* **Ruff Code Checks**: Clean (0 errors, 0 warnings)
* **TypeScript Compiler**: Clean (0 errors)
* **ESLint**: Clean (0 errors, 0 warnings)
* **Production Build**: Clean (optimized output in `dist/assets/`)

---

## 7. License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
