import math

import numpy as np
import pandas as pd

CATEGORICAL_CHANNELS = {"gear", "drs"}


class DistanceResampler:
    """
    Resamples telemetry channels onto a uniform spatial distance grid (default 1.0 m).
    Ensures appropriate mathematical interpolation methods are applied per channel type:
    - Continuous channels (speed, throttle, brake, accelerations) -> Linear interpolation
    - Discrete/categorical channels (gear, drs) -> Nearest-neighbor interpolation
    """

    @classmethod
    def resample(
        cls,
        df: pd.DataFrame,
        distance_step: float = 1.0,
        start_dist: float | None = None,
        end_dist: float | None = None,
    ) -> pd.DataFrame:
        if "distance" not in df.columns:
            raise ValueError(
                "Input DataFrame missing required 'distance' channel for spatial resampling."
            )

        if len(df) < 2:
            return df.copy()

        # Sort by distance and drop duplicate distance coordinates to ensure strictly increasing domain
        clean_df = df.sort_values(by="distance").drop_duplicates(subset=["distance"])
        src_dist = clean_df["distance"].to_numpy(dtype=float)

        s_min = start_dist if start_dist is not None else math.ceil(src_dist[0])
        s_max = end_dist if end_dist is not None else math.floor(src_dist[-1])

        if s_min >= s_max:
            raise ValueError(f"Invalid distance span: start {s_min}m >= end {s_max}m")

        # Generate uniform 1m distance grid
        grid_s = np.arange(s_min, s_max + (distance_step * 0.5), distance_step)

        resampled_data: dict[str, np.ndarray] = {"distance": np.round(grid_s, 2)}

        for col in clean_df.columns:
            if col == "distance":
                continue

            vals = clean_df[col].to_numpy()

            if col in CATEGORICAL_CHANNELS:
                # Nearest-neighbor interpolation for discrete states (gear, DRS)
                # Find index of closest source distance for each grid distance
                indices = np.searchsorted(src_dist, grid_s)
                indices = np.clip(indices, 0, len(src_dist) - 1)

                # Pick closer of index or index-1
                left_indices = np.clip(indices - 1, 0, len(src_dist) - 1)
                dist_right = np.abs(src_dist[indices] - grid_s)
                dist_left = np.abs(src_dist[left_indices] - grid_s)

                use_left = dist_left < dist_right
                final_indices = np.where(use_left, left_indices, indices)

                resampled_vals = vals[final_indices]
                resampled_data[col] = resampled_vals.astype(int)
            else:
                # Linear interpolation for continuous physical measurements
                if pd.api.types.is_numeric_dtype(clean_df[col]):
                    interp_vals = np.interp(grid_s, src_dist, vals)
                    resampled_data[col] = np.round(interp_vals, 4)
                else:
                    # Non-numeric passthrough (forward fill)
                    indices = np.searchsorted(src_dist, grid_s, side="right") - 1
                    indices = np.clip(indices, 0, len(vals) - 1)
                    resampled_data[col] = vals[indices]

        return pd.DataFrame(resampled_data)
