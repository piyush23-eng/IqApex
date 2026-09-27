export type EvidenceType =
  | 'OBSERVED'
  | 'STATISTICAL_ASSOCIATION'
  | 'MODELLED'
  | 'SCENARIO'
  | 'OPTIMIZATION'
  | 'VALIDATED';

export type DomainStatus =
  | 'OBSERVED_DOMAIN'
  | 'INTERPOLATION'
  | 'EXTRAPOLATION'
  | 'OUT_OF_BOUNDS';

export interface UncertaintyQuantiles {
  mean: number;
  median: number;
  std_dev: number;
  p05: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  ci_95_lower?: number;
  ci_95_upper?: number;
  pi_95_lower?: number;
  pi_95_upper?: number;
}

export interface EngineeringFinding {
  finding_id: string;
  title: string;
  description: string;
  source_module: string;
  metric: string;
  baseline_value: number;
  comparison_value: number;
  delta: number;
  unit: string;
  evidence_type: EvidenceType;
  confidence?: number;
  uncertainty?: Record<string, unknown>;
  assumptions: string[];
  provenance: Record<string, unknown>;
}

export interface PhaseContribution {
  phase: string;
  delta_s: number;
  percentage_of_lap_delta: number;
  evidence_type: EvidenceType;
}

export interface CornerContribution {
  corner_id: string;
  delta_s: number;
  entry_delta_s: number;
  apex_delta_s: number;
  exit_delta_s: number;
  dominant_phase: string;
  evidence_type: EvidenceType;
}

export interface CandidateParameterSensitivity {
  parameter_name: string;
  display_name: string;
  sensitivity_value: number;
  unit: string;
  current_value: number;
  recommended_direction: string;
  modelled_phase_impact: string;
  evidence_type: EvidenceType;
  domain_status: DomainStatus;
}

export interface LapLossAnalysisResponse {
  reference_lap_id: string;
  comparison_lap_id: string;
  total_delta_s: number;
  phase_contributions: PhaseContribution[];
  corner_contributions: CornerContribution[];
  candidate_parameters: CandidateParameterSensitivity[];
  residual_s: number;
  evidence_type: EvidenceType;
  uncertainty: Record<string, unknown>;
  provenance: Record<string, unknown>;
}

export interface SetupScenarioResponse {
  baseline_setup: Record<string, number>;
  scenario_setup: Record<string, number>;
  delta_parameters: Record<string, number>;
  downforce_n: number;
  drag_n: number;
  lift_to_drag: number;
  aero_balance_pct: number;
  delta_downforce_n: number;
  delta_drag_n: number;
  delta_corner_time_s: number;
  delta_straight_time_s: number;
  delta_lap_time_s: number;
  confidence_interval_95: [number, number];
  prediction_interval_95: [number, number];
  domain_status: DomainStatus;
  extrapolation_warning: string | null;
  evidence_type: EvidenceType;
  provenance: Record<string, unknown>;
}

export interface SetupStrategyResponse {
  strategy_id: string;
  baseline_race_time_s: number;
  scenario_race_time_s: number;
  delta_race_time_s: number;
  mean_lap_time_s: number;
  delta_mean_lap_time_s: number;
  p05_race_time_s: number;
  p50_race_time_s: number;
  p95_race_time_s: number;
  tyre_degradation_effect_s: number;
  pit_loss_s: number;
  evidence_type: EvidenceType;
  provenance: Record<string, unknown>;
}

export interface EngineeringAnalysis {
  analysis_id: string;
  created_at: string;
  input_hash: string;
  reference_session: string;
  reference_lap: string;
  comparison_lap: string;
  reference_setup: Record<string, number>;
  comparison_setup: Record<string, number>;
  findings: EngineeringFinding[];
  lap_loss: LapLossAnalysisResponse;
  setup_scenario: SetupScenarioResponse;
  strategy_consequence: SetupStrategyResponse;
  domain_status: DomainStatus;
  provenance: Record<string, unknown>;
}

export interface EngineeringReportResponse {
  analysis_id: string;
  created_at: string;
  title: string;
  input_hash: string;
  executive_summary: Record<string, unknown>;
  telemetry_evidence: Record<string, unknown>;
  statistical_evidence: Record<string, unknown>;
  vehicle_performance: Record<string, unknown>;
  strategy: Record<string, unknown>;
  uncertainty: Record<string, unknown>;
  provenance: Record<string, unknown>;
  markdown_content: string;
}

export interface TradeoffPoint {
  id: string;
  name: string;
  front_wing_angle: number;
  rear_wing_angle: number;
  downforce_n: number;
  drag_n: number;
  lap_time_delta_s: number;
  race_time_delta_s: number;
  uncertainty_pi_s: number;
  is_current: boolean;
}

export interface SetupPreset {
  id: string;
  name: string;
  description: string;
  changes: Record<string, number>;
}

export const SETUP_PRESETS: SetupPreset[] = [
  {
    id: 'nominal',
    name: 'Nominal Monza Setup',
    description: 'Reference aero package (RW=24.0°, FW=18.0°, RH_F=32mm)',
    changes: { rear_wing_angle: 24.0, front_wing_angle: 18.0, ride_height_front: 32.0 },
  },
  {
    id: 'low_drag',
    name: 'Low Drag Sprint Setup',
    description: 'Reduced wing angles for top speed on main straight (-3.0° RW, -2.0° FW)',
    changes: { rear_wing_angle: 21.0, front_wing_angle: 16.0 },
  },
  {
    id: 'high_df',
    name: 'High Downforce / Sector 2 Focus',
    description: 'Increased wing angles (+2.5° RW, +1.5° FW) to attack Ascari & Parabolica',
    changes: { rear_wing_angle: 26.5, front_wing_angle: 19.5 },
  },
  {
    id: 'ground_effect',
    name: 'Ground Effect / Low Ride Height',
    description: 'Aggressive front floor ride height (-3.0mm) + balance trimming',
    changes: { ride_height_front: 29.0, rear_wing_angle: 25.0 },
  },
  {
    id: 'extrapolation',
    name: 'Extrapolation Test (RW=34.0°)',
    description: 'Exceeds observed surrogate training range [18.0°, 30.0°] to audit warnings',
    changes: { rear_wing_angle: 34.0 },
  },
];

