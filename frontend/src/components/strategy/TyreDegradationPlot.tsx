import React, { useState } from 'react';
import { CompoundCurveResponse } from '../../types/strategy';
import { Disc } from 'lucide-react';

interface TyreDegradationPlotProps {
  curves: Record<string, CompoundCurveResponse>;
  isLoading: boolean;
}

const COMPOUND_COLORS: Record<string, string> = {
  SOFT: '#EF4444',
  MEDIUM: '#F59E0B',
  HARD: '#E2E8F0',
};

export const TyreDegradationPlot: React.FC<TyreDegradationPlotProps> = ({
  curves,
  isLoading,
}) => {
  const [metric, setMetric] = useState<'penalty' | 'grip'>('penalty');
  const chartDims = { width: 500, height: 200, padX: 45, padY: 25 };

  if (isLoading) {
    return (
      <div className="bg-workstation-panel border border-workstation-border rounded p-4 font-mono text-2xs animate-pulse text-workstation-textMuted flex items-center justify-center space-x-2 h-56">
        <Disc className="w-4 h-4 animate-spin text-workstation-accentCyan" />
        <span>COMPUTING NON-LINEAR TYRE WEAR, THERMAL & WARMUP PHENOMENOLOGY...</span>
      </div>
    );
  }

  const compounds = Object.keys(curves);
  if (compounds.length === 0) {
    return (
      <div className="bg-workstation-panel border border-workstation-border rounded p-4 font-mono text-2xs text-workstation-textMuted flex items-center justify-center h-56">
        <span>No tyre curve data loaded.</span>
      </div>
    );
  }

  // Calculate scales
  const maxLaps = 40;
  let minY = 0;
  let maxY = 4.0; // seconds for penalty

  if (metric === 'grip') {
    minY = 1.2;
    maxY = 1.85;
  } else {
    // Find max penalty across curves
    let calculatedMax = 0;
    compounds.forEach((c) => {
      curves[c]?.curve?.forEach((pt) => {
        if (pt.lap_time_penalty_s > calculatedMax) calculatedMax = pt.lap_time_penalty_s;
      });
    });
    maxY = Math.max(calculatedMax * 1.1, 3.5);
  }

  const scaleX = (age: number) =>
    chartDims.padX + (age / maxLaps) * (chartDims.width - 2 * chartDims.padX);
  const scaleY = (val: number) =>
    chartDims.height -
    chartDims.padY -
    ((val - minY) / (maxY - minY)) * (chartDims.height - 2 * chartDims.padY);

  return (
    <div className="bg-workstation-panel border border-workstation-border rounded p-3 font-mono text-2xs space-y-2">
      <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-1.5">
        <div className="flex items-center space-x-2">
          <Disc className="w-3.5 h-3.5 text-workstation-accentCyan" />
          <span className="font-bold text-workstation-textBright uppercase tracking-wider text-xs">
            SYNTHETIC TYRE DEGRADATION MODEL (C3 / C2 / C1)
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center rounded border border-workstation-borderSubtle bg-workstation-surface text-3xs p-0.5">
            <button
              onClick={() => setMetric('penalty')}
              className={`px-2 py-0.5 rounded transition-colors ${
                metric === 'penalty'
                  ? 'bg-workstation-accentCyan text-slate-950 font-bold'
                  : 'text-workstation-textMuted hover:text-workstation-textBright'
              }`}
            >
              LAP PENALTY (s)
            </button>
            <button
              onClick={() => setMetric('grip')}
              className={`px-2 py-0.5 rounded transition-colors ${
                metric === 'grip'
                  ? 'bg-workstation-accentCyan text-slate-950 font-bold'
                  : 'text-workstation-textMuted hover:text-workstation-textBright'
              }`}
            >
              EFFECTIVE GRIP (μ)
            </button>
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative">
        <svg viewBox={`0 0 ${chartDims.width} ${chartDims.height}`} className="w-full h-44 select-none">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const yVal = minY + pct * (maxY - minY);
            const yPos = scaleY(yVal);
            return (
              <g key={idx}>
                <line
                  x1={chartDims.padX}
                  y1={yPos}
                  x2={chartDims.width - chartDims.padX}
                  y2={yPos}
                  stroke="#334155"
                  strokeWidth="0.5"
                  strokeDasharray="2,2"
                />
                <text
                  x={chartDims.padX - 4}
                  y={yPos + 3}
                  textAnchor="end"
                  fill="#64748B"
                  fontSize="7"
                  className="font-mono"
                >
                  {yVal.toFixed(1)}
                  {metric === 'penalty' ? 's' : ''}
                </text>
              </g>
            );
          })}

          {/* X axis ticks */}
          {[0, 10, 20, 30, 40].map((age) => {
            const xPos = scaleX(age);
            return (
              <g key={age}>
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
                  fill="#64748B"
                  fontSize="7"
                  className="font-mono"
                >
                  L{age}
                </text>
              </g>
            );
          })}

          {/* Curves for each compound */}
          {compounds.map((compound) => {
            const pts = curves[compound]?.curve || [];
            if (pts.length < 2) return null;
            const strokeColor = COMPOUND_COLORS[compound] || '#FFFFFF';

            const d = pts.reduce((acc, pt, i) => {
              const x = scaleX(pt.tyre_age);
              const yVal = metric === 'penalty' ? pt.lap_time_penalty_s : pt.effective_grip;
              const y = scaleY(yVal);
              return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
            }, '');

            return (
              <g key={compound}>
                <path d={d} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
              </g>
            );
          })}

          {/* Cliff markers */}
          {compounds.map((compound) => {
            const maxL = curves[compound]?.max_viable_laps;
            if (!maxL) return null;
            const xCliff = scaleX(maxL);
            const strokeColor = COMPOUND_COLORS[compound] || '#FFFFFF';
            return (
              <g key={`cliff-${compound}`}>
                <line
                  x1={xCliff}
                  y1={chartDims.padY}
                  x2={xCliff}
                  y2={chartDims.height - chartDims.padY}
                  stroke={strokeColor}
                  strokeWidth="1"
                  strokeDasharray="3,3"
                  opacity="0.6"
                />
                <text
                  x={xCliff}
                  y={chartDims.padY - 2}
                  textAnchor="middle"
                  fill={strokeColor}
                  fontSize="6"
                  className="font-mono font-bold"
                >
                  CLIFF {compound} ({maxL}L)
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend & Physical Details */}
      <div className="flex flex-wrap items-center justify-between text-3xs border-t border-workstation-borderSubtle pt-1.5 text-workstation-textMuted">
        <div className="flex items-center space-x-4">
          {compounds.map((c) => (
            <div key={c} className="flex items-center space-x-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: COMPOUND_COLORS[c] }}
              />
              <span className="text-workstation-textBright font-semibold">{c}</span>
              <span className="text-4xs text-workstation-textMuted">
                (Cliff @ L{curves[c]?.max_viable_laps ?? 0})
              </span>
            </div>
          ))}
        </div>

        <div className="text-4xs text-workstation-textSecondary">
          Model: μ(age) = μ₀ - a·age - b·age² - Δthermal + warmup
        </div>
      </div>
    </div>
  );
};
