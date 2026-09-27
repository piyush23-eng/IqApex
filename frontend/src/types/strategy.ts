export interface TyreCompoundConfig {
  name: string;
  code: string;
  color: string;
  initial_grip: number;
  degradation_a: number;
  degradation_b: number;
  thermal_penalty_rate: number;
  warmup_laps: number;
  max_viable_laps: number;
  minimum_viable_grip: number;
}

export interface StintDefinition {
  compound: string;
  laps: number;
}

export interface SimulatedLap {
  lap_number: number;
  stint_number: number;
  compound: string;
  tyre_age: number;
  fuel_remaining_kg: number;
  vehicle_mass_kg: number;
  effective_grip: number;
  base_lap_time_s: number;
  tyre_penalty_s: number;
  fuel_effect_s: number;
  traffic_penalty_s: number;
  interruption_penalty_s: number;
  lap_time_s: number;
  cumulative_time_s: number;
  is_pit_in_lap: boolean;
  pit_loss_s: number;
}

export interface StintSimulation {
  stint_number: number;
  compound: string;
  start_lap: number;
  end_lap: number;
  stint_length: number;
  total_stint_time_s: number;
  mean_lap_time_s: number;
  start_tyre_age: number;
  end_tyre_age: number;
  laps: SimulatedLap[];
}

export interface RaceSimulationResponse {
  strategy_id: string;
  total_race_time_s: number;
  mean_lap_time_s: number;
  pit_stops_count: number;
  total_pit_loss_s: number;
  stints: StintSimulation[];
  laps: SimulatedLap[];
  weather_scenario: string;
  safety_car_scenario: string;
  traffic_scenario: string;
  scientific_disclaimer: string;
}

export interface FeasibleStrategy {
  strategy_id: string;
  name: string;
  pit_stops_count: number;
  compound_sequence: string[];
  stint_lengths: number[];
  pit_laps: number[];
  is_fia_legal: boolean;
  summary: string;
}

export interface StrategyListResponse {
  total_strategies: number;
  strategies: FeasibleStrategy[];
  circuit: string;
  total_laps: number;
  provenance_label: string;
}

export interface HistogramBin {
  bin_start: number;
  bin_end: number;
  count: number;
  frequency: number;
}

export interface StrategyMonteCarloResponse {
  strategy_id: string;
  simulation_seed: number;
  iterations: number;
  mean_race_time_s: number;
  median_race_time_s: number;
  std_dev_race_time_s: number;
  p05_race_time_s: number;
  p10_race_time_s: number;
  p25_race_time_s: number;
  p50_race_time_s: number;
  p75_race_time_s: number;
  p90_race_time_s: number;
  p95_race_time_s: number;
  bins: HistogramBin[];
  probability_beating_ref: number | null;
  scientific_disclaimer: string;
}

export interface StrategyAttributionItem {
  factor_name: string;
  delta_s: number;
  description: string;
}

export interface StrategyComparisonResponse {
  baseline_id: string;
  scenario_id: string;
  delta_race_time_s: number;
  delta_pit_loss_s: number;
  delta_mean_lap_time_s: number;
  baseline_race_time_s: number;
  scenario_race_time_s: number;
  baseline_stops: number;
  scenario_stops: number;
  attribution: StrategyAttributionItem[];
  residual_s: number;
  disclaimer: string;
}

export interface PitWindowItem {
  pit_lap_offset: number;
  scheduled_pit_lap: number;
  actual_pit_lap: number;
  modelled_race_time_s: number;
  delta_race_time_s: number;
  p95_race_time_s: number;
  final_tyre_age: number;
}

export interface PitWindowResponse {
  scheduled_pit_lap: number;
  sensitivity_curve: PitWindowItem[];
  disclaimer: string;
}

export interface CompoundCurvePoint {
  tyre_age: number;
  effective_grip: number;
  lap_time_penalty_s: number;
  thermal_penalty_s: number;
  is_cliff_exceeded: boolean;
}

export interface CompoundCurveResponse {
  compound: string;
  max_viable_laps: number;
  curve: CompoundCurvePoint[];
}

export interface ScenarioMatrixCell {
  safety_car_scenario: string;
  weather_scenario: string;
  modelled_race_time_s: number;
  delta_from_baseline_s: number;
}

export interface ScenarioMatrixResponse {
  baseline_race_time_s: number;
  scenarios: ScenarioMatrixCell[];
}
