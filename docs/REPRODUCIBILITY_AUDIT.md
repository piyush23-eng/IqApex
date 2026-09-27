# ApexIQ — Deterministic Reproducibility Audit (Stage 9)

**Standard Seed**: `42871`  
**Hash Algorithm**: SHA-256 (Canonical JSON representation)  
**Status**: BITWISE DETERMINISTIC & VERIFIED

---

## 1. Global Determinism Framework

Across all stochastic and semi-stochastic simulation routines (Latin Hypercube DoE sampling, Monte Carlo race runs, GBDT surrogate training), deterministic execution is enforced via explicit random seed passing.

### Verified Invariants:
1. **Identical Seeds Produce Identical Results**:
   * Running 500 Monte Carlo race iterations twice with `seed=42871` produces identical mean race times ($\Delta t = 0.000\text{ s}$), identical P10/P90 quantiles, and identical win probabilities.
2. **Distinct Seeds Produce Non-Degenerate Variances**:
   * Running Monte Carlo runs with differing seeds (`42871` vs `42872`) produces different stochastic sequences, confirming that random states are legitimately sampled rather than static constants.
3. **Canonical SHA-256 Provenance Hashing**:
   * Every DoE dataset and surrogate model generates a canonical SHA-256 hash derived from sorted feature lists, parameter matrices, and dataset rows:
     ```python
     canonical_str = f"{self.target_name}:{sorted(self.feature_names)}:{self.model_family}:{self.random_seed}"
     model_hash = hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()
     ```
   * Any change in training features or random seeds alters the hash, guaranteeing traceable lineage.

---

## 2. Component Isolation in Strategy & Kinematics

In `StrategySimulationEngine`:
* **Tyre degradation**, **fuel burn**, **weather transitions**, and **pit delta** are computed via independent decoupled functions.
* When testing fuel-only effects, tyre degradation can be held strictly invariant.
* When evaluating aerodynamic downforce variations in vehicle kinematics, corner transit times adjust according to aero load while straight-line top speed reflects parasitic drag, preserving physical causality.
