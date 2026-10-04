# ApexIQ Architecture & Pipeline Specification

## High-Level System Architecture

ApexIQ is designed as an end-to-end telemetry engineering and vehicle dynamics decision support platform.

```mermaid
flowchart TD
    subgraph Data Layer [Data & Ingestion Layer]
        A[ECU Telemetry Streams] -->|100Hz Raw Telemetry| B[FastAPI Gateway]
        B -->|Parquet Persistence| C[(Telemetry Parquet Store)]
        C -->|1m Spatial Resampling| D[DistanceResampler]
    end

    subgraph Analytics Layer [Analytics & Physics Models]
        D --> E[LapTimeDecomposer]
        D --> F[CornerKinematicsAnalyzer]
        D --> G[DriverConsistencyAnalyzer]
        D --> H[AeroSurrogatePipeline]
    end

    subgraph Optimization Layer [Engineering Decision Engine]
        E --> I[LapLossAttribution]
        H --> J[ConstrainedSLSQP]
        H --> K[ParetoFrontierGenerator]
        J --> L[SetupWhatIfEngine]
        K --> M[MultiObjectiveTradeoff]
    end

    subgraph Presentation Layer [Cyber Matrix HUD]
        L --> N[React 18 Workstation]
        M --> N
        F --> N
        I --> N
    end
```

## Core Engineering Invariants
1. **Spatial Invariance**: Telemetry comparisons are conducted over fixed $\Delta s = 1.0\text{ m}$ grids rather than varying temporal coordinates.
2. **Deterministic Residuals**: No unmeasured delta is discarded; $\Delta t_{\text{total}} = \sum \Delta t_{\text{phases}} + \Delta t_{\text{residual}}$.
3. **Surrogate Calibration**: GBDT aerodynamic surrogates enforce $v^2$ physical scaling and non-negative aerodynamic drag.
