from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.analytics.engineering_analysis_engine import EngineeringAnalysisEngine
from app.schemas.engineering_analysis import (
    DomainStatus,
    EngineeringFinding,
    EvidenceType,
)


def test_engineering_finding_disallows_fake_validated_type():
    """
    Evidence type VALIDATED is strictly forbidden on synthetic models
    unless an independent validation dataset actually exists in provenance.
    """
    with pytest.raises(ValidationError) as excinfo:
        EngineeringFinding(
            finding_id="F-TEST-1",
            title="Fake Validation Claim",
            description="Claiming model is validated without evidence",
            source_module="vehicle-performance",
            metric="lap_time",
            baseline_value=0.0,
            comparison_value=-0.1,
            delta=-0.1,
            unit="s",
            evidence_type=EvidenceType.VALIDATED,
            provenance={"source": "synthetic_model"},
        )
    assert "Evidence type 'VALIDATED' is forbidden" in str(excinfo.value)


def test_engineering_finding_allows_validated_with_provenance():
    """
    When an explicit independent validation dataset exists, VALIDATED is permitted.
    """
    finding = EngineeringFinding(
        finding_id="F-TEST-2",
        title="Valid Independent Validation",
        description="Compared against independent wind tunnel physical test",
        source_module="vehicle-performance",
        metric="downforce",
        baseline_value=2500.0,
        comparison_value=2510.0,
        delta=10.0,
        unit="N",
        evidence_type=EvidenceType.VALIDATED,
        provenance={"independent_validation_dataset": True, "dataset_id": "WT-RUN-402"},
    )
    assert finding.evidence_type == EvidenceType.VALIDATED


def test_domain_status_classification():
    """
    Verifies parameter bounds checking distinguishes INTERPOLATION, EXTRAPOLATION, and OUT_OF_BOUNDS.
    """
    engine = EngineeringAnalysisEngine(random_seed=42871)

    # 1. Normal configuration inside observed training range
    normal_setup = {"rear_wing_angle": 24.0, "front_wing_angle": 18.0}
    status, warning = engine.check_domain_status(normal_setup)
    assert status == DomainStatus.INTERPOLATION
    assert warning is None

    # 2. Extrapolation configuration: outside observed (18.0 to 30.0) but inside physical (12.0 to 38.0)
    extrap_setup = {"rear_wing_angle": 33.0}
    status, warning = engine.check_domain_status(extrap_setup)
    assert status == DomainStatus.EXTRAPOLATION
    assert warning is not None
    assert "extrapolating" in warning

    # 3. Out-of-bounds configuration: outside physical envelope
    oob_setup = {"rear_wing_angle": 45.0}
    status, warning = engine.check_domain_status(oob_setup)
    assert status == DomainStatus.OUT_OF_BOUNDS
    assert warning is not None
    assert "violates physical envelope" in warning
