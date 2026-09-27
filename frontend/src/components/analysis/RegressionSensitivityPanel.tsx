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
      <div className="bg-workstation-panel border border-workstation-border rounded p-4 text-center font-mono text-xs text-workstation-textMuted">
        Computing regression and sensitivity models...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-3 font-mono text-2xs">
      {/* Left 6 cols: OLS Degradation Regression & Residual Analysis */}
      <div className="col-span-6 bg-workstation-panel border border-workstation-border rounded p-3 space-y-2.5">
        <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-1.5">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-3.5 h-3.5 text-workstation-accentCyan" />
            <span className="font-bold text-workstation-textBright tracking-wider uppercase">
              TYRE DEGRADATION OLS REGRESSION
            </span>
          </div>
          {regression && (
            <span className="text-3xs text-workstation-accentCyan">
              R² = {regression.r_squared.toFixed(3)}
            </span>
          )}
        </div>

        {regression ? (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-workstation-surface/60 border border-workstation-borderSubtle p-2 rounded">
                <div className="text-3xs text-workstation-textMuted">DEGRADATION RATE</div>
                <div className="text-sm font-bold text-workstation-telemetryAmber mt-0.5">
                  +{regression.slope.toFixed(3)} s/lap
                </div>
                <div className="text-4xs text-workstation-textMuted">
                  SE: ±{regression.slope_std_error.toFixed(4)}
                </div>
              </div>

              <div className="bg-workstation-surface/60 border border-workstation-borderSubtle p-2 rounded">
                <div className="text-3xs text-workstation-textMuted">95% CI ON RATE</div>
                <div className="text-xs font-bold text-workstation-textBright mt-1">
                  [{regression.ci_95_slope_lower.toFixed(3)}, {regression.ci_95_slope_upper.toFixed(3)}]
                </div>
                <div className="text-4xs text-workstation-textMuted">t-distribution</div>
              </div>

              <div className="bg-workstation-surface/60 border border-workstation-borderSubtle p-2 rounded">
                <div className="text-3xs text-workstation-textMuted">RESIDUAL STD (sₑ)</div>
                <div className="text-xs font-bold text-workstation-textBright mt-1">
                  ±{regression.residual_std.toFixed(3)} s
                </div>
                <div className="text-4xs text-workstation-textMuted">Unexplained pace scatter</div>
              </div>
            </div>

            {/* Regression Residual Scatter Strip */}
            <div className="bg-workstation-surface/40 border border-workstation-borderSubtle p-2 rounded space-y-1">
              <div className="flex items-center justify-between text-3xs text-workstation-textMuted">
                <span className="font-bold text-workstation-textBright">RESIDUALS AUDIT (Actual - Predicted)</span>
                <span>N={regression.sample_count} Stint Laps</span>
              </div>
              <div className="grid grid-cols-4 gap-1 text-3xs pt-1">
                {regression.residuals.slice(0, 8).map((r) => {
                  const resSign = r.residual > 0 ? '+' : '';
                  const resColor =
                    Math.abs(r.residual) > 0.1
                      ? 'text-workstation-telemetryAmber'
                      : 'text-workstation-telemetryGreen';
                  return (
                    <div
                      key={r.observation_id}
                      className="bg-workstation-panel/70 px-1.5 py-0.5 rounded border border-workstation-borderSubtle flex justify-between"
                    >
                      <span className="text-workstation-textMuted">{r.observation_id.replace('lap-demo-', 'L')}</span>
                      <span className={`font-semibold ${resColor}`}>
                        {resSign}{r.residual.toFixed(3)}s
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-workstation-textMuted text-3xs py-4 text-center">
            No regression model fitted.
          </div>
        )}
      </div>

      {/* Right 6 cols: Correlation Matrix & Empirical Sensitivity */}
      <div className="col-span-6 space-y-3">
        {/* Correlation Card */}
        <div className="bg-workstation-panel border border-workstation-border rounded p-3 space-y-2">
          <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-1.5">
            <div className="flex items-center space-x-2">
              <GitFork className="w-3.5 h-3.5 text-workstation-accentCyan" />
              <span className="font-bold text-workstation-textBright tracking-wider uppercase">
                PEARSON & SPEARMAN CORRELATION
              </span>
            </div>
            {correlation && (
              <span className="flex items-center space-x-1 text-3xs">
                {correlation.is_significant_005 ? (
                  <span className="text-workstation-telemetryGreen flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>p &lt; 0.05 SIGNIFICANT</span>
                  </span>
                ) : (
                  <span className="text-workstation-telemetryAmber flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>p ≥ 0.05 NOT SIGNIFICANT</span>
                  </span>
                )}
              </span>
            )}
          </div>

          {correlation ? (
            <div className="grid grid-cols-2 gap-2 text-2xs">
              <div className="bg-workstation-surface/60 border border-workstation-borderSubtle p-2 rounded space-y-0.5">
                <div className="text-3xs text-workstation-textMuted">PEARSON LINEAR (r)</div>
                <div className="text-base font-bold text-workstation-textBright">
                  {correlation.pearson_r.toFixed(3)}
                </div>
                <div className="text-3xs text-workstation-textMuted">
                  p-value = {correlation.pearson_p_value.toExponential(2)}
                </div>
              </div>

              <div className="bg-workstation-surface/60 border border-workstation-borderSubtle p-2 rounded space-y-0.5">
                <div className="text-3xs text-workstation-textMuted">SPEARMAN RANK (ρ)</div>
                <div className="text-base font-bold text-workstation-textBright">
                  {correlation.spearman_rho.toFixed(3)}
                </div>
                <div className="text-3xs text-workstation-textMuted">
                  p-value = {correlation.spearman_p_value.toExponential(2)}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-workstation-textMuted text-3xs py-2 text-center">
              No correlation data available.
            </div>
          )}
        </div>

        {/* Empirical Corner Sensitivity Card */}
        <div className="bg-workstation-panel border border-workstation-border rounded p-3 space-y-2">
          <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-1.5">
            <div className="flex items-center space-x-2">
              <Activity className="w-3.5 h-3.5 text-workstation-accentCyan" />
              <span className="font-bold text-workstation-textBright tracking-wider uppercase">
                MEASURED PARAMETER SENSITIVITY
              </span>
            </div>
            <span className="text-3xs text-workstation-textMuted">∂(Δt) / ∂(Feature)</span>
          </div>

          <div className="space-y-1">
            {sensitivity.map((item) => (
              <div
                key={item.feature}
                className="bg-workstation-surface/50 border border-workstation-borderSubtle p-1.5 rounded flex items-center justify-between text-3xs"
              >
                <div>
                  <span className="font-bold text-workstation-textBright">{item.feature}</span>
                  <span className="text-workstation-textMuted ml-1.5">
                    (Base: {item.baseline_value.toFixed(1)}, σ = ±{item.observed_variation_std.toFixed(1)})
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-workstation-accentCyan font-semibold">
                    {item.lap_delta_sensitivity_per_unit > 0 ? '+' : ''}
                    {item.lap_delta_sensitivity_per_unit.toFixed(4)} s/unit
                  </span>
                  <span className="text-workstation-textMuted text-4xs">
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
