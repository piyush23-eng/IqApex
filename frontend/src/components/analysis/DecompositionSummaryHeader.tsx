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
  const deltaSign = totalDelta > 0 ? '+' : '';

  return (
    <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-3 font-mono text-2xs select-none space-y-2.5 shadow-md w-full flex-shrink-0">
      {/* Top Bar: Circuit Info & Synthetic Dataset Notice */}
      <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-2 text-3xs">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 bg-[#00F0FF] border border-[#1E3A8A] animate-pulse" />
          <span className="font-extrabold text-[#FFFFFF] tracking-wider uppercase text-2xs">
            [ LAP-TIME DECOMPOSITION &amp; PERFORMANCE PHASE ENGINE ]
          </span>
          <span className="text-[#FFFFFF] font-bold">|</span>
          <span className="text-[#94A3B8] font-bold">CIRCUIT: AUTODROMO NAZIONALE MONZA (5,793m)</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 bg-[#00F0FF] text-[#FFFFFF] border border-[#1E3A8A] font-extrabold text-4xs shadow-sm flex items-center space-x-1">
            <AlertCircle className="w-3 h-3 text-[#FFFFFF] stroke-[2.5]" />
            <span>SYNTHETIC CALIBRATION DATASET ✕</span>
          </span>
        </div>
      </div>

      {/* Main Workflow Strip */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Reference Methodology & Lap Selection */}
        <div className="col-span-1 md:col-span-5 bg-[#070E22] border border-[#1E3A8A] p-2.5 shadow space-y-1.5">
          <div className="flex items-center justify-between text-3xs text-[#94A3B8] uppercase">
            <span className="text-[#FFFFFF] font-extrabold flex items-center space-x-1">
              <Compass className="w-3.5 h-3.5 text-[#FFFFFF] stroke-[2.5]" />
              <span>REFERENCE METHODOLOGY</span>
            </span>
            <span className="px-1.5 py-0.2 bg-[#00F0FF] border border-[#1E3A8A] text-[#FFFFFF] font-bold text-4xs">
              VALIDATED ✕
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <select
              aria-label="Select Reference Method"
              className="bg-[#0A132E] border border-[#1E3A8A] text-[#FFFFFF] px-2 py-1 font-mono text-2xs font-bold focus:outline-none focus:bg-[#00F0FF]"
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
                className="bg-[#0A132E] border border-[#1E3A8A] text-[#FFFFFF] px-2 py-1 font-mono text-2xs font-bold focus:outline-none focus:bg-[#00F0FF]"
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

          <div className="text-3xs text-[#94A3B8] flex items-center justify-between font-bold">
            <span>Ref Lap: {decomposition?.reference_lap_id || referenceLapId}</span>
            <span>Grid: 1.0 m uniform</span>
          </div>
        </div>

        {/* Comparison Lap Selector */}
        <div className="col-span-1 md:col-span-4 bg-[#070E22] border border-[#1E3A8A] p-2.5 shadow space-y-1.5">
          <div className="flex items-center justify-between text-3xs text-[#94A3B8] uppercase">
            <span className="text-[#FFFFFF] font-extrabold flex items-center space-x-1">
              <GitCommit className="w-3.5 h-3.5 text-[#FFB000] stroke-[2.5]" />
              <span>COMPARISON LAP</span>
            </span>
            <span className="px-1.5 py-0.2 bg-[#FFB000] border border-[#1E3A8A] text-[#FFFFFF] font-bold text-4xs">
              EVALUATING ✕
            </span>
          </div>

          <div>
            <select
              aria-label="Select Comparison Lap"
              className="bg-[#0A132E] border border-[#1E3A8A] text-[#FFFFFF] px-2 py-1 font-mono text-2xs font-bold focus:outline-none focus:bg-[#FFB000] w-full"
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

          <div className="text-3xs text-[#94A3B8] flex items-center justify-between font-bold">
            <span>Comp Lap: {decomposition?.comparison_lap_id || comparisonLapId}</span>
            <span>Status: Evaluated</span>
          </div>
        </div>

        {/* Total Measured Lap Delta */}
        <div className="col-span-1 md:col-span-3 bg-[#070E22] border border-[#1E3A8A] p-2.5 shadow text-center">
          <div className="text-3xs text-[#94A3B8] uppercase font-bold flex items-center justify-center space-x-1">
            <Timer className="w-3.5 h-3.5 text-[#FFFFFF] stroke-[2.5]" />
            <span>MEASURED TOTAL LAP DELTA</span>
          </div>
          <div className={`text-xl font-extrabold mt-1 ${isDeltaNegative ? 'text-[#00E676]' : 'text-[#FFB000]'}`}>
            {isLoading ? '...' : `${deltaSign}${totalDelta.toFixed(3)} s`}
          </div>
          <div className="text-3xs text-[#94A3B8] font-bold mt-0.5">
            {totalDelta < 0 ? 'Comparison Faster' : totalDelta > 0 ? 'Comparison Slower' : 'Identical Pace'}
          </div>
        </div>
      </div>
    </div>
  );
};
