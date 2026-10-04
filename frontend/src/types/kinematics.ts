/**
 * Formal telemetry domain types for Corner Kinematics Spectrum,
 * Speed Traps, and Micro-sector Performance Attribution.
 */

export type CornerClassification =
  | 'Heavy Braking'
  | 'Medium Speed'
  | 'High Speed / Aero'
  | 'Traction Exit';

export interface CornerKinematicSpectrumModel {
  id: string;
  name: string;
  officialNumber: string;
  type: CornerClassification;
  distanceSpan: string;
  apexDistance: number;
  refApexSpeed: number; // km/h
  compApexSpeed: number; // km/h
  apexSpeedDelta: number; // km/h
  entryBrakingG: number; // g
  brakePointDeltaMeters: number; // m
  throttlePickupDistance: string;
  timeDelta: number; // seconds
  cumulativeDelta: number; // seconds
  dominantSetupParam: string;
  setupInfluence: string;
  gear: number;
  lateralG: number;
}

export interface RadarSpeedTrapData {
  location: string;
  distance: string;
  refSpeed: number; // km/h
  compSpeed: number; // km/h
  delta: number; // km/h
}
