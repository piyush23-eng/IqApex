import io
from pathlib import Path
from typing import BinaryIO

import pandas as pd
import pyarrow.parquet as pq

from app.schemas.lineage import TelemetryInspectionResult
from app.telemetry.adapters.base import TelemetrySourceAdapter
from app.telemetry.inspector import inspect_telemetry_dataframe


class ParquetTelemetryAdapter(TelemetrySourceAdapter):
    """Format adapter for Apache Parquet columnar telemetry files."""

    def load(
        self, source: str | Path | BinaryIO | bytes, filename: str | None = None
    ) -> None:
        self.source_name = filename or (
            str(source) if isinstance(source, (str, Path)) else "stream.parquet"
        )

        if isinstance(source, bytes):
            buffer = io.BytesIO(source)
        elif isinstance(source, (str, Path)):
            path = Path(source)
            if not path.exists():
                raise FileNotFoundError(f"Parquet file not found: {path}")
            buffer = str(path)
        else:
            buffer = source

        self.raw_df = pd.read_parquet(buffer, engine="pyarrow")

        # Read parquet schema metadata
        meta = {}
        if isinstance(buffer, (str, Path)):
            try:
                parquet_file = pq.ParquetFile(buffer)
                meta = {
                    k.decode("utf-8") if isinstance(k, bytes) else k: v.decode("utf-8")
                    if isinstance(v, bytes)
                    else str(v)
                    for k, v in (parquet_file.schema_arrow.metadata or {}).items()
                }
            except (OSError, ValueError):
                meta = {}

        self.source_metadata = {
            "format": "Parquet",
            "source_name": self.source_name,
            "rows": len(self.raw_df),
            "columns": list(self.raw_df.columns),
            "parquet_metadata": meta,
        }

    def inspect_schema(self) -> TelemetryInspectionResult:
        if self.raw_df is None:
            raise ValueError("No data loaded. Call load() first.")
        return inspect_telemetry_dataframe(self.raw_df, file_format="Parquet")
