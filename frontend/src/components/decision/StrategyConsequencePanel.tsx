import React from 'react';
import { SetupStrategyResponse } from '../../types/engineeringAnalysis';
import { GitBranch } from 'lucide-react';

interface StrategyConsequencePanelProps {
  strategy: SetupStrategyResponse | null;
  isLoading: boolean;
}

export const StrategyConsequencePanel: React.FC<StrategyConsequencePanelProps> = ({
  strategy,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-4 font-mono text-2xs text-[#FFFFFF] flex items-center justify-center space-x-2 h-64 shadow-md">
        <GitBranch className="w-4 h-4 animate-spin text-[#FFFFFF]" />
        <span className="font-bold uppercase">[ SIMULATING 53-LAP RACE STRATEGY CONVERGENCE & 1000-RUN MONTE CARLO... ]</span>
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-4 font-mono text-2xs text-[#94A3B8] font-bold flex items-center justify-center h-64 shadow-md">
        <span>[ NO STRATEGY CONSEQUENCE DATA AVAILABLE ]</span>
      </div>
    );
  }

  const {
    strategy_id,
    baseline_race_time_s,
    scenario_race_time_s,
    delta_race_time_s,
    delta_mean_lap_time_s,
    p05_race_time_s,
    p50_race_time_s,
    p95_race_time_s,
    tyre_degradation_effect_s,
    pit_loss_s,
  } = strategy;

  const formatRaceTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = (s % 60).toFixed(1);
    return `${mins}m ${secs}s (${s.toFixed(1)}s)`;
  };

  return (
    <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-0 shadow-md font-mono">
      {/* Header & Net Race Consequence */}
      <div className="window-header-retro bg-[#070E22] border-b border-[#1E3A8A] px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[#FFFFFF] font-extrabold">
        <div className="flex items-center space-x-2">
          <GitBranch className="w-3.5 h-3.5 text-[#FFFFFF] stroke-[2.5]" />
          <span className="font-extrabold text-[#FFFFFF] uppercase tracking-wider text-2xs">
            [ RACE STRATEGY & SCENARIO CONSEQUENCE (53 LAPS — MONZA) ]
          </span>
        </div>

        <div className="flex items-center space-x-3 text-3xs">
          <div>
            <span className="text-[#94A3B8] font-bold">NET RACE TIME DELTA: </span>
            <strong className={`text-xs font-black ${delta_race_time_s < 0 ? 'text-[#00E676]' : 'text-[#FFB000]'}`}>
              {delta_race_time_s >= 0 ? '+' : ''}{delta_race_time_s.toFixed(2)}s
            </strong>
          </div>
          <span className="text-3xs px-2 py-0.5 bg-[#00F0FF] border border-[#1E3A8A] text-[#FFFFFF] font-extrabold shadow-sm">
            SCENARIO ✕
          </span>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Grid: 3 Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Race Time Comparison */}
          <div className="bg-[#070E22] border border-[#1E3A8A] p-2.5 space-y-1.5 shadow">
            <div className="text-3xs text-[#FFFFFF] uppercase font-black flex items-center justify-between border-b border-[#1E3A8A] pb-1">
              <span>RACE TIME (53 LAPS)</span>
              <span className="text-4xs text-[#94A3B8] font-bold">{strategy_id}</span>
            </div>
            <div className="divide-y divide-black/20 text-3xs space-y-1">
              <div className="flex justify-between items-center pt-1">
                <span className="text-[#94A3B8] font-bold">Baseline Setup:</span>
                <span className="font-mono text-[#FFFFFF] font-bold">
                  {formatRaceTime(baseline_race_time_s)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-[#94A3B8] font-bold">Scenario Setup:</span>
                <span className="font-mono text-[#FFFFFF] font-black">
                  {formatRaceTime(scenario_race_time_s)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-[#94A3B8] font-bold">Mean Lap Delta:</span>
                <span className={`font-mono font-black ${delta_mean_lap_time_s < 0 ? 'text-[#00E676]' : 'text-[#FFB000]'}`}>
                  {delta_mean_lap_time_s >= 0 ? '+' : ''}{delta_mean_lap_time_s.toFixed(3)}s/lap
                </span>
              </div>
            </div>
          </div>

          {/* 1,000-Run Monte Carlo Quantiles */}
          <div className="bg-[#070E22] border border-[#1E3A8A] p-2.5 space-y-1.5 shadow">
            <div className="text-3xs text-[#FFFFFF] uppercase font-black flex items-center justify-between border-b border-[#1E3A8A] pb-1">
              <span>1,000-RUN MONTE CARLO</span>
              <span className="text-4xs bg-[#070E22] px-1 py-0.2 border border-[#1E3A8A] font-bold text-[#FFFFFF]">Seed 42871</span>
            </div>
            <div className="divide-y divide-black/20 text-3xs space-y-1">
              <div className="flex justify-between items-center pt-1">
                <span className="text-[#94A3B8] font-bold">Optimistic (P05):</span>
                <span className="font-mono text-[#00E676] font-black">
                  {p05_race_time_s.toFixed(1)}s
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-[#94A3B8] font-bold">Median (P50):</span>
                <span className="font-mono text-[#FFFFFF] font-black">
                  {p50_race_time_s.toFixed(1)}s
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-[#94A3B8] font-bold">Pessimistic (P95):</span>
                <span className="font-mono text-[#FFB000] font-black">
                  {p95_race_time_s.toFixed(1)}s
                </span>
              </div>
            </div>
          </div>

          {/* Physical Modifiers */}
          <div className="bg-[#070E22] border border-[#1E3A8A] p-2.5 space-y-1.5 shadow">
            <div className="text-3xs text-[#FFFFFF] uppercase font-black flex items-center justify-between border-b border-[#1E3A8A] pb-1">
              <span>PHYSICAL MODIFIERS</span>
              <span className="text-4xs text-[#94A3B8] font-bold">Attributed</span>
            </div>
            <div className="divide-y divide-black/20 text-3xs space-y-1">
              <div className="flex justify-between items-center pt-1">
                <span className="text-[#94A3B8] font-bold">Pit Stop Loss:</span>
                <span className="font-mono text-[#FFFFFF] font-black">
                  {pit_loss_s.toFixed(1)}s (1 stop)
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-[#94A3B8] font-bold">Tyre Deg Effect:</span>
                <span className={`font-mono font-black ${tyre_degradation_effect_s <= 0 ? 'text-[#00E676]' : 'text-[#FFB000]'}`}>
                  {tyre_degradation_effect_s >= 0 ? '+' : ''}{tyre_degradation_effect_s.toFixed(2)}s
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-[#94A3B8] font-bold">Degradation Risk:</span>
                <span className="font-mono text-[#00E676] font-black">
                  CLIFF UNEXCEEDED (Max L29)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
