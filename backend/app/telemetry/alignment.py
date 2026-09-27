import numpy as np
import pandas as pd

from app.schemas.lineage import LapComparisonResponse
from app.telemetry.resampling import DistanceResampler


class MultiLapAligner:
    """Aligns multiple laps onto an identical spatial distance grid."""

    @classmethod
    def align_laps(
        cls,
        laps: dict[str, pd.DataFrame],
        channels: list[str] | None = None,
        distance_step: float = 1.0,
    ) -> pd.DataFrame:
        """
        Aligns a dictionary of {lap_id: lap_df} onto a common distance grid.
        Returns a single combined DataFrame with columns formatted as:
        [distance, {lap_id}_{channel}, ...]
        """
        if not laps:
            return pd.DataFrame()

        channels = channels or ["speed", "throttle", "brake", "gear", "timestamp"]

        # Determine overlapping common distance envelope
        common_s_min = max(df["distance"].min() for df in laps.values())
        common_s_max = min(df["distance"].max() for df in laps.values())

        if common_s_min >= common_s_max:
            raise ValueError(
                f"No overlapping distance range between laps: min={common_s_min}, max={common_s_max}"
            )

        aligned_dfs: dict[str, pd.DataFrame] = {}
        for lap_id, df in laps.items():
            resampled = DistanceResampler.resample(
                df,
                distance_step=distance_step,
                start_dist=common_s_min,
                end_dist=common_s_max,
            )
            aligned_dfs[lap_id] = resampled

        # Build master merged dataframe
        first_lap_id = next(iter(aligned_dfs))
        grid_dist = aligned_dfs[first_lap_id]["distance"].values
        result: dict[str, np.ndarray] = {"distance": grid_dist}

        for lap_id, df in aligned_dfs.items():
            for ch in channels:
                if ch in df.columns:
                    col_name = f"{lap_id}_{ch}"
                    result[col_name] = df[ch].values

        return pd.DataFrame(result)


class TimeDeltaCalculator:
    """
    Computes mathematical cumulative time differences and velocity deltas
    between a comparison lap and a reference lap as a function of distance:
    Δt(s) = t_comp(s) - t_ref(s)
    Δv(s) = v_comp(s) - v_ref(s)
    """

    @classmethod
    def compute(
        cls,
        reference_df: pd.DataFrame,
        comparison_df: pd.DataFrame,
        reference_lap_id: str = "reference",
        comparison_lap_id: str = "comparison",
        distance_step: float = 1.0,
    ) -> LapComparisonResponse:
        # Align both onto common distance grid
        common_min = max(
            float(reference_df["distance"].min()),
            float(comparison_df["distance"].min()),
        )
        common_max = min(
            float(reference_df["distance"].max()),
            float(comparison_df["distance"].max()),
        )

        if common_min >= common_max:
            raise ValueError(
                f"No overlapping track distance between laps: [{common_min}m, {common_max}m]"
            )

        res_ref = DistanceResampler.resample(
            reference_df,
            distance_step=distance_step,
            start_dist=common_min,
            end_dist=common_max,
        )
        res_comp = DistanceResampler.resample(
            comparison_df,
            distance_step=distance_step,
            start_dist=common_min,
            end_dist=common_max,
        )

        dist = res_ref["distance"].to_numpy()
        ref_t = res_ref["timestamp"].to_numpy()
        comp_t = res_comp["timestamp"].to_numpy()
        ref_v = res_ref["speed"].to_numpy()
        comp_v = res_comp["speed"].to_numpy()

        # Zero-index starting time offsets to measure relative elapsed time along lap
        ref_elapsed = ref_t - ref_t[0]
        comp_elapsed = comp_t - comp_t[0]

        # Cumulative time delta: positive means comparison lap is slower (taking more time to reach distance s)
        time_delta = comp_elapsed - ref_elapsed
        speed_delta = comp_v - ref_v

        return LapComparisonResponse(
            reference_lap_id=reference_lap_id,
            comparison_lap_id=comparison_lap_id,
            point_count=len(dist),
            distance=np.round(dist, 2).tolist(),
            reference_speed=np.round(ref_v, 2).tolist(),
            comparison_speed=np.round(comp_v, 2).tolist(),
            speed_delta=np.round(speed_delta, 2).tolist(),
            reference_time=np.round(ref_elapsed, 4).tolist(),
            comparison_time=np.round(comp_elapsed, 4).tolist(),
            time_delta=np.round(time_delta, 4).tolist(),
        )
