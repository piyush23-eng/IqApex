import React, { useState, useMemo } from 'react';
import { Target, Info } from 'lucide-react';
import type { TradeoffPoint } from '../../types/engineeringAnalysis';

interface MultiObjectiveTradeoffPlotProps {
  points: TradeoffPoint[];
  selectedPointId?: string;
  onSelectPoint?: (point: TradeoffPoint) => void;
}

type MetricKey = 'lap_time_delta_s' | 'downforce_n' | 'drag_n' | 'race_time_delta_s' | 'uncertainty_pi_s';

interface MetricOption {
  key: MetricKey;
  label: string;
  unit: string;
  direction: 'min' | 'max'; // lower is better or higher is better
}

const METRIC_OPTIONS: MetricOption[] = [
  { key: 'lap_time_delta_s', label: 'Lap Time Delta', unit: 's', direction: 'min' },
  { key: 'race_time_delta_s', label: 'Race Time Delta', unit: 's', direction: 'min' },
  { key: 'downforce_n', label: 'Downforce', unit: 'N', direction: 'max' },
  { key: 'drag_n', label: 'Aerodynamic Drag', unit: 'N', direction: 'min' },
  { key: 'uncertainty_pi_s', label: '95% PI Width', unit: 's', direction: 'min' },
];

export const MultiObjectiveTradeoffPlot: React.FC<MultiObjectiveTradeoffPlotProps> = ({
  points,
  selectedPointId,
  onSelectPoint,
}) => {
  const [xMetric, setXMetric] = useState<MetricKey>('lap_time_delta_s');
  const [yMetric, setYMetric] = useState<MetricKey>('uncertainty_pi_s');
  const [hoveredPoint, setHoveredPoint] = useState<TradeoffPoint | null>(null);

  const xOption = METRIC_OPTIONS.find((m) => m.key === xMetric) || METRIC_OPTIONS[0];
  const yOption = METRIC_OPTIONS.find((m) => m.key === yMetric) || METRIC_OPTIONS[4];

  // SVG dimensions
  const width = 640;
  const height = 340;
  const padding = { top: 25, right: 30, bottom: 45, left: 65 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Extents
  const { minX, maxX, minY, maxY } = useMemo(() => {
    if (points.length === 0) {
      return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
    }
    const xVals = points.map((p) => p[xMetric]);
    const yVals = points.map((p) => p[yMetric]);
    const rawMinX = Math.min(...xVals);
    const rawMaxX = Math.max(...xVals);
    const rawMinY = Math.min(...yVals);
    const rawMaxY = Math.max(...yVals);

    const padX = (rawMaxX - rawMinX) * 0.1 || 0.1;
    const padY = (rawMaxY - rawMinY) * 0.1 || 0.1;

    return {
      minX: rawMinX - padX,
      maxX: rawMaxX + padX,
      minY: rawMinY - padY,
      maxY: rawMaxY + padY,
    };
  }, [points, xMetric, yMetric]);

  const scaleX = React.useCallback((val: number) => {
    if (maxX === minX) return padding.left + plotWidth / 2;
    return padding.left + ((val - minX) / (maxX - minX)) * plotWidth;
  }, [maxX, minX, padding.left, plotWidth]);

  const scaleY = React.useCallback((val: number) => {
    if (maxY === minY) return padding.top + plotHeight / 2;
    // Invert Y: higher value -> higher up (lower SVG y)
    return padding.top + plotHeight - ((val - minY) / (maxY - minY)) * plotHeight;
  }, [maxY, minY, padding.top, plotHeight]);

  // Pareto Frontier Calculation
  const paretoPoints = useMemo(() => {
    if (points.length === 0) return new Set<string>();

    const paretoSet = new Set<string>();
    for (const p1 of points) {
      let isDominated = false;
      for (const p2 of points) {
        if (p1.id === p2.id) continue;

        // Better condition check based on metric direction
        const p2BetterX = xOption.direction === 'min' ? p2[xMetric] <= p1[xMetric] : p2[xMetric] >= p1[xMetric];
        const p2BetterY = yOption.direction === 'min' ? p2[yMetric] <= p1[yMetric] : p2[yMetric] >= p1[yMetric];
        const p2StrictlyBetter =
          (xOption.direction === 'min' ? p2[xMetric] < p1[xMetric] : p2[xMetric] > p1[xMetric]) ||
          (yOption.direction === 'min' ? p2[yMetric] < p1[yMetric] : p2[yMetric] > p1[yMetric]);

        if (p2BetterX && p2BetterY && p2StrictlyBetter) {
          isDominated = true;
          break;
        }
      }
      if (!isDominated) {
        paretoSet.add(p1.id);
      }
    }
    return paretoSet;
  }, [points, xMetric, yMetric, xOption, yOption]);

  // Sorted Pareto line points
  const paretoLineData = useMemo(() => {
    const pts = points.filter((p) => paretoPoints.has(p.id));
    return pts.sort((a, b) => a[xMetric] - b[xMetric]);
  }, [points, paretoPoints, xMetric]);

  const paretoPath = useMemo(() => {
    if (paretoLineData.length < 2) return '';
    return paretoLineData.reduce((path, pt, i) => {
      const x = scaleX(pt[xMetric]);
      const y = scaleY(pt[yMetric]);
      return i === 0 ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
    }, '');
  }, [paretoLineData, scaleX, scaleY, xMetric, yMetric]);

  return (
    <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-0 shadow-md font-mono">
      <div className="window-header-retro bg-[#070E22] border-b border-[#1E3A8A] px-3 py-1.5 flex flex-wrap items-center justify-between text-[#FFFFFF] font-extrabold">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-[#FFFFFF] stroke-[2.5]" />
          <span className="text-2xs font-extrabold uppercase tracking-wider text-[#FFFFFF]">
            [ MULTI-OBJECTIVE SETUP TRADE-OFF SPACE ]
          </span>
          <span className="text-3xs bg-[#00F0FF] text-[#FFFFFF] font-extrabold px-1.5 py-0.2 border border-[#1E3A8A] shadow-sm">
            PARETO FRONTIER
          </span>
        </div>

        {/* Axis Selectors */}
        <div className="flex items-center gap-3 text-2xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[#FFFFFF] font-bold">X:</span>
            <select
              value={xMetric}
              onChange={(e) => setXMetric(e.target.value as MetricKey)}
              className="bg-[#070E22] border border-[#1E3A8A] text-[#FFFFFF] text-3xs px-2 py-0.5 font-bold focus:outline-none focus:ring-2 focus:ring-[#0062FF] cursor-pointer"
            >
              {METRIC_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label} ({opt.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[#FFFFFF] font-bold">Y:</span>
            <select
              value={yMetric}
              onChange={(e) => setYMetric(e.target.value as MetricKey)}
              className="bg-[#070E22] border border-[#1E3A8A] text-[#FFFFFF] text-3xs px-2 py-0.5 font-bold focus:outline-none focus:ring-2 focus:ring-[#0062FF] cursor-pointer"
            >
              {METRIC_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label} ({opt.unit})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* SVG Canvas */}
        <div className="relative flex justify-center bg-[#070E22] border border-[#1E3A8A] shadow overflow-hidden">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto max-h-[360px] select-none"
          >
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
              const y = padding.top + pct * plotHeight;
              const x = padding.left + pct * plotWidth;
              const valY = maxY - pct * (maxY - minY);
              const valX = minX + pct * (maxX - minX);

              return (
                <g key={pct}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={padding.left + plotWidth}
                    y2={y}
                    stroke="#1E3A8A"
                    strokeDasharray="2,2"
                  />
                  <text
                    x={padding.left - 6}
                    y={y + 3}
                    textAnchor="end"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                    fill="#93C5FD"
                  >
                    {valY.toFixed(valY >= 100 ? 0 : 2)}
                  </text>

                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={padding.top + plotHeight}
                    stroke="#1E3A8A"
                    strokeDasharray="2,2"
                  />
                  <text
                    x={x}
                    y={padding.top + plotHeight + 14}
                    textAnchor="middle"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                    fill="#93C5FD"
                  >
                    {valX.toFixed(valX >= 100 ? 0 : 2)}
                  </text>
                </g>
              );
            })}

            {/* Zero baseline lines if in range */}
            {minX < 0 && maxX > 0 && (
              <line
                x1={scaleX(0)}
                y1={padding.top}
                x2={scaleX(0)}
                y2={padding.top + plotHeight}
                stroke="#0062FF"
                strokeWidth="1.5"
                strokeDasharray="3,3"
              />
            )}
            {minY < 0 && maxY > 0 && (
              <line
                x1={padding.left}
                y1={scaleY(0)}
                x2={padding.left + plotWidth}
                y2={scaleY(0)}
                stroke="#0062FF"
                strokeWidth="1.5"
                strokeDasharray="3,3"
              />
            )}

            {/* Pareto line connecting non-dominated candidates */}
            {paretoPath && (
              <path
                d={paretoPath}
                fill="none"
                stroke="#00F0FF"
                strokeWidth="2.5"
                strokeDasharray="4,2"
              />
            )}

            {/* Data Points */}
            {points.map((pt) => {
              const cx = scaleX(pt[xMetric]);
              const cy = scaleY(pt[yMetric]);
              const isPareto = paretoPoints.has(pt.id);
              const isSelected = pt.id === selectedPointId;
              const isHovered = hoveredPoint?.id === pt.id;

              return (
                <g
                  key={pt.id}
                  className="cursor-pointer"
                  onClick={() => onSelectPoint?.(pt)}
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  {/* Halo for current or selected */}
                  {(pt.is_current || isSelected || isHovered) && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isSelected || pt.is_current ? 11 : 8}
                      fill={pt.is_current ? '#0062FF' : isSelected ? '#00F0FF' : '#3B82F6'}
                      opacity={0.4}
                    />
                  )}

                  {/* Point Node */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={pt.is_current ? 6.5 : isPareto ? 5 : 4}
                    fill={
                      pt.is_current
                        ? '#0062FF'
                        : isSelected
                        ? '#FFFFFF'
                        : isPareto
                        ? '#00F0FF'
                        : '#0A132E'
                    }
                    stroke={pt.is_current ? '#00F0FF' : isSelected ? '#0062FF' : isPareto ? '#FFFFFF' : '#1E3A8A'}
                    strokeWidth={pt.is_current ? 2.5 : 1.5}
                  />

                  {/* Label for current setup */}
                  {pt.is_current && (
                    <text
                      x={cx + 9}
                      y={cy - 6}
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                      fill="#00F0FF"
                    >
                      [CURRENT]
                    </text>
                  )}
                </g>
              );
            })}

            {/* Axis Labels */}
            <text
              x={padding.left + plotWidth / 2}
              y={height - 8}
              textAnchor="middle"
              fontSize="10"
              fill="#93C5FD"
              fontWeight="bold"
              fontFamily="monospace"
            >
              {xOption.label} ({xOption.unit}) {xOption.direction === 'min' ? '← Lower Better' : '→ Higher Better'}
            </text>

            <text
              transform={`rotate(-90)`}
              x={-(padding.top + plotHeight / 2)}
              y={14}
              textAnchor="middle"
              fontSize="10"
              fill="#93C5FD"
              fontWeight="bold"
              fontFamily="monospace"
            >
              {yOption.label} ({yOption.unit}) {yOption.direction === 'min' ? '↓ Lower Better' : '↑ Higher Better'}
            </text>
          </svg>

          {/* Hover / Selection tooltip overlay */}
          {hoveredPoint && (
            <div className="absolute top-2 right-2 bg-[#070E22] border border-[#1E3A8A] p-2.5 text-3xs text-[#FFFFFF] pointer-events-none shadow-md max-w-[220px]">
              <div className="font-extrabold text-[#FFFFFF] border-b border-[#1E3A8A] pb-1 mb-1.5 flex justify-between items-center">
                <span>{hoveredPoint.name}</span>
                {paretoPoints.has(hoveredPoint.id) && (
                  <span className="text-4xs bg-[#00F0FF] text-[#FFFFFF] font-bold px-1 border border-[#1E3A8A]">PARETO</span>
                )}
              </div>
              <div className="space-y-0.5 text-[#E2E8F0] font-bold">
                <div>FW: {hoveredPoint.front_wing_angle.toFixed(1)}° | RW: {hoveredPoint.rear_wing_angle.toFixed(1)}°</div>
                <div>Lap Delta: <span className={hoveredPoint.lap_time_delta_s <= 0 ? 'text-[#00E676]' : 'text-[#FFB000]'}>{hoveredPoint.lap_time_delta_s > 0 ? '+' : ''}{hoveredPoint.lap_time_delta_s.toFixed(3)} s</span></div>
                <div>Race Delta: <span className={hoveredPoint.race_time_delta_s <= 0 ? 'text-[#00E676]' : 'text-[#FFB000]'}>{hoveredPoint.race_time_delta_s > 0 ? '+' : ''}{hoveredPoint.race_time_delta_s.toFixed(2)} s</span></div>
                <div>Downforce: <span className="text-[#FFFFFF] font-extrabold">{hoveredPoint.downforce_n.toFixed(0)} N</span></div>
                <div>Drag: <span className="text-[#FFFFFF] font-extrabold">{hoveredPoint.drag_n.toFixed(0)} N</span></div>
                <div>95% PI: <span className="text-[#FFFFFF] font-extrabold">±{(hoveredPoint.uncertainty_pi_s / 2).toFixed(3)} s</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Legend & Guidance */}
        <div className="flex flex-wrap items-center justify-between text-3xs text-[#FFFFFF] px-1 font-bold">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-[#008000] inline-block border border-[#1E3A8A]" />
              <span>Pareto Non-dominated</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-[#00F0FF] inline-block border border-[#1E3A8A]" />
              <span>Active Scenario Setup</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-[#93C5FD] inline-block border border-[#1E3A8A]" />
              <span>Candidate Alternative</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[#94A3B8] text-3xs">
            <Info className="w-3.5 h-3.5 text-[#FFFFFF]" />
            <span>Click any candidate point to load into Setup What-If</span>
          </div>
        </div>
      </div>
    </div>
  );
};
