from __future__ import annotations

from app.analytics.engineering_analysis_engine import (
    DEFAULT_BASELINE_SETUP,
    EngineeringAnalysisEngine,
)
from app.schemas.engineering_analysis import DomainStatus, EvidenceType


def test_setup_scenario_propagation_and_intervals():
    """
    Verifies parameter change propagation to downforce, drag, kinematics, and 95% intervals.
    """
    engine = EngineeringAnalysisEngine(random_seed=42871)
    res = engine.evaluate_setup_scenario(
        baseline_setup=DEFAULT_BASELINE_SETUP,
        parameter_changes={"rear_wing_angle": 2.0},
    )

    assert res.delta_downforce_n > 0  # Increasing rear wing increases downforce
    assert res.delta_drag_n > 0  # Increasing rear wing increases drag
    assert res.delta_corner_time_s < 0  # More downforce reduces corner transit time
    assert res.delta_straight_time_s >= 0  # More drag increases or maintains straight transit time

    # Interval checks: Prediction interval must be wider than confidence interval
    ci_span = res.confidence_interval_95[1] - res.confidence_interval_95[0]
    pi_span = res.prediction_interval_95[1] - res.prediction_interval_95[0]
    assert pi_span > ci_span

    assert res.domain_status == DomainStatus.INTERPOLATION
    assert res.evidence_type == EvidenceType.MODELLED


def test_setup_strategy_coupling():
    """
    Verifies coupling from setup parameters through to 53-lap race simulation.
    """
    engine = EngineeringAnalysisEngine(random_seed=42871)
    scenario_setup = {**DEFAULT_BASELINE_SETUP, "rear_wing_angle": 26.0}
    res = engine.evaluate_setup_strategy(
        baseline_setup=DEFAULT_BASELINE_SETUP,
        scenario_setup=scenario_setup,
        strategy_id="strat_1stop_med_hard",
    )

    assert res.baseline_race_time_s > 3800.0
    assert res.scenario_race_time_s > 3800.0
    assert res.p05_race_time_s < res.p50_race_time_s < res.p95_race_time_s
    assert res.evidence_type == EvidenceType.SCENARIO


def test_end_to_end_cross_module_pipeline():
    """
    Verifies full pipeline execution from telemetry observation to strategy and structured findings.
    """
    engine = EngineeringAnalysisEngine(random_seed=42871)
    analysis = engine.run_full_pipeline(
        reference_lap_id="lap_ref_1",
        comparison_lap_id="lap_comp_1",
        baseline_setup=DEFAULT_BASELINE_SETUP,
        parameter_changes={"rear_wing_angle": 1.5, "front_wing_angle": 1.0},
    )

    assert analysis.analysis_id.startswith("ANALYSIS-")
    assert len(analysis.findings) == 4

    types_found = {f.evidence_type for f in analysis.findings}
    assert EvidenceType.OBSERVED in types_found
    assert EvidenceType.STATISTICAL_ASSOCIATION in types_found
    assert EvidenceType.MODELLED in types_found
    assert EvidenceType.SCENARIO in types_found
    assert EvidenceType.VALIDATED not in types_found  # Synthetic pipeline must never claim VALIDATED

    # Verify deterministic hash reproducibility
    analysis_repeat = engine.run_full_pipeline(
        reference_lap_id="lap_ref_1",
        comparison_lap_id="lap_comp_1",
        baseline_setup=DEFAULT_BASELINE_SETUP,
        parameter_changes={"rear_wing_angle": 1.5, "front_wing_angle": 1.0},
    )
    assert analysis.input_hash == analysis_repeat.input_hash
