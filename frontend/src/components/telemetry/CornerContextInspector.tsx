import React from 'react';
import { CornerMetric } from '../../types/domain';
import { MapPin, X, ZoomIn } from 'lucide-react';

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
  const timeDeltaColor = isTimeDeltaNegative ? 'text-workstation-telemetryGreen' : 'text-workstation-telemetryAmber';

  return (
    <div className="bg-workstation-panel border border-workstation-accentCyan/40 rounded p-3 font-mono text-2xs select-none shadow-lg animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-2 mb-2">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-workstation-accentCyan" />
          <span className="text-sm font-bold text-workstation-textBright">
            {corner.corner_id} — {corner.corner_name}
          </span>
          <span className="px-2 py-0.5 bg-workstation-surface border border-workstation-borderSubtle text-workstation-textMuted text-3xs rounded">
            {Math.round(corner.entry_distance)}m → {Math.round(corner.exit_distance)}m
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onZoomToCorner(corner)}
            className="px-2 py-1 bg-workstation-surface hover:bg-workstation-border border border-workstation-borderSubtle text-workstation-accentCyan rounded text-3xs flex items-center space-x-1 transition-colors"
          >
            <ZoomIn className="w-3 h-3" />
            <span>Focus Corner View</span>
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-workstation-surface text-workstation-textMuted hover:text-workstation-textBright rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Kinematics Metric Cards Grid */}
      <div className="grid grid-cols-6 gap-2">
        {/* Entry Speed */}
        <div className="bg-workstation-surface/80 p-2 rounded border border-workstation-borderSubtle">
          <div className="text-3xs text-workstation-textMuted uppercase">ENTRY SPEED</div>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-sm font-bold text-workstation-textBright">{corner.comp_entry_speed.toFixed(0)}</span>
            <span className="text-3xs text-workstation-textMuted">vs {corner.ref_entry_speed.toFixed(0)} km/h</span>
          </div>
          <div
            className={`text-3xs font-semibold mt-0.5 ${
              corner.entry_speed_delta >= 0 ? 'text-workstation-telemetryGreen' : 'text-workstation-telemetryAmber'
            }`}
          >
            Δv: {corner.entry_speed_delta > 0 ? '+' : ''}{corner.entry_speed_delta.toFixed(1)} km/h
          </div>
        </div>

        {/* Apex Minimum Speed */}
        <div className="bg-workstation-surface/80 p-2 rounded border border-workstation-borderSubtle">
          <div className="text-3xs text-workstation-textMuted uppercase">APEX (MIN) SPEED</div>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-sm font-bold text-workstation-textBright">{corner.comp_min_speed.toFixed(0)}</span>
            <span className="text-3xs text-workstation-textMuted">vs {corner.ref_min_speed.toFixed(0)} km/h</span>
          </div>
          <div
            className={`text-3xs font-semibold mt-0.5 ${
              corner.min_speed_delta >= 0 ? 'text-workstation-telemetryGreen' : 'text-workstation-telemetryAmber'
            }`}
          >
            Δv: {corner.min_speed_delta > 0 ? '+' : ''}{corner.min_speed_delta.toFixed(1)} km/h
          </div>
        </div>

        {/* Exit Speed */}
        <div className="bg-workstation-surface/80 p-2 rounded border border-workstation-borderSubtle">
          <div className="text-3xs text-workstation-textMuted uppercase">EXIT SPEED</div>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-sm font-bold text-workstation-textBright">{corner.comp_exit_speed.toFixed(0)}</span>
            <span className="text-3xs text-workstation-textMuted">vs {corner.ref_exit_speed.toFixed(0)} km/h</span>
          </div>
          <div
            className={`text-3xs font-semibold mt-0.5 ${
              corner.exit_speed_delta >= 0 ? 'text-workstation-telemetryGreen' : 'text-workstation-telemetryAmber'
            }`}
          >
            Δv: {corner.exit_speed_delta > 0 ? '+' : ''}{corner.exit_speed_delta.toFixed(1)} km/h
          </div>
        </div>

        {/* Braking Point */}
        <div className="bg-workstation-surface/80 p-2 rounded border border-workstation-borderSubtle">
          <div className="text-3xs text-workstation-textMuted uppercase">BRAKING POINT</div>
          <div className="text-sm font-bold text-workstation-textBright mt-1">
            {corner.comp_braking_point ? `${Math.round(corner.comp_braking_point)} m` : '---'}
          </div>
          <div className="text-3xs text-workstation-textMuted mt-0.5">
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
        <div className="bg-workstation-surface/80 p-2 rounded border border-workstation-borderSubtle">
          <div className="text-3xs text-workstation-textMuted uppercase">THROTTLE PICKUP</div>
          <div className="text-sm font-bold text-workstation-textBright mt-1">
            {corner.comp_throttle_pickup ? `${Math.round(corner.comp_throttle_pickup)} m` : '---'}
          </div>
          <div className="text-3xs text-workstation-textMuted mt-0.5">
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
        <div className="bg-workstation-surface/80 p-2 rounded border border-workstation-borderSubtle">
          <div className="text-3xs text-workstation-textMuted uppercase">CORNER Δt / EXIT Δt</div>
          <div className={`text-sm font-bold mt-1 ${timeDeltaColor}`}>
            {corner.corner_time_delta > 0 ? '+' : ''}{corner.corner_time_delta.toFixed(3)} s
          </div>
          <div className="text-3xs text-workstation-textMuted mt-0.5">
            Exit: {corner.cumulative_time_delta_exit > 0 ? '+' : ''}{corner.cumulative_time_delta_exit.toFixed(3)} s
          </div>
        </div>
      </div>
    </div>
  );
};
