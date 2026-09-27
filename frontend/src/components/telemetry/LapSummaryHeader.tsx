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
      <div className="bg-workstation-panel border border-workstation-border p-3 rounded text-workstation-textMuted text-2xs animate-pulse flex items-center justify-between">
        <span>Loading synchronized telemetry comparison...</span>
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
  const deltaColor = isDeltaNegative ? 'text-workstation-telemetryGreen' : 'text-workstation-telemetryAmber';
  const deltaSign = lap_time_delta > 0 ? '+' : '';

  return (
    <div className="bg-workstation-panel border border-workstation-border rounded p-2.5 font-mono text-2xs select-none space-y-2">
      {/* Top Banner: Synthetic Data Warning & Circuit Info */}
      <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-1.5 text-3xs">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-workstation-textBright tracking-wider">
            CIRCUIT: AUTODROMO NAZIONALE MONZA
          </span>
          <span className="text-workstation-border">|</span>
          <span className="text-workstation-textMuted">LENGTH: 5,793 m</span>
          <span className="text-workstation-border">|</span>
          <span className="text-workstation-textMuted">SESSION: FP2</span>
        </div>

        <div className="flex items-center space-x-2">
          {data_label.toLowerCase().includes('synthetic') ? (
            <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold rounded flex items-center space-x-1">
              <AlertCircle className="w-3 h-3" />
              <span>SYNTHETIC DEMONSTRATION DATASET</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold rounded flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3" />
              <span>MEASURED VEHICLE DATA</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Comparison Strip */}
      <div className="grid grid-cols-12 gap-3 items-center">
        {/* Reference Lap Card (Cyan) */}
        <div className="col-span-4 bg-workstation-surface/80 border-l-2 border-workstation-accentCyan p-2 rounded-r">
          <div className="flex items-center justify-between text-3xs text-workstation-textMuted uppercase mb-0.5">
            <span className="text-workstation-accentCyan font-bold flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-workstation-accentCyan inline-block" />
              <span>REFERENCE LAP (L{reference_lap.lap_number})</span>
            </span>
            <span className="px-1.5 py-0.2 bg-workstation-surface border border-workstation-borderSubtle text-workstation-telemetryGreen rounded">
              {reference_lap.valid ? 'VALID' : 'INVALID'}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-sm font-bold text-workstation-textBright">
              {formatLapTime(reference_lap.lap_time)}
            </div>
            <div className="text-2xs text-workstation-textSecondary">
              #{reference_driver?.car_number || 44} {reference_driver?.name || 'L. Hamilton'}
            </div>
          </div>

          <div className="flex items-center justify-between text-3xs text-workstation-textMuted mt-1">
            <span>
              {reference_run?.compound || 'SOFT (C4)'} (Age: {reference_run?.tyre_age ?? 2} laps)
            </span>
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-2.5 h-2.5 text-workstation-telemetryGreen" />
              <span>Score: {reference_quality_score.toFixed(1)}</span>
            </span>
          </div>
        </div>

        {/* Comparison Lap Card (Amber) */}
        <div className="col-span-4 bg-workstation-surface/80 border-l-2 border-workstation-telemetryAmber p-2 rounded-r">
          <div className="flex items-center justify-between text-3xs text-workstation-textMuted uppercase mb-0.5">
            <span className="text-workstation-telemetryAmber font-bold flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-workstation-telemetryAmber inline-block" />
              <span>COMPARISON LAP (L{comparison_lap.lap_number})</span>
            </span>
            <span className="px-1.5 py-0.2 bg-workstation-surface border border-workstation-borderSubtle text-workstation-telemetryGreen rounded">
              {comparison_lap.valid ? 'VALID' : 'INVALID'}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-sm font-bold text-workstation-textBright">
              {formatLapTime(comparison_lap.lap_time)}
            </div>
            <div className="text-2xs text-workstation-textSecondary">
              #{comparison_driver?.car_number || 16} {comparison_driver?.name || 'C. Leclerc'}
            </div>
          </div>

          <div className="flex items-center justify-between text-3xs text-workstation-textMuted mt-1">
            <span>
              {comparison_run?.compound || 'SOFT (C4)'} (Age: {comparison_run?.tyre_age ?? 3} laps)
            </span>
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-2.5 h-2.5 text-workstation-telemetryGreen" />
              <span>Score: {comparison_quality_score.toFixed(1)}</span>
            </span>
          </div>
        </div>

        {/* Lap Delta */}
        <div className="col-span-2 bg-workstation-surface/60 border border-workstation-borderSubtle p-2 rounded text-center">
          <div className="text-3xs text-workstation-textMuted uppercase flex items-center justify-center space-x-1">
            <Timer className="w-3 h-3 text-workstation-accentCyan" />
            <span>LAP DELTA (Δt)</span>
          </div>
          <div className={`text-base font-bold mt-0.5 ${deltaColor}`}>
            {deltaSign}{lap_time_delta.toFixed(3)} s
          </div>
          <div className="text-3xs text-workstation-textMuted mt-0.5">
            {isDeltaNegative ? 'Comparison Faster' : 'Reference Faster'}
          </div>
        </div>

        {/* Sector Splits */}
        <div className="col-span-2 bg-workstation-surface/60 border border-workstation-borderSubtle p-2 rounded">
          <div className="text-3xs text-workstation-textMuted uppercase flex items-center space-x-1 mb-1">
            <Flag className="w-3 h-3 text-workstation-accentCyan" />
            <span>SECTOR DELTAS</span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-center">
            {sectors.map((s) => {
              const sColor = s.delta < 0 ? 'text-workstation-telemetryGreen' : s.delta > 0 ? 'text-workstation-telemetryAmber' : 'text-workstation-textMuted';
              const sign = s.delta > 0 ? '+' : '';
              return (
                <div key={s.sector} className="bg-workstation-surface/80 p-1 rounded">
                  <div className="text-3xs text-workstation-textMuted">S{s.sector}</div>
                  <div className={`text-2xs font-bold ${sColor}`}>
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
