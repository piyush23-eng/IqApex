from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, model_validator


class EvidenceType(str, Enum):
    OBSERVED = "OBSERVED"
    STATISTICAL_ASSOCIATION = "STATISTICAL_ASSOCIATION"
    MODELLED = "MODELLED"
    SCENARIO = "SCENARIO"
    OPTIMIZATION = "OPTIMIZATION"
    VALIDATED = "VALIDATED"


class DomainStatus(str, Enum):
    OBSERVED_DOMAIN = "OBSERVED_DOMAIN"
    INTERPOLATION = "INTERPOLATION"
    EXTRAPOLATION = "EXTRAPOLATION"
    OUT_OF_BOUNDS = "OUT_OF_BOUNDS"


class UncertaintyQuantiles(BaseModel):
    mean: float
    median: float
    std_dev: float
    p05: float
    p10: float
    p25: float
    p50: float
    p75: float
    p90: float
    p95: float
    ci_95_lower: float | None = None
    ci_95_upper: float | None = None
    pi_95_lower: float | None = None
    pi_95_upper: float | None = None


class EngineeringFinding(BaseModel):
    finding_id: str
    title: str
    description: str
    source_module: str
    metric: str
    baseline_value: float
    comparison_value: float
    delta: float
    unit: str
    evidence_type: EvidenceType
    confidence: float | None = None
    uncertainty: dict[str, Any] | None = None
    assumptions: list[str] = Field(default_factory=list)
    provenance: dict[str, Any] = Field(default_factory=dict)

    @model_validator(mode="after")
    def check_validated_flag(self) -> EngineeringFinding:
        # Enforce rule: VALIDATED is disallowed for synthetic models
        # unless explicit real-world validation provenance exists
        if self.evidence_type == EvidenceType.VALIDATED:
            has_independent_val = self.provenance.get("independent_validation_dataset") is True
            if not has_independent_val:
                raise ValueError(
                    "Evidence type 'VALIDATED' is forbidden unless an independent validation dataset actually exists."
                )
        return self


class PhaseContribution(BaseModel):
    phase: str
    delta_s: float
    percentage_of_lap_delta: float
    evidence_type: EvidenceType = EvidenceType.OBSERVED


class CornerContribution(BaseModel):
    corner_id: str
    delta_s: float
    entry_delta_s: float
    apex_delta_s: float
    exit_delta_s: float
    dominant_phase: str
    evidence_type: EvidenceType = EvidenceType.OBSERVED


class CandidateParameterSensitivity(BaseModel):
    parameter_name: str
    display_name: str
    sensitivity_value: float
    unit: str
    current_value: float
    recommended_direction: str
    modelled_phase_impact: str
    evidence_type: EvidenceType = EvidenceType.MODELLED
    domain_status: DomainStatus = DomainStatus.INTERPOLATION


class LapLossAnalysisRequest(BaseModel):
    reference_lap_id: str = "lap_ref_1"
    comparison_lap_id: str = "lap_comp_1"
    sector: int | None = None
    corner_id: str | None = None


class LapLossAnalysisResponse(BaseModel):
    reference_lap_id: str
    comparison_lap_id: str
    total_delta_s: float
    phase_contributions: list[PhaseContribution]
    corner_contributions: list[CornerContribution]
    candidate_parameters: list[CandidateParameterSensitivity]
    residual_s: float
    evidence_type: EvidenceType = EvidenceType.OBSERVED
    uncertainty: dict[str, Any] = Field(default_factory=dict)
    provenance: dict[str, Any] = Field(default_factory=dict)


class SetupScenarioRequest(BaseModel):
    baseline_setup: dict[str, float]
    parameter_changes: dict[str, float]


class SetupScenarioResponse(BaseModel):
    baseline_setup: dict[str, float]
    scenario_setup: dict[str, float]
    delta_parameters: dict[str, float]
    downforce_n: float
    drag_n: float
    lift_to_drag: float
    aero_balance_pct: float
    delta_downforce_n: float
    delta_drag_n: float
    delta_corner_time_s: float
    delta_straight_time_s: float
    delta_lap_time_s: float
    confidence_interval_95: list[float]
    prediction_interval_95: list[float]
    domain_status: DomainStatus
    extrapolation_warning: str | None = None
    evidence_type: EvidenceType = EvidenceType.MODELLED
    provenance: dict[str, Any] = Field(default_factory=dict)


class SetupStrategyRequest(BaseModel):
    baseline_setup: dict[str, float]
    scenario_setup: dict[str, float]
    strategy_id: str = "strat_1stop_med_hard"
    weather: str = "DRY"
    safety_car: str = "GREEN"
    traffic: str = "LIGHT_TRAFFIC"


class SetupStrategyResponse(BaseModel):
    strategy_id: str
    baseline_race_time_s: float
    scenario_race_time_s: float
    delta_race_time_s: float
    mean_lap_time_s: float
    delta_mean_lap_time_s: float
    p05_race_time_s: float
    p50_race_time_s: float
    p95_race_time_s: float
    tyre_degradation_effect_s: float
    pit_loss_s: float
    evidence_type: EvidenceType = EvidenceType.SCENARIO
    provenance: dict[str, Any] = Field(default_factory=dict)


class FullCrossModulePipelineRequest(BaseModel):
    reference_lap_id: str = "lap_ref_1"
    comparison_lap_id: str = "lap_comp_1"
    baseline_setup: dict[str, float] | None = None
    parameter_changes: dict[str, float] | None = None
    strategy_id: str = "strat_1stop_med_hard"
    weather: str = "DRY"
    safety_car: str = "GREEN"
    traffic: str = "LIGHT_TRAFFIC"


class EngineeringAnalysis(BaseModel):
    analysis_id: str
    created_at: str
    input_hash: str
    reference_session: str
    reference_lap: str
    comparison_lap: str
    reference_setup: dict[str, float]
    comparison_setup: dict[str, float]
    findings: list[EngineeringFinding]
    lap_loss: LapLossAnalysisResponse
    setup_scenario: SetupScenarioResponse
    strategy_consequence: SetupStrategyResponse
    domain_status: DomainStatus
    provenance: dict[str, Any] = Field(default_factory=dict)


class EngineeringReportResponse(BaseModel):
    analysis_id: str
    created_at: str
    title: str
    input_hash: str
    executive_summary: dict[str, Any]
    telemetry_evidence: dict[str, Any]
    statistical_evidence: dict[str, Any]
    vehicle_performance: dict[str, Any]
    strategy: dict[str, Any]
    uncertainty: dict[str, Any]
    provenance: dict[str, Any]
    markdown_content: str
