import React, { useState } from 'react';
import { CompoundCurveResponse } from '../../types/strategy';
import { Disc } from 'lucide-react';

interface TyreDegradationPlotProps {
  curves: Record<string, CompoundCurveResponse>;
  isLoading: boolean;
}

const COMPOUND_COLORS: Record<string, string> = {
  SOFT: '#FF3366',
  MEDIUM: '#FBBF24',
  HARD: '#FFFFFF',
};

export const TyreDegradationPlot: React.FC<TyreDegradationPlotProps> = ({
  curves,
  isLoading,
}) => {
  const [metric, setMetric] = useState<'penalty' | 'grip'>('penalty');
  const chartDims = { width: 500, height: 200, padX: 45, padY: 25 };

  if (isLoading) {
    return (
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-4 font-mono text-2xs text-[#FFFFFF] flex items-center justify-center space-x-2 h-56 shadow-md">
        <Disc className="w-4 h-4 animate-spin text-[#FFFFFF]" />
        <span className="font-bold uppercase">[ COMPUTING NON-LINEAR TYRE WEAR, THERMAL & WARMUP PHENOMENOLOGY... ]</span>
      </div>
    );
  }

  const compounds = Object.keys(curves);
  if (compounds.length === 0) {
    return (
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-4 font-mono text-2xs text-[#94A3B8] flex items-center justify-center h-56 shadow-md">
        <span>[ NO TYRE CURVE DATA LOADED ]</span>
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
    <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-3 font-mono text-2xs space-y-2 shadow-md">
      {/* Titanium Header */}
      <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-2 bg-[#070E22] p-2 -mx-3 -mt-3 mb-2">
        <div className="flex items-center space-x-2">
          <Disc className="w-3.5 h-3.5 text-[#FFFFFF]" />
          <span className="font-bold text-[#FFFFFF] uppercase tracking-wider text-xs">
            [ SYNTHETIC TYRE DEGRADATION MODEL (C3 / C2 / C1) ]
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setMetric('penalty')}
            className={`px-2 py-0.5 border border-[#1E3A8A] text-3xs font-bold transition-all ${
              metric === 'penalty'
                ? 'bg-[#0062FF] text-[#FFFFFF] border-[#00F0FF] shadow-matrix-glow'
                : 'bg-[#070E22] text-[#93C5FD] hover:bg-[#0E1A3D]'
            }`}
          >
            [ LAP PENALTY (s) ]
          </button>
          <button
            onClick={() => setMetric('grip')}
            className={`px-2 py-0.5 border border-[#1E3A8A] text-3xs font-bold transition-all ${
              metric === 'grip'
                ? 'bg-[#0062FF] text-[#FFFFFF] border-[#00F0FF] shadow-matrix-glow'
                : 'bg-[#070E22] text-[#93C5FD] hover:bg-[#0E1A3D]'
            }`}
          >
            [ EFFECTIVE GRIP (μ) ]
          </button>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative bg-[#070E22] border border-[#1E3A8A] p-2 shadow">
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
                  stroke="#1E3A8A"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
                <text
                  x={chartDims.padX - 4}
                  y={yPos + 3}
                  textAnchor="end"
                  fill="#93C5FD"
                  fontSize="7"
                  className="font-mono font-bold"
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
                  L{age}
                </text>
              </g>
            );
          })}

          {/* Curves for each compound */}
          {compounds.map((compound) => {
            const pts = curves[compound]?.curve || [];
            if (pts.length < 2) return null;
            const strokeColor = COMPOUND_COLORS[compound] || '#000000';

            const d = pts.reduce((acc, pt, i) => {
              const x = scaleX(pt.tyre_age);
              const yVal = metric === 'penalty' ? pt.lap_time_penalty_s : pt.effective_grip;
              const y = scaleY(yVal);
              return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
            }, '');

            return (
              <g key={compound}>
                <path d={d} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
              </g>
            );
          })}

          {/* Cliff markers */}
          {compounds.map((compound) => {
            const maxL = curves[compound]?.max_viable_laps;
            if (!maxL) return null;
            const xCliff = scaleX(maxL);
            const strokeColor = COMPOUND_COLORS[compound] || '#000000';
            return (
              <g key={`cliff-${compound}`}>
                <line
                  x1={xCliff}
                  y1={chartDims.padY}
                  x2={xCliff}
                  y2={chartDims.height - chartDims.padY}
                  stroke={strokeColor}
                  strokeWidth="1.5"
                  strokeDasharray="3,3"
                />
                <text
                  x={xCliff}
                  y={chartDims.padY - 2}
                  textAnchor="middle"
                  fill={strokeColor}
                  fontSize="6.5"
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
      <div className="flex flex-wrap items-center justify-between text-3xs border-t border-[#1E3A8A] pt-2 text-[#94A3B8]">
        <div className="flex items-center space-x-4">
          {compounds.map((c) => (
            <div key={c} className="flex items-center space-x-1.5 bg-[#070E22] px-2 py-0.5 border border-[#1E3A8A] shadow-sm">
              <span
                className="w-2.5 h-2.5 border border-[#1E3A8A] inline-block"
                style={{ backgroundColor: COMPOUND_COLORS[c] }}
              />
              <span className="text-[#FFFFFF] font-bold">{c}</span>
              <span className="text-4xs text-[#94A3B8]">
                (Cliff @ L{curves[c]?.max_viable_laps ?? 0})
              </span>
            </div>
          ))}
        </div>

        <div className="text-4xs text-[#CBD5E1] font-bold bg-[#0A0D15] px-2 py-0.5 border border-[#1E3A8A]">
          MODEL: μ(age) = μ₀ - a·age - b·age² - Δthermal + warmup
        </div>
      </div>
    </div>
  );
};
