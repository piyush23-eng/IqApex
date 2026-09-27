from __future__ import annotations

import numpy as np
from fastapi import APIRouter, HTTPException, Query

from app.analytics.aero_monte_carlo import AeroMonteCarloEngine
from app.analytics.aero_quality import AeroDatasetQualityAuditor
from app.analytics.aero_surrogate import AeroSurrogateModel
from app.analytics.aero_tradeoff import AeroTradeOffEngine
from app.analytics.synthetic_aero_generator import SyntheticAeroGenerator
from app.analytics.vehicle_performance import VehiclePerformanceSimulator
from app.schemas.vehicle_performance import (
    AeroEvaluationResponse,
    AeroMonteCarloRequest,
    AeroMonteCarloResponse,
    CornerSimulationDTO,
    ParameterListResponse,
    ParetoFrontierResponse,
    ParetoPointDTO,
    PerformanceDeltaItem,
    ResponseSurface2DVehicleResponse,
    StraightSimulationDTO,
    TrackSimulationResponse,
    VehicleComparisonRequest,
    VehicleComparisonResponse,
    VehicleConfigInput,
    VehicleParameterSpec,
)

router = APIRouter(prefix="/vehicle-performance", tags=["Vehicle Performance & Aero"])

# Lazy singleton generator & surrogate training pipeline cache
_generator: SyntheticAeroGenerator | None = None
_dataset_df = None
_dataset_meta = None
_surrogate_models: dict[str, AeroSurrogateModel] = {}
_simulator = VehiclePerformanceSimulator()


def _get_services():
    global _generator, _dataset_df, _dataset_meta
    if _generator is None:
        _generator = SyntheticAeroGenerator()
        raw_df, _dataset_meta = _generator.generate_doe_dataset(sample_count=1200, random_seed=42871)
        valid_df, _ = AeroDatasetQualityAuditor.audit_dataset(raw_df)
        _dataset_df = valid_df

        feature_cols = [
            "front_wing_angle",
            "rear_wing_angle",
            "ride_height_front",
            "ride_height_rear",
            "yaw_angle",
            "vehicle_speed",
        ]

        # Fit surrogates for key targets
        for tgt in ["downforce_n", "drag_n", "cl", "cd", "aero_balance_pct"]:
            model = AeroSurrogateModel(
                target_name=tgt,
                feature_names=feature_cols,
                model_family="gradient_boosting",
                random_seed=42871,
            )
            model.fit(_dataset_df, dataset_hash=_dataset_meta.dataset_hash)
            _surrogate_models[tgt] = model

    return _generator, _dataset_df, _dataset_meta, _surrogate_models


@router.get("/parameters", response_model=ParameterListResponse)
def get_vehicle_parameters():
    generator, _, _, _ = _get_services()
    param_list = [
        VehicleParameterSpec(
            name=p.name,
            unit=p.unit,
            minimum=p.minimum,
            maximum=p.maximum,
            step=p.step,
            default=p.default,
            source=p.source,
            description=p.description,
        )
        for p in generator.parameters.values()
    ]
    return ParameterListResponse(
        parameters=param_list,
        constants=generator.constants,
        provenance_label="Synthetic engineering dataset",
    )


@router.post("/evaluate", response_model=AeroEvaluationResponse)
def evaluate_vehicle_configuration(config: VehicleConfigInput):
    _, _, meta, surrogates = _get_services()
    feat_dict = config.model_dump()

    # Query surrogates
    pred_df = surrogates["downforce_n"].predict_single(feat_dict)
    pred_drag = surrogates["drag_n"].predict_single(feat_dict)
    pred_cl = surrogates["cl"].predict_single(feat_dict)
    pred_cd = surrogates["cd"].predict_single(feat_dict)
    pred_bal = surrogates["aero_balance_pct"].predict_single(feat_dict)

    l_d = round(pred_cl.prediction / max(pred_cd.prediction, 0.01), 3)

    return AeroEvaluationResponse(
        cl=pred_cl.prediction,
        cd=pred_cd.prediction,
        downforce_n=pred_df.prediction,
        drag_n=pred_drag.prediction,
        lift_to_drag=l_d,
        aero_balance_pct=pred_bal.prediction,
        downforce_pi_95=(pred_df.pi_95_lower, pred_df.pi_95_upper),
        drag_pi_95=(pred_drag.pi_95_lower, pred_drag.pi_95_upper),
        domain_status=pred_df.domain_status,
        model_version=surrogates["downforce_n"].metadata.model_version,
        dataset_version=meta.dataset_version,
        dataset_hash=meta.dataset_hash,
        disclaimer=(
            "Synthetic aerodynamic surrogate estimate. "
            "Not real F1 CFD, wind-tunnel, vehicle-dynamics, or team data."
        ),
        result_type="MODELLED",
    )


