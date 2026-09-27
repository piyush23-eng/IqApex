export interface ParameterDefinition {
  name: string;
  unit: string;
  minimum: number;
  maximum: number;
  step: number;
  source: 'telemetry' | 'metadata' | 'session' | 'proxy';
  allowed_perturbation: [number, number];
  description: string;
}

export interface ModelMetrics {
  mae: number;
  rmse: number;
  r_squared: number;
  cv_rmse: number;
  sample_count: number;
  residual_mean: number;
  residual_std: number;
  shapiro_p_value: number | null;
}

export interface ModelMetadata {
  model_id: string;
  model_type: 'linear' | 'polynomial' | 'spline' | 'interaction';
  features: string[];
  target: string;
  training_dataset: string;
  validation_methodology: string;
  training_timestamp: string;
  pipeline_version: string;
  metrics: ModelMetrics;
  observed_domain: Record<string, [number, number]>;
  model_hash: string;
  training_data_type: string;
}

export interface ObservedDataPoint {
  lap_id: string;
  x_val: number;
  y_val: number;
}

export interface ResponseCurvePoint {
  x: number;
  y_modelled: number;
  ci_95_lower: number;
  ci_95_upper: number;
  pi_95_lower: number;
  pi_95_upper: number;
  is_extrapolation: boolean;
}

export interface ResponseCurveResponse {
  parameter_name: string;
  target_name: string;
  baseline_x: number;
  baseline_y: number;
  scenario_x: number;
  scenario_y: number;
  predicted_delta: number;
  uncertainty_95: number;
  domain_status: 'INTERPOLATION' | 'EXTRAPOLATION';
  extrapolation_warning: string | null;
  observed_range: [number, number];
  points: ResponseCurvePoint[];
  observed_data: ObservedDataPoint[];
  model_metadata: ModelMetadata;
  provenance: Record<string, unknown>;
}

export interface ResponseSurface2DResponse {
  feature_x1: string;
  feature_x2: string;
  target_name: string;
  x1_values: number[];
  x2_values: number[];
  z_matrix: number[][];
  interpolation_mask: boolean[][];
  observed_x1_range: [number, number];
  observed_x2_range: [number, number];
  observed_scatter: Array<{ lap_id: string; x1: number; x2: number; y: number }>;
  model_metadata: ModelMetadata;
  provenance: Record<string, unknown>;
}

export interface SweepPoint {
  parameter_value: number;
  predicted_target: number;
  predicted_delta: number;
  uncertainty_95: number;
  is_extrapolation: boolean;
  distance_from_observed_range: number;
}

export interface ParameterSweepResponse {
  parameter_name: string;
  target_name: string;
  unit: string;
  baseline_value: number;
  baseline_target: number;
  observed_range: [number, number];
  points: SweepPoint[];
  model_metadata: ModelMetadata;
  result_type: 'MODELLED';
}

export interface HistogramBin {
  bin_start: number;
  bin_end: number;
  count: number;
  frequency: number;
}

export interface MonteCarloSimulationRequest {
  parameter_name: string;
  target_name: string;
  baseline_value: number;
  scenario_mean: number;
  scenario_std: number;
  iterations?: number;
  simulation_seed?: number;
  include_residual_variance?: boolean;
  session_id?: string;
  corner_id?: string;
}

export interface MonteCarloSimulationResponse {
  simulation_seed: number;
  iterations: number;
  parameter_name: string;
  target_name: string;
  baseline_value: number;
  scenario_mean: number;
  scenario_std: number;
  mean_delta: number;
  median_delta: number;
  std_dev_delta: number;
  p05_delta: number;
  p10_delta: number;
  p50_delta: number;
  p90_delta: number;
  p95_delta: number;
  bins: HistogramBin[];
  result_type: 'MODELLED';
  disclaimer: string;
  provenance: Record<string, unknown>;
}

export interface ConstrainedOptimizationRequest {
  parameter_name: string;
  target_name: string;
  baseline_value: number;
  allow_extrapolation?: boolean;
  robust_penalty_lambda?: number;
  session_id?: string;
  corner_id?: string;
}

export interface ScenarioOutcome {
  name: string;
  scenario_type: 'NOMINAL' | 'CONSERVATIVE' | 'ROBUST';
  parameter_value: number;
  predicted_target: number;
  predicted_delta: number;
  uncertainty_95: number;
  data_domain: 'INTERPOLATION' | 'EXTRAPOLATION';
  is_extrapolation: boolean;
  constraints_satisfied: boolean;
  description: string;
}

export interface ConstrainedOptimizationResponse {
  parameter_name: string;
  target_name: string;
  unit: string;
  baseline_value: number;
  baseline_target: number;
  observed_range: [number, number];
  configured_bounds: [number, number];
  scenarios: ScenarioOutcome[];
  model_version: string;
  validation_rmse: number;
  result_type: 'OPTIMIZED';
  disclaimer: string;
  provenance: Record<string, unknown>;
}

export interface SensitivityMatrixItem {
  corner_id: string;
  corner_name: string;
  parameter_name: string;
  unit: string;
  baseline_value: number;
  observed_range: [number, number];
  local_sensitivity: number;
  uncertainty_95: number;
  sample_count: number;
  model_quality: string;
  result_type: 'MODELLED';
}

export interface SensitivityMatrixResponse {
  circuit: string;
  session_id: string;
  items: SensitivityMatrixItem[];
  training_data_type: string;
}
