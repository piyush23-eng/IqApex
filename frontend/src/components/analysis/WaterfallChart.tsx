import React, { useState } from 'react';
import { WaterfallStep } from '../../types/decomposition';
import { BarChart3, Info } from 'lucide-react';

interface WaterfallChartProps {
  steps: WaterfallStep[];
  totalDelta: number;
}

export const WaterfallChart: React.FC<WaterfallChartProps> = ({ steps, totalDelta }) => {
  const [hoveredStep, setHoveredStep] = useState<WaterfallStep | null>(null);

  if (!steps || steps.length === 0) {
    return (
      <div className="bg-workstation-panel border border-workstation-border rounded p-6 text-center font-mono text-xs text-workstation-textMuted">
        No waterfall decomposition steps available.
      </div>
    );
  }

  // Determine value range for SVG scaling
  const allValues = steps.flatMap((s) => [s.start_time, s.end_time]);
  const minVal = Math.min(0, ...allValues);
  const maxVal = Math.max(0, ...allValues);
  const margin = Math.max(0.05, (maxVal - minVal) * 0.15);
  const yMin = minVal - margin;
  const yMax = maxVal + margin;
  const range = yMax - yMin > 1e-4 ? yMax - yMin : 0.1;

  const svgWidth = 840;
  const svgHeight = 220;
  const padding = { top: 20, right: 30, bottom: 45, left: 55 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  const getY = (val: number) => {
    return padding.top + chartHeight - ((val - yMin) / range) * chartHeight;
  };

  const zeroY = getY(0);
  const colWidth = Math.min(42, (chartWidth / steps.length) * 0.7);
  const stepGap = chartWidth / steps.length;

  return (
    <div className="bg-workstation-panel border border-workstation-border rounded p-3 font-mono text-2xs space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-1.5">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-3.5 h-3.5 text-workstation-accentCyan" />
          <span className="font-bold text-workstation-textBright tracking-wider uppercase">
            CUMULATIVE LAP-TIME WATERFALL DECOMPOSITION
          </span>
        </div>
        <div className="flex items-center space-x-3 text-3xs text-workstation-textMuted">
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 bg-workstation-telemetryGreen rounded-xs inline-block" />
            <span>Time Gained (Δ &lt; 0)</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 bg-workstation-telemetryAmber rounded-xs inline-block" />
            <span>Time Lost (Δ &gt; 0)</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 bg-workstation-accentCyan/80 rounded-xs inline-block" />
            <span>Residual (Exact)</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 bg-workstation-textBright rounded-xs inline-block" />
            <span>Total Δ ({totalDelta > 0 ? '+' : ''}{totalDelta.toFixed(3)}s)</span>
          </span>
        </div>
      </div>

      {/* Interactive Waterfall SVG */}
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto select-none"
          style={{ minWidth: '680px' }}
        >
          {/* Horizontal grid lines */}
          {[-0.2, -0.1, 0, 0.1, 0.2, 0.3, 0.4].map((gridVal) => {
            if (gridVal < yMin || gridVal > yMax) return null;
            const y = getY(gridVal);
            return (
              <g key={gridVal}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={svgWidth - padding.right}
                  y2={y}
                  stroke={gridVal === 0 ? '#38bdf8' : '#27272a'}
                  strokeWidth={gridVal === 0 ? 1 : 0.5}
                  strokeDasharray={gridVal === 0 ? undefined : '2,2'}
                />
                <text
                  x={padding.left - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="#71717a"
                  fontSize="8"
                  fontFamily="monospace"
                >
                  {gridVal > 0 ? `+${gridVal.toFixed(2)}` : gridVal.toFixed(2)}s
                </text>
              </g>
            );
          })}

          {/* Connectors & Bars */}
          {steps.map((step, idx) => {
            const centerX = padding.left + idx * stepGap + stepGap / 2;
            const barX = centerX - colWidth / 2;

            // Bar Y coordinates
            let yTop: number;
            let yBottom: number;
            let barFill = '#71717a';

            if (step.category === 'baseline') {
              yTop = zeroY - 2;
              yBottom = zeroY + 2;
              barFill = '#52525b';
            } else if (step.category === 'total') {
              const valY = getY(step.end_time);
              yTop = Math.min(zeroY, valY);
              yBottom = Math.max(zeroY, valY);
              barFill = step.end_time > 0 ? '#f59e0b' : '#10b981';
            } else {
              const startY = getY(step.start_time);
              const endY = getY(step.end_time);
              yTop = Math.min(startY, endY);
              yBottom = Math.max(startY, endY);

              if (step.category === 'residual') {
                barFill = '#06b6d4';
              } else if (step.increment > 0.0005) {
                barFill = '#f59e0b';
              } else if (step.increment < -0.0005) {
                barFill = '#10b981';
              } else {
                barFill = '#71717a';
              }
            }

            const barHeight = Math.max(2, yBottom - yTop);

            // Connector line to next bar
            const nextStep = steps[idx + 1];
            let connector = null;
            if (nextStep && step.category !== 'total') {
              const nextCenterX = padding.left + (idx + 1) * stepGap + stepGap / 2;
              const nextBarX = nextCenterX - colWidth / 2;
              const endY = getY(step.end_time);
              connector = (
                <line
                  x1={barX + colWidth}
                  y1={endY}
                  x2={nextBarX}
                  y2={endY}
                  stroke="#52525b"
                  strokeWidth={0.75}
                  strokeDasharray="2,2"
                />
              );
            }

            const isHovered = hoveredStep?.step_index === step.step_index;

            // Simplified display label for X axis
            let displayLabel = step.label;
            if (displayLabel.includes('(')) {
              displayLabel = displayLabel.split('(')[0].trim();
            }
            if (displayLabel === 'Reference Lap') displayLabel = 'Ref';
            if (displayLabel === 'Total Delta') displayLabel = 'Total Δ';
            if (displayLabel === 'Decomposition Residual') displayLabel = 'Residual';

            return (
              <g
                key={step.step_index}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredStep(step)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                {connector}

                {/* Column Bar */}
                <rect
                  x={barX}
                  y={yTop}
                  width={colWidth}
                  height={barHeight}
                  fill={barFill}
                  opacity={isHovered ? 1 : 0.85}
                  stroke={isHovered ? '#ffffff' : step.category === 'residual' ? '#06b6d4' : 'none'}
                  strokeWidth={isHovered ? 1.5 : step.category === 'residual' ? 1 : 0}
                  strokeDasharray={step.category === 'residual' ? '2,1' : undefined}
                  rx={1.5}
                />

                {/* Value on top of bar */}
                {step.category !== 'baseline' && (
                  <text
                    x={centerX}
                    y={yTop - 4}
                    textAnchor="middle"
                    fill={isHovered ? '#ffffff' : '#a1a1aa'}
                    fontSize="7"
                    fontWeight={isHovered ? 'bold' : 'normal'}
                    fontFamily="monospace"
                  >
                    {step.category === 'total'
                      ? `${step.end_time > 0 ? '+' : ''}${step.end_time.toFixed(3)}`
                      : `${step.increment > 0 ? '+' : ''}${step.increment.toFixed(3)}`}
                  </text>
                )}

                {/* X-axis step label */}
                <text
                  x={centerX}
                  y={svgHeight - padding.bottom + 14}
                  textAnchor="end"
                  transform={`rotate(-40, ${centerX}, ${svgHeight - padding.bottom + 14})`}
                  fill={isHovered ? '#38bdf8' : '#71717a'}
                  fontSize="7.5"
                  fontFamily="monospace"
                  fontWeight={isHovered ? 'bold' : 'normal'}
                >
                  {displayLabel}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hovered Step Inspector Tooltip */}
        {hoveredStep && (
          <div className="absolute top-2 right-4 bg-workstation-surface/95 border border-workstation-accentCyan/60 rounded px-2.5 py-1.5 shadow-lg backdrop-blur-sm pointer-events-none text-3xs space-y-0.5">
            <div className="text-workstation-textBright font-bold flex items-center space-x-1">
              <Info className="w-2.5 h-2.5 text-workstation-accentCyan" />
              <span>{hoveredStep.label}</span>
            </div>
            <div className="text-workstation-textMuted">
              Span: <span className="text-workstation-textPrimary">{hoveredStep.distance_range}</span>
            </div>
            <div className="flex items-center space-x-3 pt-0.5">
              <span>
                Step Δ:{' '}
                <strong
                  className={
                    hoveredStep.increment > 0
                      ? 'text-workstation-telemetryAmber'
                      : hoveredStep.increment < 0
                      ? 'text-workstation-telemetryGreen'
                      : 'text-workstation-textMuted'
                  }
                >
                  {hoveredStep.increment > 0 ? '+' : ''}
                  {hoveredStep.increment.toFixed(4)}s
                </strong>
              </span>
              <span>
                Cumulative:{' '}
                <strong className="text-workstation-textBright">
                  {hoveredStep.end_time > 0 ? '+' : ''}
                  {hoveredStep.end_time.toFixed(4)}s
                </strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
