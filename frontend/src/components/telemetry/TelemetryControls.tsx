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
    <div className="window-retro p-2.5 font-mono text-2xs select-none space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Lap Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Reference Lap Selector */}
          <div className="flex items-center space-x-2 px-2.5 py-1 bg-[#070E22] border border-[#0062FF] shadow">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0062FF] border border-[#00F0FF] inline-block flex-shrink-0 shadow-[0_0_6px_#0062FF]" />
            <span className="text-3xs text-[#00F0FF] uppercase font-black tracking-wider">REF:</span>
            <select
              aria-label="Select Reference Lap"
              className="bg-[#0A132E] border border-[#1E3A8A] text-[#FFFFFF] px-2 py-0.5 font-bold text-2xs focus:outline-none focus:border-[#0062FF] cursor-pointer"
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

          {/* Swap Button */}
          <button
            onClick={() => {
              onSelectReferenceLap(comparisonLapId);
              onSelectComparisonLap(referenceLapId);
            }}
            className="btn-retro text-3xs font-extrabold flex items-center space-x-1.5"
            title="Swap Reference & Comparison Laps"
          >
            <span className="font-black text-[#FFFFFF]">⇄</span>
            <span>[ SWAP ]</span>
          </button>

          {/* Comparison Lap Selector */}
          <div className="flex items-center space-x-2 px-2.5 py-1 bg-[#070E22] border border-[#FFFFFF] shadow">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFFFFF] border border-[#FFFFFF] inline-block flex-shrink-0 shadow-[0_0_6px_#FFFFFF]" />
            <span className="text-3xs text-[#FFFFFF] uppercase font-black tracking-wider">COMP:</span>
            <select
              aria-label="Select Comparison Lap"
              className="bg-[#0A132E] border border-[#1E3A8A] text-[#FFFFFF] px-2 py-0.5 font-bold text-2xs focus:outline-none focus:border-[#FFFFFF] cursor-pointer"
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
        <div className="flex items-center space-x-2.5">
          {/* Delta Mode toggle */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onToggleDeltaMode('time')}
              className={deltaMode === 'time' ? 'tab-retro-active text-3xs' : 'tab-retro-inactive text-3xs'}
            >
              [ Δt (Time) ]
            </button>
            <button
              onClick={() => onToggleDeltaMode('speed')}
              className={deltaMode === 'speed' ? 'tab-retro-active text-3xs' : 'tab-retro-inactive text-3xs'}
            >
              [ Δv (Speed) ]
            </button>
          </div>

          <span className="text-[#FFFFFF] font-bold">|</span>

          {/* Zoom info & buttons */}
          <div className="flex items-center space-x-1.5">
            <span className="text-3xs text-[#FFFFFF] px-2 py-1 bg-[#070E22] border border-[#1E3A8A] shadow-sm font-black">
              [{Math.round(zoomSpan.min)}m → {Math.round(zoomSpan.max)}m]
            </span>
            <button
              onClick={onZoomIn}
              title="Zoom In (+)"
              className="btn-retro p-1 text-[#FFFFFF]"
            >
              <ZoomIn className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
            <button
              onClick={onZoomOut}
              title="Zoom Out (-)"
              className="btn-retro p-1 text-[#FFFFFF]"
            >
              <ZoomOut className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
            <button
              onClick={onResetZoom}
              title="Reset Zoom [R]"
              className={`btn-retro text-3xs font-extrabold flex items-center space-x-1 ${
                isZoomed ? 'bg-[#00F0FF] hover:bg-[#00EE00]' : ''
              }`}
            >
              <RotateCcw className="w-3 h-3 stroke-[2.5]" />
              <span>[ RESET R ]</span>
            </button>
          </div>

          {/* Shortcut tooltip trigger */}
          <button
            onClick={() => setShowHotkeys(!showHotkeys)}
            className="btn-retro p-1 text-[#FFFFFF]"
            title="Workstation Hotkeys"
          >
            <HelpCircle className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Channel Toggles Strip */}
      <div className="flex flex-wrap items-center justify-between pt-2 border-t-2 border-dashed border-[#1E3A8A] gap-1.5">
        <div className="flex items-center space-x-1.5 text-3xs text-[#FFFFFF] font-black uppercase tracking-wider mr-2">
          <Eye className="w-3 h-3 stroke-[2.5]" />
          <span>CHANNELS:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {CHANNELS.map((ch) => {
            const isVisible = visibleChannels[ch.key];
            return (
              <button
                key={ch.key}
                onClick={() => onToggleChannel(ch.key)}
                className={isVisible ? 'tab-retro-active text-3xs' : 'tab-retro-inactive text-3xs line-through opacity-60'}
                title={`Toggle ${ch.label} [Key: ${ch.hotkey}]`}
              >
                <span>[{ch.hotkey}: {ch.label}]</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hotkeys Dialog */}
      {showHotkeys && (
        <div className="p-3 bg-[#070E22] border border-[#1E3A8A] shadow-md text-3xs space-y-2">
          <div className="font-black text-[#FFFFFF] uppercase tracking-wider flex items-center justify-between border-b border-[#1E3A8A] pb-1">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 bg-[#00F0FF] border border-[#1E3A8A] inline-block" />
              <span>KEYBOARD SHORTCUTS & NAVIGATION MAP</span>
            </span>
            <span onClick={() => setShowHotkeys(false)} className="cursor-pointer font-bold">[✕]</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1.5 text-[#FFFFFF] font-bold">
            <div><kbd className="kbd-cap mr-1">R</kbd> Reset zoom to full lap</div>
            <div><kbd className="kbd-cap mr-1">1 - 9</kbd> Toggle channels 1 to 9</div>
            <div><kbd className="kbd-cap mr-1">← / →</kbd> Step cursor 10m</div>
            <div><kbd className="kbd-cap mr-1">Shift + ← / →</kbd> Step cursor 100m</div>
            <div><kbd className="kbd-cap mr-1">Drag</kbd> Distance box zoom</div>
            <div><kbd className="kbd-cap mr-1">Scroll</kbd> Zoom at cursor</div>
          </div>
        </div>
      )}
    </div>
  );
};
