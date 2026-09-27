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
  | 'model-health';

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
