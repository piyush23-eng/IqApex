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
      <div className="bg-workstation-panel border border-workstation-border rounded p-4 font-mono text-2xs animate-pulse text-workstation-textMuted flex items-center justify-center space-x-2 h-52">
        <SlidersHorizontal className="w-4 h-4 animate-spin text-workstation-accentCyan" />
        <span>EVALUATING PIT WINDOW SENSITIVITY CURVE (±3 LAPS OFFSET)...</span>
      </div>
    );
  }

  if (!pitWindowData || pitWindowData.sensitivity_curve.length === 0) {
    return (
      <div className="bg-workstation-panel border border-workstation-border rounded p-4 font-mono text-2xs text-workstation-textMuted flex items-center justify-center h-52">
        <span>No pit window sensitivity data.</span>
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
    <div className="bg-workstation-panel border border-workstation-border rounded p-3 font-mono text-2xs space-y-2">
      <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-1.5">
        <div className="flex items-center space-x-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-workstation-accentCyan" />
          <span className="font-bold text-workstation-textBright uppercase tracking-wider text-xs">
            PIT STOP WINDOW SENSITIVITY (NOMINAL LAP {scheduled_pit_lap})
          </span>
        </div>

        <div className="flex items-center space-x-3 text-3xs">
          <span>
            OPTIMAL PIT LAP: <strong className="text-workstation-accentCyan">L{bestPoint.actual_pit_lap}</strong>
          </span>
          <span>
            DELTA: <strong className={bestPoint.delta_race_time_s <= 0 ? 'text-emerald-400' : 'text-amber-400'}>
              {bestPoint.delta_race_time_s >= 0 ? '+' : ''}{bestPoint.delta_race_time_s.toFixed(2)}s
            </strong>
          </span>
        </div>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${chartDims.width} ${chartDims.height}`} className="w-full h-40 select-none">
          {/* Zero delta horizontal line */}
          <line
            x1={chartDims.padX}
            y1={zeroY}
            x2={chartDims.width - chartDims.padX}
            y2={zeroY}
            stroke="#475569"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
          <text
            x={chartDims.padX - 4}
            y={zeroY + 3}
            textAnchor="end"
            fill="#94A3B8"
            fontSize="6"
            className="font-mono"
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
                  stroke="#475569"
                  strokeWidth="1"
                />
                <text
                  x={xPos}
                  y={chartDims.height - chartDims.padY + 12}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="7"
                  className="font-mono"
                >
                  {pt.pit_lap_offset > 0 ? `+${pt.pit_lap_offset}` : pt.pit_lap_offset} (L{pt.actual_pit_lap})
                </text>
              </g>
            );
          })}

          {/* Curve */}
          <path d={curvePath} fill="none" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" />

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
                  r={isBest ? 5 : 3.5}
                  fill={isBest ? '#10B981' : isNominal ? '#06B6D4' : '#0F172A'}
                  stroke={isBest ? '#10B981' : '#0EA5E9'}
                  strokeWidth="2"
                />
                <text
                  x={x}
                  y={y - 7}
                  textAnchor="middle"
                  fill={pt.delta_race_time_s <= 0 ? '#10B981' : '#F87171'}
                  fontSize="6.5"
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
      <div className="flex items-center justify-between text-3xs border-t border-workstation-borderSubtle pt-1 text-workstation-textMuted">
        <div className="flex items-center space-x-1">
          <Info className="w-3 h-3 text-workstation-accentCyan" />
          <span>Negative offset: Undercut attempt (pit earlier). Positive offset: Overcut attempt (extend stint).</span>
        </div>
        <div className="text-4xs text-workstation-textSecondary">
          Stint 2 Final Tyre Age: {bestPoint.final_tyre_age} Laps
        </div>
      </div>
    </div>
  );
};
