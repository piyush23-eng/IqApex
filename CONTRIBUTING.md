# Contributing to ApexIQ

Thank you for your interest in contributing to **ApexIQ**! We welcome contributions that improve algorithmic performance, analytical rigor, documentation clarity, and test coverage.

---

## 1. Development Principles & Code Standards

* **Scientific Integrity**: ApexIQ strictly uses synthetic engineering datasets. Never submit PRs containing proprietary, confidential, or copyrighted Formula 1 team telemetry or wind-tunnel data.
* **Non-Causal Language**: Do not introduce causal phrasing in analytical modules. Use *"associated with"*, *"modelled response"*, and *"estimated by surrogate"*.
* **SI Unit Compliance**: All physical calculations must operate internally on SI units ($\text{m}$, $\text{m/s}$, $\text{N}$, $\text{kg}$, $\text{Pa}$, $\text{rad}$ or $\text{deg}$). Conversions to engineering display units occur explicitly at API serialization boundaries.
* **Deterministic Reproducibility**: All stochastic components must support an explicit `random_seed` argument (default: `42871`).

---

## 2. Setting Up Your Development Environment

```bash
# 1. Fork and clone the repository
git clone https://github.com/<your-username>/apexiq.git
cd apexiq

# 2. Setup backend virtual environment
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 3. Setup frontend dependencies
cd ../frontend
npm install
```

---

## 3. Pull Request Quality Checklist

Before submitting a Pull Request, verify that all quality gates pass:

```bash
# 1. Run all backend tests
cd backend && pytest tests/ -q

# 2. Run Python linter
cd backend && ruff check app tests

# 3. Run frontend TypeScript static type check
cd frontend && npm run type-check

# 4. Run frontend linter
cd frontend && npm run lint

# 5. Build frontend production bundle
cd frontend && npm run build

# 6. Run the offline demonstration workflow
cd .. && make demo
```

Every PR must maintain a 100% test pass rate with 0 linter errors and 0 TypeScript compilation errors.
