# ApexIQ Provenance & Scientific Reproducibility

## 1. Deterministic Seeding Guarantee
All stochastic models, surrogate sampling routines, and Monte Carlo strategy iterations are anchored to a deterministic master seed:
```python
MASTER_SEED: int = 42871
```
Any execution of the cross-module pipeline with identical input parameters yields bitwise identical outputs across platforms.

---

## 2. Cryptographic Analysis Hashing
Every generated engineering report and cross-module pipeline response computes an SHA-256 digest across normalized JSON payloads:
```text
input_hash = sha256(canonical_json(inputs))
```
Engineers can audit that:
1. Analysis outputs correspond to the exact session and vehicle parameters entered.
2. No post-hoc manipulation or arbitrary data fitting occurred.
3. Trackside decisions are permanently traceable in historical archives.

---

## 3. Structured Machine-Readable & Human-Readable Output
Stage 8 reports are dual-rendered:
1. **GitHub Flavored Markdown**: Formatted for engineering briefings, executive debriefs, and race debrief logs.
2. **Structured JSON**: Fully typed Pydantic payloads containing numerical arrays, confidence bounds, domain validity metadata, and raw model parameters.
