import React from 'react';
import { ResponseCurveResponse } from '../../types/optimization';
import { HelpCircle, AlertTriangle, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';

interface WhatIfResultPanelProps {
  curveData: ResponseCurveResponse | null;
}

export const WhatIfResultPanel: React.FC<WhatIfResultPanelProps> = ({ curveData }) => {
  if (!curveData) {
    return (
      <div className="bg-workstation-panel border border-workstation-border rounded p-4 text-center font-mono text-xs text-workstation-textMuted">
        Awaiting what-if parameter evaluation...
      </div>
    );
  }

  const {
    parameter_name,
    target_name,
    baseline_x,
    scenario_x,
    baseline_y,
    scenario_y,
    predicted_delta,
    uncertainty_95,
    domain_status,
    observed_range,
    model_metadata,
  } = curveData;

  const isFaster = predicted_delta < -0.0005;
  const isSlower = predicted_delta > 0.0005;
  const deltaColor = isFaster
    ? 'text-workstation-telemetryGreen'
    : isSlower
    ? 'text-workstation-telemetryAmber'
    : 'text-workstation-textMuted';

  const deltaSign = predicted_delta > 0 ? '+' : '';
  const piLower = predicted_delta - uncertainty_95;
  const piUpper = predicted_delta + uncertainty_95;

  return (
    <div className="bg-workstation-panel border border-workstation-border rounded p-3 font-mono text-2xs space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-1.5">
        <div className="flex items-center space-x-2">
          <Activity className="w-3.5 h-3.5 text-workstation-accentCyan" />
          <span className="font-bold text-workstation-textBright tracking-wider uppercase">
            MODELLED WHAT-IF PERFORMANCE RESPONSE ({parameter_name.replace(/_/g, ' ')})
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-1.5 py-0.2 bg-workstation-surface border border-workstation-borderSubtle text-workstation-accentCyan rounded text-3xs font-semibold">
            STATUS: MODELLED
          </span>
          <span
            className={`px-1.5 py-0.2 rounded text-3xs font-bold flex items-center space-x-1 ${
              domain_status === 'EXTRAPOLATION'
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                : 'bg-green-500/10 border border-green-500/30 text-workstation-telemetryGreen'
            }`}
          >
            {domain_status === 'EXTRAPOLATION' ? (
              <>
                <AlertTriangle className="w-2.5 h-2.5" />
                <span>EXTRAPOLATION</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>INTERPOLATION</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-4 gap-2.5">
        <div className="bg-workstation-surface/60 border border-workstation-borderSubtle p-2 rounded">
          <div className="text-3xs text-workstation-textMuted uppercase">BASELINE SETUP</div>
          <div className="text-sm font-bold text-workstation-textBright mt-0.5">
            {baseline_x.toFixed(1)} → {baseline_y.toFixed(3)}s
          </div>
          <div className="text-4xs text-workstation-textMuted mt-0.5">
            Measured reference {target_name.replace(/_/g, ' ')}
          </div>
        </div>

        <div className="bg-workstation-surface/60 border border-workstation-borderSubtle p-2 rounded">
          <div className="text-3xs text-workstation-textMuted uppercase">SCENARIO TARGET</div>
          <div className="text-sm font-bold text-workstation-textBright mt-0.5">
            {scenario_x.toFixed(1)} → {scenario_y.toFixed(3)}s
          </div>
          <div className="text-4xs text-workstation-textMuted mt-0.5">
            Perturbation: {scenario_x - baseline_x >= 0 ? '+' : ''}
            {(scenario_x - baseline_x).toFixed(2)} units
          </div>
        </div>

        <div className="bg-workstation-surface/80 border-l-2 border-workstation-accentCyan p-2 rounded-r">
          <div className="text-3xs text-workstation-textMuted uppercase">PREDICTED RESPONSE (Δt)</div>
          <div className={`text-base font-bold mt-0.5 ${deltaColor}`}>
            {deltaSign}{predicted_delta.toFixed(4)} s
          </div>
          <div className="text-4xs text-workstation-textMuted mt-0.5">
            Model estimates {predicted_delta < 0 ? 'lap-time improvement' : 'lap-time loss'}
          </div>
        </div>

        <div className="bg-workstation-surface/80 border-l-2 border-workstation-telemetryAmber p-2 rounded-r">
          <div className="text-3xs text-workstation-textMuted uppercase">95% PREDICTION INTERVAL</div>
          <div className="text-xs font-bold text-workstation-textBright mt-0.5">
            [{piLower.toFixed(3)}s, {piUpper.toFixed(3)}s]
          </div>
          <div className="text-4xs text-workstation-textMuted mt-0.5">
            Uncertainty: ±{uncertainty_95.toFixed(4)} s (Student t)
          </div>
        </div>
      </div>

      {/* Engineering Decision Context and Model Diagnostics */}
      <div className="bg-workstation-surface/40 border border-workstation-borderSubtle p-2.5 rounded space-y-1.5 text-3xs">
        <div className="flex items-center justify-between text-workstation-textMuted">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-3.5 h-3.5 text-workstation-telemetryGreen" />
            <span className="font-semibold text-workstation-textBright">
              MODEL GOVERNANCE & VALIDATION
            </span>
          </div>
          <span>
            Observed Domain: [{observed_range[0].toFixed(1)}, {observed_range[1].toFixed(1)}]
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 pt-1 border-t border-workstation-borderSubtle">
          <div>
            <span className="text-workstation-textMuted block">Selected Model:</span>
            <span className="font-bold text-workstation-textBright">{model_metadata.model_id}</span>
          </div>
          <div>
            <span className="text-workstation-textMuted block">Validation RMSE:</span>
            <span className="font-bold text-workstation-accentCyan">
              {model_metadata.metrics.rmse.toFixed(4)} s
            </span>
          </div>
          <div>
            <span className="text-workstation-textMuted block">Grouped CV RMSE:</span>
            <span className="font-bold text-workstation-accentCyan">
              {model_metadata.metrics.cv_rmse.toFixed(4)} s
            </span>
          </div>
          <div>
            <span className="text-workstation-textMuted block">Fit Coefficient (R²):</span>
            <span className="font-bold text-workstation-textBright">
              {model_metadata.metrics.r_squared.toFixed(3)}
            </span>
          </div>
        </div>

        <div className="border-t border-workstation-borderSubtle pt-1 text-4xs text-workstation-textMuted flex items-center space-x-1">
          <HelpCircle className="w-3 h-3 text-workstation-accentCyan shrink-0" />
          <span>
            <strong>No-Causality Guarantee:</strong> ApexIQ models statistical association within the recorded dataset.
            The predicted change is an estimated response surface evaluation, not a physically guaranteed outcome.
          </span>
        </div>
      </div>
    </div>
  );
};
