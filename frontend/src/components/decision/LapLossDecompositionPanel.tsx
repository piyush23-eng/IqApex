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
      <div className="bg-workstation-panel border border-workstation-border rounded p-4 font-mono text-2xs animate-pulse text-workstation-textMuted flex items-center justify-center space-x-2 h-64">
        <Timer className="w-4 h-4 animate-spin text-workstation-accentCyan" />
        <span>DECOMPOSING TELEMETRY PHASES & CANDIDATE PARAMETER SENSITIVITIES...</span>
      </div>
    );
  }

  if (!lapLoss) {
    return (
      <div className="bg-workstation-panel border border-workstation-border rounded p-4 font-mono text-2xs text-workstation-textMuted flex items-center justify-center h-64">
        <span>No lap loss data available.</span>
      </div>
    );
  }

  return (
    <div className="bg-workstation-panel border border-workstation-border rounded p-3 font-mono text-2xs space-y-3">
      {/* Header & Total Lap Delta */}
      <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-2">
        <div className="flex items-center space-x-2">
          <Gauge className="w-3.5 h-3.5 text-workstation-accentCyan" />
          <span className="font-bold text-workstation-textBright uppercase tracking-wider text-xs">
            TELEMETRY LAP LOSS DECOMPOSITION (OBSERVED)
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-workstation-textMuted text-3xs">TOTAL LAP DELTA:</span>
          <span className="text-amber-400 font-bold text-sm">+{lapLoss.total_delta_s.toFixed(3)}s</span>
          <span className="text-4xs px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
            OBSERVED
          </span>
        </div>
      </div>

      {/* Phase Decomposition Table & Waterfall */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Phase Breakdown Table */}
        <div className="space-y-1.5">
          <div className="text-3xs text-workstation-textMuted uppercase font-semibold">
            Physical Performance Phases
          </div>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-workstation-borderSubtle text-4xs text-workstation-textMuted bg-workstation-surface/50">
                <th className="py-1 px-2">PHASE</th>
                <th className="py-1 px-2 text-right">DELTA (s)</th>
                <th className="py-1 px-2 text-right">SHARE</th>
                <th className="py-1 px-2 text-center">TYPE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-workstation-borderSubtle text-3xs">
              {lapLoss.phase_contributions.map((p) => (
                <tr key={p.phase} className="hover:bg-workstation-surface/40 transition-colors">
                  <td className="py-1 px-2 font-semibold text-workstation-textBright">
                    {p.phase}
                  </td>
                  <td className="py-1 px-2 text-right font-mono text-amber-400">
                    +{p.delta_s.toFixed(3)}s
                  </td>
                  <td className="py-1 px-2 text-right font-mono text-workstation-textMuted">
                    {p.percentage_of_lap_delta}%
                  </td>
                  <td className="py-1 px-2 text-center text-4xs text-emerald-400 font-bold">
                    {p.evidence_type}
                  </td>
                </tr>
              ))}
              <tr className="bg-workstation-surface/20 text-3xs">
                <td className="py-1 px-2 text-workstation-textMuted italic">Zero-Hidden Residual</td>
                <td className="py-1 px-2 text-right font-mono text-emerald-400">
                  {lapLoss.residual_s >= 0 ? '+' : ''}{lapLoss.residual_s.toFixed(4)}s
                </td>
                <td className="py-1 px-2 text-right font-mono text-workstation-textMuted">0.0%</td>
                <td className="py-1 px-2 text-center text-4xs text-emerald-400 font-bold">RECONCILED</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Corner Divergence Breakdown */}
        <div className="space-y-1.5">
          <div className="text-3xs text-workstation-textMuted uppercase font-semibold">
            Corner Divergence Breakdown
          </div>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-workstation-borderSubtle text-4xs text-workstation-textMuted bg-workstation-surface/50">
                <th className="py-1 px-2">CORNER</th>
                <th className="py-1 px-2">DOMINANT PHASE</th>
                <th className="py-1 px-2 text-right">ENTRY</th>
                <th className="py-1 px-2 text-right">APEX</th>
                <th className="py-1 px-2 text-right">EXIT</th>
                <th className="py-1 px-2 text-right">NET</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-workstation-borderSubtle text-3xs">
              {lapLoss.corner_contributions.map((c) => (
                <tr key={c.corner_id} className="hover:bg-workstation-surface/40 transition-colors">
                  <td className="py-1 px-2 font-bold text-workstation-accentCyan">
                    {c.corner_id}
                  </td>
                  <td className="py-1 px-2 text-workstation-textSecondary text-4xs">
                    {c.dominant_phase}
                  </td>
                  <td className="py-1 px-2 text-right font-mono text-workstation-textMuted">
                    +{c.entry_delta_s.toFixed(3)}
                  </td>
                  <td className="py-1 px-2 text-right font-mono text-workstation-textBright font-semibold">
                    +{c.apex_delta_s.toFixed(3)}
                  </td>
                  <td className="py-1 px-2 text-right font-mono text-workstation-textMuted">
                    +{c.exit_delta_s.toFixed(3)}
                  </td>
                  <td className="py-1 px-2 text-right font-mono text-amber-400 font-bold">
                    +{c.delta_s.toFixed(3)}s
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Associated Candidate Parameters Sensitivities */}
      <div className="border-t border-workstation-borderSubtle pt-2 space-y-1.5">
        <div className="flex items-center justify-between text-3xs text-workstation-textMuted">
          <span className="font-semibold uppercase tracking-wider text-workstation-textBright">
            CANDIDATE SETUP PARAMETER SENSITIVITIES (MODELLED ASSOCIATIONS)
          </span>
          <span className="text-4xs text-workstation-textMuted">
            Non-causal sensitivity estimates within observed configuration domain
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {lapLoss.candidate_parameters.map((cp) => (
            <div
              key={cp.parameter_name}
              className="bg-workstation-surface border border-workstation-borderSubtle rounded p-2 text-3xs space-y-1"
            >
              <div className="flex items-center justify-between font-bold">
                <span className="text-workstation-textBright">{cp.display_name}</span>
                <span className="px-1 py-0.2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-4xs">
                  {cp.recommended_direction}
                </span>
              </div>
              <div className="flex items-center justify-between text-workstation-textMuted">
                <span>Sensitivity:</span>
                <strong className="text-workstation-accentCyan font-mono">
                  {cp.sensitivity_value >= 0 ? '+' : ''}{cp.sensitivity_value} {cp.unit}
                </strong>
              </div>
              <p className="text-4xs text-workstation-textMuted leading-tight pt-0.5">
                {cp.modelled_phase_impact}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
