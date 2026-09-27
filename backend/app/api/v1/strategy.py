from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.analytics.strategy_analytics import StrategyAnalyticsService
from app.analytics.strategy_engine import StrategySimulationEngine
from app.analytics.strategy_generator import StrategyGenerator
from app.analytics.tyre_model import SyntheticTyreModel
from app.schemas.strategy import (
    CompoundCurveItemDTO,
    CompoundCurveResponse,
    FeasibleStrategyDTO,
    PitWindowItemDTO,
    PitWindowResponse,
    PitWindowSensitivityRequest,
    RaceSimulationRequest,
    RaceSimulationResponse,
    ScenarioMatrixCellDTO,
    ScenarioMatrixRequest,
    ScenarioMatrixResponse,
    SimulatedLapDTO,
    StintSimulationDTO,
    StrategyAttributionDTO,
    StrategyComparisonResponse,
    StrategyListResponse,
    StrategyMonteCarloRequest,
    StrategyMonteCarloResponse,
)

router = APIRouter(prefix="/strategy", tags=["Race Strategy & Simulation"])

_engine = StrategySimulationEngine()
_generator = StrategyGenerator()
_tyre_model = SyntheticTyreModel()


@router.get("/config")
def get_strategy_configuration() -> dict[str, Any]:
    return {
        "race": _engine.race_cfg,
        "pit_stop": _engine.pit_cfg,
        "traffic_scenarios": _engine.config["traffic_scenarios"],
        "interruptions": _engine.config["interruptions"],
        "weather": _engine.config["weather"],
        "provenance_label": "Synthetic engineering dataset",
        "scientific_disclaimer": "Modelled scenario — not real F1 race data.",
    }


@router.get("/tyres/{compound}", response_model=CompoundCurveResponse)
def get_tyre_compound_curve(
    compound: str,
    max_laps: int = Query(default=40, ge=10, le=60),
    weather_thermal_mult: float = Query(default=1.0, ge=0.5, le=2.0),
):
    code = compound.upper()
    if code not in _tyre_model.compounds:
        raise HTTPException(status_code=404, detail=f"Tyre compound '{compound}' not recognized.")

    curve_raw = _tyre_model.generate_compound_curve(
        compound_code=code,
        max_laps=max_laps,
        weather_thermal_mult=weather_thermal_mult,
    )
    items = [CompoundCurveItemDTO(**pt) for pt in curve_raw]
    max_viable = _tyre_model.compounds[code].max_viable_laps

    return CompoundCurveResponse(
        compound=code,
        max_viable_laps=max_viable,
        curve=items,
    )


@router.get("/generate", response_model=StrategyListResponse)
def generate_feasible_strategies(max_stops: int = Query(default=2, ge=1, le=3)):
    strats = _generator.generate_strategies(max_stops=max_stops)
    dtos = [
        FeasibleStrategyDTO(
            strategy_id=s.strategy_id,
            name=s.name,
            pit_stops_count=s.pit_stops_count,
            compound_sequence=s.compound_sequence,
            stint_lengths=s.stint_lengths,
            pit_laps=s.pit_laps,
            is_fia_legal=s.is_fia_legal,
            summary=s.summary,
        )
        for s in strats
    ]
    return StrategyListResponse(
        total_strategies=len(dtos),
        strategies=dtos,
        circuit=_generator.total_laps and "Autodromo Nazionale Monza",
        total_laps=_generator.total_laps,
    )


@router.post("/simulate-race", response_model=RaceSimulationResponse)
def simulate_race_endpoint(req: RaceSimulationRequest):
    stints_dicts = [{"compound": s.compound, "laps": s.laps} for s in req.stints]
    total_l = sum(s.laps for s in req.stints)
    if total_l != 53:
        raise HTTPException(status_code=400, detail=f"Total stint laps ({total_l}) must equal Monza race length (53 laps).")

    res = _engine.simulate_race(
        strategy_id=req.strategy_id,
        stint_definitions=stints_dicts,
        weather_code=req.weather,
        safety_car_code=req.safety_car,
        traffic_code=req.traffic,
        cl_total=req.cl_total,
        cd_total=req.cd_total,
    )

    stint_dtos = []
    for st in res.stints:
        lap_dtos = [SimulatedLapDTO(**l.__dict__) for l in st.laps]
        stint_dtos.append(
            StintSimulationDTO(
                stint_number=st.stint_number,
                compound=st.compound,
                start_lap=st.start_lap,
                end_lap=st.end_lap,
                stint_length=st.stint_length,
                total_stint_time_s=st.total_stint_time_s,
                mean_lap_time_s=st.mean_lap_time_s,
                start_tyre_age=st.start_tyre_age,
                end_tyre_age=st.end_tyre_age,
                laps=lap_dtos,
            )
        )

    all_laps = [SimulatedLapDTO(**l.__dict__) for l in res.laps]

    return RaceSimulationResponse(
        strategy_id=res.strategy_id,
        total_race_time_s=res.total_race_time_s,
        mean_lap_time_s=res.mean_lap_time_s,
        pit_stops_count=res.pit_stops_count,
        total_pit_loss_s=res.total_pit_loss_s,
        stints=stint_dtos,
        laps=all_laps,
        weather_scenario=res.weather_scenario,
        safety_car_scenario=res.safety_car_scenario,
        traffic_scenario=res.traffic_scenario,
        scientific_disclaimer=res.scientific_disclaimer,
    )


