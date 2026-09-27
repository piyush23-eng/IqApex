# ApexIQ Architectural Specification

## 1. System Intent & Design Philosophy
ApexIQ is engineered for trackside motorsport vehicle-performance engineering.
The platform enforces mathematical rigor, verifiable data contracts, and uncompromising performance.

Key architectural tenets:
1. **Separation of Concerns**:
   - The UI contains zero mathematical or filtering logic.
   - The analytics and simulation layer contains zero presentation logic.
   - The ingestion subsystem handles time-series deserialization and sanitation before model invocation.
2. **Explicit Data Integrity**:
   - Datasets must produce an audited `DataQualityResult` before passing into analytics.
   - Synthetic or demonstration data is explicitly labeled and cannot masquerade as live car telemetry.
3. **Decimation & Scalability**:
   - High-frequency traces (100 Hz - 1 kHz) are decimated server-side via the Largest Triangle Three Buckets (LTTB) algorithm to preserve apex minima, braking spikes, and acceleration transients without saturating browser memory.

## 2. Ingestion to Presentation Pipeline

```
Raw Logger Traces (ATLAS / Pi / CSV / Socket)
                   │
                   ▼
       [Data Ingestion Subsystem]
                   │
                   ▼
     [Telemetry Quality Validator]
     (Checks boundaries, monotonicity, jitter)
                   │
                   ▼
      [Spatial Distance Resampling]
                   │
                   ▼
         [Feature Engineering]
                   │
                   ▼
        [Performance Models]
   (Aero balance, Kinematics, Tyres)
                   │
                   ▼
            [FastAPI Tier]
                   │
                   ▼
        [React Desktop Shell]
```

## 3. Communication Protocols
- **Control & Metadata**: REST JSON over HTTP/2.
- **High-Rate Telemetry**: Decimated JSON arrays in Stage 1; binary flatbuffers/arrow stream planned for Stage 2.
