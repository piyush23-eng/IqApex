from __future__ import annotations

from fastapi import APIRouter, Query

from app.analytics.engineering_analysis_engine import (
    DEFAULT_BASELINE_SETUP,
    EngineeringAnalysisEngine,
)
from app.schemas.engineering_analysis import (
    EngineeringAnalysis,
    EngineeringFinding,
    EngineeringReportResponse,
    FullCrossModulePipelineRequest,
    LapLossAnalysisRequest,
    LapLossAnalysisResponse,
    SetupScenarioRequest,
    SetupScenarioResponse,
    SetupStrategyRequest,
    SetupStrategyResponse,
)

router = APIRouter(prefix="/engineering-analysis", tags=["engineering-analysis"])

# Singleton engine instance
_engine: EngineeringAnalysisEngine | None = None


def _get_engine() -> EngineeringAnalysisEngine:
    global _engine
    if _engine is None:
        _engine = EngineeringAnalysisEngine(random_seed=42871)
    return _engine


@router.post("/lap-loss", response_model=LapLossAnalysisResponse)
def analyze_lap_loss(req: LapLossAnalysisRequest) -> LapLossAnalysisResponse:
    """
    Decomposes measured lap time loss into physical phases and associates
    candidate setup parameters that possess modelled sensitivity.
    """
    engine = _get_engine()
    return engine.analyze_lap_loss(
        reference_lap_id=req.reference_lap_id,
        comparison_lap_id=req.comparison_lap_id,
        sector=req.sector,
        corner_id=req.corner_id,
    )


@router.get("/lap-loss", response_model=LapLossAnalysisResponse)
def get_lap_loss(
    reference_lap: str = Query("lap_ref_1"),
    comparison_lap: str = Query("lap_comp_1"),
    sector: int | None = Query(None),
    corner: str | None = Query(None),
) -> LapLossAnalysisResponse:
    """
    GET endpoint for lap loss decomposition.
    """
    engine = _get_engine()
    return engine.analyze_lap_loss(
        reference_lap_id=reference_lap,
        comparison_lap_id=comparison_lap,
        sector=sector,
        corner_id=corner,
    )


@router.post("/setup-scenario", response_model=SetupScenarioResponse)
def evaluate_setup_scenario(req: SetupScenarioRequest) -> SetupScenarioResponse:
    """
    Evaluates a setup change through the Aero Surrogate and Vehicle Dynamics kinematics.
    Preserves 95% confidence and prediction intervals and flags extrapolation.
    """
    engine = _get_engine()
    return engine.evaluate_setup_scenario(
        baseline_setup=req.baseline_setup,
        parameter_changes=req.parameter_changes,
    )


@router.post("/setup-strategy", response_model=SetupStrategyResponse)
def evaluate_setup_strategy(req: SetupStrategyRequest) -> SetupStrategyResponse:
    """
    Couples a vehicle setup change into the 53-lap race strategy simulation and Monte Carlo engine.
    """
    engine = _get_engine()
    return engine.evaluate_setup_strategy(
        baseline_setup=req.baseline_setup,
        scenario_setup=req.scenario_setup,
        strategy_id=req.strategy_id,
        weather=req.weather,
        safety_car=req.safety_car,
        traffic=req.traffic,
    )


@router.post("/full-pipeline", response_model=EngineeringAnalysis)
def run_full_cross_module_pipeline(req: FullCrossModulePipelineRequest) -> EngineeringAnalysis:
    """
    Runs the complete cross-module pipeline from telemetry observation through
    hypotheses, setup what-if, vehicle kinematics, race strategy, and findings.
    """
    engine = _get_engine()
    return engine.run_full_pipeline(
        reference_lap_id=req.reference_lap_id,
        comparison_lap_id=req.comparison_lap_id,
        baseline_setup=req.baseline_setup,
        parameter_changes=req.parameter_changes,
        strategy_id=req.strategy_id,
        weather=req.weather,
        safety_car=req.safety_car,
        traffic=req.traffic,
    )


@router.get("/findings", response_model=list[EngineeringFinding])
def get_engineering_findings() -> list[EngineeringFinding]:
    """
    Returns structured findings categorized by evidence_type.
    """
    engine = _get_engine()
    analysis = engine.run_full_pipeline()
    return analysis.findings


@router.post("/report", response_model=EngineeringReportResponse)
def generate_engineering_report(analysis: EngineeringAnalysis) -> EngineeringReportResponse:
    """
    Compiles an exportable deterministic engineering decision report from an analysis object.
    """
    engine = _get_engine()
    return engine.generate_report(analysis)


@router.get("/report/default", response_model=EngineeringReportResponse)
def get_default_report() -> EngineeringReportResponse:
    """
    Generates report for standard baseline scenario.
    """
    engine = _get_engine()
    analysis = engine.run_full_pipeline(
        baseline_setup=DEFAULT_BASELINE_SETUP,
        parameter_changes={"rear_wing_angle": 1.5, "front_wing_angle": 1.0},
    )
    return engine.generate_report(analysis)