@router.post("/compare", response_model=StrategyComparisonResponse)
def compare_strategies_endpoint(
    req_base: RaceSimulationRequest,
    req_scen: RaceSimulationRequest,
):
    base_res = _engine.simulate_race(
        strategy_id=req_base.strategy_id,
        stint_definitions=[{"compound": s.compound, "laps": s.laps} for s in req_base.stints],
        weather_code=req_base.weather,
        safety_car_code=req_base.safety_car,
        traffic_code=req_base.traffic,
    )
    scen_res = _engine.simulate_race(
        strategy_id=req_scen.strategy_id,
        stint_definitions=[{"compound": s.compound, "laps": s.laps} for s in req_scen.stints],
        weather_code=req_scen.weather,
        safety_car_code=req_scen.safety_car,
        traffic_code=req_scen.traffic,
    )

    summary = StrategyAnalyticsService.decompose_strategy_delta(base_res, scen_res)
    attribution_dtos = [StrategyAttributionDTO(**a.__dict__) for a in summary.attribution]

    return StrategyComparisonResponse(
        baseline_id=summary.baseline_id,
        scenario_id=summary.scenario_id,
        delta_race_time_s=summary.delta_race_time_s,
        delta_pit_loss_s=summary.delta_pit_loss_s,
        delta_mean_lap_time_s=summary.delta_mean_lap_time_s,
        baseline_race_time_s=summary.baseline_race_time_s,
        scenario_race_time_s=summary.scenario_race_time_s,
        baseline_stops=summary.baseline_stops,
        scenario_stops=summary.scenario_stops,
        attribution=attribution_dtos,
        residual_s=summary.residual_s,
    )


@router.post("/monte-carlo", response_model=StrategyMonteCarloResponse)
def strategy_monte_carlo_endpoint(req: StrategyMonteCarloRequest):
    stints_dicts = [{"compound": s.compound, "laps": s.laps} for s in req.stints]
    from app.analytics.strategy_monte_carlo import StrategyMonteCarloSimulator

    mc_res = StrategyMonteCarloSimulator.run_simulation(
        engine=_engine,
        strategy_id=req.strategy_id,
        stint_definitions=stints_dicts,
        weather_code=req.weather,
        safety_car_code=req.safety_car,
        traffic_code=req.traffic,
        iterations=req.iterations,
        random_seed=req.simulation_seed,
        ref_race_time_s=req.ref_race_time_s,
    )

    return StrategyMonteCarloResponse(
        strategy_id=mc_res.strategy_id,
        simulation_seed=mc_res.simulation_seed,
        iterations=mc_res.iterations,
        mean_race_time_s=mc_res.mean_race_time_s,
        median_race_time_s=mc_res.median_race_time_s,
        std_dev_race_time_s=mc_res.std_dev_race_time_s,
        p05_race_time_s=mc_res.p05_race_time_s,
        p10_race_time_s=mc_res.p10_race_time_s,
        p25_race_time_s=mc_res.p25_race_time_s,
        p50_race_time_s=mc_res.p50_race_time_s,
        p75_race_time_s=mc_res.p75_race_time_s,
        p90_race_time_s=mc_res.p90_race_time_s,
        p95_race_time_s=mc_res.p95_race_time_s,
        bins=mc_res.bins,
        probability_beating_ref=mc_res.probability_beating_ref,
        scientific_disclaimer=mc_res.scientific_disclaimer,
    )


@router.post("/pit-window", response_model=PitWindowResponse)
def pit_window_sensitivity_endpoint(req: PitWindowSensitivityRequest):
    stints_dicts = [{"compound": s.compound, "laps": s.laps} for s in req.stints]
    items_raw = StrategyAnalyticsService.evaluate_pit_window(
        engine=_engine,
        stint_definitions=stints_dicts,
        stint_index_to_vary=req.stint_index,
        lap_offsets=req.offsets,
    )
    dtos = [PitWindowItemDTO(**i.__dict__) for i in items_raw]
    sched = stints_dicts[req.stint_index]["laps"]
    return PitWindowResponse(
        scheduled_pit_lap=sched,
        sensitivity_curve=dtos,
    )


@router.post("/scenarios", response_model=ScenarioMatrixResponse)
def scenario_matrix_endpoint(req: ScenarioMatrixRequest):
    stints_dicts = [{"compound": s.compound, "laps": s.laps} for s in req.stints]
    base_res = _engine.simulate_race("BASE_DRY_GREEN", stints_dicts, "DRY", "GREEN")
    base_t = base_res.total_race_time_s

    cells = []
    sc_list = ["GREEN", "VSC", "SAFETY_CAR"]
    w_list = ["DRY", "COOL_DRY", "HOT_DRY"]

    for sc in sc_list:
        for w in w_list:
            r = _engine.simulate_race("SCEN", stints_dicts, w, sc)
            cells.append(
                ScenarioMatrixCellDTO(
                    safety_car_scenario=sc,
                    weather_scenario=w,
                    modelled_race_time_s=r.total_race_time_s,
                    delta_from_baseline_s=round(r.total_race_time_s - base_t, 2),
                )
            )

    return ScenarioMatrixResponse(
        baseline_race_time_s=base_t,
        scenarios=cells,
    )
