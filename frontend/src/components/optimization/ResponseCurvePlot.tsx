import React, { useState } from 'react';
import { ResponseCurveResponse } from '../../types/optimization';
import { LineChart, AlertTriangle } from 'lucide-react';

interface ResponseCurvePlotProps {
  curveData: ResponseCurveResponse | null;
  isLoading?: boolean;
}

export const ResponseCurvePlot: React.FC<ResponseCurvePlotProps> = ({
  curveData,
  isLoading = false,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label: string } | null>(null);

  if (isLoading) {
    return (
      <div className="bg-workstation-panel border border-workstation-border rounded p-6 text-center font-mono text-xs text-workstation-textMuted">
        Evaluating response model and prediction intervals...
      </div>
    );
  }

  if (!curveData || curveData.points.length === 0) {
    return (
      <div className="bg-workstation-panel border border-workstation-border rounded p-6 text-center font-mono text-xs text-workstation-textMuted">
        No response curve data available.
      </div>
    );
  }

  const {
    parameter_name,
    target_name,
    baseline_x,
    scenario_x,
    observed_range,
    domain_status,
    extrapolation_warning,
    points,
    observed_data,
  } = curveData;

  const [obsMin, obsMax] = observed_range;

  // Compute bounding boxes for SVG
  const allX = points.map((p) => p.x);
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);

  const allY = [
    ...points.map((p) => p.ci_95_lower),
    ...points.map((p) => p.ci_95_upper),
    ...points.map((p) => p.pi_95_lower),
    ...points.map((p) => p.pi_95_upper),
    ...observed_data.map((d) => d.y_val),
  ];
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);

  const yMargin = Math.max(0.02, (maxY - minY) * 0.12);
  const plotYMin = minY - yMargin;
  const plotYMax = maxY + yMargin;

  const width = 760;
  const height = 260;
  const pad = { top: 25, right: 35, bottom: 40, left: 60 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;

  const getX = (val: number) => pad.left + ((val - minX) / (maxX - minX || 1.0)) * w;
  const getY = (val: number) => pad.top + h - ((val - plotYMin) / (plotYMax - plotYMin || 1.0)) * h;

  // Construct SVG paths
  // 1. Model fitted line
  const modelLinePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.x)} ${getY(p.y_modelled)}`).join(' ');

  // 2. 95% Confidence Interval band (shaded area)
  const ciAreaPath =
    points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.x)} ${getY(p.ci_95_upper)}`).join(' ') +
    ' ' +
    [...points].reverse().map((p) => `L ${getX(p.x)} ${getY(p.ci_95_lower)}`).join(' ') +
    ' Z';

  // 3. 95% Prediction Interval upper and lower lines
  const piUpperPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.x)} ${getY(p.pi_95_upper)}`).join(' ');
  const piLowerPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.x)} ${getY(p.pi_95_lower)}`).join(' ');

  return (
    <div className="bg-workstation-panel border border-workstation-border rounded p-3 font-mono text-2xs space-y-2">
      {/* Header and Extrapolation Notice */}
      <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-1.5">
        <div className="flex items-center space-x-2">
          <LineChart className="w-3.5 h-3.5 text-workstation-accentCyan" />
          <span className="font-bold text-workstation-textBright tracking-wider uppercase">
            RESPONSE CURVE & UNCERTAINTY BANDS (95% CI & PI)
          </span>
        </div>

        <div className="flex items-center space-x-3 text-3xs text-workstation-textMuted">
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 bg-workstation-accentCyan/30 border border-workstation-accentCyan inline-block rounded-xs" />
            <span>95% CI (Mean)</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-3 h-0.5 border-t border-dashed border-zinc-500 inline-block" />
            <span>95% PI (Single Lap)</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-workstation-telemetryAmber inline-block" />
            <span>Observed Laps</span>
          </span>
        </div>
      </div>

      {extrapolation_warning && (
        <div className="bg-amber-950/30 border border-amber-500/40 text-amber-300 p-2 rounded flex items-center space-x-2 text-3xs">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{extrapolation_warning}</span>
        </div>
      )}

      {/* SVG Canvas */}
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          style={{ minWidth: '600px' }}
        >
          {/* Shaded Observed Range Box in Background */}
          <rect
            x={getX(obsMin)}
            y={pad.top}
            width={Math.max(2, getX(obsMax) - getX(obsMin))}
            height={h}
            fill="#38bdf8"
            fillOpacity="0.04"
            stroke="#38bdf8"
            strokeOpacity="0.2"
            strokeDasharray="2,2"
          />

          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((frac) => {
            const yVal = plotYMin + frac * (plotYMax - plotYMin);
            const y = getY(yVal);
            return (
              <g key={frac}>
                <line
                  x1={pad.left}
                  y1={y}
                  x2={width - pad.right}
                  y2={y}
                  stroke="#27272a"
                  strokeWidth={0.5}
                  strokeDasharray="2,2"
                />
                <text
                  x={pad.left - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="#71717a"
                  fontSize="7.5"
                  fontFamily="monospace"
                >
                  {yVal.toFixed(3)}s
                </text>
              </g>
            );
          })}

          {/* 95% Confidence Interval band */}
          <path d={ciAreaPath} fill="#38bdf8" fillOpacity="0.12" />

          {/* 95% Prediction Interval lines (dashed) */}
          <path d={piUpperPath} fill="none" stroke="#71717a" strokeWidth="1" strokeDasharray="3,3" />
          <path d={piLowerPath} fill="none" stroke="#71717a" strokeWidth="1" strokeDasharray="3,3" />

          {/* Model Curve */}
          <path d={modelLinePath} fill="none" stroke="#38bdf8" strokeWidth="2" />

          {/* Observed telemetry scatter points */}
          {observed_data.map((d) => {
            const cx = getX(d.x_val);
            const cy = getY(d.y_val);
            return (
              <circle
                key={d.lap_id}
                cx={cx}
                cy={cy}
                r="3.5"
                fill="#f59e0b"
                stroke="#18181b"
                strokeWidth="1"
                className="cursor-pointer hover:r-5 transition-all"
                onMouseEnter={() =>
                  setHoveredPoint({
                    x: d.x_val,
                    y: d.y_val,
                    label: `Observed ${d.lap_id.replace('lap-demo-', 'Lap ')}: ${d.x_val.toFixed(1)} → ${d.y_val.toFixed(3)}s`,
                  })
                }
                onMouseLeave={() => setHoveredPoint(null)}
              />
            );
          })}

          {/* Baseline Vertical Line */}
          <line
            x1={getX(baseline_x)}
            y1={pad.top}
            x2={getX(baseline_x)}
            y2={pad.top + h}
            stroke="#06b6d4"
            strokeWidth="1.5"
            strokeDasharray="4,2"
          />
          <text
            x={getX(baseline_x) + 4}
            y={pad.top + 10}
            fill="#06b6d4"
            fontSize="7"
            fontFamily="monospace"
            fontWeight="bold"
          >
            Baseline: {baseline_x.toFixed(1)}
          </text>

          {/* Scenario Vertical Line */}
          <line
            x1={getX(scenario_x)}
            y1={pad.top}
            x2={getX(scenario_x)}
            y2={pad.top + h}
            stroke={domain_status === 'EXTRAPOLATION' ? '#f59e0b' : '#10b981'}
            strokeWidth="2"
          />
          <text
            x={getX(scenario_x) + 4}
            y={pad.top + 22}
            fill={domain_status === 'EXTRAPOLATION' ? '#f59e0b' : '#10b981'}
            fontSize="7"
            fontFamily="monospace"
            fontWeight="bold"
          >
            Scenario: {scenario_x.toFixed(1)}
          </text>

          {/* X Axis ticks */}
          {points
            .filter((_, idx) => idx % 12 === 0)
            .map((p) => (
              <g key={p.x}>
                <line
                  x1={getX(p.x)}
                  y1={pad.top + h}
                  x2={getX(p.x)}
                  y2={pad.top + h + 4}
                  stroke="#52525b"
                  strokeWidth={1}
                />
                <text
                  x={getX(p.x)}
                  y={pad.top + h + 13}
                  textAnchor="middle"
                  fill="#71717a"
                  fontSize="7.5"
                  fontFamily="monospace"
                >
                  {p.x.toFixed(1)}
                </text>
              </g>
            ))}

          {/* Axis Titles */}
          <text
            x={width / 2}
            y={height - 5}
            textAnchor="middle"
            fill="#a1a1aa"
            fontSize="8"
            fontFamily="monospace"
          >
            {parameter_name.toUpperCase()}
          </text>
          <text
            x={-height / 2}
            y={12}
            transform="rotate(-90)"
            textAnchor="middle"
            fill="#a1a1aa"
            fontSize="8"
            fontFamily="monospace"
          >
            PREDICTED {target_name.toUpperCase()} (s)
          </text>
        </svg>

        {/* Hover Readout Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-2 right-4 bg-workstation-surface/95 border border-workstation-accentCyan/60 rounded px-2.5 py-1 text-3xs font-mono text-workstation-textBright shadow-lg pointer-events-none">
            {hoveredPoint.label}
          </div>
        )}
      </div>
    </div>
  );
};
