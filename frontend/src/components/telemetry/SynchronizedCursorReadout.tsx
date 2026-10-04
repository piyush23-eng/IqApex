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
      <div className="window-retro px-3 py-1.5 text-3xs font-mono text-[#FFFFFF] flex items-center justify-between">
        <span className="flex items-center space-x-2 font-bold">
          <span className="w-2.5 h-2.5 bg-[#00F0FF] border border-[#1E3A8A] inline-block animate-pulse" />
          <Crosshair className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>[ HOVER CURSOR OVER TELEMETRY TO INSPECT SYNCHRONIZED CHANNELS ]</span>
        </span>
        <span className="text-[#94A3B8] font-extrabold uppercase">DISTANCE: ——— M</span>
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

  return (
    <div className="window-retro p-1.5 font-mono text-3xs select-none">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        {/* Spatial Location Indicator */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 px-2 py-0.5 bg-[#0062FF] border border-[#00F0FF] font-black text-[#FFFFFF] shadow-matrix-glow">
            <Crosshair className="w-3 h-3 stroke-[2.5]" />
            <span className="tabular-nums">[ s = {Math.round(sample.distance)} m ]</span>
          </div>

          <span className="px-2 py-0.5 bg-[#070E22] border border-[#1E3A8A] text-[#FFFFFF] font-black shadow-sm">
            [{sector}]
          </span>

          {currentCorner ? (
            <div className="px-2 py-0.5 bg-[#070E22] border border-[#1E3A8A] text-[#FFFFFF] font-extrabold flex items-center space-x-1 shadow-sm">
              <MapPin className="w-3 h-3 stroke-[2.5] text-[#00F0FF]" />
              <span>[ {currentCorner.corner_id}: {currentCorner.name} ]</span>
            </div>
          ) : (
            <span className="text-[#94A3B8] font-bold px-1">[ Straight / Transition ]</span>
          )}
        </div>

        {/* Live Hardware Telemetry Channel Chips (Ref Blue #0062FF vs Comp White #FFFFFF) */}
        <div className="flex flex-wrap items-center gap-1.5 text-2xs">
          {/* Speed */}
          <div className="flex items-center space-x-1 px-2 py-0.5 bg-[#070E22] border border-[#1E3A8A] shadow-sm">
            <span className="text-4xs text-[#94A3B8] uppercase font-black">SPD:</span>
            <span className="text-[#0062FF] font-black tabular-nums">{sample.ref_speed.toFixed(0)}</span>
            <span className="text-[#888888] font-bold">/</span>
            <span className="text-[#FFFFFF] font-black tabular-nums">{sample.comp_speed.toFixed(0)}</span>
            <span className={`text-4xs font-black tabular-nums px-1 border ${sample.speed_delta >= 0 ? 'bg-[#00E676]/20 text-[#00E676] border-[#00E676]/40' : 'bg-[#FF3366]/20 text-[#FF3366] border-[#FF3366]/40'}`}>
              {sample.speed_delta > 0 ? '+' : ''}{sample.speed_delta.toFixed(1)}
            </span>
          </div>

          {/* Throttle */}
          <div className="flex items-center space-x-1 px-2 py-0.5 bg-[#070E22] border border-[#1E3A8A] shadow-sm">
            <span className="text-4xs text-[#94A3B8] uppercase font-black">THR:</span>
            <span className="text-[#0062FF] font-black tabular-nums">{sample.ref_throttle.toFixed(0)}%</span>
            <span className="text-[#888888] font-bold">/</span>
            <span className="text-[#FFFFFF] font-bold tabular-nums">{sample.comp_throttle.toFixed(0)}%</span>
          </div>

          {/* Brake */}
          <div className="flex items-center space-x-1 px-2 py-0.5 bg-[#070E22] border border-[#1E3A8A] shadow-sm">
            <span className="text-4xs text-[#94A3B8] uppercase font-black">BRK:</span>
            <span className="text-[#0062FF] font-black tabular-nums">{sample.ref_brake.toFixed(0)}%</span>
            <span className="text-[#888888] font-bold">/</span>
            <span className="text-[#FFFFFF] font-bold tabular-nums">{sample.comp_brake.toFixed(0)}%</span>
          </div>

          {/* Gear */}
          <div className="flex items-center space-x-1 px-2 py-0.5 bg-[#070E22] border border-[#1E3A8A] shadow-sm">
            <span className="text-4xs text-[#94A3B8] uppercase font-black">GEAR:</span>
            <span className="text-[#0062FF] font-black">G{sample.ref_gear}</span>
            <span className="text-[#888888] font-bold">/</span>
            <span className="text-[#FFFFFF] font-bold">G{sample.comp_gear}</span>
          </div>

          {/* RPM */}
          <div className="flex items-center space-x-1 px-2 py-0.5 bg-[#070E22] border border-[#1E3A8A] shadow-sm">
            <span className="text-4xs text-[#94A3B8] uppercase font-black">RPM:</span>
            <span className="text-[#FFFFFF] font-black tabular-nums">{sample.ref_rpm}</span>
          </div>

          {/* DRS */}
          <div className="flex items-center space-x-1 px-2 py-0.5 bg-[#070E22] border border-[#1E3A8A] shadow-sm">
            <span className="text-4xs text-[#94A3B8] uppercase font-black">DRS:</span>
            <span className={`px-1 font-black ${sample.ref_drs ? 'bg-[#0062FF] text-[#FFFFFF] border border-[#00F0FF]' : 'text-[#888888]'}`}>
              {sample.ref_drs ? 'ON' : 'OFF'}
            </span>
          </div>

          {/* Lat G */}
          <div className="flex items-center space-x-1 px-1.5 py-0.5 bg-[#070E22] border border-[#1E3A8A] shadow-sm">
            <span className="text-4xs text-[#94A3B8] uppercase font-black">LAT:</span>
            <span className="text-[#FFFFFF] font-black tabular-nums">{sample.ref_lat_g.toFixed(1)}G</span>
          </div>

          {/* Long G */}
          <div className="flex items-center space-x-1 px-1.5 py-0.5 bg-[#070E22] border border-[#1E3A8A] shadow-sm">
            <span className="text-4xs text-[#94A3B8] uppercase font-black">LON:</span>
            <span className="text-[#FFFFFF] font-black tabular-nums">{sample.ref_long_g.toFixed(1)}G</span>
          </div>

          {/* Cumulative Time Delta Δt */}
          <div className={`flex items-center space-x-1 px-2 py-0.5 border shadow-sm ${sample.time_delta <= 0 ? 'bg-[#00E676]/20 border-[#00E676]/50 text-[#00E676]' : 'bg-[#FF3366]/20 border-[#FF3366]/50 text-[#FF3366]'}`}>
            <span className="text-4xs uppercase font-black">Δt:</span>
            <span className="font-black tabular-nums">
              {sample.time_delta > 0 ? '+' : ''}{sample.time_delta.toFixed(3)}s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
