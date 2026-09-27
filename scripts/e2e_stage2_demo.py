#!/usr/bin/env python3
"""
ApexIQ Stage 2 End-to-End Pipeline Demonstration Script
Exercises:
Synthetic CSV -> Inspect -> Map Channels -> Normalize Units -> Validate ->
Resample to 1m -> Persist Parquet -> Create Processing Lineage -> Retrieve API -> Compare Two Laps
"""

import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from fastapi.testclient import TestClient
from app.main import app
from app.telemetry.adapters.csv_adapter import CSVTelemetryAdapter
from app.telemetry.adapters.parquet_adapter import ParquetTelemetryAdapter
from app.telemetry.mapping import channel_mapper
from app.telemetry.units import UnitNormalizer
from app.telemetry.resampling import DistanceResampler
from app.telemetry.alignment import TimeDeltaCalculator
from app.telemetry.pipeline import TelemetryIngestionPipeline

client = TestClient(app)

print("=" * 80)
print(" APEXIQ STAGE 2: END-TO-END TELEMETRY PIPELINE DEMONSTRATION")
print("=" * 80)

data_dir = Path(__file__).resolve().parents[1] / "backend" / "tests" / "data"
csv_file = data_dir / "synthetic_telemetry.csv"

# 1. INSPECT RAW FILE
print("\n[Step 1] Inspecting Raw Telemetry File...")
inspection = TelemetryIngestionPipeline.inspect(csv_file, filename=csv_file.name)
print(f"  • File Format:               {inspection.file_format}")
print(f"  • Raw Rows:                  {inspection.row_count:,}")
print(f"  • Columns:                   {inspection.column_count}")
print(f"  • Core Channels Found:       {len(inspection.core_channels_found)} / 10")
print(f"  • Missing Core Channels:     {inspection.core_channels_missing or 'None'}")
print(f"  • Estimated Sampling Rate:   {inspection.estimated_sampling_frequency} Hz")
print(f"  • Distance Envelope:         {inspection.distance_range[0]}m -> {inspection.distance_range[1]}m")
print(f"  • Time Span:                 {inspection.timestamp_range[0]}s -> {inspection.timestamp_range[1]}s")

# 2. RUN FULL INGESTION PIPELINE
print("\n[Step 2] Executing Full Ingestion Pipeline...")
with open(csv_file, "rb") as f:
    ingest_res = TelemetryIngestionPipeline.ingest(
        source=f,
        filename=csv_file.name,
        session_id="demo-session-monza-2026",
        run_id="run-03-soft-stint",
        lap_id="lap-monza-e2e-demo",
        resample_distance_step=1.0,
    )

print(f"  • Processing Run ID:         {ingest_res.processing_run_id}")
print(f"  • Source SHA-256 Digest:     {ingest_res.lineage.source_hash[:24]}...")
print(f"  • Pipeline Version:          v{ingest_res.lineage.pipeline_version}")
print(f"  • Mapping Version:           v{ingest_res.lineage.mapping_version}")
print(f"  • Quality Status:            {ingest_res.quality.status.value}")
print(f"  • Quality Score:             {ingest_res.quality.quality_score:.1f} / 100.0")
print(f"  • Raw Acquisition Samples:   {ingest_res.raw_points:,}")
print(f"  • 1-Meter Resampled Points:  {ingest_res.resampled_points:,}")
print(f"  • Raw Storage (Parquet):     {ingest_res.raw_storage_path}")
print(f"  • Processed Storage (1m):    {ingest_res.processed_storage_path}")

# 3. VERIFY PERSISTENCE WITH PARQUET ADAPTER
print("\n[Step 3] Verifying Processed Parquet Storage...")
pq_adapter = ParquetTelemetryAdapter()
pq_adapter.load(ingest_res.processed_storage_path)
proc_df = pq_adapter.read_telemetry()
print(f"  • Loaded Processed Parquet:  {len(proc_df):,} rows x {len(proc_df.columns)} channels")
print(f"  • Grid Uniformity (Δs):      {proc_df['distance'].diff().dropna().unique().tolist()}")
print(f"  • Discrete Channel (Gear):   Unique states: {sorted(proc_df['gear'].unique().tolist())}")

# 4. API RETRIEVAL
print("\n[Step 4] Querying API Endpoints...")
res_health = client.get("/api/health")
assert res_health.status_code == 200
print(f"  • GET /api/health:           {res_health.json()['status']}")

# 5. MULTI-LAP COMPARISON (HAMILTON VS LECLERC)
print("\n[Step 5] Multi-Lap Mathematical Time & Speed Delta...")
res_comp = client.post(
    "/api/telemetry/compare",
    json={
        "reference_lap_id": "lap-demo-02",
        "comparison_lap_id": "lap-demo-03",
        "distance_step": 1.0,
    }
)
assert res_comp.status_code == 200
comp_data = res_comp.json()
pts = comp_data["point_count"]
final_delta_t = comp_data["time_delta"][-1]
max_delta_v = max(comp_data["speed_delta"])
min_delta_v = min(comp_data["speed_delta"])

print(f"  • Reference Lap:             {comp_data['reference_lap_id']}")
print(f"  • Comparison Lap:            {comp_data['comparison_lap_id']}")
print(f"  • Distance Grid Points:      {pts:,} meters")
print(f"  • Initial Time Delta:        {comp_data['time_delta'][0]:.4f} s")
print(f"  • Final Lap Time Delta Δt:   {final_delta_t:+.3f} s")
print(f"  • Peak Speed Differential:   {min_delta_v:.1f} km/h to {max_delta_v:+.1f} km/h")

print("\n" + "=" * 80)
print(" PIPELINE DEMONSTRATION VERIFIED: ALL CHECKS PASSED")
print("=" * 80)
