import React from 'react';
import { ConstrainedOptimizationResponse, ScenarioOutcome } from '../../types/optimization';
import { Shield, ArrowRight } from 'lucide-react';

interface ConstrainedOptimizationPanelProps {
  optimizationData: ConstrainedOptimizationResponse | null;
  onApplyScenario: (paramVal: number) => void;
  isLoading?: boolean;
}

export const ConstrainedOptimizationPanel: React.FC<ConstrainedOptimizationPanelProps> = ({
  optimizationData,
  onApplyScenario,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-workstation-panel border border-workstation-border rounded p-4 text-center font-mono text-xs text-workstation-textMuted">
        Executing constrained optimization solver and robust risk trade-offs...
      </div>
    );
  }

  if (!optimizationData) {
    return (
      <div className="bg-workstation-panel border border-workstation-border rounded p-4 text-center font-mono text-xs text-workstation-textMuted">
        Awaiting constrained optimization execution...
      </div>
    );
  }

  const {
    unit,
    observed_range,
    configured_bounds,
    scenarios,
    model_version,
    validation_rmse,
    disclaimer,
  } = optimizationData;

  return (
    <div className="bg-workstation-panel border border-workstation-border rounded p-3 font-mono text-2xs space-y-2.5">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-1.5">
        <div className="flex items-center space-x-2">
          <Shield className="w-3.5 h-3.5 text-workstation-accentCyan" />
          <span className="font-bold text-workstation-textBright tracking-wider uppercase">
            CONSTRAINED OPTIMIZATION & ROBUST SCENARIOS TRADE-OFF
          </span>
        </div>

        <div className="flex items-center space-x-3 text-3xs text-workstation-textMuted">
          <span>Search Bounds: [{configured_bounds[0]}, {configured_bounds[1]}] {unit}</span>
          <span>Observed: [{observed_range[0]}, {observed_range[1]}] {unit}</span>
          <span>Model: {model_version}</span>
        </div>
      </div>

      {/* Scenarios Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-workstation-border text-3xs text-workstation-textMuted uppercase bg-workstation-surface/40">
              <th className="py-1.5 px-2">SCENARIO TYPE</th>
              <th className="py-1.5 px-2 text-right">OPTIMIZED VALUE</th>
              <th className="py-1.5 px-2 text-right">PREDICTED TARGET</th>
              <th className="py-1.5 px-2 text-right">PREDICTED Δt</th>
              <th className="py-1.5 px-2 text-right">UNCERTAINTY (95%)</th>
              <th className="py-1.5 px-2 text-center">DOMAIN</th>
              <th className="py-1.5 px-2">OBJECTIVE / TRADE-OFF</th>
              <th className="py-1.5 px-2 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-workstation-borderSubtle">
            {scenarios.map((scen: ScenarioOutcome) => {
              const isFaster = scen.predicted_delta < 0;
              const deltaColor = isFaster
                ? 'text-workstation-telemetryGreen'
                : scen.predicted_delta > 0
                ? 'text-workstation-telemetryAmber'
                : 'text-workstation-textMuted';

              return (
                <tr key={scen.name} className="hover:bg-workstation-surface/50 transition-colors">
                  <td className="py-2 px-2 font-bold text-workstation-textBright">
                    <span className="flex items-center space-x-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          scen.scenario_type === 'NOMINAL'
                            ? 'bg-workstation-telemetryGreen'
                            : scen.scenario_type === 'CONSERVATIVE'
                            ? 'bg-workstation-accentCyan'
                            : 'bg-workstation-telemetryAmber'
                        }`}
                      />
                      <span>{scen.name}</span>
                    </span>
                  </td>

                  <td className="py-2 px-2 text-right font-mono font-bold text-workstation-textBright">
                    {scen.parameter_value.toFixed(2)} {unit}
                  </td>

                  <td className="py-2 px-2 text-right font-mono text-workstation-textMuted">
                    {scen.predicted_target.toFixed(3)}s
                  </td>

                  <td className={`py-2 px-2 text-right font-mono font-bold ${deltaColor}`}>
                    {scen.predicted_delta > 0 ? '+' : ''}
                    {scen.predicted_delta.toFixed(4)}s
                  </td>

                  <td className="py-2 px-2 text-right font-mono text-workstation-textMuted">
                    ±{scen.uncertainty_95.toFixed(4)}s
                  </td>

                  <td className="py-2 px-2 text-center">
                    {scen.data_domain === 'INTERPOLATION' ? (
                      <span className="px-1.5 py-0.2 bg-green-500/10 border border-green-500/30 text-workstation-telemetryGreen rounded text-4xs font-semibold">
                        INTERPOLATION
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded text-4xs font-bold">
                        EXTRAPOLATION
                      </span>
                    )}
                  </td>

                  <td className="py-2 px-2 text-3xs text-workstation-textMuted">
                    {scen.description}
                  </td>

                  <td className="py-2 px-2 text-right">
                    <button
                      onClick={() => onApplyScenario(scen.parameter_value)}
                      className="px-2 py-0.5 bg-workstation-surface hover:bg-workstation-borderSubtle border border-workstation-border hover:border-workstation-accentCyan text-workstation-textBright rounded flex items-center space-x-1 ml-auto text-3xs transition-colors"
                      title="Load parameter value into interactive what-if slider"
                    >
                      <span>Apply</span>
                      <ArrowRight className="w-2.5 h-2.5 text-workstation-accentCyan" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-4xs text-workstation-textMuted border-t border-workstation-borderSubtle pt-1 flex items-center justify-between">
        <span>{disclaimer}</span>
        <span>Validation RMSE: {validation_rmse.toFixed(4)}s</span>
      </div>
    </div>
  );
};
