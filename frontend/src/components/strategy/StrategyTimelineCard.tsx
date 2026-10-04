import React from 'react';
import { RaceSimulationResponse } from '../../types/strategy';
import { Timer, Gauge } from 'lucide-react';

interface StrategyTimelineCardProps {
  simulation: RaceSimulationResponse | null;
  isLoading: boolean;
}

const COMPOUND_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  SOFT: { bg: 'bg-[#FF3366]/15', text: 'text-[#FF3366]', border: 'border-r border-[#1E3A8A]' },
  MEDIUM: { bg: 'bg-[#FFB000]/15', text: 'text-[#FBBF24]', border: 'border-r border-[#1E3A8A]' },
  HARD: { bg: 'bg-[#070E22]', text: 'text-[#FFFFFF]', border: 'border-r border-[#1E3A8A]' },
};

const COMPOUND_FILL: Record<string, string> = {
  SOFT: '#CC0000',
  MEDIUM: '#FFB000',
  HARD: '#000000',
};

export const StrategyTimelineCard: React.FC<StrategyTimelineCardProps> = ({
  simulation,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-4 font-mono text-2xs animate-pulse text-[#FFFFFF] flex items-center justify-center space-x-2 h-32 shadow-md">
        <Timer className="w-4 h-4 animate-spin text-[#FFFFFF]" />
        <span className="font-extrabold uppercase">SIMULATING 53-LAP RACE TRAJECTORY ACROSS PHYSICAL VEHICLE MODEL...</span>
      </div>
    );
  }

  if (!simulation) {
    return (
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-4 font-mono text-2xs text-[#94A3B8] flex items-center justify-center h-32 shadow-md">
        <span className="font-bold">No simulation data. Select strategy parameters and run simulation.</span>
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
    <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-0 shadow-md font-mono text-2xs">
      {/* Header & High-level Metrics */}
      <div className="window-header-retro bg-[#070E22] border-b border-[#1E3A8A] px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[#FFFFFF] font-extrabold">
        <div className="flex items-center space-x-2">
          <Gauge className="w-4 h-4 text-[#FFFFFF] stroke-[2.5]" />
          <span className="font-extrabold text-[#FFFFFF] text-2xs uppercase tracking-wide">
            [ STRATEGY EXECUTION TIMELINE: {simulation.strategy_id} ]
          </span>
          <span className="text-3xs text-[#94A3B8] font-bold">
            [{simulation.weather_scenario} / {simulation.safety_car_scenario} / {simulation.traffic_scenario}]
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-3xs font-bold">
          <div>
            <span className="text-[#94A3B8]">TOTAL TIME: </span>
            <strong className="text-[#FFFFFF] text-xs font-black">{formatTime(simulation.total_race_time_s)}</strong>
          </div>
          <div>
            <span className="text-[#94A3B8]">MEAN LAP: </span>
            <strong className="text-[#FFFFFF] font-black">{simulation.mean_lap_time_s.toFixed(3)}s</strong>
          </div>
          <div>
            <span className="text-[#94A3B8]">PIT STOPS: </span>
            <strong className="text-[#FFFFFF] font-black bg-[#161D2B] px-1 border border-[#1E3A8A]">{simulation.pit_stops_count}</strong>
          </div>
          <div>
            <span className="text-[#94A3B8]">PIT LOSS: </span>
            <strong className="text-[#FFB000] font-black">{simulation.total_pit_loss_s.toFixed(1)}s</strong>
          </div>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Visual Timeline Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-3xs text-[#FFFFFF] font-extrabold">
            <span>LAP 1 (GRID)</span>
            <span className="bg-[#00F0FF] px-1.5 py-0.2 border border-[#1E3A8A] text-[#FFFFFF]">STINT ALLOCATION & PIT WINDOWS</span>
            <span>LAP {totalLaps} (CHEQUERED)</span>
          </div>

          <div className="w-full h-9 bg-[#070E22] border border-[#1E3A8A] flex overflow-hidden relative shadow">
            {simulation.stints.map((stint, idx) => {
              const widthPct = (stint.stint_length / totalLaps) * 100;
              const styleCfg = COMPOUND_COLORS[stint.compound] || COMPOUND_COLORS.HARD;
              return (
                <div
                  key={idx}
                  style={{ width: `${widthPct}%` }}
                  className={`h-full ${styleCfg.border} ${styleCfg.bg} flex items-center justify-between px-2 text-3xs transition-all relative group`}
                >
                  <div className="flex items-center space-x-1.5 font-black">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block border border-[#1E3A8A]"
                      style={{ backgroundColor: COMPOUND_FILL[stint.compound] || '#000000' }}
                    />
                    <span className={styleCfg.text}>{stint.compound}</span>
                  </div>
                  <div className="text-[#FFFFFF] font-bold text-3xs">
                    L{stint.start_lap}–L{stint.end_lap} ({stint.stint_length}L)
                  </div>

                  {/* Pit stop marker at end of stint if not final stint */}
                  {idx < simulation.stints.length - 1 && (
                    <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-black z-10">
                      <span className="absolute -bottom-4 right-1/2 translate-x-1/2 text-4xs bg-[#00F0FF] px-1 border border-[#1E3A8A] text-[#FFFFFF] font-black whitespace-nowrap shadow-sm">
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
              className="bg-[#070E22] border border-[#1E3A8A] p-2.5 text-3xs space-y-1 shadow"
            >
              <div className="flex items-center justify-between font-extrabold border-b border-[#1E3A8A] pb-1">
                <span className={COMPOUND_COLORS[stint.compound]?.text || 'text-[#FFFFFF]'}>
                  STINT {stint.stint_number}: {stint.compound}
                </span>
                <span className="text-[#94A3B8]">
                  Laps {stint.start_lap}–{stint.end_lap} ({stint.stint_length}L)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[#94A3B8] font-bold pt-0.5">
                <div>
                  Stint Time: <span className="text-[#FFFFFF] font-black">{stint.total_stint_time_s.toFixed(2)}s</span>
                </div>
                <div>
                  Mean Lap: <span className="text-[#FFFFFF] font-black">{stint.mean_lap_time_s.toFixed(3)}s</span>
                </div>
                <div>
                  Tyre Age Start: <span className="text-[#FFFFFF]">{stint.start_tyre_age}</span>
                </div>
                <div>
                  Tyre Age End: <span className="text-[#FFFFFF]">{stint.end_tyre_age}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
