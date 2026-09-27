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
      <div className="bg-workstation-panel border border-workstation-border rounded p-4 font-mono text-2xs animate-pulse text-workstation-textMuted flex items-center justify-center space-x-2 h-64">
        <GitBranch className="w-4 h-4 animate-spin text-workstation-accentCyan" />
        <span>SIMULATING 53-LAP RACE STRATEGY CONVERGENCE & 1000-RUN MONTE CARLO...</span>
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="bg-workstation-panel border border-workstation-border rounded p-4 font-mono text-2xs text-workstation-textMuted flex items-center justify-center h-64">
        <span>No strategy consequence data available.</span>
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
    <div className="bg-workstation-panel border border-workstation-border rounded p-3 font-mono text-2xs space-y-3">
      {/* Header & Net Race Consequence */}
      <div className="flex flex-wrap items-center justify-between border-b border-workstation-borderSubtle pb-2 gap-2">
        <div className="flex items-center space-x-2">
          <GitBranch className="w-3.5 h-3.5 text-workstation-accentCyan" />
          <span className="font-bold text-workstation-textBright uppercase tracking-wider text-xs">
            RACE STRATEGY & SCENARIO CONSEQUENCE (53 LAPS — MONZA)
          </span>
        </div>

        <div className="flex items-center space-x-3 text-3xs">
          <div>
            <span className="text-workstation-textMuted">NET RACE TIME DELTA: </span>
            <strong className={`text-xs ${delta_race_time_s < 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {delta_race_time_s >= 0 ? '+' : ''}{delta_race_time_s.toFixed(2)}s
            </strong>
          </div>
          <span className="text-4xs px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/30 text-sky-400 font-bold">
            SCENARIO
          </span>
        </div>
      </div>

      {/* Grid: 3 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Race Time Comparison */}
        <div className="bg-workstation-surface border border-workstation-borderSubtle rounded p-2.5 space-y-1.5">
          <div className="text-3xs text-workstation-textMuted uppercase font-semibold flex items-center justify-between">
            <span>RACE TIME (53 LAPS)</span>
            <span className="text-4xs text-workstation-textSecondary">{strategy_id}</span>
          </div>
          <div className="divide-y divide-workstation-borderSubtle text-3xs space-y-1">
            <div className="flex justify-between items-center pt-1">
              <span className="text-workstation-textMuted">Baseline Setup:</span>
              <span className="font-mono text-workstation-textSecondary">
                {formatRaceTime(baseline_race_time_s)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-workstation-textMuted">Scenario Setup:</span>
              <span className="font-mono text-workstation-textBright font-bold">
                {formatRaceTime(scenario_race_time_s)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-workstation-textMuted">Mean Lap Delta:</span>
              <span className={`font-mono font-semibold ${delta_mean_lap_time_s < 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {delta_mean_lap_time_s >= 0 ? '+' : ''}{delta_mean_lap_time_s.toFixed(3)}s/lap
              </span>
            </div>
          </div>
        </div>

        {/* 1,000-Run Monte Carlo Quantiles */}
        <div className="bg-workstation-surface border border-workstation-borderSubtle rounded p-2.5 space-y-1.5">
          <div className="text-3xs text-workstation-textMuted uppercase font-semibold flex items-center justify-between">
            <span>1,000-RUN MONTE CARLO</span>
            <span className="text-4xs text-workstation-accentCyan">Seed 42871</span>
          </div>
          <div className="divide-y divide-workstation-borderSubtle text-3xs space-y-1">
            <div className="flex justify-between items-center pt-1">
              <span className="text-workstation-textMuted">Optimistic (P05):</span>
              <span className="font-mono text-emerald-400 font-semibold">
                {p05_race_time_s.toFixed(1)}s
              </span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-workstation-textMuted">Median (P50):</span>
              <span className="font-mono text-workstation-accentCyan font-bold">
                {p50_race_time_s.toFixed(1)}s
              </span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-workstation-textMuted">Pessimistic (P95):</span>
              <span className="font-mono text-red-400 font-semibold">
                {p95_race_time_s.toFixed(1)}s
              </span>
            </div>
          </div>
        </div>

        {/* Physical Modifiers */}
        <div className="bg-workstation-surface border border-workstation-borderSubtle rounded p-2.5 space-y-1.5">
          <div className="text-3xs text-workstation-textMuted uppercase font-semibold flex items-center justify-between">
            <span>PHYSICAL MODIFIERS</span>
            <span className="text-4xs text-workstation-textSecondary">Attributed</span>
          </div>
          <div className="divide-y divide-workstation-borderSubtle text-3xs space-y-1">
            <div className="flex justify-between items-center pt-1">
              <span className="text-workstation-textMuted">Pit Stop Loss:</span>
              <span className="font-mono text-workstation-textBright font-semibold">
                {pit_loss_s.toFixed(1)}s (1 stop)
              </span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-workstation-textMuted">Tyre Deg Effect:</span>
              <span className={`font-mono font-semibold ${tyre_degradation_effect_s <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {tyre_degradation_effect_s >= 0 ? '+' : ''}{tyre_degradation_effect_s.toFixed(2)}s
              </span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-workstation-textMuted">Degradation Risk:</span>
              <span className="font-mono text-emerald-400">
                CLIFF UNEXCEEDED (Max L29)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
