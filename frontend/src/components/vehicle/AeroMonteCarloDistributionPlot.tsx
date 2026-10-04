import React from 'react';
import { AeroMonteCarloResponse } from '../../types/vehiclePerformance';
import { Binary, Play } from 'lucide-react';

interface AeroMonteCarloDistributionPlotProps {
  monteCarloData: AeroMonteCarloResponse | null;
  isLoading: boolean;
  onRunSimulation: () => void;
}

export const AeroMonteCarloDistributionPlot: React.FC<AeroMonteCarloDistributionPlotProps> = ({
  monteCarloData,
  isLoading,
  onRunSimulation,
}) => {
  const chartDims = { width: 500, height: 160, padX: 35, padY: 20 };

  if (isLoading) {
    return (
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-4 font-mono text-2xs text-[#FFFFFF] flex items-center justify-center space-x-2 h-44 shadow-md">
        <Binary className="w-4 h-4 animate-spin text-[#FFFFFF]" />
        <span className="font-bold uppercase">[ PROPAGATING PARAMETER UNCERTAINTIES ACROSS 500 ITERATIONS... ]</span>
      </div>
    );
  }

  if (!monteCarloData) {
    return (
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-4 font-mono text-2xs text-[#FFFFFF] flex items-center justify-between h-44 shadow-md">
        <div className="space-y-1">
          <div className="text-[#FFFFFF] font-bold flex items-center space-x-2 uppercase text-xs">
            <Binary className="w-4 h-4 text-[#FFFFFF]" />
            <span>[ DETERMINISTIC MONTE CARLO UNCERTAINTY PROPAGATION ]</span>
          </div>
          <p className="text-3xs text-[#94A3B8] max-w-md">
            Simulate 500 stochastic iterations propagating aerodynamic surrogate residual variance, tyre grip tolerances, and vehicle mass deviations into lap time quantiles.
          </p>
        </div>

        <button
          onClick={onRunSimulation}
          className="btn-retro-primary text-xs flex items-center space-x-1.5"
        >
          <Play className="w-3.5 h-3.5 fill-current text-[#FFFFFF]" />
          <span>[ RUN SIMULATION ]</span>
        </button>
      </div>
    );
  }

  const { bins, p05_lap_time_s, p50_lap_time_s, p95_lap_time_s, mean_lap_time_s, std_dev_lap_time_s } = monteCarloData;
  const maxFreq = Math.max(...bins.map((b) => b.frequency), 0.01);
  const minX = bins[0]?.bin_start ?? 75;
  const maxX = bins[bins.length - 1]?.bin_end ?? 85;
  const xSpan = maxX - minX || 1;

  const scaleX = (val: number) =>
    chartDims.padX + ((val - minX) / xSpan) * (chartDims.width - 2 * chartDims.padX);
  const scaleY = (freq: number) =>
    chartDims.height - chartDims.padY - (freq / maxFreq) * (chartDims.height - 2 * chartDims.padY);

  return (
    <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-3 font-mono text-2xs space-y-2 shadow-md">
      {/* Titanium Header */}
      <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-2 bg-[#070E22] p-2 -mx-3 -mt-3 mb-2">
        <div className="flex items-center space-x-2">
          <Binary className="w-3.5 h-3.5 text-[#FFFFFF]" />
          <span className="font-bold text-[#FFFFFF] uppercase tracking-wider text-xs">
            [ MONTE CARLO LAP-TIME UNCERTAINTY DISTRIBUTION ({monteCarloData.iterations} LAPS) ]
          </span>
        </div>

        <div className="flex items-center space-x-2 text-3xs font-bold">
          <span className="bg-[#070E22] border border-[#1E3A8A] px-1.5 py-0.5 text-[#FFFFFF]">
            SEED: {monteCarloData.simulation_seed}
          </span>
          <span className="bg-[#070E22] border border-[#1E3A8A] px-1.5 py-0.5 text-[#FFFFFF]">
            MEAN: {mean_lap_time_s.toFixed(3)}s
          </span>
          <span className="bg-[#070E22] border border-[#1E3A8A] px-1.5 py-0.5 text-[#FFFFFF]">
            σ: ±{std_dev_lap_time_s.toFixed(3)}s
          </span>
          <button
            onClick={onRunSimulation}
            className="btn-retro text-3xs flex items-center space-x-1"
          >
            <Play className="w-2.5 h-2.5 fill-current" />
            <span>[ RE-RUN ]</span>
          </button>
        </div>
      </div>

      <div className="relative bg-[#070E22] border border-[#1E3A8A] p-2 shadow">
        <svg viewBox={`0 0 ${chartDims.width} ${chartDims.height}`} className="w-full h-36 select-none">
          {/* Grid lines */}
          <line
            x1={chartDims.padX}
            y1={chartDims.height - chartDims.padY}
            x2={chartDims.width - chartDims.padX}
            y2={chartDims.height - chartDims.padY}
            stroke="#1E3A8A"
            strokeWidth="1.5"
          />

          {/* Histogram Bars */}
          {bins.map((bin, idx) => {
            const x1 = scaleX(bin.bin_start);
            const x2 = scaleX(bin.bin_end);
            const barW = Math.max(x2 - x1 - 1, 1);
            const yTop = scaleY(bin.frequency);
            const barH = chartDims.height - chartDims.padY - yTop;

            return (
              <rect
                key={idx}
                x={x1}
                y={yTop}
                width={barW}
                height={barH}
                fill="#0A132E"
                stroke="#1E3A8A"
                strokeWidth="1"
                className="hover:fill-[#0062FF] hover:stroke-[#00F0FF] transition-colors"
              >
                <title>{`Range: [${bin.bin_start} - ${bin.bin_end}] s\nCount: ${bin.count}\nFrequency: ${(bin.frequency * 100).toFixed(1)}%`}</title>
              </rect>
            );
          })}

          {/* P05, P50, P95 Indicators */}
          <line
            x1={scaleX(p05_lap_time_s)}
            y1={chartDims.padY}
            x2={scaleX(p05_lap_time_s)}
            y2={chartDims.height - chartDims.padY}
            stroke="#00E676"
            strokeWidth="2"
            strokeDasharray="2 2"
          />
          <text
            x={scaleX(p05_lap_time_s) - 2}
            y={chartDims.padY + 8}
            fill="#00E676"
            fontSize="8"
            textAnchor="end"
            fontFamily="monospace"
            fontWeight="bold"
          >
            P05: {p05_lap_time_s.toFixed(2)}s
          </text>

          {/* P50 Median (Solid Pure White) */}
          <line
            x1={scaleX(p50_lap_time_s)}
            y1={chartDims.padY}
            x2={scaleX(p50_lap_time_s)}
            y2={chartDims.height - chartDims.padY}
            stroke="#FFFFFF"
            strokeWidth="2.5"
          />
          <text
            x={scaleX(p50_lap_time_s)}
            y={chartDims.padY - 4}
            fill="#FFFFFF"
            fontSize="8.5"
            fontWeight="bold"
            textAnchor="middle"
            fontFamily="monospace"
          >
            P50 (MEDIAN): {p50_lap_time_s.toFixed(2)}s
          </text>

          <line
            x1={scaleX(p95_lap_time_s)}
            y1={chartDims.padY}
            x2={scaleX(p95_lap_time_s)}
            y2={chartDims.height - chartDims.padY}
            stroke="#FF3366"
            strokeWidth="2"
            strokeDasharray="2 2"
          />
          <text
            x={scaleX(p95_lap_time_s) + 2}
            y={chartDims.padY + 8}
            fill="#FF3366"
            fontSize="8"
            textAnchor="start"
            fontFamily="monospace"
            fontWeight="bold"
          >
            P95: {p95_lap_time_s.toFixed(2)}s
          </text>
        </svg>
      </div>

      <div className="flex items-center justify-between text-3xs text-[#CBD5E1] font-bold pt-1.5 border-t border-[#1E3A8A]">
        <span>PERCENTILES: P05 (FASTEST TIRE/WIND) | P50 (MEDIAN LAP) | P95 (WORST CASE TOLERANCE)</span>
        <span>REPRODUCIBILITY GUARANTEE: DETERMINISTIC NUMERICAL SEED</span>
      </div>
    </div>
  );
};
