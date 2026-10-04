import React from 'react';
import { LapComparisonSummary } from '../../types/domain';
import { formatLapTime } from '../../utils/formatters';
import { Timer, ShieldCheck, Flag, AlertCircle } from 'lucide-react';

interface LapSummaryHeaderProps {
  summary: LapComparisonSummary | null;
  isLoading?: boolean;
}

export const LapSummaryHeader: React.FC<LapSummaryHeaderProps> = ({
  summary,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="window-retro p-3 text-[#FFFFFF] text-2xs animate-pulse flex items-center justify-between font-mono">
        <span className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 bg-[#00F0FF] border border-[#1E3A8A] animate-ping" />
          <span className="font-bold">[ SYNCHRONIZING TELEMETRY CHANNELS & RESAMPLE BUFFER... ]</span>
        </span>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const {
    reference_lap,
    comparison_lap,
    reference_driver,
    comparison_driver,
    reference_run,
    comparison_run,
    reference_quality_score,
    comparison_quality_score,
    lap_time_delta,
    sectors,
    data_label,
  } = summary;

  const isDeltaNegative = lap_time_delta < 0; // Negative means comp is faster
  const deltaSign = lap_time_delta > 0 ? '+' : '';

  return (
    <div className="window-retro p-2 font-mono text-2xs select-none space-y-2">
      {/* Top Banner: Synthetic Data Warning & Circuit Info */}
      <div className="window-header-retro">
        <div className="flex items-center space-x-2">
          <span className="font-black text-[#FFFFFF]">
            CIRCUIT: AUTODROMO NAZIONALE MONZA
          </span>
          <span className="text-[#FFFFFF] font-bold">|</span>
          <span className="text-[#CBD5E1] font-bold">LENGTH: 5,793 m</span>
          <span className="text-[#FFFFFF] font-bold">|</span>
          <span className="text-[#CBD5E1] font-bold">SESSION: FP2</span>
        </div>

        <div className="flex items-center space-x-2">
          {data_label.toLowerCase().includes('synthetic') ? (
            <span className="px-2 py-0.5 bg-[#FFB000] border border-[#1E3A8A] text-[#FFFFFF] font-extrabold flex items-center space-x-1 shadow-sm">
              <AlertCircle className="w-3 h-3 stroke-[2.5]" />
              <span>SYNTHETIC DEMO DATASET</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-[#00F0FF] border border-[#1E3A8A] text-[#FFFFFF] font-extrabold flex items-center space-x-1 shadow-sm">
              <ShieldCheck className="w-3 h-3 stroke-[2.5]" />
              <span>MEASURED VEHICLE DATA</span>
            </span>
          )}
          <span className="px-1 border border-[#1E3A8A] font-bold bg-[#070E22] cursor-pointer">[✕]</span>
        </div>
      </div>

      {/* Main Comparison Strip */}
      <div className="grid grid-cols-12 gap-2.5 items-center">
        {/* Reference Lap Card (Solid Electric Blue / Ref HAM #44) */}
        <div className="col-span-4 bg-[#070E22] border border-[#1E3A8A] border-l-[6px] border-l-[#0062FF] p-2.5 shadow">
          <div className="flex items-center justify-between text-3xs uppercase mb-0.5">
            <span className="text-[#FFFFFF] font-black flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 bg-[#0062FF] border border-[#00F0FF] inline-block shadow-matrix-glow" />
              <span>[ REFERENCE LAP L{reference_lap.lap_number} ]</span>
            </span>
            <span className="px-1.5 py-0.2 bg-[#0062FF] border border-[#00F0FF] text-[#FFFFFF] font-extrabold text-4xs">
              {reference_lap.valid ? 'VALID' : 'INVALID'}
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <div className="text-base font-black text-[#FFFFFF] tabular-nums">
              {formatLapTime(reference_lap.lap_time)}
            </div>
            <div className="text-2xs text-[#FFFFFF] font-extrabold bg-[#0062FF] px-2 py-0.5 border border-[#00F0FF] shadow-matrix-glow">
              #{reference_driver?.car_number || 44} {reference_driver?.name || 'L. Hamilton'}
            </div>
          </div>

          <div className="flex items-center justify-between text-3xs text-[#93C5FD] font-bold mt-1.5 pt-1 border-t border-dashed border-[#1E3A8A]">
            <span>
              {reference_run?.compound || 'SOFT (C4)'} (Age: {reference_run?.tyre_age ?? 2} laps)
            </span>
            <span className="flex items-center space-x-1 text-[#FFFFFF] font-extrabold">
              <ShieldCheck className="w-2.5 h-2.5 stroke-[2.5] text-[#00F0FF]" />
              <span>Score: {reference_quality_score.toFixed(1)}</span>
            </span>
          </div>
        </div>

        {/* Comparison Lap Card (Solid Pure White / Comp LEC #16) */}
        <div className="col-span-4 bg-[#070E22] border border-[#1E3A8A] border-l-[6px] border-l-[#FFFFFF] p-2.5 shadow">
          <div className="flex items-center justify-between text-3xs uppercase mb-0.5">
            <span className="text-[#FFFFFF] font-black flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 bg-[#FFFFFF] border border-[#FFFFFF] inline-block shadow-sm" />
              <span>[ COMPARISON LAP L{comparison_lap.lap_number} ]</span>
            </span>
            <span className="px-1.5 py-0.2 bg-[#FFFFFF] border border-[#FFFFFF] text-[#030712] font-extrabold text-4xs">
              {comparison_lap.valid ? 'VALID' : 'INVALID'}
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <div className="text-base font-black text-[#FFFFFF] tabular-nums">
              {formatLapTime(comparison_lap.lap_time)}
            </div>
            <div className="text-2xs text-[#030712] font-extrabold bg-[#FFFFFF] px-2 py-0.5 border border-[#FFFFFF] shadow-sm">
              #{comparison_driver?.car_number || 16} {comparison_driver?.name || 'C. Leclerc'}
            </div>
          </div>

          <div className="flex items-center justify-between text-3xs text-[#93C5FD] font-bold mt-1.5 pt-1 border-t border-dashed border-[#1E3A8A]">
            <span>
              {comparison_run?.compound || 'SOFT (C4)'} (Age: {comparison_run?.tyre_age ?? 3} laps)
            </span>
            <span className="flex items-center space-x-1 text-[#FFFFFF] font-extrabold">
              <ShieldCheck className="w-2.5 h-2.5 stroke-[2.5] text-[#00F0FF]" />
              <span>Score: {comparison_quality_score.toFixed(1)}</span>
            </span>
          </div>
        </div>

        {/* Lap Delta */}
        <div className="col-span-2 bg-[#0A132E] border border-[#0062FF] p-2.5 text-center shadow-md">
          <div className="text-4xs text-[#93C5FD] uppercase font-black tracking-wider flex items-center justify-center space-x-1">
            <Timer className="w-3 h-3 text-[#00F0FF] stroke-[2.5]" />
            <span>LAP DELTA (Δt)</span>
          </div>
          <div className={`text-base font-black tabular-nums mt-0.5 ${isDeltaNegative ? 'text-[#00E676]' : 'text-[#FF3366]'}`}>
            {deltaSign}{lap_time_delta.toFixed(3)}s
          </div>
          <div className={`text-4xs font-extrabold mt-0.5 uppercase tracking-wider ${isDeltaNegative ? 'text-[#00E676]' : 'text-[#FF3366]'}`}>
            {isDeltaNegative ? '[ COMP FASTER ]' : '[ REF FASTER ]'}
          </div>
        </div>

        {/* Sector Splits */}
        <div className="col-span-2 bg-[#070E22] border border-[#1E3A8A] p-2 shadow">
          <div className="text-4xs text-[#FFFFFF] uppercase font-black tracking-wider flex items-center space-x-1 mb-1">
            <Flag className="w-3 h-3 text-[#00F0FF] stroke-[2.5]" />
            <span>SECTORS</span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-center font-mono">
            {sectors.map((s) => {
              const sign = s.delta > 0 ? '+' : '';
              return (
                <div key={s.sector} className="bg-[#0A132E] border border-[#1E3A8A] p-1 shadow-sm">
                  <div className="text-4xs text-[#93C5FD] font-extrabold">S{s.sector}</div>
                  <div className={`text-3xs font-black tabular-nums ${s.delta < 0 ? 'text-[#00E676]' : 'text-[#FF3366]'}`}>
                    {sign}{s.delta.toFixed(3)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
