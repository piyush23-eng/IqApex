import pandas as pd

from app.schemas.analysis import CircuitCornerDefinition, CornerMetric, SectorComparison

# Standard Autodromo Nazionale Monza Corner Definitions (5,793m)
MONZA_CORNERS: list[CircuitCornerDefinition] = [
    CircuitCornerDefinition(
        corner_id="T1",
        name="Variante del Rettifilo (T1)",
        turn_number=1,
        entry_distance=950.0,
        apex_distance=1020.0,
        exit_distance=1080.0,
        circuit="Autodromo Nazionale Monza",
    ),
    CircuitCornerDefinition(
        corner_id="T2",
        name="Variante del Rettifilo (T2)",
        turn_number=2,
        entry_distance=1080.0,
        apex_distance=1160.0,
        exit_distance=1220.0,
        circuit="Autodromo Nazionale Monza",
    ),
    CircuitCornerDefinition(
        corner_id="T3",
        name="Curva Biassono (Curva Grande)",
        turn_number=3,
        entry_distance=1380.0,
        apex_distance=1620.0,
        exit_distance=1850.0,
        circuit="Autodromo Nazionale Monza",
    ),
    CircuitCornerDefinition(
        corner_id="T4",
        name="Variante della Roggia (T4)",
        turn_number=4,
        entry_distance=2080.0,
        apex_distance=2160.0,
        exit_distance=2240.0,
        circuit="Autodromo Nazionale Monza",
    ),
    CircuitCornerDefinition(
        corner_id="T5",
        name="Variante della Roggia (T5)",
        turn_number=5,
        entry_distance=2240.0,
        apex_distance=2290.0,
        exit_distance=2360.0,
        circuit="Autodromo Nazionale Monza",
    ),
    CircuitCornerDefinition(
        corner_id="T6",
        name="Curva di Lesmo 1",
        turn_number=6,
        entry_distance=2520.0,
        apex_distance=2620.0,
        exit_distance=2720.0,
        circuit="Autodromo Nazionale Monza",
    ),
    CircuitCornerDefinition(
        corner_id="T7",
        name="Curva di Lesmo 2",
        turn_number=7,
        entry_distance=2820.0,
        apex_distance=2930.0,
        exit_distance=3040.0,
        circuit="Autodromo Nazionale Monza",
    ),
    CircuitCornerDefinition(
        corner_id="T8",
        name="Variante Ascari (T8)",
        turn_number=8,
        entry_distance=4020.0,
        apex_distance=4110.0,
        exit_distance=4170.0,
        circuit="Autodromo Nazionale Monza",
    ),
    CircuitCornerDefinition(
        corner_id="T9",
        name="Variante Ascari (T9)",
        turn_number=9,
        entry_distance=4170.0,
        apex_distance=4230.0,
        exit_distance=4290.0,
        circuit="Autodromo Nazionale Monza",
    ),
    CircuitCornerDefinition(
        corner_id="T10",
        name="Variante Ascari (T10)",
        turn_number=10,
        entry_distance=4290.0,
        apex_distance=4350.0,
        exit_distance=4420.0,
        circuit="Autodromo Nazionale Monza",
    ),
    CircuitCornerDefinition(
        corner_id="T11",
        name="Curva Parabolica (Alboreto)",
        turn_number=11,
        entry_distance=5120.0,
        apex_distance=5380.0,
        exit_distance=5650.0,
        circuit="Autodromo Nazionale Monza",
    ),
]

MONZA_SECTORS = [
    {"sector": 1, "start_distance": 0.0, "end_distance": 1842.0},
    {"sector": 2, "start_distance": 1842.0, "end_distance": 3611.0},
    {"sector": 3, "start_distance": 3611.0, "end_distance": 5793.0},
]


def get_circuit_corners(circuit: str) -> list[CircuitCornerDefinition]:
    """Return track corner definitions for the requested circuit."""
    circuit_lower = circuit.lower()
    if "monza" in circuit_lower:
        return MONZA_CORNERS
    return MONZA_CORNERS  # Default to Monza for current session


