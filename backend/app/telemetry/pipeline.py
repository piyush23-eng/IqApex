import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import BinaryIO

from app.analytics.quality_checker import TelemetryQualityChecker
from app.schemas.domain import Lap, TelemetryPoint
from app.schemas.lineage import (
    IngestionResult,
    ProcessingRun,
    TelemetryInspectionResult,
)
from app.telemetry.adapters.base import TelemetrySourceAdapter
from app.telemetry.adapters.csv_adapter import CSVTelemetryAdapter
from app.telemetry.adapters.parquet_adapter import ParquetTelemetryAdapter
from app.telemetry.mapping import channel_mapper
from app.telemetry.resampling import DistanceResampler
from app.telemetry.storage import telemetry_storage
from app.telemetry.units import UnitNormalizer


class TelemetryIngestionPipeline:
    """
    Core orchestrator converting raw heterogeneous motorsport telemetry
    into a standardized, normalized, validated, resampled, and persisted representation.
    """

    PIPELINE_VERSION = "2.0.0"

    @classmethod
    def get_adapter(cls, filename: str) -> TelemetrySourceAdapter:
        lower = filename.lower()
        if lower.endswith((".csv", ".txt", ".tsv")):
            return CSVTelemetryAdapter()
        elif lower.endswith((".parquet", ".pq")):
            return ParquetTelemetryAdapter()
        else:
            raise ValueError(
                f"Unsupported telemetry file extension in '{filename}'. Supported formats: .csv, .parquet"
            )

    @classmethod
    def inspect(
        cls,
        source: str | Path | BinaryIO | bytes,
        filename: str,
        source_units: dict[str, str] | None = None,
    ) -> TelemetryInspectionResult:
        adapter = cls.get_adapter(filename)
        adapter.load(source, filename=filename)
        return adapter.inspect_schema()

    @classmethod
    def ingest(
        cls,
        source: str | Path | BinaryIO | bytes,
        filename: str,
        session_id: str,
        run_id: str,
        lap_id: str,
        lap_metadata: Lap | None = None,
        source_units: dict[str, str] | None = None,
        resample_distance_step: float = 1.0,
    ) -> IngestionResult:
        source_units = source_units or {}

        # 1. Compute SHA-256 for provenance
        if isinstance(source, (str, Path, bytes)):
            source_hash = telemetry_storage.compute_sha256(source)
            adapter_source = source
        else:
            content = source.read()
            source_hash = telemetry_storage.compute_sha256(content)
            adapter_source = content

        # 2. Load into Format Adapter (Raw Data remains immutable)
        adapter = cls.get_adapter(filename)
        adapter.load(adapter_source, filename=filename)
        raw_df = adapter.read_telemetry()

        # 3. Channel Mapping Layer
        mapping, _ = channel_mapper.map_columns(list(raw_df.columns), enforce_core=True)

        # Select & rename to canonical channels
        mapped_df = raw_df[list(mapping.keys())].rename(columns=mapping)

        # 4. Unit Normalization Layer
        mapped_source_units = {
            mapping[k]: v for k, v in source_units.items() if k in mapping
        }
        norm_df, _, unit_warnings = UnitNormalizer.normalize_dataframe(
            mapped_df, source_units=mapped_source_units
        )

        # 5. Convert to TelemetryPoint array for validation
        points: list[TelemetryPoint] = []
        for row in norm_df.itertuples(index=False):
            points.append(
                TelemetryPoint(
                    timestamp=float(row.timestamp),
                    distance=float(row.distance),
                    speed=float(row.speed),
                    throttle=float(row.throttle),
                    brake=float(row.brake),
                    gear=int(row.gear),
                    rpm=int(row.rpm),
                    drs=int(row.drs),
                    lateral_acceleration=float(row.lateral_acceleration),
                    longitudinal_acceleration=float(row.longitudinal_acceleration),
                )
            )

        # 6. Quality Validation Layer (executed BEFORE persistence)
        quality = TelemetryQualityChecker.evaluate_lap(lap_metadata, points)
        quality.warnings.extend(unit_warnings)

        # 7. Distance Resampling Layer (1-meter grid)
        resampled_df = DistanceResampler.resample(
            norm_df, distance_step=resample_distance_step
        )

        # 8. Persistence Layer
        raw_path = telemetry_storage.save_raw(
            raw_df, session_id=session_id, run_id=run_id
        )
        proc_path = telemetry_storage.save_processed(
            resampled_df, session_id=session_id, run_id=run_id, lap_id=lap_id
        )

        # 9. Traceable Lineage Record
        processing_run_id = f"pr-{uuid.uuid4().hex[:12]}"
        lineage = ProcessingRun(
            processing_run_id=processing_run_id,
            source_file=filename,
            source_hash=source_hash,
            processed_at=datetime.now(timezone.utc).isoformat(),
            pipeline_version=cls.PIPELINE_VERSION,
            mapping_version=channel_mapper.version,
            status=quality.status.value,
            quality_score=quality.quality_score,
            resampling_resolution=resample_distance_step,
        )

        return IngestionResult(
            processing_run_id=processing_run_id,
            session_id=session_id,
            run_id=run_id,
            lap_id=lap_id,
            raw_points=len(raw_df),
            resampled_points=len(resampled_df),
            data_label="Vehicle telemetry recording",
            quality=quality,
            lineage=lineage,
            raw_storage_path=str(raw_path),
            processed_storage_path=str(proc_path),
            points=points,
        )
