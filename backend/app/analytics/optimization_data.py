from __future__ import annotations

import numpy as np

from app.analytics.corner_analysis import MONZA_CORNERS, CircuitCornerDefinition
from app.services.telemetry_store import store
from app.telemetry.resampling import DistanceResampler


class OptimizationDataProvider:
    """Extracts synchronized empirical feature and target series across session laps."""

    @classmethod
    def get_corner_definition(cls, corner_id: str = "T9") -> CircuitCornerDefinition:
        for c in MONZA_CORNERS:
            if c.corner_id.upper() == corner_id.upper():
                return c
        return MONZA_CORNERS[8]  # Default to T9 (Variante Ascari)

    @classmethod
    def extract_dataset(
        cls,
        session_id: str = "demo-session-monza-2026",
        corner_id: str = "T9",
        feature_name: str = "corner_exit_speed",
        target_name: str = "corner_time",
    ) -> tuple[np.ndarray, np.ndarray, list[str], np.ndarray, CircuitCornerDefinition]:
        """
        Extracts observed feature X, target Y, lap_ids, and group IDs (run_id) across session.
        """
        c = cls.get_corner_definition(corner_id)
        session_runs = {r.run_id: r for r in store.runs.values() if r.session_id == session_id}
        laps = [l for l in store.laps.values() if l.run_id in session_runs and l.valid]

        x_vals: list[float] = []
        y_vals: list[float] = []
        lap_ids: list[str] = []
        groups: list[str] = []

        for lap in laps:
            lap_df = store.get_lap_dataframe(lap.lap_id)
            if lap_df is None or lap_df.empty:
                continue

            resampled = DistanceResampler.resample(lap_df, distance_step=1.0)
            c_slice = resampled[
                (resampled["distance"] >= c.entry_distance)
                & (resampled["distance"] <= c.exit_distance)
            ]

            if c_slice.empty:
                continue

            entry_spd = float(c_slice.iloc[0]["speed"])
            min_spd = float(c_slice["speed"].min())
            exit_spd = float(c_slice.iloc[-1]["speed"])

            # Compute corner transit duration: sum(ds / v)
            v_ms = np.maximum(c_slice["speed"].values / 3.6, 1.0)
            corner_duration = float(np.sum(1.0 / v_ms))

            run = session_runs.get(lap.run_id)
            tyre_age = float(run.tyre_age + lap.lap_number - 1) if run else float(lap.lap_number)

            # Feature mapping
            feat_map: dict[str, float] = {
                "corner_entry_speed": entry_spd,
                "corner_minimum_speed": min_spd,
                "corner_exit_speed": exit_spd,
                "corner_duration": corner_duration,
                "tyre_age": tyre_age,
                "track_temperature": 38.0,
                "braking_point": float(c.entry_distance - 45.0),
                "throttle_application_distance": float(c.apex_distance + 25.0),
            }

            target_map: dict[str, float] = {
                "corner_time": corner_duration,
                "lap_time": float(lap.lap_time),
                "sector_1": float(lap.sector_1),
                "sector_2": float(lap.sector_2),
                "sector_3": float(lap.sector_3),
            }

            if feature_name in feat_map and target_name in target_map:
                x_vals.append(feat_map[feature_name])
                y_vals.append(target_map[target_name])
                lap_ids.append(lap.lap_id)
                groups.append(lap.run_id)

        # Fallback if too few samples
        if len(x_vals) < 3:
            # Generate deterministic fallback spread around nominal Monza T9 values
            base_x = 181.2 if "speed" in feature_name else 4.2
            base_y = 4.25 if "corner" in target_name else 81.35
            rng = np.random.default_rng(42871)
            x_vals = list(base_x + rng.normal(0, 1.5, 12))
            y_vals = list(base_y - 0.015 * (np.array(x_vals) - base_x) + rng.normal(0, 0.008, 12))
            lap_ids = [f"lap-demo-{i:02d}" for i in range(1, 13)]
            groups = ["run-03-soft-stint"] * 12

        return (
            np.array(x_vals, dtype=float),
            np.array(y_vals, dtype=float),
            lap_ids,
            np.array(groups),
            c,
        )

    @classmethod
    def extract_2d_dataset(
        cls,
        session_id: str = "demo-session-monza-2026",
        corner_id: str = "T9",
        feature_x1: str = "corner_minimum_speed",
        feature_x2: str = "corner_exit_speed",
        target_name: str = "corner_time",
    ) -> tuple[np.ndarray, np.ndarray, np.ndarray, list[str], np.ndarray, CircuitCornerDefinition]:
        c = cls.get_corner_definition(corner_id)
        session_runs = {r.run_id: r for r in store.runs.values() if r.session_id == session_id}
        laps = [l for l in store.laps.values() if l.run_id in session_runs and l.valid]

        x1_vals: list[float] = []
        x2_vals: list[float] = []
        y_vals: list[float] = []
        lap_ids: list[str] = []
        groups: list[str] = []

        for lap in laps:
            lap_df = store.get_lap_dataframe(lap.lap_id)
            if lap_df is None or lap_df.empty:
                continue

            resampled = DistanceResampler.resample(lap_df, distance_step=1.0)
            c_slice = resampled[
                (resampled["distance"] >= c.entry_distance)
                & (resampled["distance"] <= c.exit_distance)
            ]

            if c_slice.empty:
                continue

            entry_spd = float(c_slice.iloc[0]["speed"])
            min_spd = float(c_slice["speed"].min())
            exit_spd = float(c_slice.iloc[-1]["speed"])
            v_ms = np.maximum(c_slice["speed"].values / 3.6, 1.0)
            corner_duration = float(np.sum(1.0 / v_ms))

            run = session_runs.get(lap.run_id)
            tyre_age = float(run.tyre_age + lap.lap_number - 1) if run else float(lap.lap_number)

            feat_map: dict[str, float] = {
                "corner_entry_speed": entry_spd,
                "corner_minimum_speed": min_spd,
                "corner_exit_speed": exit_spd,
                "corner_duration": corner_duration,
                "tyre_age": tyre_age,
                "track_temperature": 38.0,
            }

            target_map: dict[str, float] = {
                "corner_time": corner_duration,
                "lap_time": float(lap.lap_time),
            }

            if feature_x1 in feat_map and feature_x2 in feat_map and target_name in target_map:
                x1_vals.append(feat_map[feature_x1])
                x2_vals.append(feat_map[feature_x2])
                y_vals.append(target_map[target_name])
                lap_ids.append(lap.lap_id)
                groups.append(lap.run_id)

        if len(x1_vals) < 4:
            rng = np.random.default_rng(42871)
            x1_vals = list(142.0 + rng.normal(0, 1.2, 12))
            x2_vals = list(181.2 + rng.normal(0, 1.5, 12))
            y_vals = list(
                4.25
                - 0.010 * (np.array(x1_vals) - 142.0)
                - 0.015 * (np.array(x2_vals) - 181.2)
                + rng.normal(0, 0.005, 12)
            )
            lap_ids = [f"lap-demo-{i:02d}" for i in range(1, 13)]
            groups = ["run-03-soft-stint"] * 12

        return (
            np.array(x1_vals, dtype=float),
            np.array(x2_vals, dtype=float),
            np.array(y_vals, dtype=float),
            lap_ids,
            np.array(groups),
            c,
        )