class CornerKinematicsCalculator:
    """
    Computes rigorous, measured corner kinematic metrics from distance-aligned
    telemetry without subjective heuristics.
    """

    @classmethod
    def compute_corner_metrics(
        cls,
        ref_df: pd.DataFrame,
        comp_df: pd.DataFrame,
        corners: list[CircuitCornerDefinition] | None = None,
    ) -> list[CornerMetric]:
        if corners is None:
            corners = MONZA_CORNERS

        metrics: list[CornerMetric] = []

        for c in corners:
            # Slices strictly within corner boundary
            ref_slice = ref_df[
                (ref_df["distance"] >= c.entry_distance)
                & (ref_df["distance"] <= c.exit_distance)
            ]
            comp_slice = comp_df[
                (comp_df["distance"] >= c.entry_distance)
                & (comp_df["distance"] <= c.exit_distance)
            ]

            if ref_slice.empty or comp_slice.empty:
                continue

            # Measured speeds
            ref_entry_speed = float(ref_slice.iloc[0]["speed"])
            comp_entry_speed = float(comp_slice.iloc[0]["speed"])
            ref_exit_speed = float(ref_slice.iloc[-1]["speed"])
            comp_exit_speed = float(comp_slice.iloc[-1]["speed"])

            # True kinematic apex is the location of minimum speed
            ref_min_idx = ref_slice["speed"].idxmin()
            ref_min_speed = float(ref_slice.loc[ref_min_idx, "speed"])
            ref_apex_dist = float(ref_slice.loc[ref_min_idx, "distance"])

            comp_min_idx = comp_slice["speed"].idxmin()
            comp_min_speed = float(comp_slice.loc[comp_min_idx, "speed"])
            comp_apex_dist = float(comp_slice.loc[comp_min_idx, "distance"])

            # Corner transit duration
            ref_corner_time = float(
                ref_slice.iloc[-1]["timestamp"] - ref_slice.iloc[0]["timestamp"]
            )
            comp_corner_time = float(
                comp_slice.iloc[-1]["timestamp"] - comp_slice.iloc[0]["timestamp"]
            )

            # Cumulative time delta at corner exit
            exit_ref_t = float(ref_slice.iloc[-1]["timestamp"])
            exit_comp_t = float(comp_slice.iloc[-1]["timestamp"])
            cumulative_delta_exit = exit_comp_t - exit_ref_t

            # Braking point detection: first brake application > 5% within [entry - 150m, apex]
            brake_search_min = max(0.0, c.entry_distance - 150.0)
            ref_pre_apex = ref_df[
                (ref_df["distance"] >= brake_search_min)
                & (ref_df["distance"] <= ref_apex_dist)
            ]
            comp_pre_apex = comp_df[
                (comp_df["distance"] >= brake_search_min)
                & (comp_df["distance"] <= comp_apex_dist)
            ]

            ref_braking_pt = cls._detect_first_threshold(
                ref_pre_apex, "brake", threshold=5.0
            )
            comp_braking_pt = cls._detect_first_threshold(
                comp_pre_apex, "brake", threshold=5.0
            )
            braking_pt_delta = (
                round(comp_braking_pt - ref_braking_pt, 2)
                if (ref_braking_pt is not None and comp_braking_pt is not None)
                else None
            )

            # Throttle application pickup: first throttle > 15% after apex
            ref_post_apex = ref_df[
                (ref_df["distance"] >= ref_apex_dist)
                & (ref_df["distance"] <= c.exit_distance + 50.0)
            ]
            comp_post_apex = comp_df[
                (comp_df["distance"] >= comp_apex_dist)
                & (comp_df["distance"] <= c.exit_distance + 50.0)
            ]

            ref_throttle_pt = cls._detect_first_threshold(
                ref_post_apex, "throttle", threshold=15.0
            )
            comp_throttle_pt = cls._detect_first_threshold(
                comp_post_apex, "throttle", threshold=15.0
            )
            throttle_pt_delta = (
                round(comp_throttle_pt - ref_throttle_pt, 2)
                if (ref_throttle_pt is not None and comp_throttle_pt is not None)
                else None
            )

            metric = CornerMetric(
                corner_id=c.corner_id,
                corner_name=c.name,
                turn_number=c.turn_number,
                entry_distance=round(c.entry_distance, 1),
                apex_distance=round(c.apex_distance, 1),
                exit_distance=round(c.exit_distance, 1),
                ref_entry_speed=round(ref_entry_speed, 2),
                comp_entry_speed=round(comp_entry_speed, 2),
                entry_speed_delta=round(comp_entry_speed - ref_entry_speed, 2),
                ref_min_speed=round(ref_min_speed, 2),
                comp_min_speed=round(comp_min_speed, 2),
                min_speed_delta=round(comp_min_speed - ref_min_speed, 2),
                ref_apex_distance=round(ref_apex_dist, 1),
                comp_apex_distance=round(comp_apex_dist, 1),
                ref_exit_speed=round(ref_exit_speed, 2),
                comp_exit_speed=round(comp_exit_speed, 2),
                exit_speed_delta=round(comp_exit_speed - ref_exit_speed, 2),
                ref_braking_point=ref_braking_pt,
                comp_braking_point=comp_braking_pt,
                braking_point_delta=braking_pt_delta,
                ref_throttle_pickup=ref_throttle_pt,
                comp_throttle_pickup=comp_throttle_pt,
                throttle_pickup_delta=throttle_pt_delta,
                ref_corner_time=round(ref_corner_time, 4),
                comp_corner_time=round(comp_corner_time, 4),
                corner_time_delta=round(comp_corner_time - ref_corner_time, 4),
                cumulative_time_delta_exit=round(cumulative_delta_exit, 4),
            )
            metrics.append(metric)

        return metrics

    @staticmethod
    def _detect_first_threshold(
        df_slice: pd.DataFrame, channel: str, threshold: float
    ) -> float | None:
        if df_slice.empty or channel not in df_slice.columns:
            return None
        above = df_slice[df_slice[channel] >= threshold]
        if above.empty:
            return None
        return round(float(above.iloc[0]["distance"]), 1)

    @classmethod
    def compute_sector_comparisons(
        cls,
        ref_s1: float,
        ref_s2: float,
        ref_s3: float,
        comp_s1: float,
        comp_s2: float,
        comp_s3: float,
    ) -> list[SectorComparison]:
        """Compute measured sector splits and deltas."""
        return [
            SectorComparison(
                sector=1,
                start_distance=MONZA_SECTORS[0]["start_distance"],
                end_distance=MONZA_SECTORS[0]["end_distance"],
                ref_time=round(ref_s1, 3),
                comp_time=round(comp_s1, 3),
                delta=round(comp_s1 - ref_s1, 3),
            ),
            SectorComparison(
                sector=2,
                start_distance=MONZA_SECTORS[1]["start_distance"],
                end_distance=MONZA_SECTORS[1]["end_distance"],
                ref_time=round(ref_s2, 3),
                comp_time=round(comp_s2, 3),
                delta=round(comp_s2 - ref_s2, 3),
            ),
            SectorComparison(
                sector=3,
                start_distance=MONZA_SECTORS[2]["start_distance"],
                end_distance=MONZA_SECTORS[2]["end_distance"],
                ref_time=round(ref_s3, 3),
                comp_time=round(comp_s3, 3),
                delta=round(comp_s3 - ref_s3, 3),
            ),
        ]
