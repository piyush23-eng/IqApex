import React from 'react';
import { CornerMetric } from '../../types/domain';
import { MapPin } from 'lucide-react';

interface CornerContextInspectorProps {
  corner: CornerMetric | null;
  onClose: () => void;
  onZoomToCorner: (corner: CornerMetric) => void;
}

export const CornerContextInspector: React.FC<CornerContextInspectorProps> = ({
  corner,
  onClose,
  onZoomToCorner,
}) => {
  if (!corner) return null;

  const isTimeDeltaNegative = corner.corner_time_delta < 0;

  return (
    <div className="window-retro font-mono text-2xs select-none shadow-md p-0 overflow-hidden my-3 bg-[#0A132E]">
      {/* Header */}
      <div className="window-header-retro flex items-center justify-between px-3 py-1.5 border-b border-[#1E3A8A] bg-[#070E22]">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-[#FFFFFF]" />
          <span className="text-xs font-bold text-[#FFFFFF] uppercase tracking-wider">
            [ CORNER {corner.corner_id}: {corner.corner_name} ]
          </span>
          <span className="px-2 py-0.5 bg-[#070E22] border border-[#1E3A8A] text-[#FFFFFF] text-3xs font-bold">
            {Math.round(corner.entry_distance)}m → {Math.round(corner.exit_distance)}m
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onZoomToCorner(corner)}
            className="btn-retro text-3xs px-2 py-0.5"
          >
            [ FOCUS CORNER ]
          </button>
          <button
            onClick={onClose}
            className="px-1.5 py-0.5 bg-[#070E22] hover:bg-black hover:text-[#00F0FF] border border-[#1E3A8A] text-[#FFFFFF] font-bold transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Kinematics Metric Cards Grid */}
      <div className="p-2.5 grid grid-cols-2 md:grid-cols-6 gap-2">
        {/* Entry Speed */}
        <div className="bg-[#070E22] p-2 border border-[#1E3A8A] shadow">
          <div className="text-3xs text-[#94A3B8] uppercase font-bold">ENTRY SPEED</div>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-sm font-bold text-[#FFFFFF]">{corner.comp_entry_speed.toFixed(0)}</span>
            <span className="text-3xs text-[#94A3B8]">vs {corner.ref_entry_speed.toFixed(0)} km/h</span>
          </div>
          <div
            className={`text-3xs font-bold mt-0.5 ${
              corner.entry_speed_delta >= 0 ? 'text-[#00E676]' : 'text-[#FF3366]'
            }`}
          >
            Δv: {corner.entry_speed_delta > 0 ? '+' : ''}{corner.entry_speed_delta.toFixed(1)} km/h
          </div>
        </div>

        {/* Apex Minimum Speed */}
        <div className="bg-[#070E22] p-2 border border-[#1E3A8A] shadow">
          <div className="text-3xs text-[#94A3B8] uppercase font-bold">APEX (MIN) SPEED</div>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-sm font-bold text-[#FFFFFF]">{corner.comp_min_speed.toFixed(0)}</span>
            <span className="text-3xs text-[#94A3B8]">vs {corner.ref_min_speed.toFixed(0)} km/h</span>
          </div>
          <div
            className={`text-3xs font-bold mt-0.5 ${
              corner.min_speed_delta >= 0 ? 'text-[#00E676]' : 'text-[#FF3366]'
            }`}
          >
            Δv: {corner.min_speed_delta > 0 ? '+' : ''}{corner.min_speed_delta.toFixed(1)} km/h
          </div>
        </div>

        {/* Exit Speed */}
        <div className="bg-[#070E22] p-2 border border-[#1E3A8A] shadow">
          <div className="text-3xs text-[#94A3B8] uppercase font-bold">EXIT SPEED</div>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-sm font-bold text-[#FFFFFF]">{corner.comp_exit_speed.toFixed(0)}</span>
            <span className="text-3xs text-[#94A3B8]">vs {corner.ref_exit_speed.toFixed(0)} km/h</span>
          </div>
          <div
            className={`text-3xs font-bold mt-0.5 ${
              corner.exit_speed_delta >= 0 ? 'text-[#00E676]' : 'text-[#FF3366]'
            }`}
          >
            Δv: {corner.exit_speed_delta > 0 ? '+' : ''}{corner.exit_speed_delta.toFixed(1)} km/h
          </div>
        </div>

        {/* Braking Point */}
        <div className="bg-[#070E22] p-2 border border-[#1E3A8A] shadow">
          <div className="text-3xs text-[#94A3B8] uppercase font-bold">BRAKING POINT</div>
          <div className="text-sm font-bold text-[#FFFFFF] mt-1">
            {corner.comp_braking_point ? `${Math.round(corner.comp_braking_point)} m` : '---'}
          </div>
          <div className="text-3xs text-[#94A3B8] mt-0.5 font-medium">
            {corner.braking_point_delta !== null ? (
              <span>
                {corner.braking_point_delta > 0
                  ? `Braked ${corner.braking_point_delta}m later`
                  : `Braked ${Math.abs(corner.braking_point_delta)}m earlier`}
              </span>
            ) : (
              'Ref: N/A'
            )}
          </div>
        </div>

        {/* Throttle Pickup */}
        <div className="bg-[#070E22] p-2 border border-[#1E3A8A] shadow">
          <div className="text-3xs text-[#94A3B8] uppercase font-bold">THROTTLE PICKUP</div>
          <div className="text-sm font-bold text-[#FFFFFF] mt-1">
            {corner.comp_throttle_pickup ? `${Math.round(corner.comp_throttle_pickup)} m` : '---'}
          </div>
          <div className="text-3xs text-[#94A3B8] mt-0.5 font-medium">
            {corner.throttle_pickup_delta !== null ? (
              <span>
                {corner.throttle_pickup_delta > 0
                  ? `Pickup ${corner.throttle_pickup_delta}m later`
                  : `Pickup ${Math.abs(corner.throttle_pickup_delta)}m earlier`}
              </span>
            ) : (
              'Ref: N/A'
            )}
          </div>
        </div>

        {/* Corner Duration & Exit Delta */}
        <div className="bg-[#070E22] p-2 border border-[#1E3A8A] shadow">
          <div className="text-3xs text-[#94A3B8] uppercase font-bold">CORNER Δt / EXIT Δt</div>
          <div className={`text-sm font-bold mt-1 ${isTimeDeltaNegative ? 'text-[#00E676]' : 'text-[#FF3366]'}`}>
            {corner.corner_time_delta > 0 ? '+' : ''}{corner.corner_time_delta.toFixed(3)} s
          </div>
          <div className="text-3xs text-[#94A3B8] mt-0.5 font-medium">
            Exit: {corner.cumulative_time_delta_exit > 0 ? '+' : ''}{corner.cumulative_time_delta_exit.toFixed(3)} s
          </div>
        </div>
      </div>
    </div>
  );
};
