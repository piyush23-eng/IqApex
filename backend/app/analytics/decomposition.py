import pandas as pd

from app.analytics.corner_analysis import MONZA_CORNERS, MONZA_SECTORS
from app.analytics.segmentation import LapSegmenter
from app.schemas.analysis import CircuitCornerDefinition
from app.schemas.decomposition import (
    CornerTimeGrowth,
    LapDecompositionResult,
    PhaseContribution,
    ProvenanceMetadata,
    SectorDecomposition,
    WaterfallStep,
)
from app.schemas.domain import Lap


class LapTimeDecomposer:
    """
    Decomposes total lap delta into measurable physical phases:
    Braking, Cornering, Acceleration, and Straight-line,
    with mathematically transparent and non-hidden residuals.
    """

    @classmethod
    def decompose(
        cls,
        ref_df: pd.DataFrame,
        comp_df: pd.DataFrame,
        ref_lap: Lap,
        comp_lap: Lap,
        corners: list[CircuitCornerDefinition] | None = None,
        reference_method: str = "selected_lap",
        processing_run_id: str = "pr-demo-baseline-001",
    ) -> LapDecompositionResult:
        if corners is None:
            corners = MONZA_CORNERS

        total_lap_delta = round(comp_lap.lap_time - ref_lap.lap_time, 4)

        # 1. Segment reference lap into physical phases
        segments = LapSegmenter.segment_lap(ref_df, corners)

        phase_contributions: list[PhaseContribution] = []
        braking_sum = 0.0
        cornering_sum = 0.0
        accel_sum = 0.0
        straight_sum = 0.0

        for seg in segments:
            r_slice = ref_df[
                (ref_df["distance"] >= seg.start_distance)
                & (ref_df["distance"] <= seg.end_distance)
            ]
            c_slice = comp_df[
                (comp_df["distance"] >= seg.start_distance)
                & (comp_df["distance"] <= seg.end_distance)
            ]

            if r_slice.empty or c_slice.empty or len(r_slice) < 2 or len(c_slice) < 2:
                continue

            r_dur = float(r_slice.iloc[-1]["timestamp"] - r_slice.iloc[0]["timestamp"])
            c_dur = float(c_slice.iloc[-1]["timestamp"] - c_slice.iloc[0]["timestamp"])
            dt = round(c_dur - r_dur, 4)

            # Safeguard division by near-zero total delta
            pct = (
                round((dt / total_lap_delta) * 100.0, 1)
                if abs(total_lap_delta) >= 0.005
                else None
            )

            confidence = "High" if seg.distance_span >= 30.0 else "Moderate"

            phase_contributions.append(
                PhaseContribution(
                    phase_name=seg.phase_name,
                    category=seg.category,
                    start_distance=round(seg.start_distance, 1),
                    end_distance=round(seg.end_distance, 1),
                    distance_span=round(seg.distance_span, 1),
                    ref_duration=round(r_dur, 4),
                    comp_duration=round(c_dur, 4),
                    delta_time=dt,
                    percentage_of_total=pct,
                    confidence=confidence,
                )
            )

            if seg.category == "braking":
                braking_sum += dt
            elif seg.category == "cornering":
                cornering_sum += dt
            elif seg.category == "acceleration":
                accel_sum += dt
            elif seg.category == "straight":
                straight_sum += dt

        braking_delta = round(braking_sum, 4)
        cornering_delta = round(cornering_sum, 4)
        acceleration_delta = round(accel_sum, 4)
        straight_delta = round(straight_sum, 4)

        # 2. Compute Mathematical Residual (Strict No-Hidden-Residuals Principle)
        summed_phases = braking_delta + cornering_delta + acceleration_delta + straight_delta
        residual = round(total_lap_delta - summed_phases, 4)

        # 3. Corner Time-Delta Growth Analysis (entry -> apex -> exit)
        corners_growth = cls._compute_corner_time_growth(ref_df, comp_df, corners)

        # 4. Sector Decomposition
        sectors = cls._compute_sector_decomposition(ref_lap, comp_lap, corners_growth, segments, ref_df, comp_df)

        # 5. Waterfall Steps
        waterfall_steps = cls._generate_waterfall_steps(corners_growth, total_lap_delta, residual)

        # 6. Provenance Metadata
        provenance = ProvenanceMetadata(
            reference_lap_id=ref_lap.lap_id,
            comparison_lap_id=comp_lap.lap_id,
            spatial_grid_resolution_m=1.0,
            processing_run_id=processing_run_id,
            pipeline_version="2.0.0",
            methodology="Spatial distance-aligned 1m phase integration with explicit residual reporting",
        )

        is_demo = ref_lap.lap_id.startswith("lap-demo-") or comp_lap.lap_id.startswith("lap-demo-")
        label = "Synthetic demonstration dataset" if is_demo else "Vehicle telemetry recording"

        return LapDecompositionResult(
            reference_lap_id=ref_lap.lap_id,
            comparison_lap_id=comp_lap.lap_id,
            data_label=label,
            reference_method=reference_method,
            total_lap_delta=total_lap_delta,
            braking_delta=braking_delta,
            cornering_delta=cornering_delta,
            acceleration_delta=acceleration_delta,
            straight_delta=straight_delta,
            residual=residual,
            phases=phase_contributions,
            corners_growth=corners_growth,
            sectors=sectors,
            waterfall_steps=waterfall_steps,
            provenance=provenance,
        )

    @classmethod
    def _compute_corner_time_growth(
        cls,
        ref_df: pd.DataFrame,
        comp_df: pd.DataFrame,
        corners: list[CircuitCornerDefinition],
    ) -> list[CornerTimeGrowth]:
        results: list[CornerTimeGrowth] = []

        for c in corners:
            # Locate exact time delta at entry, apex, exit
            entry_delta = cls._get_time_delta_at(ref_df, comp_df, c.entry_distance)
            apex_delta = cls._get_time_delta_at(ref_df, comp_df, c.apex_distance)
            exit_delta = cls._get_time_delta_at(ref_df, comp_df, c.exit_distance)

            entry_to_apex = round(apex_delta - entry_delta, 4)
            apex_to_exit = round(exit_delta - apex_delta, 4)
            total_corner = round(exit_delta - entry_delta, 4)

            results.append(
                CornerTimeGrowth(
                    corner_id=c.corner_id,
                    corner_name=c.name,
                    turn_number=c.turn_number,
                    entry_distance=round(c.entry_distance, 1),
                    apex_distance=round(c.apex_distance, 1),
                    exit_distance=round(c.exit_distance, 1),
                    entry_delta_time=round(entry_delta, 4),
                    apex_delta_time=round(apex_delta, 4),
                    exit_delta_time=round(exit_delta, 4),
                    entry_to_apex_growth=entry_to_apex,
                    apex_to_exit_growth=apex_to_exit,
                    total_corner_delta=total_corner,
                )
            )

        return results

    @staticmethod
    def _get_time_delta_at(
        ref_df: pd.DataFrame, comp_df: pd.DataFrame, distance: float
    ) -> float:
        r_row = ref_df.iloc[(ref_df["distance"] - distance).abs().argsort()[:1]]
        c_row = comp_df.iloc[(comp_df["distance"] - distance).abs().argsort()[:1]]
        if r_row.empty or c_row.empty:
            return 0.0
        return float(c_row.iloc[0]["timestamp"] - r_row.iloc[0]["timestamp"])

    @classmethod
    def _compute_sector_decomposition(
        cls,
        ref_lap: Lap,
        comp_lap: Lap,
        corners_growth: list[CornerTimeGrowth],
        segments: list,
        ref_df: pd.DataFrame,
        comp_df: pd.DataFrame,
    ) -> list[SectorDecomposition]:
        sectors: list[SectorDecomposition] = []
        sec_splits = [
            (1, MONZA_SECTORS[0]["start_distance"], MONZA_SECTORS[0]["end_distance"], comp_lap.sector_1 - ref_lap.sector_1),
            (2, MONZA_SECTORS[1]["start_distance"], MONZA_SECTORS[1]["end_distance"], comp_lap.sector_2 - ref_lap.sector_2),
            (3, MONZA_SECTORS[2]["start_distance"], MONZA_SECTORS[2]["end_distance"], comp_lap.sector_3 - ref_lap.sector_3),
        ]

        for sec_num, s_min, s_max, sec_delta in sec_splits:
            corner_map: dict[str, float] = {}
            for cg in corners_growth:
                if s_min <= cg.apex_distance <= s_max:
                    corner_map[cg.corner_id] = cg.total_corner_delta

            # Compute straight delta in this sector
            straight_dt = 0.0
            for seg in segments:
                if seg.category in ("straight", "acceleration") and s_min <= seg.start_distance < s_max:
                    r_slice = ref_df[(ref_df["distance"] >= seg.start_distance) & (ref_df["distance"] <= seg.end_distance)]
                    c_slice = comp_df[(comp_df["distance"] >= seg.start_distance) & (comp_df["distance"] <= seg.end_distance)]
                    if len(r_slice) >= 2 and len(c_slice) >= 2:
                        straight_dt += float(
                            (c_slice.iloc[-1]["timestamp"] - c_slice.iloc[0]["timestamp"])
                            - (r_slice.iloc[-1]["timestamp"] - r_slice.iloc[0]["timestamp"])
                        )

            corners_sum = sum(corner_map.values())
            sector_residual = round(sec_delta - (corners_sum + straight_dt), 4)

            sectors.append(
                SectorDecomposition(
                    sector=sec_num,
                    start_distance=s_min,
                    end_distance=s_max,
                    total_delta=round(sec_delta, 4),
                    corner_contributions=corner_map,
                    straight_contribution=round(straight_dt, 4),
                    sector_residual=sector_residual,
                )
            )

        return sectors

    @classmethod
    def _generate_waterfall_steps(
        cls,
        corners_growth: list[CornerTimeGrowth],
        total_delta: float,
        residual: float,
    ) -> list[WaterfallStep]:
        steps: list[WaterfallStep] = []
        current_time = 0.0

        # Step 0: Reference baseline
        steps.append(
            WaterfallStep(
                step_index=0,
                label="Reference Lap",
                category="baseline",
                start_time=0.0,
                increment=0.0,
                end_time=0.0,
                distance_range="0 m",
            )
        )

        idx = 1
        for cg in corners_growth:
            start_t = round(current_time, 4)
            inc = cg.total_corner_delta
            current_time += inc
            end_t = round(current_time, 4)

            steps.append(
                WaterfallStep(
                    step_index=idx,
                    label=f"{cg.corner_id} ({cg.corner_name.split('(')[0].strip()})",
                    category="corner",
                    start_time=start_t,
                    increment=round(inc, 4),
                    end_time=end_t,
                    distance_range=f"{Math_round(cg.entry_distance)}m–{Math_round(cg.exit_distance)}m",
                )
            )
            idx += 1

        # Residual step (explicit)
        start_t = round(current_time, 4)
        current_time += residual
        end_t = round(current_time, 4)
        steps.append(
            WaterfallStep(
                step_index=idx,
                label="Decomposition Residual",
                category="residual",
                start_time=start_t,
                increment=round(residual, 4),
                end_time=end_t,
                distance_range="Lap Span",
            )
        )
        idx += 1

        # Final comparison total
        steps.append(
            WaterfallStep(
                step_index=idx,
                label="Comparison Lap Total",
                category="total",
                start_time=0.0,
                increment=round(total_delta, 4),
                end_time=round(total_delta, 4),
                distance_range="0–5793 m",
            )
        )

        return steps


def Math_round(val: float) -> int:
    return round(val)
