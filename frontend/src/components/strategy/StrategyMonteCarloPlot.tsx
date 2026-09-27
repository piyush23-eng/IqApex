import React from 'react';
import { StrategyMonteCarloResponse } from '../../types/strategy';
import { Binary, Play } from 'lucide-react';

interface StrategyMonteCarloPlotProps {
  monteCarloData: StrategyMonteCarloResponse | null;
  isLoading: boolean;
  onRunMonteCarlo: () => void;
}

export const StrategyMonteCarloPlot: React.FC<StrategyMonteCarloPlotProps> = ({
  monteCarloData,
  isLoading,
  onRunMonteCarlo,
}) => {
  const chartDims = { width: 500, height: 180, padX: 45, padY: 25 };

  if (isLoading) {
    return (
      <div className="bg-workstation-panel border border-workstation-border rounded p-4 font-mono text-2xs animate-pulse text-workstation-textMuted flex items-center justify-center space-x-2 h-52">
        <Binary className="w-4 h-4 animate-spin text-workstation-accentCyan" />
        <span>SIMULATING 1,000 STOCHASTIC SCENARIOS (TYRE VARIANCE, PIT UNCERTAINTY, TRAFFIC)...</span>
      </div>
    );
  }

  if (!monteCarloData) {
    return (
      <div className="bg-workstation-panel border border-workstation-border rounded p-4 font-mono text-2xs text-workstation-textMuted flex items-center justify-between h-52">
        <div className="space-y-1">
          <div className="text-workstation-textBright font-semibold flex items-center space-x-2">
            <Binary className="w-4 h-4 text-workstation-accentCyan" />
            <span>1,000-RUN MONTE CARLO RACE OUTCOME UNCERTAINTY</span>
          </div>
          <p className="text-3xs text-workstation-textMuted max-w-md">
            Execute 1,000 deterministic iterations propagating tyre wear rate variation (±12%), pit stop execution noise (±0.8s), and stochastic traffic interference into race completion distribution and quantiles.
          </p>
        </div>

        <button
          onClick={onRunMonteCarlo}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-workstation-accentCyan text-slate-950 font-bold hover:bg-sky-300 transition-colors text-xs"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>RUN 1,000x MC</span>
        </button>
      </div>
    );
  }

  const {
    bins,
    mean_race_time_s,
    median_race_time_s,
    std_dev_race_time_s,
    p05_race_time_s,
    p50_race_time_s,
    p95_race_time_s,
    iterations,
    simulation_seed,
    probability_beating_ref,
  } = monteCarloData;

  const maxCount = Math.max(...bins.map((b) => b.count), 1);
  const minX = bins[0]?.bin_start ?? mean_race_time_s - 50;
  const maxX = bins[bins.length - 1]?.bin_end ?? mean_race_time_s + 50;
  const xSpan = maxX - minX || 1;

  const scaleX = (val: number) =>
    chartDims.padX + ((val - minX) / xSpan) * (chartDims.width - 2 * chartDims.padX);
  const scaleY = (count: number) =>
    chartDims.height - chartDims.padY - (count / maxCount) * (chartDims.height - 2 * chartDims.padY);

  const formatRaceTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = (s % 60).toFixed(1);
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="bg-workstation-panel border border-workstation-border rounded p-3 font-mono text-2xs space-y-2">
      <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-1.5">
        <div className="flex items-center space-x-2">
          <Binary className="w-3.5 h-3.5 text-workstation-accentCyan" />
          <span className="font-bold text-workstation-textBright uppercase tracking-wider text-xs">
            RACE OUTCOME UNCERTAINTY DISTRIBUTION ({iterations} RUNS)
          </span>
        </div>

        <div className="flex items-center space-x-3 text-3xs">
          <span>SEED: <strong className="text-workstation-accentCyan">{simulation_seed}</strong></span>
          <span>MEAN: <strong className="text-workstation-textBright">{formatRaceTime(mean_race_time_s)}</strong></span>
          <span>σ: <strong className="text-workstation-textMuted">±{std_dev_race_time_s.toFixed(2)}s</strong></span>
          {probability_beating_ref !== null && (
            <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded font-semibold">
              P(Beat Ref): {(probability_beating_ref * 100).toFixed(1)}%
            </span>
          )}
          <button
            onClick={onRunMonteCarlo}
            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-workstation-surface border border-workstation-border text-workstation-textSecondary hover:text-workstation-textBright"
          >
            <Play className="w-2.5 h-2.5" />
            <span>RE-RUN</span>
          </button>
        </div>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${chartDims.width} ${chartDims.height}`} className="w-full h-40 select-none">
          {/* Baseline horizontal grid line */}
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
            const w = Math.max(x2 - x1 - 1, 1);
            const y = scaleY(bin.count);
            const h = chartDims.height - chartDims.padY - y;
            return (
              <rect
                key={idx}
                x={x1}
                y={y}
                width={w}
                height={h}
                fill="#0EA5E9"
                opacity="0.75"
                className="hover:opacity-100 transition-opacity"
              >
                <title>{`[${bin.bin_start.toFixed(1)}s - ${bin.bin_end.toFixed(1)}s]: ${bin.count} runs (${(bin.frequency * 100).toFixed(1)}%)`}</title>
              </rect>
            );
          })}

          {/* Quantile Lines */}
          {/* P05 */}
          <line
            x1={scaleX(p05_race_time_s)}
            y1={chartDims.padY}
            x2={scaleX(p05_race_time_s)}
            y2={chartDims.height - chartDims.padY}
            stroke="#10B981"
            strokeWidth="1.5"
            strokeDasharray="2,2"
          />
          <text
            x={scaleX(p05_race_time_s) - 3}
            y={chartDims.padY + 10}
            textAnchor="end"
            fill="#10B981"
            fontSize="6"
            className="font-mono font-bold"
          >
            P05: {formatRaceTime(p05_race_time_s)}
          </text>

          {/* P50 Median */}
          <line
            x1={scaleX(p50_race_time_s)}
            y1={chartDims.padY}
            x2={scaleX(p50_race_time_s)}
            y2={chartDims.height - chartDims.padY}
            stroke="#38BDF8"
            strokeWidth="2"
          />
          <text
            x={scaleX(p50_race_time_s)}
            y={chartDims.padY - 4}
            textAnchor="middle"
            fill="#38BDF8"
            fontSize="7"
            className="font-mono font-bold"
          >
            P50 (MEDIAN): {formatRaceTime(p50_race_time_s)}
          </text>

          {/* P95 */}
          <line
            x1={scaleX(p95_race_time_s)}
            y1={chartDims.padY}
            x2={scaleX(p95_race_time_s)}
            y2={chartDims.height - chartDims.padY}
            stroke="#EF4444"
            strokeWidth="1.5"
            strokeDasharray="2,2"
          />
          <text
            x={scaleX(p95_race_time_s) + 3}
            y={chartDims.padY + 10}
            textAnchor="start"
            fill="#EF4444"
            fontSize="6"
            className="font-mono font-bold"
          >
            P95: {formatRaceTime(p95_race_time_s)}
          </text>
        </svg>
      </div>

      {/* Uncertainty Quantile Breakdown Table */}
      <div className="grid grid-cols-5 gap-2 border-t border-workstation-borderSubtle pt-1.5 text-center text-3xs">
        <div className="p-1 rounded bg-workstation-surface">
          <span className="text-workstation-textMuted block text-4xs">OPTIMISTIC (P05)</span>
          <span className="text-emerald-400 font-bold">{p05_race_time_s.toFixed(2)}s</span>
        </div>
        <div className="p-1 rounded bg-workstation-surface">
          <span className="text-workstation-textMuted block text-4xs">LOWER QUARTILE (P25)</span>
          <span className="text-workstation-textBright font-semibold">{monteCarloData.p25_race_time_s.toFixed(2)}s</span>
        </div>
        <div className="p-1 rounded bg-workstation-surface border border-workstation-accentCyan/30">
          <span className="text-workstation-accentCyan block text-4xs font-bold">MEDIAN (P50)</span>
          <span className="text-workstation-accentCyan font-bold">{median_race_time_s.toFixed(2)}s</span>
        </div>
        <div className="p-1 rounded bg-workstation-surface">
          <span className="text-workstation-textMuted block text-4xs">UPPER QUARTILE (P75)</span>
          <span className="text-workstation-textBright font-semibold">{monteCarloData.p75_race_time_s.toFixed(2)}s</span>
        </div>
        <div className="p-1 rounded bg-workstation-surface">
          <span className="text-workstation-textMuted block text-4xs">PESSIMISTIC (P95)</span>
          <span className="text-red-400 font-bold">{p95_race_time_s.toFixed(2)}s</span>
        </div>
      </div>
    </div>
  );
};
