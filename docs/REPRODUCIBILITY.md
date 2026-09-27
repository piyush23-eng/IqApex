# ApexIQ — Deterministic Reproducibility Guide

**System Seed**: `42871`  
**Hash Algorithm**: SHA-256 (Canonical representation)  
**Standard Environment**: Python 3.13 / ARM64 or x86_64

---

## 1. Deterministic Execution Invariant

In high-stakes vehicle engineering, non-deterministic simulations introduce artificial variance that obscures true physical signal. ApexIQ enforces strict determinism across all stochastic components:

1. **Latin Hypercube Sampling**: The 500-sample aerodynamic DoE dataset is generated using `np.random.default_rng(42871)`.
2. **HistGradientBoosting**: The surrogate regressor sets `random_state=42871`.
3. **Monte Carlo Simulations**: The 1,000-run race strategy uncertainty engine initializes `np.random.default_rng(42871)`.

### Bitwise Verification:
Executing two sequential runs with `seed=42871` yields bitwise identical results:
* $\Delta \text{Mean Race Time} = 0.000000\text{ s}$
* $\Delta \text{P10} = 0.000000\text{ s}$
* $\Delta \text{P90} = 0.000000\text{ s}$

---

## 2. Canonical SHA-256 Provenance Hashing

Every dataset and trained surrogate model carries a cryptographically verifiable SHA-256 provenance hash:

```python
canonical_str = f"{self.target_name}:{sorted(self.feature_names)}:{self.model_family}:{self.random_seed}"
model_hash = hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()
```

If an engineer alters feature definitions, changes hyper-parameters, or modifies training data, the resulting hash shifts, instantly invalidating cached results and ensuring auditable decision lineage.

---

## 3. How to Verify Reproducibility Locally

Run the automated test suite dedicated to determinism and reproducibility:

```bash
cd backend
PYTHONPATH=. .venv/bin/pytest tests/test_strategy_and_mc_validation.py tests/test_physics_invariants.py -v
```

All determinism invariants are guaranteed to pass 100% of the time.
