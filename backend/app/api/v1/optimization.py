from dataclasses import asdict

from fastapi import APIRouter, HTTPException, Query

from app.analytics.monte_carlo import MonteCarloSimulationService
from app.analytics.optimization_data import OptimizationDataProvider
from app.analytics.optimization_engine import ConstrainedOptimizationEngine
from app.analytics.parameters import ParameterRegistry
from app.analytics.response_models import (
    InteractionResponseModel,
    ModelSelector,
)
from app.analytics.response_surfaces import ResponseSurfaceEngine
from app.analytics.sensitivity_engine import SensitivityEngine
from app.schemas.optimization import (
    ConstrainedOptimizationRequest,
    ConstrainedOptimizationResponse,
    MonteCarloSimulationRequest,
    MonteCarloSimulationResponse,
    ParameterDefinitionSchema,
    ParameterSweepResponse,
    ResponseCurveResponse,
    ResponseSurface2DResponse,
)

router = APIRouter(prefix="/optimization", tags=["Optimization"])


@router.get("/parameters", response_model=list[ParameterDefinitionSchema])
def get_parameter_registry() -> list[ParameterDefinitionSchema]:
    """Returns all registered vehicle performance parameters from the central registry."""
    registry = ParameterRegistry.get_instance()
    params = registry.list_parameters()
    return [
        ParameterDefinitionSchema(
            name=p.name,
            unit=p.unit,
            minimum=p.minimum,
            maximum=p.maximum,
            step=p.step,
            source=p.source,
            allowed_perturbation=p.allowed_perturbation,
            description=p.description,
        )
        for p in params
    ]


@router.get("/response-curve", response_model=ResponseCurveResponse)
def get_response_curve(
    session_id: str = Query("demo-session-monza-2026", description="Session ID"),
    corner_id: str = Query("T9", description="Corner identifier (e.g. T9)"),
    parameter_name: str = Query("corner_exit_speed", description="Parameter name"),
    target_name: str = Query("corner_time", description="Target metric"),
    baseline_value: float = Query(181.2, description="Baseline parameter value"),
    scenario_value: float = Query(183.0, description="What-if scenario parameter value"),
) -> ResponseCurveResponse:
    """
    Fits and selects the optimal response model via Grouped Cross-Validation,
    then generates a 1D response curve with 95% CI, 95% PI, and extrapolation detection.
    """
    registry = ParameterRegistry.get_instance()
    if not registry.has_parameter(parameter_name):
        raise HTTPException(status_code=400, detail=f"Parameter '{parameter_name}' not registered")

    x_obs, y_obs, lap_ids, groups, corner_def = OptimizationDataProvider.extract_dataset(
        session_id=session_id,
        corner_id=corner_id,
        feature_name=parameter_name,
        target_name=target_name,
    )

    best_model, _ = ModelSelector.fit_and_select(
        x=x_obs,
        y=y_obs,
        target_name=target_name,
        feature_name=parameter_name,
        groups=groups,
        dataset_name=session_id,
    )

    curve_res = ResponseSurfaceEngine.generate_curve(
        model=best_model,
        observed_x=x_obs,
        observed_y=y_obs,
        lap_ids=lap_ids,
        baseline_x=baseline_value,
        scenario_x=scenario_value,
        n_points=60,
    )

    meta = best_model.metadata
    if meta is None:
        raise HTTPException(status_code=500, detail="Model metadata could not be generated")

    return ResponseCurveResponse(
        parameter_name=curve_res.parameter_name,
        target_name=curve_res.target_name,
        baseline_x=curve_res.baseline_x,
        baseline_y=curve_res.baseline_y,
        scenario_x=curve_res.scenario_x,
        scenario_y=curve_res.scenario_y,
        predicted_delta=curve_res.predicted_delta,
        uncertainty_95=curve_res.uncertainty_95,
        domain_status=curve_res.domain_status,
        extrapolation_warning=curve_res.extrapolation_warning,
        observed_range=curve_res.observed_range,
        points=[p.__dict__ for p in curve_res.points],
        observed_data=[d.__dict__ for d in curve_res.observed_data],
        model_metadata=asdict(meta),
        provenance={
            "session_id": session_id,
            "corner_id": corner_id,
            "corner_name": corner_def.name,
            "pipeline_version": "5.0.0",
            "model_version": meta.model_id,
            "training_data_type": "Synthetic demonstration dataset",
        },
    )


