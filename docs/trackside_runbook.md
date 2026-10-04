# ApexIQ Trackside Deployment & Pit-Wall Operations Runbook

Standard operating procedures for deploying, synchronizing, and monitoring ApexIQ during live Formula 1 Grand Prix sessions (FP1, FP2, FP3, Qualifying, Race).

---

## 1. System Architecture Overview

```
[ Car Telemetry ECU (ATLAS / Wintax) ]
                  │
                  ▼ (100 Hz UDP / MQTT Stream)
     [ Trackside Edge Gateway ]
                  │
                  ▼ (Distance Resampling & Validation)
     [ ApexIQ Fast-Path Ingestion Pipeline ]
                  │
         ┌────────┴────────┐
         ▼                 ▼
[ Parquet Lake ]    [ GBDT Surrogate / SLSQP ]
         │                 │
         └────────┬────────┘
                  ▼
   [ FastAPI REST / WebSocket Server ]
                  │
                  ▼ (0.0.0.0:8000)
    [ React / Tailwind Cyber Matrix HUD ]
```

---

## 2. Pre-Session Initialization Checklist

1. **Hardware Integrity**: Ensure edge servers have gigabit ethernet connections to the timing transponder loop.
2. **Environment Configuration**:
   ```bash
   cp .env.example .env
   # Set LIVE_TRACKSIDE_MODE=true
   # Set CIRCUIT_NAME=monza
   ```
3. **Database & Parquet Store Check**:
   ```bash
   python backend/scripts/verify_dataset_invariants.py data/
   ```
4. **Launch Workstations**:
   ```bash
   docker compose -f docker-compose.yml up -d
   ```

---

## 3. Session Contingency Protocols

### Missing Beacon Sync
If the start/finish loop drops an optic trigger:
- ApexIQ resynchronizes spatial alignment using GPS coordinates cross-referenced against the Monza track center line.
- The pipeline flags the lap as `UNSYNCHRONIZED_BEACON` in `data_quality`.
