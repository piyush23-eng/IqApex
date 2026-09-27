export interface VehicleParameterSpec {
  name: string;
  unit: string;
  minimum: number;
  maximum: number;
  step: number;
  default: number;
  source: string;
  description: string;
}

export interface ParameterListResponse {
  parameters: VehicleParameterSpec[];
  constants: Record<string, number>;
  provenance_label: string;
}

export interface VehicleConfig {
  front_wing_angle: number;
  rear_wing_angle: number;
  ride_height_front: number;
  ride_height_rear: number;
  yaw_angle: number;
  vehicle_speed: number;
  tyre_grip: number;
  mass: number;
}

export interface AeroEvaluationResponse {
  cl: number;
  cd: number;
  downforce_n: number;
  drag_n: number;
  lift_to_drag: number;
  aero_balance_pct: number;
  downforce_pi_95: [number, number];
  drag_pi_95: [number, number];
  domain_status: 'INTERPOLATION' | 'EXTRAPOLATION';
  model_version: string;
  dataset_version: string;
  dataset_hash: string;
  disclaimer: string;
  result_type: string;
}

export interface PerformanceDeltaItem {
  name: string;
  unit: string;
  baseline: number;
  scenario: number;
  delta: number;
  uncertainty_95: number;
}

export interface VehicleComparisonResponse {
  metrics: PerformanceDeltaItem[];
  modeled_lap_time_baseline_s: number;
  modeled_lap_time_scenario_s: number;
  modeled_lap_time_delta_s: number;
  top_speed_baseline_kph: number;
  top_speed_scenario_kph: number;
  top_speed_delta_kph: number;
  mean_lat_g_baseline: number;
  mean_lat_g_scenario: number;
  mean_lat_g_delta: number;
  baseline_domain: string;
  scenario_domain: string;
  disclaimer: string;
}

export interface ParetoPoint {
  config_id: string;
  front_wing_angle: number;
  rear_wing_angle: number;
  ride_height_front: number;
  ride_height_rear: number;
  downforce_n: number;
  drag_n: number;
  lift_to_drag: number;
  aero_balance_pct: number;
  is_pareto_optimal: boolean;
  dominance_rank: number;
}

export interface ParetoFrontierResponse {
  total_evaluated: number;
  pareto_efficient_count: number;
  dominated_count: number;
  points: ParetoPoint[];
  pareto_frontier: ParetoPoint[];
  disclaimer: string;
  scientific_label: string;
}

export interface ResponseSurface2DVehicleResponse {
  x_feature: string;
  y_feature: string;
  target: string;
  x_values: number[];
  y_values: number[];
  z_matrix: number[][];
  interpolation_mask: boolean[][];
  observed_x_bounds: [number, number];
  observed_y_bounds: [number, number];
  model_version: string;
}

export interface CornerSimulationItem {
  corner_id: string;
  corner_name: string;
  turn_number: number;
  curvature_radius_m: number;
  length_m: number;
  downforce_n: number;
  normal_load_n: number;
  max_lateral_force_n: number;
  max_lateral_accel_g: number;
  max_corner_speed_kph: number;
  transit_time_s: number;
  domain_status: string;
}

export interface StraightSimulationItem {
  straight_name: string;
  start_distance_m: number;
  end_distance_m: number;
  length_m: number;
  entry_speed_kph: number;
  exit_speed_kph: number;
  top_speed_kph: number;
  mean_acceleration_g: number;
  transit_time_s: number;
  drag_at_exit_n: number;
}

export interface TrackSimulationResponse {
  modeled_lap_time_s: number;
  total_corner_time_s: number;
  total_straight_time_s: number;
  top_speed_kph: number;
  mean_lateral_accel_g: number;
  corners: CornerSimulationItem[];
  straights: StraightSimulationItem[];
  disclaimer: string;
  circuit: string;
}

export interface HistogramBin {
  bin_start: number;
  bin_end: number;
  count: number;
  frequency: number;
}

export interface AeroMonteCarloResponse {
  simulation_seed: number;
  iterations: number;
  mean_lap_time_s: number;
  median_lap_time_s: number;
  std_dev_lap_time_s: number;
  p05_lap_time_s: number;
  p10_lap_time_s: number;
  p50_lap_time_s: number;
  p90_lap_time_s: number;
  p95_lap_time_s: number;
  p05_downforce_n: number;
  p95_downforce_n: number;
  mean_downforce_n: number;
  bins: HistogramBin[];
  disclaimer: string;
  result_type: string;
}
