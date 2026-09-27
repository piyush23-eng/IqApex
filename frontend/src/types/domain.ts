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
