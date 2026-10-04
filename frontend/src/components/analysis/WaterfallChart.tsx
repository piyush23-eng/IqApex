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
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-6 text-center font-mono text-xs text-[#94A3B8] font-bold shadow-md">
        [ NO WATERFALL DECOMPOSITION STEPS AVAILABLE ]
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
    <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-3 font-mono text-2xs space-y-2 shadow-md w-full flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-1.5">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-3.5 h-3.5 text-[#FFFFFF] stroke-[2.5]" />
          <span className="font-extrabold text-[#FFFFFF] tracking-wider uppercase text-2xs">
            [ CUMULATIVE LAP-TIME WATERFALL DECOMPOSITION ]
          </span>
        </div>
        <div className="flex items-center space-x-2 text-3xs">
          <span className="flex items-center space-x-1 px-1.5 py-0.5 bg-[#070E22] border border-[#1E3A8A] shadow-sm">
            <span className="w-2.5 h-2.5 bg-[#00F0FF] border border-[#1E3A8A] inline-block" />
            <span className="font-bold text-[#FFFFFF]">Time Gained (Δ &lt; 0)</span>
          </span>
          <span className="flex items-center space-x-1 px-1.5 py-0.5 bg-[#070E22] border border-[#1E3A8A] shadow-sm">
            <span className="w-2.5 h-2.5 bg-[#FFB000] border border-[#1E3A8A] inline-block" />
            <span className="font-bold text-[#FFFFFF]">Time Lost (Δ &gt; 0)</span>
          </span>
          <span className="flex items-center space-x-1 px-1.5 py-0.5 bg-[#070E22] border border-[#1E3A8A] shadow-sm">
            <span className="w-2.5 h-2.5 bg-black border border-[#1E3A8A] inline-block" />
            <span className="font-bold text-[#FFFFFF]">Residual (Exact)</span>
          </span>
          <span className="flex items-center space-x-1 px-1.5 py-0.5 bg-[#00F0FF] border border-[#1E3A8A] shadow-sm">
            <span className="font-extrabold text-[#FFFFFF]">Total Δ ({totalDelta > 0 ? '+' : ''}{totalDelta.toFixed(3)}s)</span>
          </span>
        </div>
      </div>

      {/* Interactive Waterfall SVG */}
      <div className="relative overflow-x-auto bg-[#070E22] border border-[#1E3A8A] p-2 shadow min-h-[250px] w-full">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto select-none"
          style={{ minWidth: '680px', minHeight: '220px' }}
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
                  stroke={gridVal === 0 ? '#0062FF' : '#1E3A8A'}
                  strokeWidth={gridVal === 0 ? 1.5 : 0.75}
                  strokeDasharray={gridVal === 0 ? undefined : '2,2'}
                />
                <text
                  x={padding.left - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="#93C5FD"
                  fontSize="8"
                  fontFamily="monospace"
                  fontWeight="bold"
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
            let barFill = '#0A132E';

            if (step.category === 'baseline') {
              yTop = zeroY - 2;
              yBottom = zeroY + 2;
              barFill = '#FFFFFF';
            } else if (step.category === 'total') {
              const valY = getY(step.end_time);
              yTop = Math.min(zeroY, valY);
              yBottom = Math.max(zeroY, valY);
              barFill = step.end_time > 0 ? '#FF3366' : '#00E676';
            } else {
              const startY = getY(step.start_time);
              const endY = getY(step.end_time);
              yTop = Math.min(startY, endY);
              yBottom = Math.max(startY, endY);

              if (step.category === 'residual') {
                barFill = '#0062FF';
              } else if (step.increment > 0.0005) {
                barFill = '#FF3366';
              } else if (step.increment < -0.0005) {
                barFill = '#00E676';
              } else {
                barFill = '#0A132E';
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
                  stroke="#00F0FF"
                  strokeWidth={1}
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
                  stroke={isHovered ? '#FFFFFF' : '#1E3A8A'}
                  strokeWidth={isHovered ? 2 : 1}
                />

                {/* Value on top of bar */}
                {step.category !== 'baseline' && (
                  <text
                    x={centerX}
                    y={yTop - 4}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="7.5"
                    fontWeight="bold"
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
                  fill={isHovered ? '#00F0FF' : '#93C5FD'}
                  fontSize="7.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {displayLabel}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hovered Step Inspector Tooltip */}
        {hoveredStep && (
          <div className="absolute top-2 right-4 bg-[#070E22] border border-[#1E3A8A] p-2 shadow pointer-events-none text-3xs space-y-0.5">
            <div className="text-[#FFFFFF] font-extrabold flex items-center space-x-1">
              <Info className="w-3 h-3 text-[#FFFFFF]" />
              <span>{hoveredStep.label}</span>
            </div>
            <div className="text-[#94A3B8] font-bold">
              Span: <span className="text-[#FFFFFF]">{hoveredStep.distance_range}</span>
            </div>
            <div className="flex items-center space-x-3 pt-0.5 font-bold">
              <span>
                Step Δ:{' '}
                <strong
                  className={
                    hoveredStep.increment > 0
                      ? 'text-[#FFB000]'
                      : hoveredStep.increment < 0
                      ? 'text-[#00E676]'
                      : 'text-[#FFFFFF]'
                  }
                >
                  {hoveredStep.increment > 0 ? '+' : ''}
                  {hoveredStep.increment.toFixed(4)}s
                </strong>
              </span>
              <span>
                Cumulative:{' '}
                <strong className="text-[#FFFFFF]">
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
