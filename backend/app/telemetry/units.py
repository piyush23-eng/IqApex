import numpy as np
import pandas as pd

CANONICAL_UNITS = {
    "speed": "km/h",
    "distance": "m",
    "timestamp": "s",
    "throttle": "%",
    "brake": "%",
    "gear": "index",
    "rpm": "RPM",
    "drs": "state",
    "lateral_acceleration": "G",
    "longitudinal_acceleration": "G",
    "steering_angle": "deg",
    "engine_temperature": "degC",
    "brake_temperature": "degC",
    "tyre_temperature": "degC",
}


class UnitNormalizer:
    """Normalizes raw channel units into standard engineering units."""

    @classmethod
    def normalize_channel(
        cls, channel: str, series: pd.Series, source_unit: str | None = None
    ) -> tuple[pd.Series, str, list[str]]:
        """
        Normalizes a pandas Series for a canonical channel.
        Returns:
            (normalized_series, effective_unit, warnings)
        """
        warnings: list[str] = []
        target_unit = CANONICAL_UNITS.get(channel)
        if target_unit is None:
            return series, source_unit or "UNKNOWN", warnings

        clean_unit = source_unit.strip().lower() if source_unit else None

        # 1. SPEED (Target: km/h)
        if channel == "speed":
            if clean_unit in ["m/s", "mps", "ms-1", "m_s"]:
                return series * 3.6, "km/h", warnings
            elif clean_unit in ["mph", "mi/h"]:
                return series * 1.609344, "km/h", warnings
            elif clean_unit in ["km/h", "kph", "kmh", None]:
                # Heuristic safety check: if max speed is under 115 and mean > 10, could be m/s
                max_val = float(series.max()) if len(series) > 0 else 0.0
                if clean_unit is None and 0.0 < max_val < 112.0:
                    warnings.append(
                        f"Channel '{channel}' unit unspecified; max value {max_val:.1f} might be m/s. Assuming km/h as canonical."
                    )
                return series, "km/h", warnings
            else:
                warnings.append(
                    f"Ambiguous speed unit '{source_unit}' on channel '{channel}'. Marked as UNKNOWN."
                )
                return series, "UNKNOWN", warnings

        # 2. DISTANCE (Target: m)
        elif channel == "distance":
            if clean_unit in ["km", "kilometer", "kilometres"]:
                return series * 1000.0, "m", warnings
            elif clean_unit in ["m", "meter", "meters", "metres", None]:
                return series, "m", warnings
            else:
                warnings.append(
                    f"Ambiguous distance unit '{source_unit}'. Marked as UNKNOWN."
                )
                return series, "UNKNOWN", warnings

        # 3. THROTTLE (Target: %)
        elif channel == "throttle":
            max_val = float(series.max()) if len(series) > 0 else 0.0
            if clean_unit in ["fraction", "norm", "0-1", "ratio"] or (
                clean_unit is None and 0.0 <= max_val <= 1.05 and max_val > 0.01
            ):
                return series * 100.0, "%", warnings
            elif clean_unit in ["%", "percent", "pct", None]:
                return series, "%", warnings
            else:
                warnings.append(
                    f"Ambiguous throttle unit '{source_unit}'. Marked as UNKNOWN."
                )
                return series, "UNKNOWN", warnings

        # 4. BRAKE (Target: %)
        elif channel == "brake":
            max_val = float(series.max()) if len(series) > 0 else 0.0
            if clean_unit in ["fraction", "norm", "0-1", "ratio"] or (
                clean_unit is None and 0.0 <= max_val <= 1.05 and max_val > 0.01
            ):
                return series * 100.0, "%", warnings
            elif clean_unit in ["%", "percent", "bar", None]:
                return series, "%", warnings
            else:
                warnings.append(
                    f"Ambiguous brake unit '{source_unit}'. Marked as UNKNOWN."
                )
                return series, "UNKNOWN", warnings

        # 5. ACCELERATIONS (Target: G)
        elif channel in ["lateral_acceleration", "longitudinal_acceleration"]:
            if clean_unit in ["m/s^2", "m/s2", "ms-2", "m_s2"]:
                return series / 9.80665, "G", warnings
            elif clean_unit in ["g", "g-force", None]:
                return series, "G", warnings
            else:
                warnings.append(
                    f"Ambiguous acceleration unit '{source_unit}' on '{channel}'. Marked as UNKNOWN."
                )
                return series, "UNKNOWN", warnings

        # 6. RPM (Target: RPM)
        elif channel == "rpm":
            if clean_unit in ["rad/s", "rad_s"]:
                return series * (60.0 / (2.0 * np.pi)), "RPM", warnings
            elif clean_unit in ["rpm", "rev/min", None]:
                return series, "RPM", warnings
            else:
                warnings.append(
                    f"Ambiguous RPM unit '{source_unit}'. Marked as UNKNOWN."
                )
                return series, "UNKNOWN", warnings

        # 7. TIME (Target: s)
        elif channel == "timestamp":
            if clean_unit in ["ms", "millisecond", "milliseconds"]:
                return series / 1000.0, "s", warnings
            elif clean_unit in ["s", "sec", "seconds", None]:
                return series, "s", warnings
            else:
                warnings.append(
                    f"Ambiguous timestamp unit '{source_unit}'. Marked as UNKNOWN."
                )
                return series, "UNKNOWN", warnings

        # Default passthrough
        return series, target_unit, warnings

    @classmethod
    def normalize_dataframe(
        cls, df: pd.DataFrame, source_units: dict[str, str] | None = None
    ) -> tuple[pd.DataFrame, dict[str, str], list[str]]:
        """Normalizes all channels in a DataFrame to canonical engineering units."""
        source_units = source_units or {}
        norm_df = df.copy()
        effective_units: dict[str, str] = {}
        all_warnings: list[str] = []

        for col in norm_df.columns:
            series = norm_df[col]
            s_unit = source_units.get(col)
            norm_series, eff_unit, warns = cls.normalize_channel(col, series, s_unit)
            norm_df[col] = norm_series
            effective_units[col] = eff_unit
            all_warnings.extend(warns)

        return norm_df, effective_units, all_warnings
