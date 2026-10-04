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
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-4 text-center font-mono text-xs text-[#FFFFFF] font-bold shadow-md">
        [ EXECUTING CONSTRAINED OPTIMIZATION SOLVER AND ROBUST RISK TRADE-OFFS... ]
      </div>
    );
  }

  if (!optimizationData) {
    return (
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-4 text-center font-mono text-xs text-[#94A3B8] font-bold shadow-md">
        [ AWAITING CONSTRAINED OPTIMIZATION EXECUTION... ]
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
    <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-3 font-mono text-2xs space-y-2.5 shadow-md">
      {/* Titanium Header */}
      <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-2 bg-[#070E22] p-2 -mx-3 -mt-3 mb-2">
        <div className="flex items-center space-x-2">
          <Shield className="w-3.5 h-3.5 text-[#FFFFFF]" />
          <span className="font-bold text-[#FFFFFF] tracking-wider uppercase text-xs">
            [ CONSTRAINED OPTIMIZATION & ROBUST SCENARIOS TRADE-OFF ]
          </span>
        </div>

        <div className="flex items-center space-x-2 text-3xs font-bold">
          <span className="bg-[#070E22] border border-[#1E3A8A] px-1.5 py-0.5 text-[#FFFFFF]">
            Search: [{configured_bounds[0]}, {configured_bounds[1]}] {unit}
          </span>
          <span className="bg-[#070E22] border border-[#1E3A8A] px-1.5 py-0.5 text-[#FFFFFF]">
            Observed: [{observed_range[0]}, {observed_range[1]}] {unit}
          </span>
          <span className="bg-[#070E22] border border-[#1E3A8A] px-1.5 py-0.5 text-[#FFFFFF]">
            Model: {model_version}
          </span>
        </div>
      </div>

      {/* Scenarios Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse border border-[#1E3A8A] bg-[#070E22] shadow">
          <thead>
            <tr className="border-b border-[#1E3A8A] text-3xs text-[#FFFFFF] uppercase bg-[#0A0D15] font-bold">
              <th className="py-2 px-3 border-r border-[#1E3A8A]">[ SCENARIO TYPE ]</th>
              <th className="py-2 px-3 text-right border-r border-[#1E3A8A]">[ OPTIMIZED VALUE ]</th>
              <th className="py-2 px-3 text-right border-r border-[#1E3A8A]">[ TARGET ]</th>
              <th className="py-2 px-3 text-right border-r border-[#1E3A8A]">[ PREDICTED Δt ]</th>
              <th className="py-2 px-3 text-right border-r border-[#1E3A8A]">[ UNCERTAINTY (95%) ]</th>
              <th className="py-2 px-3 text-center border-r border-[#1E3A8A]">[ DOMAIN ]</th>
              <th className="py-2 px-3 border-r border-[#1E3A8A]">[ OBJECTIVE / TRADE-OFF ]</th>
              <th className="py-2 px-3 text-right">[ ACTION ]</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black text-2xs">
            {scenarios.map((scen: ScenarioOutcome) => {
              const isFaster = scen.predicted_delta < 0;
              const deltaColor = isFaster
                ? 'text-[#00E676]'
                : scen.predicted_delta > 0
                ? 'text-[#FFB000]'
                : 'text-[#94A3B8]';

              return (
                <tr key={scen.name} className="hover:bg-[#0E1A3D] transition-colors">
                  <td className="py-2 px-3 font-bold text-[#FFFFFF] border-r border-[#1E3A8A]">
                    <span className="flex items-center space-x-1.5">
                      <span
                        className={`w-2.5 h-2.5 border border-[#1E3A8A] inline-block ${
                          scen.scenario_type === 'NOMINAL'
                            ? 'bg-[#00F0FF]'
                            : scen.scenario_type === 'CONSERVATIVE'
                            ? 'bg-[#070E22]'
                            : 'bg-[#0E1A3D] text-[#FBBF24] border border-[#FBBF24]/50'
                        }`}
                      />
                      <span>{scen.name}</span>
                    </span>
                  </td>

                  <td className="py-2 px-3 text-right font-mono font-black text-[#FFFFFF] border-r border-[#1E3A8A]">
                    {scen.parameter_value.toFixed(2)} {unit}
                  </td>

                  <td className="py-2 px-3 text-right font-mono text-[#94A3B8] font-bold border-r border-[#1E3A8A]">
                    {scen.predicted_target.toFixed(3)}s
                  </td>

                  <td className={`py-2 px-3 text-right font-mono font-black ${deltaColor} border-r border-[#1E3A8A]`}>
                    {scen.predicted_delta > 0 ? '+' : ''}
                    {scen.predicted_delta.toFixed(4)}s
                  </td>

                  <td className="py-2 px-3 text-right font-mono text-[#94A3B8] font-bold border-r border-[#1E3A8A]">
                    ±{scen.uncertainty_95.toFixed(4)}s
                  </td>

                  <td className="py-2 px-3 text-center border-r border-[#1E3A8A]">
                    {scen.data_domain === 'INTERPOLATION' ? (
                      <span className="px-1.5 py-0.5 bg-[#00F0FF] border border-[#1E3A8A] text-[#FFFFFF] rounded-none text-4xs font-black">
                        [ INTERPOLATION ]
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-[#0E1A3D] text-[#FBBF24] border border-[#FBBF24]/50 border border-[#1E3A8A] text-[#FFB000] rounded-none text-4xs font-black">
                        [ EXTRAPOLATION ]
                      </span>
                    )}
                  </td>

                  <td className="py-2 px-3 text-3xs text-[#94A3B8] font-bold border-r border-[#1E3A8A]">
                    {scen.description}
                  </td>

                  <td className="py-2 px-3 text-right">
                    <button
                      onClick={() => onApplyScenario(scen.parameter_value)}
                      className="btn-retro text-3xs flex items-center space-x-1 ml-auto"
                      title="Load parameter value into interactive what-if slider"
                    >
                      <span>[ Apply ]</span>
                      <ArrowRight className="w-2.5 h-2.5 text-[#FFFFFF]" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-4xs text-[#CBD5E1] font-bold border-t border-[#1E3A8A] pt-1.5 flex items-center justify-between">
        <span>{disclaimer}</span>
        <span className="bg-[#070E22] border border-[#1E3A8A] px-1.5 py-0.5">VALIDATION RMSE: {validation_rmse.toFixed(4)}s</span>
      </div>
    </div>
  );
};
