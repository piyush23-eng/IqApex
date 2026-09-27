from __future__ import annotations

from typing import Literal

import numpy as np
from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.analytics.corner_analysis import MONZA_CORNERS
from app.analytics.optimization_data import OptimizationDataProvider
from app.analytics.response_models import ModelSelector
from app.analytics.sensitivity_engine import SensitivityEngine

router = APIRouter(prefix="/sensitivity", tags=["Sensitivity"])


class SensitivityMatrixItem(BaseModel):
    corner_id: str
    corner_name: str
    parameter_name: str
    unit: str
    baseline_value: float
    observed_range: tuple[float, float]
    local_sensitivity: float  # s / unit
    uncertainty_95: float
    sample_count: int
    model_quality: str
    result_type: Literal["MODELLED"] = "MODELLED"


class SensitivityMatrixResponse(BaseModel):
    circuit: str
    session_id: str
    items: list[SensitivityMatrixItem]
    training_data_type: str = "Synthetic demonstration dataset"


@router.get("/matrix", response_model=SensitivityMatrixResponse)
def get_sensitivity_matrix(
    session_id: str = Query("demo-session-monza-2026", description="Session ID"),
) -> SensitivityMatrixResponse:
    """
    Computes a comprehensive local sensitivity matrix across all circuit corners
    and key kinematic performance parameters.
    """
    params = [
        ("corner_minimum_speed", "km/h"),
        ("corner_exit_speed", "km/h"),
        ("corner_entry_speed", "km/h"),
    ]

    items: list[SensitivityMatrixItem] = []

    for c in MONZA_CORNERS:
        for param_name, unit in params:
            x_obs, y_obs, _lap_ids, groups, _ = OptimizationDataProvider.extract_dataset(
                session_id=session_id,
                corner_id=c.corner_id,
                feature_name=param_name,
                target_name="corner_time",
            )

            best_model, _ = ModelSelector.fit_and_select(
                x=x_obs,
                y=y_obs,
                target_name="corner_time",
                feature_name=param_name,
                groups=groups,
                dataset_name=session_id,
            )

            baseline_val = float(np.median(x_obs)) if len(x_obs) > 0 else 180.0
            sens = SensitivityEngine.compute_local_sensitivity(
                model=best_model,
                baseline_val=baseline_val,
            )

            items.append(
                SensitivityMatrixItem(
                    corner_id=c.corner_id,
                    corner_name=c.name.split("(")[0].strip(),
                    parameter_name=param_name,
                    unit=unit,
                    baseline_value=sens.baseline_value,
                    observed_range=sens.observed_range,
                    local_sensitivity=sens.local_derivative,
                    uncertainty_95=sens.uncertainty_95,
                    sample_count=sens.sample_count,
                    model_quality=sens.model_validation_status,
                    result_type="MODELLED",
                )
            )

    return SensitivityMatrixResponse(
        circuit="Autodromo Nazionale Monza",
        session_id=session_id,
        items=items,
        training_data_type="Synthetic demonstration dataset",
    )
