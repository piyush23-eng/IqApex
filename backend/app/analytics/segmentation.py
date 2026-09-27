from typing import Literal

import pandas as pd

from app.analytics.config import PERF_CONFIG, PerformanceThresholds
from app.schemas.analysis import CircuitCornerDefinition

PhaseCategory = Literal["braking", "cornering", "acceleration", "straight"]


class TelemetryPhaseSegment:
    def __init__(
        self,
        phase_name: str,
        category: PhaseCategory,
        start_distance: float,
        end_distance: float,
    ) -> None:
        self.phase_name = phase_name
        self.category = category
        self.start_distance = start_distance
        self.end_distance = end_distance

    @property
    def distance_span(self) -> float:
        return self.end_distance - self.start_distance


class LapSegmenter:
    """
    Segments distance-aligned telemetry into physical, traceable performance phases:
    1. Braking
    2. Corner Entry
    3. Apex / Cornering
    4. Corner Exit / Acceleration
    5. Straight
    """

    @classmethod
    def segment_lap(
        cls,
        df: pd.DataFrame,
        corners: list[CircuitCornerDefinition],
        thresholds: PerformanceThresholds | None = None,
    ) -> list[TelemetryPhaseSegment]:
        cfg = thresholds or PERF_CONFIG
        if df.empty:
            return []

        # Sort by distance
        df_sorted = df.sort_values("distance").reset_index(drop=True)
        distances = df_sorted["distance"].values
        brakes = df_sorted["brake"].values if "brake" in df_sorted else [0.0] * len(df)
        throttles = df_sorted["throttle"].values if "throttle" in df_sorted else [0.0] * len(df)
        long_gs = (
            df_sorted["longitudinal_acceleration"].values
            if "longitudinal_acceleration" in df_sorted
            else [0.0] * len(df)
        )

        speeds = df_sorted["speed"].values if "speed" in df_sorted else [0.0] * len(df)

        n = len(distances)
        point_phases: list[tuple[str, PhaseCategory]] = []

        for i in range(n):
            s = float(distances[i])
            brk = float(brakes[i])
            thr = float(throttles[i])
            lon_g = float(long_gs[i])
            spd = float(speeds[i])

            # Check if inside any corner envelope
            active_corner = None
            for c in corners:
                if c.entry_distance <= s <= c.exit_distance:
                    active_corner = c
                    break

            if brk >= cfg.braking.min_brake_pressure or lon_g <= cfg.braking.deceleration_threshold:
                point_phases.append(("Braking", "braking"))
            elif active_corner is not None:
                # Inside corner envelope
                apex_s = active_corner.apex_distance
                if s < apex_s - 15.0:
                    point_phases.append((f"{active_corner.corner_id} Entry", "cornering"))
                elif s <= apex_s + 15.0:
                    point_phases.append((f"{active_corner.corner_id} Apex", "cornering"))
                else:
                    if thr >= cfg.acceleration.min_throttle:
                        point_phases.append((f"{active_corner.corner_id} Exit Accel", "acceleration"))
                    else:
                        point_phases.append((f"{active_corner.corner_id} Exit", "cornering"))
            else:
                # Outside corner envelopes (straights)
                # If high-speed cruise / terminal velocity or low accel -> straight-line
                if spd >= 300.0 or lon_g < cfg.acceleration.longitudinal_accel_threshold:
                    point_phases.append(("Straight-line", "straight"))
                else:
                    point_phases.append(("Straight Acceleration", "acceleration"))

        # Merge contiguous slices of identical (phase_name, category)
        segments: list[TelemetryPhaseSegment] = []
        if not point_phases:
            return segments

        curr_name, curr_cat = point_phases[0]
        start_dist = float(distances[0])

        for i in range(1, n):
            name, cat = point_phases[i]
            if name != curr_name:
                end_dist = float(distances[i - 1])
                segments.append(
                    TelemetryPhaseSegment(
                        phase_name=curr_name,
                        category=curr_cat,
                        start_distance=start_dist,
                        end_distance=end_dist,
                    )
                )
                curr_name, curr_cat = name, cat
                start_dist = float(distances[i])

        # Final segment
        segments.append(
            TelemetryPhaseSegment(
                phase_name=curr_name,
                category=curr_cat,
                start_distance=start_dist,
                end_distance=float(distances[-1]),
            )
        )

        return segments
