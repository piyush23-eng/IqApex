import io
from pathlib import Path
from typing import BinaryIO

import pandas as pd

from app.schemas.lineage import TelemetryInspectionResult
from app.telemetry.adapters.base import TelemetrySourceAdapter
from app.telemetry.inspector import inspect_telemetry_dataframe


class CSVTelemetryAdapter(TelemetrySourceAdapter):
    """Format adapter for CSV / delimited telemetry text files."""

    def load(
        self, source: str | Path | BinaryIO | bytes, filename: str | None = None
    ) -> None:
        self.source_name = filename or (
            str(source) if isinstance(source, (str, Path)) else "stream.csv"
        )

        if isinstance(source, bytes):
            buffer = io.BytesIO(source)
        elif isinstance(source, (str, Path)):
            path = Path(source)
            if not path.exists():
                raise FileNotFoundError(f"CSV file not found: {path}")
            buffer = str(path)
        else:
            buffer = source

        try:
            self.raw_df = pd.read_csv(buffer, sep=None, engine="python", comment="#")
        except (ValueError, TypeError, pd.errors.ParserError):
            if isinstance(buffer, io.BytesIO):
                buffer.seek(0)
            self.raw_df = pd.read_csv(buffer, sep=",")

        self.source_metadata = {
            "format": "CSV",
            "source_name": self.source_name,
            "rows": len(self.raw_df),
            "columns": list(self.raw_df.columns),
        }

    def inspect_schema(self) -> TelemetryInspectionResult:
        if self.raw_df is None:
            raise ValueError("No data loaded. Call load() first.")
        return inspect_telemetry_dataframe(self.raw_df, file_format="CSV")