@router.get("/response-surface-2d", response_model=ResponseSurface2DResponse)
def get_response_surface_2d(
    session_id: str = Query("demo-session-monza-2026", description="Session ID"),
    corner_id: str = Query("T9", description="Corner identifier"),
    feature_x1: str = Query("corner_minimum_speed", description="First feature (X1)"),
    feature_x2: str = Query("corner_exit_speed", description="Second feature (X2)"),
    target_name: str = Query("corner_time", description="Target metric"),
) -> ResponseSurface2DResponse:
    """
    Fits a two-variable interaction model Y = β0 + β1*X1 + β2*X2 + β3*(X1*X2)
    and computes a 2D engineering contour grid.
    """
    x1, x2, y, lap_ids, groups, corner_def = OptimizationDataProvider.extract_2d_dataset(
        session_id=session_id,
        corner_id=corner_id,
        feature_x1=feature_x1,
        feature_x2=feature_x2,
        target_name=target_name,
    )

    inter_model = InteractionResponseModel(target_name, [feature_x1, feature_x2])
    inter_model.fit(x1, x2, y, groups=groups, dataset_name=session_id)

    surf_res = ResponseSurfaceEngine.generate_surface_2d(
        model=inter_model,
        obs_x1=x1,
        obs_x2=x2,
        obs_y=y,
        lap_ids=lap_ids,
        grid_size=25,
    )

    meta = inter_model.metadata
    if meta is None:
        raise HTTPException(status_code=500, detail="Interaction model metadata generation failed")

    return ResponseSurface2DResponse(
        feature_x1=surf_res.feature_x1,
        feature_x2=surf_res.feature_x2,
        target_name=surf_res.target_name,
        x1_values=surf_res.x1_values,
        x2_values=surf_res.x2_values,
        z_matrix=surf_res.z_matrix,
        interpolation_mask=surf_res.interpolation_mask,
        observed_x1_range=surf_res.observed_x1_range,
        observed_x2_range=surf_res.observed_x2_range,
        observed_scatter=surf_res.observed_scatter,
        model_metadata=asdict(meta),
        provenance={
            "session_id": session_id,
            "corner_id": corner_id,
            "corner_name": corner_def.name,
            "pipeline_version": "5.0.0",
            "model_version": meta.model_id,
            "training_data_type": "Synthetic demonstration dataset",
        },
    )


@router.get("/sweep", response_model=ParameterSweepResponse)
def get_parameter_sweep(
    session_id: str = Query("demo-session-monza-2026", description="Session ID"),
    corner_id: str = Query("T9", description="Corner identifier"),
    parameter_name: str = Query("corner_exit_speed", description="Parameter name"),
    target_name: str = Query("corner_time", description="Target metric"),
    baseline_value: float = Query(181.2, description="Baseline value"),
) -> ParameterSweepResponse:
    """Computes a controlled sweep across the parameter range with local derivatives and uncertainty."""
    registry = ParameterRegistry.get_instance()
    param_def = registry.get(parameter_name)

    x_obs, y_obs, _lap_ids, groups, _ = OptimizationDataProvider.extract_dataset(
        session_id=session_id,
        corner_id=corner_id,
        feature_name=parameter_name,
        target_name=target_name,
    )

    best_model, _ = ModelSelector.fit_and_select(
        x=x_obs,
        y=y_obs,
        target_name=target_name,
        feature_name=parameter_name,
        groups=groups,
        dataset_name=session_id,
    )

    sweep_res = SensitivityEngine.compute_sweep(
        model=best_model,
        param_def=param_def,
        baseline_val=baseline_value,
    )

    return ParameterSweepResponse(
        parameter_name=sweep_res.parameter_name,
        target_name=sweep_res.target_name,
        unit=sweep_res.unit,
        baseline_value=sweep_res.baseline_value,
        baseline_target=sweep_res.baseline_target,
        observed_range=sweep_res.observed_range,
        points=[p.__dict__ for p in sweep_res.points],
        model_metadata=asdict(best_model.metadata),
        result_type="MODELLED",
    )


