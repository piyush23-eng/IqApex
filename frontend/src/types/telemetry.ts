export type ChannelKey =
  | 'speed'
  | 'throttle'
  | 'brake'
  | 'gear'
  | 'rpm'
  | 'drs'
  | 'lat_g'
  | 'long_g'
  | 'delta';

export interface ChannelConfig {
  key: ChannelKey;
  label: string;
  unit: string;
  hotkey: number;
}

export const CHANNELS: ChannelConfig[] = [
  { key: 'speed', label: 'Speed', unit: 'km/h', hotkey: 1 },
  { key: 'throttle', label: 'Throttle', unit: '%', hotkey: 2 },
  { key: 'brake', label: 'Brake', unit: '%', hotkey: 3 },
  { key: 'gear', label: 'Gear', unit: 'idx', hotkey: 4 },
  { key: 'rpm', label: 'RPM', unit: 'rpm', hotkey: 5 },
  { key: 'drs', label: 'DRS', unit: 'state', hotkey: 6 },
  { key: 'lat_g', label: 'Lat G', unit: 'G', hotkey: 7 },
  { key: 'long_g', label: 'Long G', unit: 'G', hotkey: 8 },
  { key: 'delta', label: 'Delta', unit: 's/kmh', hotkey: 9 },
];
