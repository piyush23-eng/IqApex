import React from 'react';
import { CircuitCornerDefinition } from '../../types/domain';
import { Crosshair, MapPin } from 'lucide-react';

export interface CursorSample {
  distance: number;
  ref_speed: number;
  comp_speed: number;
  speed_delta: number;
  ref_throttle: number;
  comp_throttle: number;
  ref_brake: number;
  comp_brake: number;
  ref_gear: number;
  comp_gear: number;
  ref_rpm: number;
  comp_rpm: number;
  ref_drs: number;
  comp_drs: number;
  ref_lat_g: number;
  comp_lat_g: number;
  ref_long_g: number;
  comp_long_g: number;
  time_delta: number;
}

interface SynchronizedCursorReadoutProps {
  sample: CursorSample | null;
  corners: CircuitCornerDefinition[];
}

export const SynchronizedCursorReadout: React.FC<SynchronizedCursorReadoutProps> = ({
  sample,
  corners,
}) => {
  if (!sample) {
    return (
      <div className="bg-workstation-surface/80 border border-workstation-border p-2 rounded text-3xs font-mono text-workstation-textMuted flex items-center justify-between">
        <span className="flex items-center space-x-1.5">
          <Crosshair className="w-3 h-3 text-workstation-textMuted/60" />
          <span>HOVER CURSOR OVER TELEMETRY TO INSPECT SYNCHRONIZED CHANNELS</span>
        </span>
        <span>Distance: --- m</span>
      </div>
    );
  }

  // Find active corner
  const currentCorner = corners.find(
    (c) => sample.distance >= c.entry_distance && sample.distance <= c.exit_distance
  );

  // Sector detection
  const sector =
    sample.distance < 1842.0 ? 'S1' : sample.distance < 3611.0 ? 'S2' : 'S3';

  const speedDeltaColor =
    sample.speed_delta > 0
      ? 'text-workstation-telemetryGreen'
      : sample.speed_delta < 0
      ? 'text-workstation-telemetryAmber'
      : 'text-workstation-textMuted';

  const timeDeltaColor =
    sample.time_delta < 0
      ? 'text-workstation-telemetryGreen'
      : sample.time_delta > 0
      ? 'text-workstation-telemetryAmber'
      : 'text-workstation-textMuted';

  return (
    <div className="bg-workstation-surface border border-workstation-accentCyan/30 rounded p-1.5 font-mono text-3xs select-none shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        {/* Spatial Location Indicator */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-workstation-accentCyan font-bold">
            <Crosshair className="w-3 h-3" />
            <span>s = {Math.round(sample.distance)} m</span>
          </div>

          <span className="px-1.5 py-0.2 bg-workstation-panel border border-workstation-borderSubtle text-workstation-textSecondary rounded font-semibold">
            {sector}
          </span>

          {currentCorner ? (
            <div className="px-1.5 py-0.2 bg-workstation-accentCyan/10 border border-workstation-accentCyan/40 text-workstation-accentCyan rounded font-semibold flex items-center space-x-1">
              <MapPin className="w-2.5 h-2.5" />
              <span>{currentCorner.corner_id} — {currentCorner.name}</span>
            </div>
          ) : (
            <span className="text-workstation-textMuted">Straight / Transition</span>
          )}
        </div>

        {/* Live Channel Values (Ref vs Comp) */}
        <div className="flex items-center space-x-3 text-2xs divide-x divide-workstation-borderSubtle">
          {/* Speed */}
          <div className="flex items-baseline space-x-1 pl-2">
            <span className="text-3xs text-workstation-textMuted uppercase">SPD:</span>
            <span className="text-workstation-accentCyan font-semibold">{sample.ref_speed.toFixed(0)}</span>
            <span className="text-3xs text-workstation-textMuted">/</span>
            <span className="text-workstation-telemetryAmber font-semibold">{sample.comp_speed.toFixed(0)}</span>
            <span className={`text-3xs font-semibold ${speedDeltaColor}`}>
              ({sample.speed_delta > 0 ? '+' : ''}{sample.speed_delta.toFixed(1)})
            </span>
          </div>

          {/* Throttle */}
          <div className="flex items-baseline space-x-1 pl-2">
            <span className="text-3xs text-workstation-textMuted uppercase">THR:</span>
            <span className="text-workstation-accentCyan">{sample.ref_throttle.toFixed(0)}%</span>
            <span className="text-3xs text-workstation-textMuted">/</span>
            <span className="text-workstation-telemetryAmber">{sample.comp_throttle.toFixed(0)}%</span>
          </div>

          {/* Brake */}
          <div className="flex items-baseline space-x-1 pl-2">
            <span className="text-3xs text-workstation-textMuted uppercase">BRK:</span>
            <span className="text-workstation-accentCyan">{sample.ref_brake.toFixed(0)}%</span>
            <span className="text-3xs text-workstation-textMuted">/</span>
            <span className="text-workstation-telemetryAmber">{sample.comp_brake.toFixed(0)}%</span>
          </div>

          {/* Gear */}
          <div className="flex items-baseline space-x-1 pl-2">
            <span className="text-3xs text-workstation-textMuted uppercase">GEAR:</span>
            <span className="text-workstation-accentCyan font-bold">G{sample.ref_gear}</span>
            <span className="text-3xs text-workstation-textMuted">/</span>
            <span className="text-workstation-telemetryAmber font-bold">G{sample.comp_gear}</span>
          </div>

          {/* RPM */}
          <div className="flex items-baseline space-x-1 pl-2">
            <span className="text-3xs text-workstation-textMuted uppercase">RPM:</span>
            <span className="text-workstation-accentCyan">{sample.ref_rpm}</span>
            <span className="text-3xs text-workstation-textMuted">/</span>
            <span className="text-workstation-telemetryAmber">{sample.comp_rpm}</span>
          </div>

          {/* DRS */}
          <div className="flex items-baseline space-x-1 pl-2">
            <span className="text-3xs text-workstation-textMuted uppercase">DRS:</span>
            <span className={sample.ref_drs ? 'text-workstation-telemetryGreen font-bold' : 'text-workstation-textMuted'}>
              {sample.ref_drs ? 'ON' : 'OFF'}
            </span>
            <span className="text-3xs text-workstation-textMuted">/</span>
            <span className={sample.comp_drs ? 'text-workstation-telemetryGreen font-bold' : 'text-workstation-textMuted'}>
              {sample.comp_drs ? 'ON' : 'OFF'}
            </span>
          </div>

          {/* Lat G */}
          <div className="flex items-baseline space-x-1 pl-2">
            <span className="text-3xs text-workstation-textMuted uppercase">LAT:</span>
            <span className="text-workstation-accentCyan">{sample.ref_lat_g.toFixed(1)}G</span>
            <span className="text-3xs text-workstation-textMuted">/</span>
            <span className="text-workstation-telemetryAmber">{sample.comp_lat_g.toFixed(1)}G</span>
          </div>

          {/* Long G */}
          <div className="flex items-baseline space-x-1 pl-2">
            <span className="text-3xs text-workstation-textMuted uppercase">LON:</span>
            <span className="text-workstation-accentCyan">{sample.ref_long_g.toFixed(1)}G</span>
            <span className="text-3xs text-workstation-textMuted">/</span>
            <span className="text-workstation-telemetryAmber">{sample.comp_long_g.toFixed(1)}G</span>
          </div>

          {/* Cumulative Time Delta Δt */}
          <div className="flex items-baseline space-x-1 pl-2">
            <span className="text-3xs text-workstation-textMuted uppercase">Δt(s):</span>
            <span className={`font-bold ${timeDeltaColor}`}>
              {sample.time_delta > 0 ? '+' : ''}{sample.time_delta.toFixed(3)} s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
