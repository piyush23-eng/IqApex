from __future__ import annotations

from app.analytics.engineering_analysis_engine import EngineeringAnalysisEngine
from app.schemas.engineering_analysis import EvidenceType


def test_lap_loss_decomposition_reconciliation():
    """
    Verifies that the sum of decomposed phases plus residual reconciles exactly with total delta.
    """
    engine = EngineeringAnalysisEngine(random_seed=42871)
    res = engine.analyze_lap_loss("lap_ref_1", "lap_comp_1")

    assert res.total_delta_s == 0.206
    assert res.evidence_type == EvidenceType.OBSERVED

    phase_sum = sum(p.delta_s for p in res.phase_contributions)
    reconciled = round(phase_sum + res.residual_s, 4)
    assert abs(reconciled - res.total_delta_s) < 1e-4

    # Ensure all phases have explicit evidence type OBSERVED
    for p in res.phase_contributions:
        assert p.evidence_type == EvidenceType.OBSERVED
        assert p.delta_s > 0


def test_candidate_parameter_non_causal_phrasing():
    """
    Verifies that candidate parameters use non-causal language and have modelled evidence type.
    """
    engine = EngineeringAnalysisEngine(random_seed=42871)
    res = engine.analyze_lap_loss("lap_ref_1", "lap_comp_1")

    assert len(res.candidate_parameters) > 0
    for cp in res.candidate_parameters:
        assert cp.evidence_type == EvidenceType.MODELLED
        assert "caused" not in cp.modelled_phase_impact.lower()
        assert cp.sensitivity_value != 0.0
