export interface ProvenanceMetadata {
  reference_lap_id: string;
  comparison_lap_id: string;
  spatial_grid_resolution_m: number;
  processing_run_id: string;
  pipeline_version: string;
  methodology: string;
}

export interface PhaseContribution {
  phase_name: string;
  category: 'braking' | 'cornering' | 'acceleration' | 'straight';
  start_distance: number;
  end_distance: number;
  distance_span: number;
  ref_duration: number;
  comp_duration: number;
  delta_time: number;
  percentage_of_total: number | null;
  confidence: string;
}

export interface CornerTimeGrowth {
  corner_id: string;
  corner_name: string;
  turn_number: number;
  entry_distance: number;
  apex_distance: number;
  exit_distance: number;
  entry_delta_time: number;
  apex_delta_time: number;
  exit_delta_time: number;
  entry_to_apex_growth: number;
  apex_to_exit_growth: number;
  total_corner_delta: number;
}

export interface SectorDecomposition {
  sector: number;
  start_distance: number;
  end_distance: number;
  total_delta: number;
  corner_contributions: Record<string, number>;
  straight_contribution: number;
  sector_residual: number;
}

export interface WaterfallStep {
  step_index: number;
  label: string;
  category: 'baseline' | 'corner' | 'straight' | 'residual' | 'total';
  start_time: number;
  increment: number;
  end_time: number;
  distance_range: string;
}

export interface LapDecompositionResult {
  reference_lap_id: string;
  comparison_lap_id: string;
  data_label: string;
  reference_method: string;
  total_lap_delta: number;
  braking_delta: number;
  cornering_delta: number;
  acceleration_delta: number;
  straight_delta: number;
  residual: number;
  phases: PhaseContribution[];
  corners_growth: CornerTimeGrowth[];
  sectors: SectorDecomposition[];
  waterfall_steps: WaterfallStep[];
  provenance: ProvenanceMetadata;
}

export interface DescriptiveStatistics {
  metric: string;
  sample_count: number;
  mean: number;
  median: number;
  std_dev: number;
  variance: number;
  p10: number;
  p90: number;
  ci_95_lower: number;
  ci_95_upper: number;
  prediction_interval_lower: number;
  prediction_interval_upper: number;
}

export interface OutlierObservation {
  id: string;
  value: number;
  reason: string;
}

export interface OutlierReport {
  method: string;
  total_samples: number;
  included_count: number;
  excluded_count: number;
  threshold_lower: number | null;
  threshold_upper: number | null;
  excluded_observations: OutlierObservation[];
}

export interface RepeatedLapsStatisticsResponse {
  session_id: string;
  driver_id: string | null;
  metric: string;
  descriptive: DescriptiveStatistics;
  outliers: OutlierReport;
}

export interface CorrelationResult {
  feature_x: string;
  feature_y: string;
  pearson_r: number;
  pearson_p_value: number;
  spearman_rho: number;
  spearman_p_value: number;
  sample_count: number;
  is_significant_005: boolean;
}

export interface RegressionResidual {
  observation_id: string;
  actual: number;
  predicted: number;
  residual: number;
}

export interface RegressionResult {
  target_metric: string;
  feature_metric: string;
  slope: number;
  intercept: number;
  slope_std_error: number;
  ci_95_slope_lower: number;
  ci_95_slope_upper: number;
  r_squared: number;
  sample_count: number;
  residual_std: number;
  heteroscedasticity_p_value: number | null;
  residuals: RegressionResidual[];
}

export interface SensitivityItem {
  feature: string;
  baseline_value: number;
  observed_variation_std: number;
  lap_delta_sensitivity_per_unit: number;
  sector_delta_sensitivity_per_unit: number;
  sample_count: number;
  uncertainty_p_value: number;
}

export type ReferenceMethod =
  | 'selected_lap'
  | 'session_best_valid'
  | 'driver_best_valid'
  | 'median_valid';
