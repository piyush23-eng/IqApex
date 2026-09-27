from __future__ import annotations

from dataclasses import dataclass

import pandas as pd


@dataclass
class QualityValidationReport:
    total_configurations: int
    retained_configurations: int
    rejected_configurations: int
    quality_score: float
    rejection_reasons: dict[str, int]
    valid_domain_bounds: dict[str, tuple[float, float]]
    label: str = "Synthetic engineering dataset quality audit"


class AeroDatasetQualityAuditor:
    """
    Validates synthetic aerodynamic dataset against strict physical bounds,
    non-physical negative force states, invalid coefficients, and duplicates.
    """

    @staticmethod
    def audit_dataset(df: pd.DataFrame) -> tuple[pd.DataFrame, QualityValidationReport]:
        total = len(df)
        rejection_reasons: dict[str, int] = {
            "missing_values": 0,
            "negative_or_zero_downforce": 0,
            "negative_or_zero_drag": 0,
            "unphysical_lift_drag_ratio": 0,
            "unphysical_aero_balance": 0,
            "out_of_range_parameters": 0,
            "duplicate_configurations": 0,
        }

        # 1. Missing values
        nan_mask = df.isna().any(axis=1)
        rejection_reasons["missing_values"] = int(nan_mask.sum())

        # 2. Negative or non-physical forces & coefficients
        neg_cl_mask = (df["cl"] <= 0.0) | (df["downforce_n"] <= 0.0)
        rejection_reasons["negative_or_zero_downforce"] = int(neg_cl_mask.sum())

        neg_cd_mask = (df["cd"] <= 0.0) | (df["drag_n"] <= 0.0)
        rejection_reasons["negative_or_zero_drag"] = int(neg_cd_mask.sum())

        # 3. Physical L/D bounds (motorsport formula range typically ~1.2 to 4.5)
        unphysical_ld = (df["lift_to_drag"] < 1.0) | (df["lift_to_drag"] > 5.0)
        rejection_reasons["unphysical_lift_drag_ratio"] = int(unphysical_ld.sum())

        # 4. Aero balance bounds (typically 30% - 60% front)
        unphysical_bal = (df["aero_balance_pct"] < 30.0) | (df["aero_balance_pct"] > 60.0)
        rejection_reasons["unphysical_aero_balance"] = int(unphysical_bal.sum())

        # 5. Parameter domain check
        oor_mask = (
            (df["front_wing_angle"] < 9.9) | (df["front_wing_angle"] > 35.1) |
            (df["rear_wing_angle"] < 14.9) | (df["rear_wing_angle"] > 40.1) |
            (df["ride_height_front"] < 24.9) | (df["ride_height_front"] > 45.1) |
            (df["ride_height_rear"] < 29.9) | (df["ride_height_rear"] > 60.1)
        )
        rejection_reasons["out_of_range_parameters"] = int(oor_mask.sum())

        # 6. Duplicates on key inputs
        dup_mask = df.duplicated(
            subset=["front_wing_angle", "rear_wing_angle", "ride_height_front", "ride_height_rear", "yaw_angle", "vehicle_speed"]
        )
        rejection_reasons["duplicate_configurations"] = int(dup_mask.sum())

        # Combined rejection mask
        drop_mask = nan_mask | neg_cl_mask | neg_cd_mask | unphysical_ld | unphysical_bal | oor_mask | dup_mask
        retained_df = df[~drop_mask].copy()

        retained_count = len(retained_df)
        rejected_count = total - retained_count
        quality_score = round((retained_count / max(total, 1)) * 100.0, 2)

        # Domain bounds of retained dataset
        domain_bounds: dict[str, tuple[float, float]] = {}
        for col in ["front_wing_angle", "rear_wing_angle", "ride_height_front", "ride_height_rear", "vehicle_speed", "downforce_n", "drag_n"]:
            if col in retained_df.columns:
                domain_bounds[col] = (float(retained_df[col].min()), float(retained_df[col].max()))

        report = QualityValidationReport(
            total_configurations=total,
            retained_configurations=retained_count,
            rejected_configurations=rejected_count,
            quality_score=quality_score,
            rejection_reasons=rejection_reasons,
            valid_domain_bounds=domain_bounds,
        )

        return retained_df, report