@router.post("/compare", response_model=VehicleComparisonResponse)
def compare_vehicle_configurations(req: VehicleComparisonRequest):
    base_eval = evaluate_vehicle_configuration(req.baseline)
    scen_eval = evaluate_vehicle_configuration(req.scenario)

    base_sim = _simulator.simulate_lap(
        cl_total=base_eval.cl,
        cd_total=base_eval.cd,
        mass_kg=req.baseline.mass,
        tyre_grip_mu=req.baseline.tyre_grip,
    )
    scen_sim = _simulator.simulate_lap(
        cl_total=scen_eval.cl,
        cd_total=scen_eval.cd,
        mass_kg=req.scenario.mass,
        tyre_grip_mu=req.scenario.tyre_grip,
    )

    metrics = [
        PerformanceDeltaItem(
            name="Downforce",
            unit="N",
            baseline=base_eval.downforce_n,
            scenario=scen_eval.downforce_n,
            delta=round(scen_eval.downforce_n - base_eval.downforce_n, 1),
            uncertainty_95=round(
                np.sqrt(
                    (base_eval.downforce_pi_95[1] - base_eval.downforce_n) ** 2
                    + (scen_eval.downforce_pi_95[1] - scen_eval.downforce_n) ** 2
                ),
                1,
            ),
        ),
        PerformanceDeltaItem(
            name="Drag",
            unit="N",
            baseline=base_eval.drag_n,
            scenario=scen_eval.drag_n,
            delta=round(scen_eval.drag_n - base_eval.drag_n, 1),
            uncertainty_95=round(
                np.sqrt(
                    (base_eval.drag_pi_95[1] - base_eval.drag_n) ** 2
                    + (scen_eval.drag_pi_95[1] - scen_eval.drag_n) ** 2
                ),
                1,
            ),
        ),
        PerformanceDeltaItem(
            name="Lift-to-Drag Ratio (L/D)",
            unit="ratio",
            baseline=base_eval.lift_to_drag,
            scenario=scen_eval.lift_to_drag,
            delta=round(scen_eval.lift_to_drag - base_eval.lift_to_drag, 3),
            uncertainty_95=0.04,
        ),
        PerformanceDeltaItem(
            name="Aero Balance",
            unit="%",
            baseline=base_eval.aero_balance_pct,
            scenario=scen_eval.aero_balance_pct,
            delta=round(scen_eval.aero_balance_pct - base_eval.aero_balance_pct, 2),
            uncertainty_95=0.15,
        ),
        PerformanceDeltaItem(
            name="Cornering Transit Time",
            unit="s",
            baseline=base_sim.total_corner_time_s,
            scenario=scen_sim.total_corner_time_s,
            delta=round(scen_sim.total_corner_time_s - base_sim.total_corner_time_s, 3),
            uncertainty_95=0.08,
        ),
        PerformanceDeltaItem(
            name="Straight Transit Time",
            unit="s",
            baseline=base_sim.total_straight_time_s,
            scenario=scen_sim.total_straight_time_s,
            delta=round(scen_sim.total_straight_time_s - base_sim.total_straight_time_s, 3),
            uncertainty_95=0.06,
        ),
    ]

    return VehicleComparisonResponse(
        metrics=metrics,
        modeled_lap_time_baseline_s=base_sim.modeled_lap_time_s,
        modeled_lap_time_scenario_s=scen_sim.modeled_lap_time_s,
        modeled_lap_time_delta_s=round(
            scen_sim.modeled_lap_time_s - base_sim.modeled_lap_time_s, 3
        ),
        top_speed_baseline_kph=base_sim.top_speed_kph,
        top_speed_scenario_kph=scen_sim.top_speed_kph,
        top_speed_delta_kph=round(scen_sim.top_speed_kph - base_sim.top_speed_kph, 1),
        mean_lat_g_baseline=base_sim.mean_lateral_accel_g,
        mean_lat_g_scenario=scen_sim.mean_lateral_accel_g,
        mean_lat_g_delta=round(scen_sim.mean_lateral_accel_g - base_sim.mean_lateral_accel_g, 2),
        baseline_domain=base_eval.domain_status,
        scenario_domain=scen_eval.domain_status,
        disclaimer=(
            "Modelled performance trade-off based on synthetic aerodynamic surrogate "
            "and quasi-steady vehicle simulation. No causal warranty."
        ),
    )


