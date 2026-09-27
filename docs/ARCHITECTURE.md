# ApexIQ Architectural Specification

## 1. System Intent & Design Philosophy
ApexIQ is engineered for trackside motorsport vehicle-performance engineering.
The platform enforces mathematical rigor, verifiable data contracts, and zero mock extrapolation.

Key architectural tenets:
1. **Separation of Concerns**:
   - The UI contains zero mathematical, filtering, or decimation logic.
   - The analytics and simulation layer contains zero presentation logic.
   - The ingestion subsystem handles time-series deserialization, mapping, and sanitation before model invocation.
2. **Explicit Data Integrity & Provenance**:
   - All ingested telemetry produces an audited `DataQualityResult` before passing into analytics or persistence.
   - Every processed dataset records a cryptographic SHA-256 hash, pipeline version, and mapping version.
   - Raw source files remain completely immutable in `data/raw/`.
3. **Decimation & Resampling Scalability**:
   - Telemetry is resampled server-side onto a uniform 1.0-meter spatial distance grid.
   - Continuous channels (speed, throttle, brake, accelerations) use linear interpolation.
   - Discrete channels (gear, DRS) use nearest-neighbor / step interpolation to prevent illegal fractional states.
   - Large stints (100 Hz - 1 kHz) are persisted in columnar Apache Parquet.

## 2. Ingestion to Presentation Pipeline

```
Raw Telemetry Source (CSV or Parquet)
                  │
                  ▼
       [TelemetrySourceAdapter]
     (CSVTelemetryAdapter / ParquetTelemetryAdapter)
                  │
                  ▼
       [Canonical Telemetry Schema]
     (Standard channel identifiers & types)
                  │
                  ▼
       [Channel Mapping Layer]
     (Config-driven alias resolution via channel_mapping.yaml)
                  │
                  ▼
       [Unit Normalizer]
     (km/h, m, s, %, RPM, G with strict Unknown handling)
                  │
                  ▼
       [Quality Validator]
     (TelemetryQualityChecker: physical boundaries, jitter, monotonicity)
                  │
                  ▼
       [Distance Resampling Engine]
     (1-meter grid: continuous vs categorical interpolation)
                  │
                  ▼
       [Persistence & Lineage Engine]
     ├── Raw Parquet:  data/raw/{session_id}/{run_id}/telemetry.parquet
     ├── Proc Parquet: data/processed/{session_id}/{run_id}/{lap_id}.parquet
     └── DB Metadata:  ProcessingRun (SHA-256, mapping ver, pipeline ver)
                  │
                  ▼
       [Analysis-Ready Telemetry API]
     (Inspection, Ingestion, Aligned Traces, Comparison Time Delta)
                  │
                  ▼
       [React Desktop Workstation UI]
     (Telemetry & Data & Runs modules active)
```

## 3. Communication Protocols
- **Control, Metadata & Lineage**: REST JSON over HTTP/2.
- **Analysis-Ready Columnar Data**: Apache Parquet files on disk; serialized JSON records for client inspection.
