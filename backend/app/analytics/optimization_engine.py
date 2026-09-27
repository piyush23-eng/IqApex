from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

import numpy as np

from app.analytics.parameters import ParameterDefinition
from app.analytics.response_models import BaseResponseModel


@dataclass
class ScenarioOutcome:
    name: str
    scenario_type: Literal["NOMINAL", "CONSERVATIVE", "ROBUST"]
    parameter_value: float
    predicted_target: float
    predicted_delta: float
    uncertainty_95: float
    data_domain: Literal["INTERPOLATION", "EXTRAPOLATION"]
    is_extrapolation: bool
    constraints_satisfied: bool
    description: str


@dataclass
class ConstrainedOptimizationResult:
    parameter_name: str
    target_name: str
    unit: str
    baseline_value: float
    baseline_target: float
    observed_range: tuple[float, float]
    configured_bounds: tuple[float, float]
    scenarios: list[ScenarioOutcome]
    model_version: str
    validation_rmse: float
    result_type: Literal["OPTIMIZED"] = "OPTIMIZED"
    disclaimer: str = (
        "OPTIMIZED outputs represent mathematical model minimization within constraints. "
        "Not an achieved or guaranteed on-track improvement."
    )


class ConstrainedOptimizationEngine:
    """Interpretable constrained optimization and robust trade-off analysis."""

    @classmethod
    def optimize_1d(
        cls,
        model: BaseResponseModel,
        param_def: ParameterDefinition,
        baseline_val: float,
        allow_extrapolation: bool = False,
        robust_penalty_lambda: float = 1.0,
    ) -> ConstrainedOptimizationResult:
        obs_min, obs_max = model.observed_domain.get(
            param_def.name, (param_def.minimum, param_def.maximum)
        )

        # Baseline evaluation
        base_pred = model.predict_with_intervals(baseline_val)
        base_target = base_pred.prediction

        # Define bounds
        if allow_extrapolation:
            search_min = max(param_def.minimum, baseline_val + param_def.allowed_perturbation[0])
            search_max = min(param_def.maximum, baseline_val + param_def.allowed_perturbation[1])
        else:
            search_min = max(obs_min, baseline_val + param_def.allowed_perturbation[0])
            search_max = min(obs_max, baseline_val + param_def.allowed_perturbation[1])

        # If search bounds collapsed
        if search_min >= search_max:
            search_min = obs_min
            search_max = obs_max

        # 1. Nominal Optimum: minimize f(x)
        # Using dense grid search for absolute global minimum within bounds (highly interpretable)
        grid = np.linspace(search_min, search_max, 100)
        grid_preds = [model.predict_with_intervals(float(x)) for x in grid]

        nominal_idx = int(np.argmin([p.prediction for p in grid_preds]))
        nominal_x = float(grid[nominal_idx])
        nom_pred = grid_preds[nominal_idx]

        # 2. Conservative Scenario: bounded strictly to inner 80% of observed range
        p10 = obs_min + 0.10 * (obs_max - obs_min)
        p90 = obs_min + 0.90 * (obs_max - obs_min)
        cons_min = max(search_min, p10)
        cons_max = min(search_max, p90)

        if cons_min < cons_max:
            cons_grid = np.linspace(cons_min, cons_max, 60)
            cons_preds = [model.predict_with_intervals(float(x)) for x in cons_grid]
            cons_idx = int(np.argmin([p.prediction for p in cons_preds]))
            cons_x = float(cons_grid[cons_idx])
            conservative_pred = cons_preds[cons_idx]
        else:
            cons_x = nominal_x
            conservative_pred = nom_pred

        # 3. Robust Scenario: minimize f(x) + lambda * sigma_pred(x) (risk-averse objective)
        robust_scores = [p.prediction + robust_penalty_lambda * p.prediction_error for p in grid_preds]
        robust_idx = int(np.argmin(robust_scores))
        robust_x = float(grid[robust_idx])
        rob_pred = grid_preds[robust_idx]

        def build_outcome(
            name: str,
            scen_type: Literal["NOMINAL", "CONSERVATIVE", "ROBUST"],
            val: float,
            pred: Any,
            desc: str,
        ) -> ScenarioOutcome:
            is_extrap = (val < obs_min) or (val > obs_max)
            return ScenarioOutcome(
                name=name,
                scenario_type=scen_type,
                parameter_value=round(val, 3),
                predicted_target=round(pred.prediction, 4),
                predicted_delta=round(pred.prediction - base_target, 4),
                uncertainty_95=round(1.96 * pred.standard_error, 4),
                data_domain="EXTRAPOLATION" if is_extrap else "INTERPOLATION",
                is_extrapolation=is_extrap,
                constraints_satisfied=param_def.is_in_physical_range(val),
                description=desc,
            )

        scenarios = [
            build_outcome(
                "Nominal Optimum",
                "NOMINAL",
                nominal_x,
                nom_pred,
                "Mathematical minimum of response model within configured bounds.",
            ),
            build_outcome(
                "Conservative Scenario",
                "CONSERVATIVE",
                cons_x,
                conservative_pred,
                "Restricted to inner 80% empirical observed distribution (P10–P90).",
            ),
            build_outcome(
                "Robust Scenario",
                "ROBUST",
                robust_x,
                rob_pred,
                f"Minimizes predicted pace penalized by model uncertainty (λ={robust_penalty_lambda}).",
            ),
        ]

        model_ver = model.metadata.model_id if model.metadata else "unversioned"
        rmse_val = model.metadata.metrics.rmse if model.metadata else 0.0

        return ConstrainedOptimizationResult(
            parameter_name=param_def.name,
            target_name=model.target_name,
            unit=param_def.unit,
            baseline_value=round(baseline_val, 3),
            baseline_target=round(base_target, 4),
            observed_range=(round(obs_min, 3), round(obs_max, 3)),
            configured_bounds=(round(search_min, 3), round(search_max, 3)),
            scenarios=scenarios,
            model_version=model_ver,
            validation_rmse=round(rmse_val, 4),
            result_type="OPTIMIZED",
        )
