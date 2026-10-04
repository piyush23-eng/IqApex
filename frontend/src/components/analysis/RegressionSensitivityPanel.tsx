import React from 'react';
import { RegressionResult, CorrelationResult, SensitivityItem } from '../../types/decomposition';
import { TrendingUp, GitFork, Activity, CheckCircle2, AlertTriangle } from 'lucide-react';

interface RegressionSensitivityPanelProps {
  regression: RegressionResult | null;
  correlation: CorrelationResult | null;
  sensitivity: SensitivityItem[];
  isLoading?: boolean;
}

export const RegressionSensitivityPanel: React.FC<RegressionSensitivityPanelProps> = ({
  regression,
  correlation,
  sensitivity,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-4 text-center font-mono text-xs text-[#FFFFFF] shadow-md">
        Computing regression and sensitivity models...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-3 font-mono text-2xs">
      {/* Left 6 cols: OLS Degradation Regression & Residual Analysis */}
      <div className="col-span-12 md:col-span-6 window-retro bg-[#0A132E] border border-[#1E3A8A] p-0 shadow-md">
        <div className="window-header-retro bg-[#070E22] border-b border-[#1E3A8A] px-3 py-1.5 flex items-center justify-between text-[#FFFFFF] font-extrabold">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-3.5 h-3.5 text-[#FFFFFF] stroke-[2.5]" />
            <span className="font-extrabold text-[#FFFFFF] tracking-wider uppercase text-2xs">
              [ TYRE DEGRADATION OLS REGRESSION ]
            </span>
          </div>
          {regression && (
            <span className="text-3xs bg-[#00F0FF] text-[#FFFFFF] font-black px-1.5 py-0.2 border border-[#1E3A8A] shadow-sm">
              R² = {regression.r_squared.toFixed(3)}
            </span>
          )}
        </div>

        <div className="p-3 space-y-3">
          {regression ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#070E22] border border-[#1E3A8A] p-2 shadow">
                  <div className="text-3xs text-[#94A3B8] font-bold">DEGRADATION RATE</div>
                  <div className="text-sm font-black text-[#FFB000] mt-0.5">
                    +{regression.slope.toFixed(3)} s/lap
                  </div>
                  <div className="text-4xs text-[#94A3B8]">
                    SE: ±{regression.slope_std_error.toFixed(4)}
                  </div>
                </div>

                <div className="bg-[#070E22] border border-[#1E3A8A] p-2 shadow">
                  <div className="text-3xs text-[#94A3B8] font-bold">95% CI ON RATE</div>
                  <div className="text-xs font-black text-[#FFFFFF] mt-1">
                    [{regression.ci_95_slope_lower.toFixed(3)}, {regression.ci_95_slope_upper.toFixed(3)}]
                  </div>
                  <div className="text-4xs text-[#94A3B8]">t-distribution</div>
                </div>

                <div className="bg-[#070E22] border border-[#1E3A8A] p-2 shadow">
                  <div className="text-3xs text-[#94A3B8] font-bold">RESIDUAL STD (sₑ)</div>
                  <div className="text-xs font-black text-[#FFFFFF] mt-1">
                    ±{regression.residual_std.toFixed(3)} s
                  </div>
                  <div className="text-4xs text-[#94A3B8]">Unexplained pace scatter</div>
                </div>
              </div>

              {/* Regression Residual Scatter Strip */}
              <div className="bg-[#070E22] border border-[#1E3A8A] p-2 space-y-1 shadow">
                <div className="flex items-center justify-between text-3xs text-[#FFFFFF] font-extrabold border-b border-[#1E3A8A] pb-1">
                  <span>RESIDUALS AUDIT (Actual - Predicted)</span>
                  <span className="text-[#94A3B8]">N={regression.sample_count} Stint Laps</span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-3xs pt-1">
                  {regression.residuals.slice(0, 8).map((r) => {
                    const resSign = r.residual > 0 ? '+' : '';
                    const resColor =
                      Math.abs(r.residual) > 0.1
                        ? 'text-[#FFB000] font-black'
                        : 'text-[#00E676] font-black';
                    return (
                      <div
                        key={r.observation_id}
                        className="bg-[#070E22] px-1.5 py-0.5 border border-[#1E3A8A] flex justify-between font-mono"
                      >
                        <span className="text-[#94A3B8] font-bold">{r.observation_id.replace('lap-demo-', 'L')}</span>
                        <span className={resColor}>
                          {resSign}{r.residual.toFixed(3)}s
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-[#94A3B8] text-3xs py-4 text-center font-bold">
              No regression model fitted.
            </div>
          )}
        </div>
      </div>

      {/* Right 6 cols: Correlation Matrix & Empirical Sensitivity */}
      <div className="col-span-12 md:col-span-6 space-y-3">
        {/* Correlation Card */}
        <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-0 shadow-md">
          <div className="window-header-retro bg-[#070E22] border-b border-[#1E3A8A] px-3 py-1.5 flex items-center justify-between text-[#FFFFFF] font-extrabold">
            <div className="flex items-center space-x-2">
              <GitFork className="w-3.5 h-3.5 text-[#FFFFFF] stroke-[2.5]" />
              <span className="font-extrabold text-[#FFFFFF] tracking-wider uppercase text-2xs">
                [ PEARSON & SPEARMAN CORRELATION ]
              </span>
            </div>
            {correlation && (
              <span className="flex items-center space-x-1 text-3xs">
                {correlation.is_significant_005 ? (
                  <span className="px-1.5 py-0.2 bg-[#00F0FF] border border-[#1E3A8A] text-[#FFFFFF] font-extrabold shadow-sm flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>p &lt; 0.05 SIGNIFICANT ✕</span>
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 bg-[#FFB000] border border-[#1E3A8A] text-[#FFFFFF] font-extrabold shadow-sm flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>p ≥ 0.05 NOT SIGNIFICANT ✕</span>
                  </span>
                )}
              </span>
            )}
          </div>

          <div className="p-3">
            {correlation ? (
              <div className="grid grid-cols-2 gap-2 text-2xs">
                <div className="bg-[#070E22] border border-[#1E3A8A] p-2 shadow space-y-0.5">
                  <div className="text-3xs text-[#94A3B8] font-bold">PEARSON LINEAR (r)</div>
                  <div className="text-base font-black text-[#FFFFFF]">
                    {correlation.pearson_r.toFixed(3)}
                  </div>
                  <div className="text-3xs text-[#94A3B8] font-mono">
                    p-value = {correlation.pearson_p_value.toExponential(2)}
                  </div>
                </div>

                <div className="bg-[#070E22] border border-[#1E3A8A] p-2 shadow space-y-0.5">
                  <div className="text-3xs text-[#94A3B8] font-bold">SPEARMAN RANK (ρ)</div>
                  <div className="text-base font-black text-[#FFFFFF]">
                    {correlation.spearman_rho.toFixed(3)}
                  </div>
                  <div className="text-3xs text-[#94A3B8] font-mono">
                    p-value = {correlation.spearman_p_value.toExponential(2)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-[#94A3B8] text-3xs py-2 text-center font-bold">
                No correlation data available.
              </div>
            )}
          </div>
        </div>

        {/* Empirical Corner Sensitivity Card */}
        <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-0 shadow-md">
          <div className="window-header-retro bg-[#070E22] border-b border-[#1E3A8A] px-3 py-1.5 flex items-center justify-between text-[#FFFFFF] font-extrabold">
            <div className="flex items-center space-x-2">
              <Activity className="w-3.5 h-3.5 text-[#FFFFFF] stroke-[2.5]" />
              <span className="font-extrabold text-[#FFFFFF] tracking-wider uppercase text-2xs">
                [ MEASURED PARAMETER SENSITIVITY ]
              </span>
            </div>
            <span className="text-3xs text-[#94A3B8] font-bold">∂(Δt) / ∂(Feature)</span>
          </div>

          <div className="p-3 space-y-1.5">
            {sensitivity.map((item) => (
              <div
                key={item.feature}
                className="bg-[#070E22] border border-[#1E3A8A] p-2 flex items-center justify-between text-3xs shadow-sm"
              >
                <div>
                  <span className="font-black text-[#FFFFFF]">{item.feature}</span>
                  <span className="text-[#94A3B8] ml-1.5">
                    (Base: {item.baseline_value.toFixed(1)}, σ = ±{item.observed_variation_std.toFixed(1)})
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-[#FFFFFF] font-mono font-black bg-[#161D2B] px-1 border border-[#1E3A8A]">
                    {item.lap_delta_sensitivity_per_unit > 0 ? '+' : ''}
                    {item.lap_delta_sensitivity_per_unit.toFixed(4)} s/unit
                  </span>
                  <span className="text-[#94A3B8] text-4xs font-bold">
                    p = {item.uncertainty_p_value.toFixed(3)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
