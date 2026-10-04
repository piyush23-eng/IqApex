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
  SOFT: { bg: 'bg-[#FF3366]/15 border border-[#1E3A8A]', text: 'text-[#FF3366]' },
  MEDIUM: { bg: 'bg-[#FFB000]/15 border border-[#1E3A8A]', text: 'text-[#FBBF24]' },
  HARD: { bg: 'bg-[#070E22] border border-[#1E3A8A]', text: 'text-[#FFFFFF]' },
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
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-4 font-mono text-2xs animate-pulse text-[#FFFFFF] flex items-center justify-center space-x-2 h-44 shadow-md">
        <Layers className="w-4 h-4 animate-spin text-[#FFFFFF]" />
        <span className="font-extrabold uppercase">ENUMERATING REGULATION-CONSTRAINED STRATEGIES (2024 FIA ART. 30.5)...</span>
      </div>
    );
  }

  // Find fastest strategy time for delta calculation
  const times = Object.values(baselineRaceTimes).filter((t) => t > 0);
  const minTime = times.length > 0 ? Math.min(...times) : null;

  return (
    <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-0 shadow-md font-mono text-2xs">
      <div className="window-header-retro bg-[#070E22] border-b border-[#1E3A8A] px-3 py-1.5 flex items-center justify-between text-[#FFFFFF] font-extrabold">
        <div className="flex items-center space-x-2">
          <Layers className="w-3.5 h-3.5 text-[#FFFFFF] stroke-[2.5]" />
          <span className="font-extrabold text-[#FFFFFF] uppercase tracking-wider text-2xs">
            [ REGULATION-CONSTRAINED STRATEGY MATRIX (53 LAPS — MONZA) ]
          </span>
        </div>
        <span className="text-3xs text-[#94A3B8] font-bold">
          {strategies.length} REGULATION-CONSTRAINED COMBINATIONS (2024 FIA ART. 30.5)
        </span>
      </div>

      <div className="p-3">
        <div className="overflow-x-auto border border-[#1E3A8A] shadow">
          <table className="w-full border-collapse text-left bg-[#070E22]">
            <thead>
              <tr className="border-b border-[#1E3A8A] text-3xs text-[#FFFFFF] font-extrabold uppercase bg-[#161D2B]">
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
            <tbody className="divide-y divide-black/20 text-3xs">
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
                    className={`hover:bg-[#0A132E] cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#00F0FF]/15' : ''
                    }`}
                  >
                    <td className="py-1.5 px-2 font-black text-[#FFFFFF]">
                      {strategy.name}
                    </td>
                    <td className="py-1.5 px-2 text-[#94A3B8] font-bold">
                      {strategy.pit_stops_count}
                    </td>
                    <td className="py-1.5 px-2">
                      <div className="flex items-center space-x-1">
                        {strategy.compound_sequence.map((c, i) => {
                          const badge = COMPOUND_BADGE[c] || COMPOUND_BADGE.HARD;
                          return (
                            <span
                              key={i}
                              className={`px-1.5 py-0.2 text-4xs font-black shadow-sm ${badge.bg} ${badge.text}`}
                            >
                              {c[0]}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-1.5 px-2 text-[#94A3B8] text-3xs font-bold">
                      {strategy.pit_laps.length > 0 ? strategy.pit_laps.map((l) => `L${l}`).join(', ') : 'None'}
                    </td>
                    <td className="py-1.5 px-2 text-right text-[#FFFFFF] font-black font-mono">
                      {simTime && mins !== null ? `${mins}m ${secs}s` : '—'}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono">
                      {delta !== null ? (
                        delta === 0 ? (
                          <span className="bg-[#00F0FF] text-[#FFFFFF] px-1.5 py-0.2 border border-[#1E3A8A] font-black text-3xs shadow-sm">OPTIMAL</span>
                        ) : (
                          <span className="text-[#FFB000] font-black">+{delta.toFixed(2)}s</span>
                        )
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      {strategy.is_fia_legal ? (
                        <CheckCircle2 className="w-4 h-4 text-[#00E676] stroke-[2.5] mx-auto" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-[#FF3366] stroke-[2.5] mx-auto" />
                      )}
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStrategy(strategy.strategy_id);
                        }}
                        className={`text-4xs font-black uppercase transition-all ${
                          isSelected
                            ? 'btn-retro-primary py-0.5 px-2'
                            : 'btn-retro py-0.5 px-2'
                        }`}
                      >
                        {isSelected ? '[ ACTIVE ]' : '[ SELECT ]'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
