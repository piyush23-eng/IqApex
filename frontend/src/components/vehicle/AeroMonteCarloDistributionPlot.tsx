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
      <div className="bg-workstation-panel border border-workstation-border rounded p-4 font-mono text-2xs animate-pulse text-workstation-textMuted flex items-center justify-center space-x-2 h-44">
        <Binary className="w-4 h-4 animate-spin text-workstation-accentCyan" />
        <span>PROPAGATING PARAMETER UNCERTAINTIES ACROSS 500 ITERATIONS...</span>
      </div>
    );
  }

  if (!monteCarloData) {
    return (
      <div className="bg-workstation-panel border border-workstation-border rounded p-4 font-mono text-2xs text-workstation-textMuted flex items-center justify-between h-44">
        <div className="space-y-1">
          <div className="text-workstation-textBright font-semibold flex items-center space-x-2">
            <Binary className="w-4 h-4 text-workstation-accentCyan" />
            <span>DETERMINISTIC MONTE CARLO UNCERTAINTY PROPAGATION</span>
          </div>
          <p className="text-3xs text-workstation-textMuted max-w-md">
            Simulate 500 stochastic iterations propagating aerodynamic surrogate residual variance, tyre grip tolerances, and vehicle mass deviations into lap time quantiles.
          </p>
        </div>

        <button
          onClick={onRunSimulation}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-workstation-accentCyan text-slate-950 font-bold hover:bg-sky-300 transition-colors text-xs"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>RUN SIMULATION</span>
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
    <div className="bg-workstation-panel border border-workstation-border rounded p-3 font-mono text-2xs space-y-2">
      <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-1.5">
        <div className="flex items-center space-x-2">
          <Binary className="w-3.5 h-3.5 text-workstation-accentCyan" />
          <span className="font-bold text-workstation-textBright uppercase tracking-wider text-xs">
            MONTE CARLO LAP-TIME UNCERTAINTY DISTRIBUTION ({monteCarloData.iterations} LAPS)
          </span>
        </div>

        <div className="flex items-center space-x-3 text-3xs">
          <span>SEED: <strong className="text-workstation-accentCyan">{monteCarloData.simulation_seed}</strong></span>
          <span>MEAN: <strong className="text-workstation-textBright">{mean_lap_time_s.toFixed(3)}s</strong></span>
          <span>σ: <strong className="text-workstation-textMuted">±{std_dev_lap_time_s.toFixed(3)}s</strong></span>
          <button
            onClick={onRunSimulation}
            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-workstation-surface border border-workstation-border text-workstation-textSecondary hover:text-workstation-textBright"
          >
            <Play className="w-2.5 h-2.5" />
            <span>RE-RUN</span>
          </button>
        </div>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${chartDims.width} ${chartDims.height}`} className="w-full h-36 select-none">
          {/* Grid lines */}
          <line
            x1={chartDims.padX}
            y1={chartDims.height - chartDims.padY}
            x2={chartDims.width - chartDims.padX}
            y2={chartDims.height - chartDims.padY}
            stroke="#334155"
            strokeWidth="1"
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
                fill="#0284c7"
                opacity="0.75"
                className="hover:opacity-100 transition-opacity"
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
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />
          <text
            x={scaleX(p05_lap_time_s) - 2}
            y={chartDims.padY + 8}
            fill="#10b981"
            fontSize="8"
            textAnchor="end"
            fontFamily="monospace"
          >
            P05: {p05_lap_time_s.toFixed(2)}s
          </text>

          <line
            x1={scaleX(p50_lap_time_s)}
            y1={chartDims.padY}
            x2={scaleX(p50_lap_time_s)}
            y2={chartDims.height - chartDims.padY}
            stroke="#f59e0b"
            strokeWidth="2"
          />
          <text
            x={scaleX(p50_lap_time_s)}
            y={chartDims.padY - 4}
            fill="#f59e0b"
            fontSize="9"
            fontWeight="bold"
            textAnchor="middle"
            fontFamily="monospace"
          >
            P50: {p50_lap_time_s.toFixed(2)}s
          </text>

          <line
            x1={scaleX(p95_lap_time_s)}
            y1={chartDims.padY}
            x2={scaleX(p95_lap_time_s)}
            y2={chartDims.height - chartDims.padY}
            stroke="#f43f5e"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />
          <text
            x={scaleX(p95_lap_time_s) + 2}
            y={chartDims.padY + 8}
            fill="#f43f5e"
            fontSize="8"
            textAnchor="start"
            fontFamily="monospace"
          >
            P95: {p95_lap_time_s.toFixed(2)}s
          </text>
        </svg>
      </div>

      <div className="flex items-center justify-between text-3xs text-workstation-textMuted pt-1 border-t border-workstation-borderSubtle">
        <span>PERCENTILES: P05 (FASTEST TIRE/WIND) | P50 (MEDIAN LAP) | P95 (WORST CASE TOLERANCE)</span>
        <span>REPRODUCIBILITY GUARANTEE: DETERMINISTIC NUMERICAL SEED</span>
      </div>
    </div>
  );
};