@router.get("/pareto-frontier", response_model=ParetoFrontierResponse)
def get_pareto_frontier(max_points: int = Query(default=120, ge=30, le=500)):
    _, df, _, _ = _get_services()
    res = AeroTradeOffEngine.compute_pareto_frontier(df, max_points=max_points)

    pts_dto = [
        ParetoPointDTO(
            config_id=p.config_id,
            front_wing_angle=p.front_wing_angle,
            rear_wing_angle=p.rear_wing_angle,
            ride_height_front=p.ride_height_front,
            ride_height_rear=p.ride_height_rear,
            downforce_n=p.downforce_n,
            drag_n=p.drag_n,
            lift_to_drag=p.lift_to_drag,
            aero_balance_pct=p.aero_balance_pct,
            is_pareto_optimal=p.is_pareto_optimal,
            dominance_rank=p.dominance_rank,
        )
        for p in res.points
    ]

    front_dto = [p for p in pts_dto if p.is_pareto_optimal]

    return ParetoFrontierResponse(
        total_evaluated=res.total_evaluated,
        pareto_efficient_count=res.pareto_efficient_count,
        dominated_count=res.dominated_count,
        points=pts_dto,
        pareto_frontier=front_dto,
        disclaimer=res.disclaimer,
        scientific_label=res.scientific_label,
    )


@router.get("/response-surface-2d", response_model=ResponseSurface2DVehicleResponse)
def get_2d_response_surface(
    target: str = Query(default="downforce_n", pattern="^(downforce_n|drag_n|cl|cd|aero_balance_pct)$"),
    x_feature: str = Query(default="front_wing_angle"),
    y_feature: str = Query(default="rear_wing_angle"),
    grid_resolution: int = Query(default=25, ge=10, le=40),
):
    _, _, _, surrogates = _get_services()
    if target not in surrogates:
        raise HTTPException(status_code=404, detail=f"Target {target} not found in surrogates")

    model = surrogates[target]
    fixed_params = {
        "front_wing_angle": 18.0,
        "rear_wing_angle": 24.0,
        "ride_height_front": 32.0,
        "ride_height_rear": 42.0,
        "yaw_angle": 1.5,
        "vehicle_speed": 250.0,
    }

    surface = AeroTradeOffEngine.generate_2d_surface(
        surrogate_model=model,
        fixed_parameters=fixed_params,
        x_feature=x_feature,
        y_feature=y_feature,
        grid_resolution=grid_resolution,
    )

    return ResponseSurface2DVehicleResponse(
        x_feature=surface["x_feature"],
        y_feature=surface["y_feature"],
        target=surface["target"],
        x_values=surface["x_values"],
        y_values=surface["y_values"],
        z_matrix=surface["z_matrix"],
        interpolation_mask=surface["interpolation_mask"],
        observed_x_bounds=list(surface["observed_x_bounds"]),
        observed_y_bounds=list(surface["observed_y_bounds"]),
        model_version=model.metadata.model_version,
    )


