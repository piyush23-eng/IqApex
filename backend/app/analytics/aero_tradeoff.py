from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np
import pandas as pd


@dataclass
class ParetoPoint:
    config_id: str
    front_wing_angle: float
    rear_wing_angle: float
    ride_height_front: float
    ride_height_rear: float
    downforce_n: float
    drag_n: float
    lift_to_drag: float
    aero_balance_pct: float
    is_pareto_optimal: bool
    dominance_rank: int


@dataclass
class ParetoFrontierResult:
    total_evaluated: int
    pareto_efficient_count: int
    dominated_count: int
    points: list[ParetoPoint]
    pareto_frontier: list[ParetoPoint]
    disclaimer: str = (
        "Pareto efficiency indicates no objective (Downforce or Drag) can be improved without worsening another. "
        "It does NOT declare a single 'best setup'."
    )
    scientific_label: str = "Synthetic multi-objective trade-off analysis"


class AeroTradeOffEngine:
    """
    Computes multi-objective Pareto frontiers (maximizing Downforce while minimizing Drag)
    and generates 2D response contour matrices.
    """

    @staticmethod
    def compute_pareto_frontier(df: pd.DataFrame, max_points: int = 150) -> ParetoFrontierResult:
        """
        Calculates Pareto efficiency across downforce and drag.
        Objective 1: Maximize Downforce (F1 = -Downforce)
        Objective 2: Minimize Drag (F2 = Drag)
        """
        # Downsample if dataset is large for rapid interactive chart response
        sub_df = df.sample(n=min(len(df), max_points), random_state=42871) if len(df) > max_points else df.copy()

        downforce = sub_df["downforce_n"].values
        drag = sub_df["drag_n"].values
        n = len(sub_df)

        is_pareto = np.ones(n, dtype=bool)
        dominance_ranks = np.zeros(n, dtype=int)

        for i in range(n):
            for j in range(n):
                if (
                    i != j
                    and (downforce[j] >= downforce[i] and drag[j] <= drag[i])
                    and (downforce[j] > downforce[i] or drag[j] < drag[i])
                ):
                    dominance_ranks[i] += 1
                    is_pareto[i] = False

        points: list[ParetoPoint] = []
        for idx, (_, row) in enumerate(sub_df.iterrows()):
            pt = ParetoPoint(
                config_id=f"cfg_{idx:04d}",
                front_wing_angle=float(row["front_wing_angle"]),
                rear_wing_angle=float(row["rear_wing_angle"]),
                ride_height_front=float(row["ride_height_front"]),
                ride_height_rear=float(row["ride_height_rear"]),
                downforce_n=round(float(row["downforce_n"]), 1),
                drag_n=round(float(row["drag_n"]), 1),
                lift_to_drag=round(float(row["lift_to_drag"]), 3),
                aero_balance_pct=round(float(row["aero_balance_pct"]), 2),
                is_pareto_optimal=bool(is_pareto[idx]),
                dominance_rank=int(dominance_ranks[idx]),
            )
            points.append(pt)

        # Sort pareto frontier by increasing drag
        pareto_points = sorted([p for p in points if p.is_pareto_optimal], key=lambda x: x.drag_n)

        return ParetoFrontierResult(
            total_evaluated=n,
            pareto_efficient_count=len(pareto_points),
            dominated_count=n - len(pareto_points),
            points=points,
            pareto_frontier=pareto_points,
        )

    @staticmethod
    def generate_2d_surface(
        surrogate_model: Any,
        fixed_parameters: dict[str, float],
        x_feature: str = "front_wing_angle",
        y_feature: str = "rear_wing_angle",
        grid_resolution: int = 25,
    ) -> dict[str, Any]:
        """
        Generates regular 2D grid matrix with interpolation/extrapolation mask.
        """
        x_domain = surrogate_model.observed_domain.get(x_feature, (10.0, 35.0))
        y_domain = surrogate_model.observed_domain.get(y_feature, (15.0, 40.0))

        # Include 10% margin to demonstrate extrapolation warning boundary
        x_span = x_domain[1] - x_domain[0]
        y_span = y_domain[1] - y_domain[0]

        x_vals = np.linspace(x_domain[0] - 0.1 * x_span, x_domain[1] + 0.1 * x_span, grid_resolution)
        y_vals = np.linspace(y_domain[0] - 0.1 * y_span, y_domain[1] + 0.1 * y_span, grid_resolution)

        z_matrix = np.zeros((grid_resolution, grid_resolution))
        interp_mask = np.zeros((grid_resolution, grid_resolution), dtype=bool)

        for i, y_v in enumerate(y_vals):
            for j, x_v in enumerate(x_vals):
                query = dict(fixed_parameters)
                query[x_feature] = float(x_v)
                query[y_feature] = float(y_v)

                pred = surrogate_model.predict_single(query)
                z_matrix[i, j] = pred.prediction
                interp_mask[i, j] = (pred.domain_status == "INTERPOLATION")

        return {
            "x_feature": x_feature,
            "y_feature": y_feature,
            "target": surrogate_model.target_name,
            "x_values": [round(float(v), 2) for v in x_vals],
            "y_values": [round(float(v), 2) for v in y_vals],
            "z_matrix": [[round(float(v), 2) for v in row] for row in z_matrix],
            "interpolation_mask": [[bool(v) for v in row] for row in interp_mask],
            "observed_x_bounds": x_domain,
            "observed_y_bounds": y_domain,
        }
