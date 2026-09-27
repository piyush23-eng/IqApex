from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

import numpy as np

from app.analytics.parameters import ParameterDefinition
from app.analytics.response_models import BaseResponseModel


@dataclass
class LocalSensitivityResult:
    parameter_name: str
    target_name: str
    baseline_value: float
    perturbation_unit: float
    predicted_delta: float
    local_derivative: float  # ∂Y / ∂X in units (e.g. s/(km/h) or s/m)
    uncertainty_95: float
    observed_range: tuple[float, float]
    sample_count: int
    model_type: str
    model_validation_status: str
    result_type: Literal["MODELLED"] = "MODELLED"


@dataclass
class SweepPoint:
    parameter_value: float
    predicted_target: float
    predicted_delta: float
    uncertainty_95: float
    is_extrapolation: bool
    distance_from_observed_range: float


@dataclass
class ParameterSweepResult:
    parameter_name: str
    target_name: str
    unit: str
    baseline_value: float
    baseline_target: float
    observed_range: tuple[float, float]
    points: list[SweepPoint]
    result_type: Literal["MODELLED"] = "MODELLED"


class SensitivityEngine:
    """Computes numerical parameter sensitivities and controlled sweeps."""

    @classmethod
    def compute_local_sensitivity(
        cls,
        model: BaseResponseModel,
        baseline_val: float,
        step_h: float = 1e-3,
    ) -> LocalSensitivityResult:
        # Central difference for numerical derivative: (f(x+h) - f(x-h)) / (2h)
        base_pred = model.predict_with_intervals(baseline_val)
        pred_plus = model.predict_with_intervals(baseline_val + step_h)
        pred_minus = model.predict_with_intervals(baseline_val - step_h)

        local_deriv = (pred_plus.prediction - pred_minus.prediction) / (2.0 * step_h)

        # 1 unit perturbation
        pred_1unit = model.predict_with_intervals(baseline_val + 1.0)
        predicted_delta_1unit = pred_1unit.prediction - base_pred.prediction

        obs_min, obs_max = model.observed_domain.get(
            model.feature_names[0], (baseline_val, baseline_val)
        )

        val_status = "Validated (Grouped CV)" if model.metadata else "Unfitted"

        return LocalSensitivityResult(
            parameter_name=model.feature_names[0],
            target_name=model.target_name,
            baseline_value=round(baseline_val, 3),
            perturbation_unit=1.0,
            predicted_delta=round(predicted_delta_1unit, 4),
            local_derivative=round(local_deriv, 5),
            uncertainty_95=round(1.96 * base_pred.standard_error, 4),
            observed_range=(round(obs_min, 3), round(obs_max, 3)),
            sample_count=model.n_samples,
            model_type=model.metadata.model_type if model.metadata else "linear",
            model_validation_status=val_status,
            result_type="MODELLED",
        )

    @classmethod
    def compute_sweep(
        cls,
        model: BaseResponseModel,
        param_def: ParameterDefinition,
        baseline_val: float,
        sweep_range: tuple[float, float] | None = None,
        step: float | None = None,
    ) -> ParameterSweepResult:
        obs_min, obs_max = model.observed_domain.get(
            param_def.name, (param_def.minimum, param_def.maximum)
        )

        step_val = step if step is not None else param_def.step

        if sweep_range is not None:
            sw_min, sw_max = sweep_range
        else:
            sw_min = max(param_def.minimum, baseline_val + param_def.allowed_perturbation[0])
            sw_max = min(param_def.maximum, baseline_val + param_def.allowed_perturbation[1])

        # Generate discrete points
        x_vals = np.arange(sw_min, sw_max + step_val * 0.5, step_val)
        base_pred = model.predict_with_intervals(baseline_val)

        points: list[SweepPoint] = []
        for x in x_vals:
            pred = model.predict_with_intervals(float(x))
            is_extrap = (x < obs_min) or (x > obs_max)
            dist_extrap = 0.0
            if x < obs_min:
                dist_extrap = obs_min - x
            elif x > obs_max:
                dist_extrap = x - obs_max

            uncert = 1.96 * pred.standard_error
            points.append(
                SweepPoint(
                    parameter_value=round(float(x), 3),
                    predicted_target=round(pred.prediction, 4),
                    predicted_delta=round(pred.prediction - base_pred.prediction, 4),
                    uncertainty_95=round(float(uncert), 4),
                    is_extrapolation=is_extrap,
                    distance_from_observed_range=round(float(dist_extrap), 3),
                )
            )

        return ParameterSweepResult(
            parameter_name=param_def.name,
            target_name=model.target_name,
            unit=param_def.unit,
            baseline_value=round(baseline_val, 3),
            baseline_target=round(base_pred.prediction, 4),
            observed_range=(round(obs_min, 3), round(obs_max, 3)),
            points=points,
            result_type="MODELLED",
        )
