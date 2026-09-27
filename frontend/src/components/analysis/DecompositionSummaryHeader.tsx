import React from 'react';
import { Lap } from '../../types/domain';
import { LapDecompositionResult, ReferenceMethod } from '../../types/decomposition';
import { formatLapTime } from '../../utils/formatters';
import { Timer, AlertCircle, Compass, GitCommit } from 'lucide-react';

interface DecompositionSummaryHeaderProps {
  decomposition: LapDecompositionResult | null;
  availableLaps: Lap[];
  referenceLapId: string;
  comparisonLapId: string;
  referenceMethod: ReferenceMethod;
  onSelectReferenceMethod: (method: ReferenceMethod) => void;
  onSelectReferenceLap: (lapId: string) => void;
  onSelectComparisonLap: (lapId: string) => void;
  isLoading?: boolean;
}

export const DecompositionSummaryHeader: React.FC<DecompositionSummaryHeaderProps> = ({
  decomposition,
  availableLaps,
  referenceLapId,
  comparisonLapId,
  referenceMethod,
  onSelectReferenceMethod,
  onSelectReferenceLap,
  onSelectComparisonLap,
  isLoading = false,
}) => {
  const totalDelta = decomposition?.total_lap_delta ?? 0.0;
  const isDeltaNegative = totalDelta < 0;
  const deltaColor = isDeltaNegative ? 'text-workstation-telemetryGreen' : 'text-workstation-telemetryAmber';
  const deltaSign = totalDelta > 0 ? '+' : '';

  return (
    <div className="bg-workstation-panel border border-workstation-border rounded p-3 font-mono text-2xs select-none space-y-2.5">
      {/* Top Bar: Circuit Info & Synthetic Dataset Notice */}
      <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-2 text-3xs">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-workstation-textBright tracking-wider uppercase">
            LAP-TIME DECOMPOSITION & PERFORMANCE PHASE ENGINE
          </span>
          <span className="text-workstation-border">|</span>
          <span className="text-workstation-textMuted">CIRCUIT: AUTODROMO NAZIONALE MONZA (5,793m)</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold rounded flex items-center space-x-1">
            <AlertCircle className="w-3 h-3" />
            <span>SYNTHETIC DEMONSTRATION DATASET</span>
          </span>
        </div>
      </div>

      {/* Main Workflow Strip */}
      <div className="grid grid-cols-12 gap-3 items-center">
        {/* Reference Methodology & Lap Selection */}
        <div className="col-span-5 bg-workstation-surface/80 border-l-2 border-workstation-accentCyan p-2 rounded-r space-y-1.5">
          <div className="flex items-center justify-between text-3xs text-workstation-textMuted uppercase">
            <span className="text-workstation-accentCyan font-bold flex items-center space-x-1">
              <Compass className="w-3 h-3" />
              <span>REFERENCE METHODOLOGY</span>
            </span>
            <span className="px-1.5 py-0.2 bg-workstation-surface border border-workstation-borderSubtle text-workstation-telemetryGreen rounded">
              VALIDATED
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <select
              aria-label="Select Reference Method"
              className="bg-workstation-surface border border-workstation-border text-workstation-textPrimary px-2 py-1 rounded text-2xs focus:outline-none focus:border-workstation-accentCyan"
              value={referenceMethod}
              onChange={(e) => onSelectReferenceMethod(e.target.value as ReferenceMethod)}
            >
              <option value="selected_lap">Selected Reference Lap</option>
              <option value="session_best_valid">Session Best Valid Lap</option>
              <option value="driver_best_valid">Driver Best Valid Lap</option>
              <option value="median_valid">Session Median Valid Lap</option>
            </select>

            {referenceMethod === 'selected_lap' && (
              <select
                aria-label="Select Reference Lap"
                className="bg-workstation-surface border border-workstation-border text-workstation-textPrimary px-2 py-1 rounded text-2xs focus:outline-none focus:border-workstation-accentCyan"
                value={referenceLapId}
                onChange={(e) => onSelectReferenceLap(e.target.value)}
              >
                {availableLaps.map((lap) => (
                  <option key={lap.lap_id} value={lap.lap_id}>
                    Lap {lap.lap_number} ({formatLapTime(lap.lap_time)}) {lap.lap_id === 'lap-demo-02' ? '— Baseline Ref' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="text-3xs text-workstation-textMuted flex items-center justify-between">
            <span>Ref Lap: {decomposition?.reference_lap_id || referenceLapId}</span>
            <span>Grid: 1.0 m uniform</span>
          </div>
        </div>

        {/* Comparison Lap Selector */}
        <div className="col-span-4 bg-workstation-surface/80 border-l-2 border-workstation-telemetryAmber p-2 rounded-r space-y-1.5">
          <div className="flex items-center justify-between text-3xs text-workstation-textMuted uppercase">
            <span className="text-workstation-telemetryAmber font-bold flex items-center space-x-1">
              <GitCommit className="w-3 h-3" />
              <span>COMPARISON LAP</span>
            </span>
            <span className="px-1.5 py-0.2 bg-workstation-surface border border-workstation-borderSubtle text-workstation-telemetryGreen rounded">
              VALIDATED
            </span>
          </div>

          <div>
            <select
              aria-label="Select Comparison Lap"
              className="bg-workstation-surface border border-workstation-border text-workstation-textPrimary px-2 py-1 rounded text-2xs focus:outline-none focus:border-workstation-telemetryAmber w-full"
              value={comparisonLapId}
              onChange={(e) => onSelectComparisonLap(e.target.value)}
            >
              {availableLaps.map((lap) => (
                <option key={lap.lap_id} value={lap.lap_id}>
                  Lap {lap.lap_number} ({formatLapTime(lap.lap_time)}) {lap.lap_id === 'lap-demo-03' ? '— Baseline Comp' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="text-3xs text-workstation-textMuted flex items-center justify-between">
            <span>Comp Lap: {decomposition?.comparison_lap_id || comparisonLapId}</span>
            <span>Status: Evaluated</span>
          </div>
        </div>

        {/* Total Measured Lap Delta */}
        <div className="col-span-3 bg-workstation-surface/90 border border-workstation-borderSubtle p-2.5 rounded text-center">
          <div className="text-3xs text-workstation-textMuted uppercase flex items-center justify-center space-x-1">
            <Timer className="w-3 h-3 text-workstation-accentCyan" />
            <span>MEASURED TOTAL LAP DELTA</span>
          </div>
          <div className={`text-xl font-bold mt-1 ${deltaColor}`}>
            {isLoading ? '...' : `${deltaSign}${totalDelta.toFixed(3)} s`}
          </div>
          <div className="text-3xs text-workstation-textMuted mt-0.5">
            {totalDelta < 0 ? 'Comparison Faster' : totalDelta > 0 ? 'Comparison Slower' : 'Identical Pace'}
          </div>
        </div>
      </div>
    </div>
  );
};
