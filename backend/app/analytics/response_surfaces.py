from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

import numpy as np

from app.analytics.response_models import BaseResponseModel, InteractionResponseModel


@dataclass
class ObservedDataPoint:
    lap_id: str
    x_val: float
    y_val: float


@dataclass
class ResponseCurvePoint:
    x: float
    y_modelled: float
    ci_95_lower: float
    ci_95_upper: float
    pi_95_lower: float
    pi_95_upper: float
    is_extrapolation: bool


@dataclass
class ResponseCurveResult:
    parameter_name: str
    target_name: str
    baseline_x: float
    baseline_y: float
    scenario_x: float
    scenario_y: float
    predicted_delta: float
    uncertainty_95: float
    domain_status: Literal["INTERPOLATION", "EXTRAPOLATION"]
    extrapolation_warning: str | None
    observed_range: tuple[float, float]
    points: list[ResponseCurvePoint]
    observed_data: list[ObservedDataPoint]


@dataclass
class ResponseSurface2DResult:
    feature_x1: str
    feature_x2: str
    target_name: str
    x1_values: list[float]
    x2_values: list[float]
    z_matrix: list[list[float]]  # z[i][j] = prediction at x1[i], x2[j]
    interpolation_mask: list[list[bool]]
    observed_x1_range: tuple[float, float]
    observed_x2_range: tuple[float, float]
    observed_scatter: list[dict[str, Any]]


class ResponseSurfaceEngine:
    """Generates continuous 1D response curves and 2D contour surfaces with transparent extrapolation detection."""

    @classmethod
    def generate_curve(
        cls,
        model: BaseResponseModel,
        observed_x: np.ndarray,
        observed_y: np.ndarray,
        lap_ids: list[str],
        baseline_x: float,
        scenario_x: float,
        n_points: int = 60,
    ) -> ResponseCurveResult:
        obs_min = float(np.min(observed_x))
        obs_max = float(np.max(observed_x))
        obs_span = max(1.0, obs_max - obs_min)

        # Allow 25% slack beyond observed range for curve visualization
        slack = obs_span * 0.25
        plot_min = min(obs_min - slack, min(baseline_x, scenario_x) - 0.5)
        plot_max = max(obs_max + slack, max(baseline_x, scenario_x) + 0.5)

        x_grid = np.linspace(plot_min, plot_max, n_points)

        points: list[ResponseCurvePoint] = []
        for x_val in x_grid:
            interv = model.predict_with_intervals(float(x_val))
            is_extrap = (x_val < obs_min) or (x_val > obs_max)
            points.append(
                ResponseCurvePoint(
                    x=round(float(x_val), 3),
                    y_modelled=round(interv.prediction, 4),
                    ci_95_lower=round(interv.ci_95_lower, 4),
                    ci_95_upper=round(interv.ci_95_upper, 4),
                    pi_95_lower=round(interv.pi_95_lower, 4),
                    pi_95_upper=round(interv.pi_95_upper, 4),
                    is_extrapolation=is_extrap,
                )
            )

        # Evaluate baseline and scenario
        base_pred = model.predict_with_intervals(baseline_x)
        scen_pred = model.predict_with_intervals(scenario_x)

        predicted_delta = scen_pred.prediction - base_pred.prediction
        uncertainty = 1.96 * np.sqrt(scen_pred.standard_error**2 + base_pred.standard_error**2)

        is_extrap_scenario = (scenario_x < obs_min) or (scenario_x > obs_max)
        domain_status: Literal["INTERPOLATION", "EXTRAPOLATION"] = (
            "EXTRAPOLATION" if is_extrap_scenario else "INTERPOLATION"
        )

        extrap_warning = None
        if is_extrap_scenario:
            dist = (
                obs_min - scenario_x if scenario_x < obs_min else scenario_x - obs_max
            )
            extrap_warning = (
                f"EXTRAPOLATION WARNING: Requested value {scenario_x:.2f} is outside the observed data range "
                f"[{obs_min:.2f}, {obs_max:.2f}] by {dist:.2f} units. The model may not generalize reliably."
            )

        observed_data = [
            ObservedDataPoint(lap_id=lid, x_val=float(xi), y_val=float(yi))
            for lid, xi, yi in zip(lap_ids, observed_x, observed_y)
        ]

        return ResponseCurveResult(
            parameter_name=model.feature_names[0],
            target_name=model.target_name,
            baseline_x=round(baseline_x, 3),
            baseline_y=round(base_pred.prediction, 4),
            scenario_x=round(scenario_x, 3),
            scenario_y=round(scen_pred.prediction, 4),
            predicted_delta=round(predicted_delta, 4),
            uncertainty_95=round(float(uncertainty), 4),
            domain_status=domain_status,
            extrapolation_warning=extrap_warning,
            observed_range=(round(obs_min, 3), round(obs_max, 3)),
            points=points,
            observed_data=observed_data,
        )

    @classmethod
    def generate_surface_2d(
        cls,
        model: InteractionResponseModel,
        obs_x1: np.ndarray,
        obs_x2: np.ndarray,
        obs_y: np.ndarray,
        lap_ids: list[str],
        grid_size: int = 25,
    ) -> ResponseSurface2DResult:
        x1_min, x1_max = float(np.min(obs_x1)), float(np.max(obs_x1))
        x2_min, x2_max = float(np.min(obs_x2)), float(np.max(obs_x2))

        span1 = max(1.0, x1_max - x1_min)
        span2 = max(1.0, x2_max - x2_min)

        x1_grid = np.linspace(x1_min - span1 * 0.15, x1_max + span1 * 0.15, grid_size)
        x2_grid = np.linspace(x2_min - span2 * 0.15, x2_max + span2 * 0.15, grid_size)

        z_matrix: list[list[float]] = []
        mask: list[list[bool]] = []

        for v1 in x1_grid:
            row_z = []
            row_mask = []
            for v2 in x2_grid:
                interv = model.predict_point(float(v1), float(v2))
                is_interp = (x1_min <= v1 <= x1_max) and (x2_min <= v2 <= x2_max)
                row_z.append(round(interv.prediction, 4))
                row_mask.append(is_interp)
            z_matrix.append(row_z)
            mask.append(row_mask)

        scatter = [
            {"lap_id": lid, "x1": float(v1), "x2": float(v2), "y": float(vy)}
            for lid, v1, v2, vy in zip(lap_ids, obs_x1, obs_x2, obs_y)
        ]

        return ResponseSurface2DResult(
            feature_x1=model.feature_names[0],
            feature_x2=model.feature_names[1],
            target_name=model.target_name,
            x1_values=[round(float(v), 3) for v in x1_grid],
            x2_values=[round(float(v), 3) for v in x2_grid],
            z_matrix=z_matrix,
            interpolation_mask=mask,
            observed_x1_range=(round(x1_min, 3), round(x1_max, 3)),
            observed_x2_range=(round(x2_min, 3), round(x2_max, 3)),
            observed_scatter=scatter,
        )