@router.post("/monte-carlo", response_model=MonteCarloSimulationResponse)
def run_monte_carlo_simulation(
    req: MonteCarloSimulationRequest,
) -> MonteCarloSimulationResponse:
    """
    Executes a deterministic Monte Carlo simulation propagating parameter uncertainty
    through the fitted response model.
    """
    x_obs, y_obs, _lap_ids, groups, corner_def = OptimizationDataProvider.extract_dataset(
        session_id=req.session_id,
        corner_id=req.corner_id,
        feature_name=req.parameter_name,
        target_name=req.target_name,
    )

    best_model, _ = ModelSelector.fit_and_select(
        x=x_obs,
        y=y_obs,
        target_name=req.target_name,
        feature_name=req.parameter_name,
        groups=groups,
        dataset_name=req.session_id,
    )

    mc_res = MonteCarloSimulationService.run_simulation(
        model=best_model,
        baseline_val=req.baseline_value,
        scenario_mean=req.scenario_mean,
        scenario_std=req.scenario_std,
        iterations=req.iterations,
        simulation_seed=req.simulation_seed,
        include_residual_variance=req.include_residual_variance,
    )

    return MonteCarloSimulationResponse(
        simulation_seed=mc_res.simulation_seed,
        iterations=mc_res.iterations,
        parameter_name=mc_res.parameter_name,
        target_name=mc_res.target_name,
        baseline_value=mc_res.baseline_value,
        scenario_mean=mc_res.scenario_mean,
        scenario_std=mc_res.scenario_std,
        mean_delta=mc_res.mean_delta,
        median_delta=mc_res.median_delta,
        std_dev_delta=mc_res.std_dev_delta,
        p05_delta=mc_res.p05_delta,
        p10_delta=mc_res.p10_delta,
        p50_delta=mc_res.p50_delta,
        p90_delta=mc_res.p90_delta,
        p95_delta=mc_res.p95_delta,
        bins=[b.__dict__ for b in mc_res.bins],
        result_type="MODELLED",
        disclaimer=mc_res.disclaimer,
        provenance={
            "session_id": req.session_id,
            "corner_id": req.corner_id,
            "corner_name": corner_def.name,
            "pipeline_version": "5.0.0",
            "model_version": best_model.metadata.model_id if best_model.metadata else "unversioned",
            "simulation_seed": req.simulation_seed,
            "training_data_type": "Synthetic demonstration dataset",
        },
    )


@router.post("/optimize", response_model=ConstrainedOptimizationResponse)
def run_constrained_optimization(
    req: ConstrainedOptimizationRequest,
) -> ConstrainedOptimizationResponse:
    """
    Performs constrained optimization comparing Nominal Optimum, Conservative Scenario,
    and Robust Scenario.
    """
    registry = ParameterRegistry.get_instance()
    param_def = registry.get(req.parameter_name)

    x_obs, y_obs, _lap_ids, groups, corner_def = OptimizationDataProvider.extract_dataset(
        session_id=req.session_id,
        corner_id=req.corner_id,
        feature_name=req.parameter_name,
        target_name=req.target_name,
    )

    best_model, _ = ModelSelector.fit_and_select(
        x=x_obs,
        y=y_obs,
        target_name=req.target_name,
        feature_name=req.parameter_name,
        groups=groups,
        dataset_name=req.session_id,
    )

    opt_res = ConstrainedOptimizationEngine.optimize_1d(
        model=best_model,
        param_def=param_def,
        baseline_val=req.baseline_value,
        allow_extrapolation=req.allow_extrapolation,
        robust_penalty_lambda=req.robust_penalty_lambda,
    )

    return ConstrainedOptimizationResponse(
        parameter_name=opt_res.parameter_name,
        target_name=opt_res.target_name,
        unit=opt_res.unit,
        baseline_value=opt_res.baseline_value,
        baseline_target=opt_res.baseline_target,
        observed_range=opt_res.observed_range,
        configured_bounds=opt_res.configured_bounds,
        scenarios=[s.__dict__ for s in opt_res.scenarios],
        model_version=opt_res.model_version,
        validation_rmse=opt_res.validation_rmse,
        result_type="OPTIMIZED",
        disclaimer=opt_res.disclaimer,
        provenance={
            "session_id": req.session_id,
            "corner_id": req.corner_id,
            "corner_name": corner_def.name,
            "pipeline_version": "5.0.0",
            "model_version": opt_res.model_version,
            "training_data_type": "Synthetic demonstration dataset",
        },
    )
