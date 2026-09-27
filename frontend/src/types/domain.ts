export interface Session {
  session_id: string;
  event_name: string;
  circuit: string;
  session_type: string;
  date: string;
  weather: string;
  track_temperature: number;
}

export interface Driver {
  driver_id: string;
  name: string;
  team: string;
  car_number: number;
}

export interface Run {
  run_id: string;
  session_id: string;
  driver_id: string;
  compound: string;
  tyre_age: number;
  run_type: string;
  start_time: string;
  end_time: string;
}

export interface Lap {
  lap_id: string;
  run_id: string;
  lap_number: number;
  lap_time: number;
  sector_1: number;
  sector_2: number;
  sector_3: number;
  valid: boolean;
}

export interface TelemetryPoint {
  timestamp: number;
  distance: number;
  speed: number;
  throttle: number;
  brake: number;
  gear: number;
  rpm: number;
  drs: number;
  lateral_acceleration: number;
  longitudinal_acceleration: number;
}

export interface Corner {
  corner_id: string;
  name: string;
  entry_distance: number;
  apex_distance: number;
  exit_distance: number;
  entry_speed: number;
  minimum_speed: number;
  exit_speed: number;
  braking_point: number;
  throttle_application: number;
}

export type DataQualityStatus = 'PASS' | 'WARNING' | 'FAIL';

export interface DataQualityResult {
  status: DataQualityStatus;
  quality_score: number;
  missing_percentage: number;
  invalid_percentage: number;
  warnings: string[];
}

export interface HealthResponse {
  status: string;
  environment: string;
  version: string;
  database_connected: boolean;
  timestamp: string;
}

export interface SessionDetailResponse {
  session: Session;
  data_label: string;
  drivers: Driver[];
  runs: Run[];
}

export interface RunDetailResponse {
  run: Run;
  data_label: string;
  driver: Driver | null;
  laps: Lap[];
}

export interface LapDetailResponse {
  lap: Lap;
  data_label: string;
  telemetry_available: boolean;
  data_quality: DataQualityResult | null;
}

export interface TelemetryResponse {
  lap_id: string;
  data_label: string;
  total_raw_points: number;
  returned_points: number;
  downsampled: boolean;
  data_quality: DataQualityResult | null;
  points: TelemetryPoint[];
}

export interface ProcessingRun {
  processing_run_id: string;
  source_file: string;
  source_hash: string;
  processed_at: string;
  pipeline_version: string;
  mapping_version: string;
  status: string;
  quality_score: number;
  resampling_resolution: number;
}

export interface TelemetryInspectionResult {
  file_format: string;
  row_count: int_number;
  column_count: int_number;
  available_channels: string[];
  core_channels_found: string[];
  core_channels_missing: string[];
  optional_channels_found: string[];
  detected_units: Record<string, string>;
  timestamp_range: [number, number] | null;
  distance_range: [number, number] | null;
  sampling_interval_mean: number | null;
  estimated_sampling_frequency: number | null;
  warnings: string[];
}

type int_number = number;

export interface IngestionResult {
  processing_run_id: string;
  session_id: string;
  run_id: string;
  lap_id: string;
  raw_points: number;
  resampled_points: number;
  data_label: string;
  quality: DataQualityResult;
  lineage: ProcessingRun;
  raw_storage_path: string;
  processed_storage_path: string;
}

export interface LapMetadataResponse {
  lap_id: string;
  run_id: string;
  session_id: string;
  data_label: string;
  raw_points_count: number;
  lineage: ProcessingRun | null;
}

export interface LapChannelsResponse {
  lap_id: string;
  channels: string[];
  channel_units: Record<string, string>;
}

export interface LapComparisonResponse {
  reference_lap_id: string;
  comparison_lap_id: string;
  point_count: number;
  distance: number[];
  reference_speed: number[];
  comparison_speed: number[];
  speed_delta: number[];
  reference_time: number[];
  comparison_time: number[];
  time_delta: number[];
}

export interface CircuitCornerDefinition {
  corner_id: string;
  name: string;
  turn_number: number;
  entry_distance: number;
  apex_distance: number;
  exit_distance: number;
  circuit: string;
}

export interface CornerMetric {
  corner_id: string;
  corner_name: string;
  turn_number: number;
  entry_distance: number;
  apex_distance: number;
  exit_distance: number;
  ref_entry_speed: number;
  comp_entry_speed: number;
  entry_speed_delta: number;
  ref_min_speed: number;
  comp_min_speed: number;
  min_speed_delta: number;
  ref_apex_distance: number;
  comp_apex_distance: number;
  ref_exit_speed: number;
  comp_exit_speed: number;
  exit_speed_delta: number;
  ref_braking_point: number | null;
  comp_braking_point: number | null;
  braking_point_delta: number | null;
  ref_throttle_pickup: number | null;
  comp_throttle_pickup: number | null;
  throttle_pickup_delta: number | null;
  ref_corner_time: number;
  comp_corner_time: number;
  corner_time_delta: number;
  cumulative_time_delta_exit: number;
}

export interface SectorComparison {
  sector: number;
  start_distance: number;
  end_distance: number;
  ref_time: number;
  comp_time: number;
  delta: number;
}

export interface LapComparisonSummary {
  reference_lap_id: string;
  comparison_lap_id: string;
  data_label: string;
  reference_driver: Driver | null;
  comparison_driver: Driver | null;
  reference_run: Run | null;
  comparison_run: Run | null;
  reference_lap: Lap;
  comparison_lap: Lap;
  reference_quality_score: number;
  comparison_quality_score: number;
  lap_time_delta: number;
  sectors: SectorComparison[];
  corners: CornerMetric[];
}

export interface AlignedChannelsResponse {
  reference_lap_id: string;
  comparison_lap_id: string;
  point_count: number;
  distance: number[];
  ref_speed: number[];
  comp_speed: number[];
  ref_throttle: number[];
  comp_throttle: number[];
  ref_brake: number[];
  comp_brake: number[];
  ref_gear: number[];
  comp_gear: number[];
  ref_rpm: number[];
  comp_rpm: number[];
  ref_drs: number[];
  comp_drs: number[];
  ref_lat_g: number[];
  comp_lat_g: number[];
  ref_long_g: number[];
  comp_long_g: number[];
  time_delta: number[];
  speed_delta: number[];
}

export type NavModule =
  | 'overview'
  | 'telemetry'
  | 'lap-analysis'
  | 'driver-comparison'
  | 'vehicle-performance'
  | 'tyres'
  | 'sensitivity'
  | 'optimization'
  | 'strategy'
  | 'data-runs'
  | 'model-health'
  | 'engineering-analysis';

export interface EngineeringContext {
  session: Session | null;
  selectedDriver: Driver | null;
  selectedRun: Run | null;
  selectedLap: Lap | null;
  referenceDriver: Driver | null;
  referenceLap: Lap | null;
  dataStatus: string;
  dataSourceLabel: string;
  isSynthetic: boolean;
}
