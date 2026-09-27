from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, BinaryIO

import pandas as pd

from app.schemas.lineage import TelemetryInspectionResult


class TelemetrySourceAdapter(ABC):
    """
    Abstract format adapter interface for heterogeneous motorsport telemetry files.
    Concrete adapters parse source formats (CSV, Parquet, and future binary loggers)
    into a unified internal representation.
    """

    def __init__(self) -> None:
        self.raw_df: pd.DataFrame | None = None
        self.source_metadata: dict[str, Any] = {}
        self.source_name: str = ""

    @abstractmethod
    def load(
        self, source: str | Path | BinaryIO | bytes, filename: str | None = None
    ) -> None:
        """Loads and parses raw telemetry from a path, stream, or byte buffer."""

    @abstractmethod
    def inspect_schema(self) -> TelemetryInspectionResult:
        """Inspects raw column names, datatypes, counts, and estimated sampling rate without transformation."""

    def read_metadata(self) -> dict[str, Any]:
        """Returns format-specific header metadata (e.g. logger ID, session string)."""
        return self.source_metadata

    def read_channels(self) -> list[str]:
        """Returns the list of raw channel names present in the file."""
        if self.raw_df is None:
            return []
        return list(self.raw_df.columns)

    def read_telemetry(self) -> pd.DataFrame:
        """
        Returns the raw, unmodified telemetry as a pandas DataFrame.
        Guarantees that raw source data is never modified in place.
        """
        if self.raw_df is None:
            raise ValueError("No telemetry data loaded in adapter. Call load() first.")
        return self.raw_df.copy()
