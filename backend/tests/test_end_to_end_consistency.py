from app.analytics.engineering_analysis_engine import EngineeringAnalysisEngine
from app.schemas.engineering_analysis import DomainStatus


def test_canonical_end_to_end_pipeline_consistency():
    """
    Cross-Module Consistency & Reproducibility Test:
    Executes the canonical reference pipeline with fixed inputs and seed 42871.
    Verifies that all 8 interconnected layers execute consistently and reproduce
    the exact same input hash and metric values.
    """
    engine = EngineeringAnalysisEngine()

    kwargs = {
        "reference_lap_id": "lap_ref_1",
        "comparison_lap_id": "lap_comp_1",
        "baseline_setup": {"rear_wing_angle": 24.0, "front_wing_angle": 18.0, "ride_height_front": 32.0, "ride_height_rear": 42.0},
        "parameter_changes": {"rear_wing_angle": -3.0, "front_wing_angle": -2.0},
        "strategy_id": "strat_1stop_med_hard",
        "weather": "DRY",
        "safety_car": "GREEN",
        "traffic": "LIGHT_TRAFFIC",
    }

    analysis1 = engine.run_full_pipeline(**kwargs)
    analysis2 = engine.run_full_pipeline(**kwargs)

    # 1. Deterministic hashing & input reproducibility
    assert analysis1.input_hash == analysis2.input_hash
    assert len(analysis1.input_hash) == 64

    # 2. Lap Loss Decomposition consistency
    assert analysis1.lap_loss.total_delta_s == analysis2.lap_loss.total_delta_s
    assert len(analysis1.lap_loss.phase_contributions) == len(analysis2.lap_loss.phase_contributions)

    # 3. Aero Surrogate & Kinematics consistency
    assert analysis1.setup_scenario.delta_lap_time_s == analysis2.setup_scenario.delta_lap_time_s
    assert analysis1.setup_scenario.downforce_n == analysis2.setup_scenario.downforce_n
    assert analysis1.setup_scenario.drag_n == analysis2.setup_scenario.drag_n
    assert analysis1.setup_scenario.domain_status == DomainStatus.INTERPOLATION

    # 4. Strategy & Monte Carlo consistency
    assert analysis1.strategy_consequence.baseline_race_time_s == analysis2.strategy_consequence.baseline_race_time_s
    assert analysis1.strategy_consequence.scenario_race_time_s == analysis2.strategy_consequence.scenario_race_time_s
    assert analysis1.strategy_consequence.delta_race_time_s == analysis2.strategy_consequence.delta_race_time_s

    # 5. Structured Findings consistency
    assert len(analysis1.findings) == len(analysis2.findings)
    assert analysis1.findings[0].title == analysis2.findings[0].title
    assert analysis1.findings[0].evidence_type == analysis2.findings[0].evidence_type

    # 6. Report generation consistency
    rep1 = engine.generate_report(analysis1)
    rep2 = engine.generate_report(analysis2)
    assert rep1.input_hash == rep2.input_hash
    assert rep1.executive_summary == rep2.executive_summary
    assert len(rep1.markdown_content) == len(rep2.markdown_content)
