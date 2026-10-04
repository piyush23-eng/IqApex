import React from 'react';
import { LapLossAnalysisResponse } from '../../types/engineeringAnalysis';
import { Timer, Gauge } from 'lucide-react';

interface LapLossDecompositionPanelProps {
  lapLoss: LapLossAnalysisResponse | null;
  isLoading: boolean;
}

export const LapLossDecompositionPanel: React.FC<LapLossDecompositionPanelProps> = ({
  lapLoss,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-4 font-mono text-2xs text-[#FFFFFF] flex items-center justify-center space-x-2 h-64 shadow-md">
        <Timer className="w-4 h-4 animate-spin text-[#FFFFFF]" />
        <span className="font-bold uppercase">[ DECOMPOSING TELEMETRY PHASES & CANDIDATE PARAMETER SENSITIVITIES... ]</span>
      </div>
    );
  }

  if (!lapLoss) {
    return (
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-4 font-mono text-2xs text-[#94A3B8] font-bold flex items-center justify-center h-64 shadow-md">
        <span>[ NO LAP LOSS DATA AVAILABLE ]</span>
      </div>
    );
  }

  return (
    <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-0 shadow-md font-mono">
      {/* Header & Total Lap Delta */}
      <div className="window-header-retro bg-[#070E22] border-b border-[#1E3A8A] px-3 py-1.5 flex items-center justify-between text-[#FFFFFF] font-extrabold">
        <div className="flex items-center space-x-2">
          <Gauge className="w-3.5 h-3.5 text-[#FFFFFF] stroke-[2.5]" />
          <span className="font-extrabold text-[#FFFFFF] uppercase tracking-wider text-2xs">
            [ TELEMETRY LAP LOSS DECOMPOSITION ]
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[#94A3B8] text-3xs font-bold uppercase">TOTAL LAP DELTA:</span>
          <span className="text-[#FFB000] font-black text-xs bg-[#070E22] px-1.5 py-0.5 border border-[#1E3A8A] shadow-sm">
            +{lapLoss.total_delta_s.toFixed(3)}s
          </span>
          <span className="text-3xs px-2 py-0.5 bg-[#00F0FF] border border-[#1E3A8A] text-[#FFFFFF] font-extrabold shadow-sm">
            OBSERVED ✕
          </span>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Phase Decomposition Table & Waterfall */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Phase Breakdown Table */}
          <div className="space-y-1.5 bg-[#070E22] border border-[#1E3A8A] p-2.5 shadow">
            <div className="text-3xs text-[#FFFFFF] uppercase font-black border-b border-[#1E3A8A] pb-1">
              Physical Performance Phases
            </div>
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#1E3A8A] text-3xs text-[#FFFFFF] font-bold uppercase bg-[#161D2B]">
                  <th className="py-1 px-2">PHASE</th>
                  <th className="py-1 px-2 text-right">DELTA (s)</th>
                  <th className="py-1 px-2 text-right">SHARE</th>
                  <th className="py-1 px-2 text-center">TYPE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black text-3xs">
                {lapLoss.phase_contributions.map((p) => (
                  <tr key={p.phase} className="hover:bg-[#0A132E] transition-colors">
                    <td className="py-1 px-2 font-bold text-[#FFFFFF]">
                      {p.phase}
                    </td>
                    <td className="py-1 px-2 text-right font-mono text-[#FFB000] font-black">
                      +{p.delta_s.toFixed(3)}s
                    </td>
                    <td className="py-1 px-2 text-right font-mono text-[#94A3B8] font-bold">
                      {p.percentage_of_lap_delta}%
                    </td>
                    <td className="py-1 px-2 text-center text-4xs text-[#FFFFFF] font-extrabold">
                      <span className="bg-[#00F0FF] px-1 py-0.2 border border-[#1E3A8A]">{p.evidence_type}</span>
                    </td>
                  </tr>
                ))}
                <tr className="bg-[#030712] text-3xs font-bold border-t border-[#1E3A8A]">
                  <td className="py-1 px-2 text-[#FFFFFF] italic">Zero-Hidden Residual</td>
                  <td className="py-1 px-2 text-right font-mono text-[#00E676] font-black">
                    {lapLoss.residual_s >= 0 ? '+' : ''}{lapLoss.residual_s.toFixed(4)}s
                  </td>
                  <td className="py-1 px-2 text-right font-mono text-[#94A3B8]">0.0%</td>
                  <td className="py-1 px-2 text-center text-4xs text-[#FFFFFF] font-extrabold">
                    <span className="bg-[#070E22] px-1 py-0.2 border border-[#1E3A8A]">RECONCILED</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Corner Divergence Breakdown */}
          <div className="space-y-1.5 bg-[#070E22] border border-[#1E3A8A] p-2.5 shadow">
            <div className="text-3xs text-[#FFFFFF] uppercase font-black border-b border-[#1E3A8A] pb-1">
              Corner Divergence Breakdown
            </div>
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#1E3A8A] text-3xs text-[#FFFFFF] font-bold uppercase bg-[#161D2B]">
                  <th className="py-1 px-2">CORNER</th>
                  <th className="py-1 px-2">PHASE</th>
                  <th className="py-1 px-2 text-right">ENTRY</th>
                  <th className="py-1 px-2 text-right">APEX</th>
                  <th className="py-1 px-2 text-right">EXIT</th>
                  <th className="py-1 px-2 text-right">NET</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black text-3xs">
                {lapLoss.corner_contributions.map((c) => (
                  <tr key={c.corner_id} className="hover:bg-[#0A132E] transition-colors">
                    <td className="py-1 px-2 font-black text-[#FFFFFF]">
                      <span className="bg-[#0E1A3D] text-[#00F0FF] px-1 py-0.2 border border-[#1E3A8A]">{c.corner_id}</span>
                    </td>
                    <td className="py-1 px-2 text-[#CBD5E1] text-4xs font-bold">
                      {c.dominant_phase}
                    </td>
                    <td className="py-1 px-2 text-right font-mono text-[#94A3B8]">
                      +{c.entry_delta_s.toFixed(3)}
                    </td>
                    <td className="py-1 px-2 text-right font-mono text-[#FFFFFF] font-bold">
                      +{c.apex_delta_s.toFixed(3)}
                    </td>
                    <td className="py-1 px-2 text-right font-mono text-[#94A3B8]">
                      +{c.exit_delta_s.toFixed(3)}
                    </td>
                    <td className="py-1 px-2 text-right font-mono text-[#FFB000] font-black">
                      +{c.delta_s.toFixed(3)}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Associated Candidate Parameters Sensitivities */}
        <div className="border-t border-[#1E3A8A] pt-2 space-y-1.5">
          <div className="flex items-center justify-between text-3xs text-[#FFFFFF] font-bold">
            <span className="font-extrabold uppercase tracking-wider text-[#FFFFFF]">
              [ CANDIDATE SETUP PARAMETER SENSITIVITIES ]
            </span>
            <span className="text-4xs text-[#94A3B8]">
              Non-causal sensitivity estimates within observed configuration domain
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {lapLoss.candidate_parameters.map((cp) => (
              <div
                key={cp.parameter_name}
                className="bg-[#070E22] border border-[#1E3A8A] p-2 text-3xs space-y-1 shadow"
              >
                <div className="flex items-center justify-between font-extrabold">
                  <span className="text-[#FFFFFF]">{cp.display_name}</span>
                  <span className="px-1.5 py-0.2 bg-[#FFB000] border border-[#1E3A8A] text-[#FFFFFF] text-4xs font-bold">
                    {cp.recommended_direction}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#94A3B8] font-bold">
                  <span>Sensitivity:</span>
                  <strong className="text-[#FFFFFF] font-mono font-black">
                    {cp.sensitivity_value >= 0 ? '+' : ''}{cp.sensitivity_value} {cp.unit}
                  </strong>
                </div>
                <p className="text-4xs text-[#CBD5E1] font-medium leading-tight pt-0.5 border-t border-[#EAEAEA]">
                  {cp.modelled_phase_impact}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
