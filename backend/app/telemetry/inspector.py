import numpy as np
import pandas as pd

from app.schemas.lineage import TelemetryInspectionResult
from app.telemetry.mapping import channel_mapper
from app.telemetry.units import CANONICAL_UNITS


def inspect_telemetry_dataframe(
    df: pd.DataFrame, file_format: str, source_units: dict[str, str] | None = None
) -> TelemetryInspectionResult:
    """
    Inspects a loaded raw DataFrame and generates a comprehensive schema report
    before any irreversible transformation or persistence occurs.
    """
    source_units = source_units or {}
    row_count = len(df)
    cols = list(df.columns)
    warnings: list[str] = []

    if row_count == 0:
        warnings.append("Raw file contains 0 data rows (empty dataset).")
        return TelemetryInspectionResult(
            file_format=file_format,
            row_count=0,
            column_count=len(cols),
            available_channels=cols,
            core_channels_found=[],
            core_channels_missing=list(channel_mapper.core_specs),
            optional_channels_found=[],
            detected_units={},
            warnings=warnings,
        )

    # Resolve mapping without raising exception
    mapping, missing_core = channel_mapper.map_columns(cols, enforce_core=False)
    core_found = [c for c in channel_mapper.core_specs if c not in missing_core]
    optional_found = [c for c in channel_mapper.optional_specs if c in mapping.values()]

    if missing_core:
        warnings.append(f"Missing core canonical channels: {', '.join(missing_core)}")

    # Detected units
    detected_units: dict[str, str] = {}
    for col in cols:
        canon = mapping.get(col)
        unit = source_units.get(col) or (
            CANONICAL_UNITS.get(canon) if canon else "UNKNOWN"
        )
        detected_units[col] = unit

    # Timestamps & Sampling Frequency
    ts_range = None
    dist_range = None
    mean_dt = None
    est_hz = None

    time_col = next((c for c, canon in mapping.items() if canon == "timestamp"), None)
    if time_col and pd.api.types.is_numeric_dtype(df[time_col]):
        t_clean = df[time_col].dropna()
        if len(t_clean) > 1:
            t_min = float(t_clean.min())
            t_max = float(t_clean.max())
            ts_range = [round(t_min, 3), round(t_max, 3)]
            dts = np.diff(t_clean.to_numpy())
            positive_dts = dts[dts > 0]
            if len(positive_dts) > 0:
                mean_dt = float(np.mean(positive_dts))
                if mean_dt > 0:
                    est_hz = round(1.0 / mean_dt, 1)

    dist_col = next((c for c, canon in mapping.items() if canon == "distance"), None)
    if dist_col and pd.api.types.is_numeric_dtype(df[dist_col]):
        d_clean = df[dist_col].dropna()
        if len(d_clean) > 0:
            d_min = float(d_clean.min())
            d_max = float(d_clean.max())
            dist_range = [round(d_min, 1), round(d_max, 1)]

    return TelemetryInspectionResult(
        file_format=file_format,
        row_count=row_count,
        column_count=len(cols),
        available_channels=cols,
        core_channels_found=core_found,
        core_channels_missing=missing_core,
        optional_channels_found=optional_found,
        detected_units=detected_units,
        timestamp_range=ts_range,
        distance_range=dist_range,
        sampling_interval_mean=round(mean_dt, 5) if mean_dt else None,
        estimated_sampling_frequency=est_hz,
        warnings=warnings,
    )