@router.post("/track-simulation", response_model=TrackSimulationResponse)
def simulate_track_performance(config: VehicleConfigInput):
    _, _, _, surrogates = _get_services()
    feat_dict = config.model_dump()
    cl_pred = surrogates["cl"].predict_single(feat_dict).prediction
    cd_pred = surrogates["cd"].predict_single(feat_dict).prediction

    res = _simulator.simulate_lap(
        cl_total=cl_pred,
        cd_total=cd_pred,
        mass_kg=config.mass,
        tyre_grip_mu=config.tyre_grip,
    )

    corner_dtos = [
        CornerSimulationDTO(
            corner_id=c.corner_id,
            corner_name=c.corner_name,
            turn_number=c.turn_number,
            curvature_radius_m=c.curvature_radius_m,
            length_m=c.length_m,
            downforce_n=c.downforce_n,
            normal_load_n=c.normal_load_n,
            max_lateral_force_n=c.max_lateral_force_n,
            max_lateral_accel_g=c.max_lateral_accel_g,
            max_corner_speed_kph=c.max_corner_speed_kph,
            transit_time_s=c.transit_time_s,
            domain_status=c.domain_status,
        )
        for c in res.corners
    ]

    straight_dtos = [
        StraightSimulationDTO(
            straight_name=s.straight_name,
            start_distance_m=s.start_distance_m,
            end_distance_m=s.end_distance_m,
            length_m=s.length_m,
            entry_speed_kph=s.entry_speed_kph,
            exit_speed_kph=s.exit_speed_kph,
            top_speed_kph=s.top_speed_kph,
            mean_acceleration_g=s.mean_acceleration_g,
            transit_time_s=s.transit_time_s,
            drag_at_exit_n=s.drag_at_exit_n,
        )
        for s in res.straights
    ]

    return TrackSimulationResponse(
        modeled_lap_time_s=res.modeled_lap_time_s,
        total_corner_time_s=res.total_corner_time_s,
        total_straight_time_s=res.total_straight_time_s,
        top_speed_kph=res.top_speed_kph,
        mean_lateral_accel_g=res.mean_lateral_accel_g,
        corners=corner_dtos,
        straights=straight_dtos,
        disclaimer=res.disclaimer,
    )


@router.post("/monte-carlo", response_model=AeroMonteCarloResponse)
def run_aero_monte_carlo(req: AeroMonteCarloRequest):
    _, _, _, surrogates = _get_services()
    feat_dict = req.config.model_dump()
    cl_pred = surrogates["cl"].predict_single(feat_dict).prediction
    cd_pred = surrogates["cd"].predict_single(feat_dict).prediction

    mc_res = AeroMonteCarloEngine.run_simulation(
        baseline_cl=cl_pred,
        baseline_cd=cd_pred,
        cl_std=req.cl_uncertainty,
        cd_std=req.cd_uncertainty,
        tyre_grip_mean=req.config.tyre_grip,
        mass_kg=req.config.mass,
        iterations=req.iterations,
        random_seed=req.simulation_seed,
    )

    return AeroMonteCarloResponse(
        simulation_seed=mc_res.simulation_seed,
        iterations=mc_res.iterations,
        mean_lap_time_s=mc_res.mean_lap_time_s,
        median_lap_time_s=mc_res.median_lap_time_s,
        std_dev_lap_time_s=mc_res.std_dev_lap_time_s,
        p05_lap_time_s=mc_res.p05_lap_time_s,
        p10_lap_time_s=mc_res.p10_lap_time_s,
        p50_lap_time_s=mc_res.p50_lap_time_s,
        p90_lap_time_s=mc_res.p90_lap_time_s,
        p95_lap_time_s=mc_res.p95_lap_time_s,
        p05_downforce_n=mc_res.p05_downforce_n,
        p95_downforce_n=mc_res.p95_downforce_n,
        mean_downforce_n=mc_res.mean_downforce_n,
        bins=mc_res.bins,
        disclaimer=mc_res.scientific_disclaimer,
        result_type="MODELLED",
    )
