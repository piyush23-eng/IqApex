import React from 'react';
import { PitWindowResponse } from '../../types/strategy';
import { SlidersHorizontal, Info } from 'lucide-react';

interface PitWindowSensitivityPlotProps {
  pitWindowData: PitWindowResponse | null;
  isLoading: boolean;
}

export const PitWindowSensitivityPlot: React.FC<PitWindowSensitivityPlotProps> = ({
  pitWindowData,
  isLoading,
}) => {
  const chartDims = { width: 500, height: 180, padX: 45, padY: 25 };

  if (isLoading) {
    return (
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-4 font-mono text-2xs text-[#FFFFFF] flex items-center justify-center space-x-2 h-52 shadow-md">
        <SlidersHorizontal className="w-4 h-4 animate-spin text-[#FFFFFF]" />
        <span className="font-bold uppercase">[ EVALUATING PIT WINDOW SENSITIVITY CURVE (±3 LAPS OFFSET)... ]</span>
      </div>
    );
  }

  if (!pitWindowData || pitWindowData.sensitivity_curve.length === 0) {
    return (
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-4 font-mono text-2xs text-[#94A3B8] flex items-center justify-center h-52 shadow-md">
        <span>[ NO PIT WINDOW SENSITIVITY DATA ]</span>
      </div>
    );
  }

  const { scheduled_pit_lap, sensitivity_curve } = pitWindowData;
  const deltas = sensitivity_curve.map((d) => d.delta_race_time_s);
  const minDelta = Math.min(...deltas, -0.5);
  const maxDelta = Math.max(...deltas, 2.5);
  const deltaSpan = maxDelta - minDelta || 1;

  const minOffset = -3;
  const maxOffset = 3;

  const scaleX = (offset: number) =>
    chartDims.padX + ((offset - minOffset) / (maxOffset - minOffset)) * (chartDims.width - 2 * chartDims.padX);

  const scaleY = (delta: number) =>
    chartDims.height -
    chartDims.padY -
    ((delta - minDelta) / deltaSpan) * (chartDims.height - 2 * chartDims.padY);

  const zeroY = scaleY(0);

  const curvePath = sensitivity_curve.reduce((acc, pt, i) => {
    const x = scaleX(pt.pit_lap_offset);
    const y = scaleY(pt.delta_race_time_s);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // Find lowest delta
  const bestPoint = sensitivity_curve.reduce((min, curr) =>
    curr.delta_race_time_s < min.delta_race_time_s ? curr : min
  );

  return (
    <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-3 font-mono text-2xs space-y-2 shadow-md">
      {/* Titanium Header */}
      <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-2 bg-[#070E22] p-2 -mx-3 -mt-3 mb-2">
        <div className="flex items-center space-x-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#FFFFFF]" />
          <span className="font-bold text-[#FFFFFF] uppercase tracking-wider text-xs">
            [ PIT STOP WINDOW SENSITIVITY (NOMINAL LAP {scheduled_pit_lap}) ]
          </span>
        </div>

        <div className="flex items-center space-x-2 text-3xs">
          <span className="bg-[#070E22] border border-[#1E3A8A] px-1.5 py-0.5 text-[#FFFFFF] font-bold">
            OPTIMAL: L{bestPoint.actual_pit_lap}
          </span>
          <span className={`px-1.5 py-0.5 border border-[#1E3A8A] font-bold ${bestPoint.delta_race_time_s <= 0 ? 'bg-[#00F0FF] text-[#FFFFFF]' : 'bg-[#0E1A3D] text-[#FBBF24] border border-[#FBBF24]/50 text-[#FFB000]'}`}>
            DELTA: {bestPoint.delta_race_time_s >= 0 ? '+' : ''}{bestPoint.delta_race_time_s.toFixed(2)}s
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative bg-[#070E22] border border-[#1E3A8A] p-2 shadow">
        <svg viewBox={`0 0 ${chartDims.width} ${chartDims.height}`} className="w-full h-40 select-none">
          {/* Zero delta horizontal line */}
          <line
            x1={chartDims.padX}
            y1={zeroY}
            x2={chartDims.width - chartDims.padX}
            y2={zeroY}
            stroke="#0062FF"
            strokeWidth="1.5"
            strokeDasharray="3,3"
          />
          <text
            x={chartDims.padX - 4}
            y={zeroY + 3}
            textAnchor="end"
            fill="#93C5FD"
            fontSize="6.5"
            className="font-mono font-bold"
          >
            0.0s (Nominal)
          </text>

          {/* Offsets X Axis */}
          {sensitivity_curve.map((pt) => {
            const xPos = scaleX(pt.pit_lap_offset);
            return (
              <g key={pt.pit_lap_offset}>
                <line
                  x1={xPos}
                  y1={chartDims.height - chartDims.padY}
                  x2={xPos}
                  y2={chartDims.height - chartDims.padY + 4}
                  stroke="#1E3A8A"
                  strokeWidth="1.5"
                />
                <text
                  x={xPos}
                  y={chartDims.height - chartDims.padY + 12}
                  textAnchor="middle"
                  fill="#93C5FD"
                  fontSize="7"
                  className="font-mono font-bold"
                >
                  {pt.pit_lap_offset > 0 ? `+${pt.pit_lap_offset}` : pt.pit_lap_offset} (L{pt.actual_pit_lap})
                </text>
              </g>
            );
          })}

          {/* Curve (Laser Cyan) */}
          <path d={curvePath} fill="none" stroke="#00F0FF" strokeWidth="2.5" strokeLinecap="round" />

          {/* Points */}
          {sensitivity_curve.map((pt) => {
            const x = scaleX(pt.pit_lap_offset);
            const y = scaleY(pt.delta_race_time_s);
            const isNominal = pt.pit_lap_offset === 0;
            const isBest = pt.actual_pit_lap === bestPoint.actual_pit_lap;

            return (
              <g key={`pt-${pt.pit_lap_offset}`}>
                <circle
                  cx={x}
                  cy={y}
                  r={isBest ? 5.5 : 4}
                  fill={isBest ? '#00E676' : isNominal ? '#0062FF' : '#0A132E'}
                  stroke={isBest ? '#FFFFFF' : isNominal ? '#00F0FF' : '#1E3A8A'}
                  strokeWidth="2"
                />
                <text
                  x={x}
                  y={y - 8}
                  textAnchor="middle"
                  fill={pt.delta_race_time_s <= 0 ? '#00E676' : '#FF3366'}
                  fontSize="7"
                  className="font-mono font-bold"
                >
                  {pt.delta_race_time_s >= 0 ? `+${pt.delta_race_time_s.toFixed(2)}` : pt.delta_race_time_s.toFixed(2)}s
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Explanatory footer */}
      <div className="flex items-center justify-between text-3xs border-t border-[#1E3A8A] pt-2 text-[#94A3B8]">
        <div className="flex items-center space-x-1">
          <Info className="w-3.5 h-3.5 text-[#FFFFFF]" />
          <span className="text-[#E2E8F0] font-bold">Negative offset: Undercut (pit earlier). Positive offset: Overcut (extend stint).</span>
        </div>
        <div className="text-4xs text-[#CBD5E1] font-bold bg-[#0A0D15] px-2 py-0.5 border border-[#1E3A8A]">
          Stint 2 Final Tyre Age: {bestPoint.final_tyre_age} Laps
        </div>
      </div>
    </div>
  );
};
