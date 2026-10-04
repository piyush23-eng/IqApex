import React, { useMemo } from 'react';
import { ParetoFrontierResponse, VehicleConfig } from '../../types/vehiclePerformance';
import { GitCommit, Info } from 'lucide-react';

interface ParetoFrontierPlotProps {
  paretoData: ParetoFrontierResponse | null;
  currentConfig: VehicleConfig;
  currentDownforce?: number;
  currentDrag?: number;
  isLoading: boolean;
}

export const ParetoFrontierPlot: React.FC<ParetoFrontierPlotProps> = ({
  paretoData,
  currentDownforce,
  currentDrag,
  isLoading,
}) => {
  const chartDims = { width: 500, height: 260, padX: 45, padY: 25 };

  const { minDrag, minDf, xRange, yRange } = useMemo(() => {
    if (!paretoData || paretoData.points.length === 0) {
      return { minDrag: 1000, minDf: 4000, xRange: 3000, yRange: 14000 };
    }
    const drags = paretoData.points.map((p) => p.drag_n);
    const dfs = paretoData.points.map((p) => p.downforce_n);
    const miD = Math.floor(Math.min(...drags) * 0.95);
    const maD = Math.ceil(Math.max(...drags) * 1.05);
    const miF = Math.floor(Math.min(...dfs) * 0.95);
    const maF = Math.ceil(Math.max(...dfs) * 1.05);
    return {
      minDrag: miD,
      minDf: miF,
      xRange: maD - miD || 1,
      yRange: maF - miF || 1,
    };
  }, [paretoData]);

  const scaleX = (val: number) =>
    chartDims.padX + ((val - minDrag) / xRange) * (chartDims.width - 2 * chartDims.padX);
  const scaleY = (val: number) =>
    chartDims.height - chartDims.padY - ((val - minDf) / yRange) * (chartDims.height - 2 * chartDims.padY);

  if (isLoading || !paretoData) {
    return (
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-4 font-mono text-2xs text-[#FFFFFF] flex items-center justify-center space-x-2 h-72 shadow-md">
        <GitCommit className="w-4 h-4 animate-spin text-[#FFFFFF]" />
        <span className="font-bold uppercase">[ COMPUTING MULTI-OBJECTIVE PARETO FRONTIER... ]</span>
      </div>
    );
  }

  // Sorted path for Pareto frontier line
  const paretoPointsSorted = [...paretoData.pareto_frontier].sort((a, b) => a.drag_n - b.drag_n);
  const paretoPath = paretoPointsSorted
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${scaleX(p.drag_n).toFixed(1)} ${scaleY(p.downforce_n).toFixed(1)}`)
    .join(' ');

  return (
    <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-3 font-mono text-2xs space-y-2 shadow-md">
      {/* Titanium Header */}
      <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-2 bg-[#070E22] p-2 -mx-3 -mt-3 mb-2">
        <div className="flex items-center space-x-2">
          <GitCommit className="w-3.5 h-3.5 text-[#FFFFFF]" />
          <span className="font-bold text-[#FFFFFF] uppercase tracking-wider text-xs">
            [ PARETO EFFICIENCY TRADEOFF (DRAG VS DOWNFORCE) ]
          </span>
        </div>

        <div className="flex items-center space-x-2 text-3xs font-bold">
          <span className="flex items-center space-x-1.5 bg-[#00F0FF] border border-[#1E3A8A] px-1.5 py-0.5 text-[#FFFFFF] shadow-sm">
            <span className="w-2 h-2 rounded-none bg-black inline-block" />
            <span>PARETO OPTIMAL ({paretoData.pareto_efficient_count})</span>
          </span>
          <span className="flex items-center space-x-1.5 bg-[#070E22] border border-[#1E3A8A] px-1.5 py-0.5 text-[#FFFFFF] shadow-sm">
            <span className="w-2 h-2 rounded-none bg-[#070E22] border border-[#1E3A8A] inline-block" />
            <span>DOMINATED ({paretoData.dominated_count})</span>
          </span>
        </div>
      </div>

      <div className="relative bg-[#070E22] border border-[#1E3A8A] p-2 shadow">
        <svg viewBox={`0 0 ${chartDims.width} ${chartDims.height}`} className="w-full h-56 select-none">
          {/* Grid lines */}
          <line
            x1={chartDims.padX}
            y1={chartDims.padY}
            x2={chartDims.padX}
            y2={chartDims.height - chartDims.padY}
            stroke="#1E3A8A"
            strokeWidth="1.5"
          />
          <line
            x1={chartDims.padX}
            y1={chartDims.height - chartDims.padY}
            x2={chartDims.width - chartDims.padX}
            y2={chartDims.height - chartDims.padY}
            stroke="#1E3A8A"
            strokeWidth="1.5"
          />

          {/* Pareto Frontier Line */}
          {paretoPath && (
            <path
              d={paretoPath}
              fill="none"
              stroke="#00F0FF"
              strokeWidth="2.5"
              strokeDasharray="4 2"
            />
          )}

          {/* Dominated Points */}
          {paretoData.points
            .filter((p) => !p.is_pareto_optimal)
            .map((pt) => (
              <circle
                key={pt.config_id}
                cx={scaleX(pt.drag_n)}
                cy={scaleY(pt.downforce_n)}
                r="3.5"
                fill="#0A132E"
                stroke="#1E3A8A"
                strokeWidth="1.2"
                className="hover:r-5 transition-all cursor-pointer hover:stroke-[#0062FF]"
              >
                <title>{`Dominated Config ${pt.config_id}\nDrag: ${pt.drag_n} N\nDownforce: ${pt.downforce_n} N\nFW: ${pt.front_wing_angle}°, RW: ${pt.rear_wing_angle}°\nL/D: ${pt.lift_to_drag}`}</title>
              </circle>
            ))}

          {/* Pareto Efficient Points */}
          {paretoPointsSorted.map((pt) => (
            <circle
              key={pt.config_id}
              cx={scaleX(pt.drag_n)}
              cy={scaleY(pt.downforce_n)}
              r="5"
              fill="#0062FF"
              stroke="#00F0FF"
              strokeWidth="2"
              className="hover:r-6 cursor-pointer transition-all hover:fill-[#00F0FF] hover:stroke-[#FFFFFF]"
            >
              <title>{`Pareto-Efficient Config ${pt.config_id}\nDrag: ${pt.drag_n} N\nDownforce: ${pt.downforce_n} N\nFW: ${pt.front_wing_angle}°, RW: ${pt.rear_wing_angle}°\nL/D: ${pt.lift_to_drag}`}</title>
            </circle>
          ))}

          {/* Current Setup Marker */}
          {currentDownforce !== undefined && currentDrag !== undefined && (
            <g>
              <circle
                cx={scaleX(currentDrag)}
                cy={scaleY(currentDownforce)}
                r="7"
                fill="#FFFFFF"
                stroke="#00F0FF"
                strokeWidth="2.5"
              >
                <title>{`CURRENT SETUP\nDrag: ${currentDrag.toFixed(1)} N\nDownforce: ${currentDownforce.toFixed(1)} N`}</title>
              </circle>
              <text
                x={scaleX(currentDrag) + 10}
                y={scaleY(currentDownforce) - 4}
                fill="#00F0FF"
                fontSize="8.5"
                fontFamily="monospace"
                fontWeight="bold"
              >
                [ CURRENT SETUP ]
              </text>
            </g>
          )}

          {/* Axis Labels */}
          <text
            x={chartDims.width / 2}
            y={chartDims.height - 5}
            fill="#93C5FD"
            fontSize="9"
            textAnchor="middle"
            fontFamily="monospace"
            fontWeight="bold"
          >
            AERODYNAMIC DRAG (N) → (MINIMIZE)
          </text>

          <text
            x={14}
            y={chartDims.height / 2}
            fill="#93C5FD"
            fontSize="9"
            textAnchor="middle"
            fontFamily="monospace"
            fontWeight="bold"
            transform={`rotate(-90 14 ${chartDims.height / 2})`}
          >
            DOWNFORCE (N) ↑ (MAXIMIZE)
          </text>
        </svg>
      </div>

      <div className="bg-[#0A0D15] border border-[#1E3A8A] p-2 text-3xs text-[#FFFFFF] font-bold flex items-start space-x-1.5 shadow-sm">
        <Info className="w-3.5 h-3.5 text-[#FFFFFF] shrink-0 mt-0.5" />
        <span>
          <strong>METHODOLOGY NOTE:</strong> The Pareto frontier illustrates non-dominated configurations where no aerodynamic force can be enhanced without exacerbating parasitic drag. It does not dictate a single optimal setup.
        </span>
      </div>
    </div>
  );
};
