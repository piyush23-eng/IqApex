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
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-4 font-mono text-2xs text-[#FFFFFF] flex items-center justify-center space-x-2 h-52 shadow-md">
        <Binary className="w-4 h-4 animate-spin text-[#FFFFFF]" />
        <span className="font-bold uppercase">[ SIMULATING 1,000 STOCHASTIC SCENARIOS (TYRE VARIANCE, PIT UNCERTAINTY)... ]</span>
      </div>
    );
  }

  if (!monteCarloData) {
    return (
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-4 font-mono text-2xs text-[#FFFFFF] flex items-center justify-between h-52 shadow-md">
        <div className="space-y-1">
          <div className="text-[#FFFFFF] font-bold flex items-center space-x-2 text-xs uppercase">
            <Binary className="w-4 h-4 text-[#FFFFFF]" />
            <span>[ 1,000-RUN MONTE CARLO RACE OUTCOME UNCERTAINTY ]</span>
          </div>
          <p className="text-3xs text-[#94A3B8] max-w-md">
            Execute 1,000 deterministic iterations propagating tyre wear rate variation (±12%), pit stop execution noise (±0.8s), and stochastic traffic interference into race completion distribution and quantiles.
          </p>
        </div>

        <button
          onClick={onRunMonteCarlo}
          className="btn-retro-primary text-xs flex items-center space-x-1.5"
        >
          <Play className="w-3.5 h-3.5 fill-current text-[#FFFFFF]" />
          <span>[ RUN 1,000x MC ]</span>
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
    <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-3 font-mono text-2xs space-y-2 shadow-md">
      {/* Titanium Header */}
      <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-2 bg-[#070E22] p-2 -mx-3 -mt-3 mb-2">
        <div className="flex items-center space-x-2">
          <Binary className="w-3.5 h-3.5 text-[#FFFFFF]" />
          <span className="font-bold text-[#FFFFFF] uppercase tracking-wider text-xs">
            [ RACE OUTCOME UNCERTAINTY DISTRIBUTION ({iterations} RUNS) ]
          </span>
        </div>

        <div className="flex items-center space-x-2 text-3xs">
          <span className="bg-[#070E22] border border-[#1E3A8A] px-1.5 py-0.5 text-[#FFFFFF] font-bold">
            SEED: {simulation_seed}
          </span>
          <span className="bg-[#070E22] border border-[#1E3A8A] px-1.5 py-0.5 text-[#FFFFFF] font-bold">
            MEAN: {formatRaceTime(mean_race_time_s)}
          </span>
          <span className="bg-[#070E22] border border-[#1E3A8A] px-1.5 py-0.5 text-[#FFFFFF] font-bold">
            σ: ±{std_dev_race_time_s.toFixed(2)}s
          </span>
          {probability_beating_ref !== null && (
            <span className="bg-[#00F0FF] border border-[#1E3A8A] px-1.5 py-0.5 text-[#FFFFFF] font-bold">
              P(Beat Ref): {(probability_beating_ref * 100).toFixed(1)}%
            </span>
          )}
          <button
            onClick={onRunMonteCarlo}
            className="btn-retro text-3xs flex items-center space-x-1"
          >
            <Play className="w-2.5 h-2.5 fill-current" />
            <span>[ RE-RUN ]</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative bg-[#070E22] border border-[#1E3A8A] p-2 shadow">
        <svg viewBox={`0 0 ${chartDims.width} ${chartDims.height}`} className="w-full h-40 select-none">
          {/* Baseline horizontal grid line */}
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
                fill="#0A132E"
                stroke="#1E3A8A"
                strokeWidth="1"
                className="hover:fill-[#0062FF] hover:stroke-[#00F0FF] transition-colors"
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
            stroke="#00E676"
            strokeWidth="2"
            strokeDasharray="2,2"
          />
          <text
            x={scaleX(p05_race_time_s) - 3}
            y={chartDims.padY + 10}
            textAnchor="end"
            fill="#00E676"
            fontSize="6.5"
            className="font-mono font-bold"
          >
            P05: {formatRaceTime(p05_race_time_s)}
          </text>

          {/* P50 Median (Solid Pure White) */}
          <line
            x1={scaleX(p50_race_time_s)}
            y1={chartDims.padY}
            x2={scaleX(p50_race_time_s)}
            y2={chartDims.height - chartDims.padY}
            stroke="#FFFFFF"
            strokeWidth="2.5"
          />
          <text
            x={scaleX(p50_race_time_s)}
            y={chartDims.padY - 4}
            textAnchor="middle"
            fill="#FFFFFF"
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
            stroke="#FF3366"
            strokeWidth="2"
            strokeDasharray="2,2"
          />
          <text
            x={scaleX(p95_race_time_s) + 3}
            y={chartDims.padY + 10}
            textAnchor="start"
            fill="#FF3366"
            fontSize="6.5"
            className="font-mono font-bold"
          >
            P95: {formatRaceTime(p95_race_time_s)}
          </text>
        </svg>
      </div>

      {/* Uncertainty Quantile Breakdown Table */}
      <div className="grid grid-cols-5 gap-2 border-t border-[#1E3A8A] pt-2 text-center text-3xs">
        <div className="p-1.5 bg-[#070E22] border border-[#1E3A8A] shadow-sm">
          <span className="text-[#94A3B8] block text-4xs font-bold uppercase">OPTIMISTIC (P05)</span>
          <span className="text-[#00E676] font-bold">{p05_race_time_s.toFixed(2)}s</span>
        </div>
        <div className="p-1.5 bg-[#070E22] border border-[#1E3A8A] shadow-sm">
          <span className="text-[#94A3B8] block text-4xs font-bold uppercase">LOWER (P25)</span>
          <span className="text-[#FFFFFF] font-bold">{monteCarloData.p25_race_time_s.toFixed(2)}s</span>
        </div>
        <div className="p-1.5 bg-[#0062FF] border border-[#00F0FF] shadow-matrix-glow">
          <span className="text-[#FFFFFF] block text-4xs font-bold uppercase">[ MEDIAN (P50) ]</span>
          <span className="text-[#FFFFFF] font-black">{median_race_time_s.toFixed(2)}s</span>
        </div>
        <div className="p-1.5 bg-[#070E22] border border-[#1E3A8A] shadow-sm">
          <span className="text-[#94A3B8] block text-4xs font-bold uppercase">UPPER (P75)</span>
          <span className="text-[#FFFFFF] font-bold">{monteCarloData.p75_race_time_s.toFixed(2)}s</span>
        </div>
        <div className="p-1.5 bg-[#070E22] border border-[#1E3A8A] shadow-sm">
          <span className="text-[#94A3B8] block text-4xs font-bold uppercase">PESSIMISTIC (P95)</span>
          <span className="text-[#FFB000] font-bold">{p95_race_time_s.toFixed(2)}s</span>
        </div>
      </div>
    </div>
  );
};
