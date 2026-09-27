import React from 'react';
import { RaceSimulationResponse } from '../../types/strategy';
import { Timer, Gauge } from 'lucide-react';

interface StrategyTimelineCardProps {
  simulation: RaceSimulationResponse | null;
  isLoading: boolean;
}

const COMPOUND_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  SOFT: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
  MEDIUM: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/50' },
  HARD: { bg: 'bg-slate-200/20', text: 'text-slate-100', border: 'border-slate-300/50' },
};

const COMPOUND_FILL: Record<string, string> = {
  SOFT: '#EF4444',
  MEDIUM: '#F59E0B',
  HARD: '#E2E8F0',
};

export const StrategyTimelineCard: React.FC<StrategyTimelineCardProps> = ({
  simulation,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="bg-workstation-panel border border-workstation-border rounded p-4 font-mono text-2xs animate-pulse text-workstation-textMuted flex items-center justify-center space-x-2 h-32">
        <Timer className="w-4 h-4 animate-spin text-workstation-accentCyan" />
        <span>SIMULATING 53-LAP RACE TRAJECTORY ACROSS PHYSICAL VEHICLE MODEL...</span>
      </div>
    );
  }

  if (!simulation) {
    return (
      <div className="bg-workstation-panel border border-workstation-border rounded p-4 font-mono text-2xs text-workstation-textMuted flex items-center justify-center h-32">
        <span>No simulation data. Select strategy parameters and run simulation.</span>
      </div>
    );
  }

  const totalLaps = 53;
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    return `${mins}m ${secs.padStart(6, '0')}s (${seconds.toFixed(3)}s)`;
  };

  return (
    <div className="bg-workstation-panel border border-workstation-border rounded p-3 font-mono text-2xs space-y-3">
      {/* Header & High-level Metrics */}
      <div className="flex flex-wrap items-center justify-between border-b border-workstation-borderSubtle pb-2 gap-2">
        <div className="flex items-center space-x-2">
          <Gauge className="w-4 h-4 text-workstation-accentCyan" />
          <span className="font-bold text-workstation-textBright text-xs uppercase tracking-wide">
            STRATEGY EXECUTION TIMELINE: {simulation.strategy_id}
          </span>
          <span className="text-3xs text-workstation-textMuted">
            [{simulation.weather_scenario} / {simulation.safety_car_scenario} / {simulation.traffic_scenario}]
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-3xs">
          <div>
            <span className="text-workstation-textMuted">TOTAL TIME: </span>
            <strong className="text-workstation-textBright text-xs">{formatTime(simulation.total_race_time_s)}</strong>
          </div>
          <div>
            <span className="text-workstation-textMuted">MEAN LAP: </span>
            <strong className="text-workstation-textBright">{simulation.mean_lap_time_s.toFixed(3)}s</strong>
          </div>
          <div>
            <span className="text-workstation-textMuted">PIT STOPS: </span>
            <strong className="text-workstation-accentCyan">{simulation.pit_stops_count}</strong>
          </div>
          <div>
            <span className="text-workstation-textMuted">PIT LOSS: </span>
            <strong className="text-amber-400">{simulation.total_pit_loss_s.toFixed(1)}s</strong>
          </div>
        </div>
      </div>

      {/* Visual Timeline Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-3xs text-workstation-textMuted">
          <span>LAP 1 (GRID)</span>
          <span className="text-workstation-textBright">STINT ALLOCATION & PIT WINDOWS</span>
          <span>LAP {totalLaps} (CHEQUERED)</span>
        </div>

        <div className="w-full h-8 bg-slate-900 border border-workstation-borderSubtle rounded flex overflow-hidden relative">
          {simulation.stints.map((stint, idx) => {
            const widthPct = (stint.stint_length / totalLaps) * 100;
            const styleCfg = COMPOUND_COLORS[stint.compound] || COMPOUND_COLORS.HARD;
            return (
              <div
                key={idx}
                style={{ width: `${widthPct}%` }}
                className={`h-full border-r ${styleCfg.border} ${styleCfg.bg} flex items-center justify-between px-2 text-3xs transition-all relative group`}
              >
                <div className="flex items-center space-x-1.5 font-bold">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: COMPOUND_FILL[stint.compound] || '#E2E8F0' }}
                  />
                  <span className={styleCfg.text}>{stint.compound}</span>
                </div>
                <div className="text-workstation-textSecondary text-3xs">
                  L{stint.start_lap}–L{stint.end_lap} ({stint.stint_length} laps)
                </div>

                {/* Pit stop marker at end of stint if not final stint */}
                {idx < simulation.stints.length - 1 && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-workstation-accentCyan z-10">
                    <span className="absolute -bottom-4 right-1/2 translate-x-1/2 text-4xs bg-slate-900 px-1 border border-workstation-accentCyan rounded text-workstation-accentCyan font-bold whitespace-nowrap">
                      PIT L{stint.end_lap}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stint Detailed Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
        {simulation.stints.map((stint) => (
          <div
            key={stint.stint_number}
            className="bg-workstation-surface border border-workstation-borderSubtle rounded p-2 text-3xs space-y-1"
          >
            <div className="flex items-center justify-between font-bold">
              <span className={COMPOUND_COLORS[stint.compound]?.text || 'text-slate-100'}>
                STINT {stint.stint_number}: {stint.compound}
              </span>
              <span className="text-workstation-textMuted">
                Laps {stint.start_lap}–{stint.end_lap} ({stint.stint_length}L)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-workstation-textMuted pt-0.5">
              <div>
                Stint Time: <span className="text-workstation-textBright font-semibold">{stint.total_stint_time_s.toFixed(2)}s</span>
              </div>
              <div>
                Mean Lap: <span className="text-workstation-textBright font-semibold">{stint.mean_lap_time_s.toFixed(3)}s</span>
              </div>
              <div>
                Tyre Age Start: <span className="text-workstation-textSecondary">{stint.start_tyre_age}</span>
              </div>
              <div>
                Tyre Age End: <span className="text-workstation-textSecondary">{stint.end_tyre_age}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
