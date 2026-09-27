import React, { useState } from 'react';
import { Lap } from '../../types/domain';
import { formatLapTime } from '../../utils/formatters';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  HelpCircle,
  Eye,
} from 'lucide-react';

import { ChannelKey, CHANNELS } from '../../types/telemetry';

interface TelemetryControlsProps {
  availableLaps: Lap[];
  referenceLapId: string;
  comparisonLapId: string;
  onSelectReferenceLap: (lapId: string) => void;
  onSelectComparisonLap: (lapId: string) => void;
  visibleChannels: Record<ChannelKey, boolean>;
  onToggleChannel: (key: ChannelKey) => void;
  deltaMode: 'time' | 'speed';
  onToggleDeltaMode: (mode: 'time' | 'speed') => void;
  onResetZoom: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  zoomSpan: { min: number; max: number };
  trackLength: number;
}

export const TelemetryControls: React.FC<TelemetryControlsProps> = ({
  availableLaps,
  referenceLapId,
  comparisonLapId,
  onSelectReferenceLap,
  onSelectComparisonLap,
  visibleChannels,
  onToggleChannel,
  deltaMode,
  onToggleDeltaMode,
  onResetZoom,
  onZoomIn,
  onZoomOut,
  zoomSpan,
  trackLength,
}) => {
  const [showHotkeys, setShowHotkeys] = useState(false);

  const isZoomed = zoomSpan.min > 10 || zoomSpan.max < trackLength - 10;

  return (
    <div className="bg-workstation-panel border border-workstation-border rounded p-2 font-mono text-2xs select-none space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Lap Selectors */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-workstation-accentCyan inline-block" />
            <span className="text-3xs text-workstation-textMuted uppercase font-semibold">REF:</span>
            <select
              aria-label="Select Reference Lap"
              className="bg-workstation-surface border border-workstation-border text-workstation-textPrimary px-2 py-0.5 rounded text-2xs focus:outline-none focus:border-workstation-accentCyan"
              value={referenceLapId}
              onChange={(e) => onSelectReferenceLap(e.target.value)}
            >
              {availableLaps.map((lap) => (
                <option key={lap.lap_id} value={lap.lap_id}>
                  Lap {lap.lap_number} ({formatLapTime(lap.lap_time)}) {lap.lap_id === 'lap-demo-02' ? '— HAM' : ''}
                </option>
              ))}
            </select>
          </div>

          <span className="text-workstation-border">|</span>

          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-workstation-telemetryAmber inline-block" />
            <span className="text-3xs text-workstation-textMuted uppercase font-semibold">COMP:</span>
            <select
              aria-label="Select Comparison Lap"
              className="bg-workstation-surface border border-workstation-border text-workstation-textPrimary px-2 py-0.5 rounded text-2xs focus:outline-none focus:border-workstation-telemetryAmber"
              value={comparisonLapId}
              onChange={(e) => onSelectComparisonLap(e.target.value)}
            >
              {availableLaps.map((lap) => (
                <option key={lap.lap_id} value={lap.lap_id}>
                  Lap {lap.lap_number} ({formatLapTime(lap.lap_time)}) {lap.lap_id === 'lap-demo-03' ? '— LEC' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Delta Mode Toggle & Zoom Controls */}
        <div className="flex items-center space-x-2">
          {/* Delta Mode toggle */}
          <div className="flex items-center bg-workstation-surface border border-workstation-border rounded p-0.5 text-3xs">
            <button
              onClick={() => onToggleDeltaMode('time')}
              className={`px-2 py-0.5 rounded transition-colors font-semibold ${
                deltaMode === 'time'
                  ? 'bg-workstation-accentCyan/20 text-workstation-accentCyan'
                  : 'text-workstation-textMuted hover:text-workstation-textSecondary'
              }`}
            >
              Δt (Time)
            </button>
            <button
              onClick={() => onToggleDeltaMode('speed')}
              className={`px-2 py-0.5 rounded transition-colors font-semibold ${
                deltaMode === 'speed'
                  ? 'bg-workstation-accentCyan/20 text-workstation-accentCyan'
                  : 'text-workstation-textMuted hover:text-workstation-textSecondary'
              }`}
            >
              Δv (Speed)
            </button>
          </div>

          <span className="text-workstation-border">|</span>

          {/* Zoom info & buttons */}
          <div className="flex items-center space-x-1">
            <span className="text-3xs text-workstation-textMuted px-1">
              [{Math.round(zoomSpan.min)}m → {Math.round(zoomSpan.max)}m]
            </span>
            <button
              onClick={onZoomIn}
              title="Zoom In (+)"
              className="p-1 bg-workstation-surface hover:bg-workstation-border border border-workstation-border rounded text-workstation-textSecondary transition-colors"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            <button
              onClick={onZoomOut}
              title="Zoom Out (-)"
              className="p-1 bg-workstation-surface hover:bg-workstation-border border border-workstation-border rounded text-workstation-textSecondary transition-colors"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <button
              onClick={onResetZoom}
              title="Reset Zoom [R]"
              className={`px-2 py-0.5 border rounded flex items-center space-x-1 text-3xs transition-colors ${
                isZoomed
                  ? 'bg-workstation-accent/20 border-workstation-accent text-workstation-accentCyan font-bold'
                  : 'bg-workstation-surface border-workstation-border text-workstation-textMuted hover:text-workstation-textSecondary'
              }`}
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Reset [R]</span>
            </button>
          </div>

          {/* Shortcut tooltip trigger */}
          <button
            onClick={() => setShowHotkeys(!showHotkeys)}
            className="p-1 text-workstation-textMuted hover:text-workstation-textSecondary transition-colors"
            title="Workstation Hotkeys"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Channel Toggles Strip */}
      <div className="flex flex-wrap items-center justify-between pt-1 border-t border-workstation-borderSubtle gap-1">
        <div className="flex items-center space-x-1 text-3xs text-workstation-textMuted mr-2">
          <Eye className="w-3 h-3 text-workstation-accentCyan" />
          <span className="uppercase font-semibold">CHANNELS:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {CHANNELS.map((ch) => {
            const isVisible = visibleChannels[ch.key];
            return (
              <button
                key={ch.key}
                onClick={() => onToggleChannel(ch.key)}
                className={`px-2 py-0.5 rounded text-3xs border transition-all flex items-center space-x-1 ${
                  isVisible
                    ? 'bg-workstation-surface border-workstation-accentCyan/40 text-workstation-textBright font-semibold'
                    : 'bg-workstation-surface/40 border-workstation-border/40 text-workstation-textMuted/50 line-through'
                }`}
                title={`Toggle ${ch.label} [Key: ${ch.hotkey}]`}
              >
                <span className="text-workstation-textMuted font-mono">[{ch.hotkey}]</span>
                <span>{ch.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hotkeys Dialog */}
      {showHotkeys && (
        <div className="p-2 bg-workstation-surface border border-workstation-accentCyan/40 rounded text-3xs space-y-1">
          <div className="font-semibold text-workstation-accentCyan uppercase">Workstation Keyboard Controls</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-workstation-textSecondary">
            <div><kbd className="px-1 py-0.2 bg-black/40 rounded text-workstation-textBright">R</kbd> : Reset zoom to full lap</div>
            <div><kbd className="px-1 py-0.2 bg-black/40 rounded text-workstation-textBright">1 - 9</kbd> : Toggle channel 1 through 9</div>
            <div><kbd className="px-1 py-0.2 bg-black/40 rounded text-workstation-textBright">← / →</kbd> : Step cursor 10 meters</div>
            <div><kbd className="px-1 py-0.2 bg-black/40 rounded text-workstation-textBright">Shift + ← / →</kbd> : Step cursor 100 meters</div>
            <div><kbd className="px-1 py-0.2 bg-black/40 rounded text-workstation-textBright">Drag</kbd> : Distance box zoom</div>
            <div><kbd className="px-1 py-0.2 bg-black/40 rounded text-workstation-textBright">Scroll</kbd> : Zoom in / out at mouse position</div>
          </div>
        </div>
      )}
    </div>
  );
};
