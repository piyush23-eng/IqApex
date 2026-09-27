from __future__ import annotations

from fastapi.testclient import TestClient

from app.analytics.engineering_analysis_engine import (
    DEFAULT_BASELINE_SETUP,
    EngineeringAnalysisEngine,
)
from app.main import app


def test_engineering_report_generation():
    """
    Verifies that the generated engineering report contains all required sections and deterministic markdown.
    """
    engine = EngineeringAnalysisEngine(random_seed=42871)
    analysis = engine.run_full_pipeline(
        baseline_setup=DEFAULT_BASELINE_SETUP,
        parameter_changes={"rear_wing_angle": 1.0},
    )
    report = engine.generate_report(analysis)

    assert report.analysis_id == analysis.analysis_id
    assert report.input_hash == analysis.input_hash
    assert "Executive Summary" in report.markdown_content
    assert "Telemetry Evidence" in report.markdown_content
    assert "Candidate Parameter Sensitivities" in report.markdown_content
    assert "Vehicle Performance & Aerodynamics" in report.markdown_content
    assert "Race Strategy Consequence" in report.markdown_content
    assert "Uncertainty & Assumptions" in report.markdown_content
    assert "Provenance & Reproducibility" in report.markdown_content


def test_engineering_analysis_api_endpoints():
    """
    Verifies REST endpoints for engineering analysis.
    """
    client = TestClient(app)

    # 1. Lap loss GET
    res = client.get("/api/engineering-analysis/lap-loss")
    assert res.status_code == 200
    data = res.json()
    assert data["total_delta_s"] == 0.206
    assert len(data["phase_contributions"]) == 4

    # 2. Setup scenario POST
    res = client.post(
        "/api/engineering-analysis/setup-scenario",
        json={
            "baseline_setup": DEFAULT_BASELINE_SETUP,
            "parameter_changes": {"rear_wing_angle": 2.0},
        },
    )
    assert res.status_code == 200
    scen_data = res.json()
    assert scen_data["delta_downforce_n"] > 0
    assert scen_data["domain_status"] == "INTERPOLATION"

    # 3. Full pipeline POST
    res = client.post(
        "/api/engineering-analysis/full-pipeline",
        json={
            "reference_lap_id": "lap_ref_1",
            "comparison_lap_id": "lap_comp_1",
            "baseline_setup": DEFAULT_BASELINE_SETUP,
            "parameter_changes": {"rear_wing_angle": 1.5},
            "strategy_id": "strat_1stop_med_hard",
        },
    )
    assert res.status_code == 200
    pipe_data = res.json()
    assert "analysis_id" in pipe_data
    assert len(pipe_data["findings"]) == 4

    # 4. Report default GET
    res = client.get("/api/engineering-analysis/report/default")
    assert res.status_code == 200
    rep_data = res.json()
    assert "markdown_content" in rep_data
