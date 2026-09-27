# ApexIQ Telemetry Ingestion, Normalization & Alignment Pipeline

## 1. Objective
The Stage 2 Telemetry Pipeline is engineered to:
> Convert heterogeneous motorsport telemetry into a consistent, validated, analysis-ready representation.

Analytical engines in subsequent stages (aero balance, tyre degradation, lap simulation) consume canonical telemetry without concern for raw source formats or logger idiosyncrasies.

---

## 2. Format Adapters
The platform uses the `TelemetrySourceAdapter` interface:
```python
class TelemetrySourceAdapter(ABC):
    def load(self, source: Union[str, Path, BinaryIO, bytes]) -> None: ...
    def inspect_schema(self) -> TelemetryInspectionResult: ...
    def read_metadata(self) -> Dict[str, Any]: ...
    def read_channels(self) -> List[str]: ...
    def read_telemetry() -> pd.DataFrame: ...
```

Supported adapters:
- `CSVTelemetryAdapter`: Auto-detects delimiters (comma, semicolon, tab) and handles comment headers.
- `ParquetTelemetryAdapter`: Reads columnar Parquet files via `pyarrow` and extracts file-level metadata.

Both adapters guarantee that raw source data is immutable and never modified in place.

---

## 3. Configurable Channel Mapping
Logger channels differ widely across data acquisition ecosystems (e.g. `vCar` vs. `speed_kph` vs. `GPS_Speed`). ApexIQ externalizes this mapping into `backend/app/telemetry/channel_mapping.yaml`.

The `ChannelMapper` service:
1. Normalizes channel names (lowercasing, trimming, replacing spaces/hyphens with underscores).
2. Maps raw channels to canonical equivalents.
3. Enforces the presence of all 10 core canonical channels.
4. If a core channel is missing, raises `ChannelMappingError` detailing missing channels and potential candidate matches.

---

## 4. Unit Normalization
The `UnitNormalizer` converts incoming engineering units into standard SI and motorsport conventions:
- **Speed**: Normalized to $\text{km/h}$ (converts $\text{m/s}$ via $\times 3.6$, $\text{mph}$ via $\times 1.609344$).
- **Distance**: Normalized to $\text{m}$ (converts $\text{km}$ via $\times 1000$).
- **Acceleration**: Normalized to $\text{G}$ (converts $\text{m/s}^2$ via $/ 9.80665$).
- **Throttle / Brake**: Normalized to $0 - 100\%$ (converts fractional $[0, 1]$ via $\times 100$).
- **RPM**: Normalized to $\text{RPM}$ (converts $\text{rad/s}$ via $\times 60 / 2\pi$).

Ambiguous or unknown units are marked as `UNKNOWN` and produce explicit data quality warnings.

---

## 5. Quality Validation Gate
Integrated with `TelemetryQualityChecker`, validation runs **before** persistence.
Checks executed:
- Missing / `NaN` / infinite values.
- Monotonic timestamps and duplicate timestamp detection.
- Monotonic distance progression.
- Physical boundaries (Speed $\le 395\text{ km/h}$, RPM $\le 16,000$, Gear $[-1..8]$, Lateral/Longitudinal $G \in [-6.5, 6.5]$).
- Telemetry discontinuities ($\Delta t > 250\text{ms}$ or $\Delta s < -1\text{m}$).
- Sampling jitter coefficient of variation ($\text{CV} > 0.50$).

---

## 6. Distance Resampling
Telemetry is resampled onto a uniform 1.0-meter spatial distance grid ($s = 0, 1, 2, \dots, S_{\text{max}}$).
- **Continuous channels** (`speed`, `throttle`, `brake`, `acceleration`): Linear interpolation.
- **Discrete / categorical channels** (`gear`, `drs`): Nearest-neighbor / step interpolation, guaranteeing that integer discrete channels never take fractional values.

---

## 7. Multi-Lap Alignment & Mathematical Delta
- `MultiLapAligner`: Warps multiple laps onto an identical distance vector over their overlapping distance envelope.
- `TimeDeltaCalculator`: Computes mathematical delta traces:
  $$\Delta t(s) = t_{\text{comparison}}(s) - t_{\text{reference}}(s)$$
  $$\Delta v(s) = v_{\text{comparison}}(s) - v_{\text{reference}}(s)$$
  Returns pure measured delta signals without subjective conclusions.

---

## 8. Persistence & Cryptographic Lineage
- **Raw Storage**: `data/raw/{session_id}/{run_id}/telemetry.parquet` (immutable).
- **Processed Storage**: `data/processed/{session_id}/{run_id}/{lap_id}.parquet`.
- **Lineage Tracking**: Each ingestion generates a `ProcessingRun` with:
  - `processing_run_id` (UUID)
  - `source_file`
  - `source_hash` (SHA-256)
  - `processed_at` (UTC ISO-8601)
  - `pipeline_version` (`2.0.0`)
  - `mapping_version` (`1.0.0`)
  - `quality_score` ($0 - 100.0$)
  - `resampling_resolution` ($1.0\text{ m}$)
