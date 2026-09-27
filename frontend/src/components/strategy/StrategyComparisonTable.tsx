import React from 'react';
import { FeasibleStrategy } from '../../types/strategy';
import { Layers, CheckCircle2, AlertCircle } from 'lucide-react';

interface StrategyComparisonTableProps {
  strategies: FeasibleStrategy[];
  selectedStrategyId: string;
  baselineRaceTimes: Record<string, number>;
  onSelectStrategy: (strategyId: string) => void;
  isLoading: boolean;
}

const COMPOUND_BADGE: Record<string, { bg: string; text: string }> = {
  SOFT: { bg: 'bg-red-500/20 border-red-500/40', text: 'text-red-400' },
  MEDIUM: { bg: 'bg-amber-500/20 border-amber-500/40', text: 'text-amber-300' },
  HARD: { bg: 'bg-slate-200/20 border-slate-300/40', text: 'text-slate-200' },
};

export const StrategyComparisonTable: React.FC<StrategyComparisonTableProps> = ({
  strategies,
  selectedStrategyId,
  baselineRaceTimes,
  onSelectStrategy,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="bg-workstation-panel border border-workstation-border rounded p-4 font-mono text-2xs animate-pulse text-workstation-textMuted flex items-center justify-center space-x-2 h-44">
        <Layers className="w-4 h-4 animate-spin text-workstation-accentCyan" />
        <span>ENUMERATING REGULATION-CONSTRAINED STRATEGIES (2024 FIA ART. 30.5)...</span>
      </div>
    );
  }

  // Find fastest strategy time for delta calculation
  const times = Object.values(baselineRaceTimes).filter((t) => t > 0);
  const minTime = times.length > 0 ? Math.min(...times) : null;

  return (
    <div className="bg-workstation-panel border border-workstation-border rounded p-3 font-mono text-2xs space-y-2">
      <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-1.5">
        <div className="flex items-center space-x-2">
          <Layers className="w-3.5 h-3.5 text-workstation-accentCyan" />
          <span className="font-bold text-workstation-textBright uppercase tracking-wider text-xs">
            REGULATION-CONSTRAINED STRATEGY MATRIX (53 LAPS — MONZA)
          </span>
        </div>
        <span className="text-3xs text-workstation-textMuted">
          {strategies.length} REGULATION-CONSTRAINED COMBINATIONS (2024 FIA ART. 30.5)
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-workstation-borderSubtle text-3xs text-workstation-textMuted bg-workstation-surface/50">
              <th className="py-1.5 px-2">STRATEGY</th>
              <th className="py-1.5 px-2">STOPS</th>
              <th className="py-1.5 px-2">COMPOUNDS</th>
              <th className="py-1.5 px-2">PIT LAPS</th>
              <th className="py-1.5 px-2 text-right">MODELLED TIME</th>
              <th className="py-1.5 px-2 text-right">DELTA TO BEST</th>
              <th className="py-1.5 px-2 text-center" title="Mandatory usage of at least 2 distinct dry weather compound specifications per 2024 FIA F1 Sporting Regulations Article 30.5">REG COMPLIANT</th>
              <th className="py-1.5 px-2 text-center">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-workstation-borderSubtle">
            {strategies.map((strategy) => {
              const isSelected = strategy.strategy_id === selectedStrategyId;
              const simTime = baselineRaceTimes[strategy.strategy_id];
              const delta = minTime && simTime ? simTime - minTime : null;

              const mins = simTime ? Math.floor(simTime / 60) : null;
              const secs = simTime ? (simTime % 60).toFixed(2) : null;

              return (
                <tr
                  key={strategy.strategy_id}
                  onClick={() => onSelectStrategy(strategy.strategy_id)}
                  className={`hover:bg-workstation-surface/60 cursor-pointer transition-colors ${
                    isSelected ? 'bg-workstation-accentCyan/10 border-l-2 border-workstation-accentCyan' : ''
                  }`}
                >
                  <td className="py-1.5 px-2 font-semibold text-workstation-textBright">
                    {strategy.name}
                  </td>
                  <td className="py-1.5 px-2 text-workstation-textMuted">
                    {strategy.pit_stops_count}
                  </td>
                  <td className="py-1.5 px-2">
                    <div className="flex items-center space-x-1">
                      {strategy.compound_sequence.map((c, i) => {
                        const badge = COMPOUND_BADGE[c] || COMPOUND_BADGE.HARD;
                        return (
                          <span
                            key={i}
                            className={`px-1.5 py-0.2 rounded border text-4xs font-bold ${badge.bg} ${badge.text}`}
                          >
                            {c[0]}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="py-1.5 px-2 text-workstation-textMuted text-3xs">
                    {strategy.pit_laps.length > 0 ? strategy.pit_laps.map((l) => `L${l}`).join(', ') : 'None'}
                  </td>
                  <td className="py-1.5 px-2 text-right text-workstation-textBright font-mono">
                    {simTime && mins !== null ? `${mins}m ${secs}s` : '—'}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono">
                    {delta !== null ? (
                      delta === 0 ? (
                        <span className="text-emerald-400 font-bold">OPTIMAL</span>
                      ) : (
                        <span className="text-amber-400">+{delta.toFixed(2)}s</span>
                      )
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    {strategy.is_fia_legal ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-red-400 mx-auto" />
                    )}
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStrategy(strategy.strategy_id);
                      }}
                      className={`px-2 py-0.5 rounded text-4xs font-bold uppercase transition-colors ${
                        isSelected
                          ? 'bg-workstation-accentCyan text-slate-950'
                          : 'bg-workstation-surface border border-workstation-border text-workstation-textSecondary hover:text-workstation-textBright'
                      }`}
                    >
                      {isSelected ? 'ACTIVE' : 'SELECT'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
