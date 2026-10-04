import React from 'react';
import { ResponseCurveResponse } from '../../types/optimization';
import { HelpCircle, AlertTriangle, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';

interface WhatIfResultPanelProps {
  curveData: ResponseCurveResponse | null;
}

export const WhatIfResultPanel: React.FC<WhatIfResultPanelProps> = ({ curveData }) => {
  if (!curveData) {
    return (
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-4 text-center font-mono text-xs text-[#94A3B8] font-bold shadow-md">
        [ AWAITING WHAT-IF PARAMETER EVALUATION... ]
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
    ? 'text-[#00E676]'
    : isSlower
    ? 'text-[#FFB000]'
    : 'text-[#94A3B8]';

  const deltaSign = predicted_delta > 0 ? '+' : '';
  const piLower = predicted_delta - uncertainty_95;
  const piUpper = predicted_delta + uncertainty_95;

  return (
    <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-3 font-mono text-2xs space-y-2.5 shadow-md">
      {/* Titanium Header */}
      <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-2 bg-[#070E22] p-2 -mx-3 -mt-3 mb-2">
        <div className="flex items-center space-x-2">
          <Activity className="w-3.5 h-3.5 text-[#FFFFFF]" />
          <span className="font-bold text-[#FFFFFF] tracking-wider uppercase text-xs">
            [ MODELLED WHAT-IF PERFORMANCE RESPONSE ({parameter_name.replace(/_/g, ' ')}) ]
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 bg-[#070E22] border border-[#1E3A8A] text-[#FFFFFF] text-3xs font-bold shadow-sm">
            STATUS: MODELLED
          </span>
          <span
            className={`px-2 py-0.5 border border-[#1E3A8A] text-3xs font-black flex items-center space-x-1 shadow-sm ${
              domain_status === 'EXTRAPOLATION'
                ? 'bg-[#0E1A3D] text-[#FBBF24] border border-[#FBBF24]/50 text-[#FFB000]'
                : 'bg-[#00F0FF] text-[#FFFFFF]'
            }`}
          >
            {domain_status === 'EXTRAPOLATION' ? (
              <>
                <AlertTriangle className="w-3 h-3" />
                <span>[ EXTRAPOLATION ]</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3 h-3" />
                <span>[ INTERPOLATION ]</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-4 gap-2.5">
        <div className="bg-[#070E22] border border-[#1E3A8A] p-2.5 shadow">
          <div className="text-3xs text-[#94A3B8] font-bold uppercase">[ BASELINE SETUP ]</div>
          <div className="text-base font-black text-[#FFFFFF] mt-0.5">
            {baseline_x.toFixed(1)} → {baseline_y.toFixed(3)}s
          </div>
          <div className="text-4xs text-[#94A3B8] font-bold mt-0.5">
            Measured reference {target_name.replace(/_/g, ' ')}
          </div>
        </div>

        <div className="bg-[#070E22] border border-[#1E3A8A] p-2.5 shadow">
          <div className="text-3xs text-[#94A3B8] font-bold uppercase">[ SCENARIO TARGET ]</div>
          <div className="text-base font-black text-[#FFFFFF] mt-0.5">
            {scenario_x.toFixed(1)} → {scenario_y.toFixed(3)}s
          </div>
          <div className="text-4xs text-[#94A3B8] font-bold mt-0.5">
            Perturbation: {scenario_x - baseline_x >= 0 ? '+' : ''}
            {(scenario_x - baseline_x).toFixed(2)} units
          </div>
        </div>

        <div className="bg-[#070E22] border border-[#1E3A8A] p-2.5 shadow">
          <div className="text-3xs text-[#94A3B8] font-bold uppercase">[ PREDICTED RESPONSE (Δt) ]</div>
          <div className={`text-base font-black mt-0.5 ${deltaColor}`}>
            {deltaSign}{predicted_delta.toFixed(4)} s
          </div>
          <div className="text-4xs text-[#94A3B8] font-bold mt-0.5">
            Model estimates {predicted_delta < 0 ? 'lap-time improvement' : 'lap-time loss'}
          </div>
        </div>

        <div className="bg-[#070E22] border border-[#1E3A8A] p-2.5 shadow">
          <div className="text-3xs text-[#94A3B8] font-bold uppercase">[ 95% PREDICTION INTERVAL ]</div>
          <div className="text-sm font-black text-[#FFFFFF] mt-0.5">
            [{piLower.toFixed(3)}s, {piUpper.toFixed(3)}s]
          </div>
          <div className="text-4xs text-[#94A3B8] font-bold mt-0.5">
            Uncertainty: ±{uncertainty_95.toFixed(4)} s (Student t)
          </div>
        </div>
      </div>

      {/* Engineering Decision Context and Model Diagnostics */}
      <div className="bg-[#0A0D15] border border-[#1E3A8A] p-2.5 space-y-1.5 text-3xs text-[#FFFFFF] font-bold shadow-sm">
        <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-1">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00E676]" />
            <span className="font-bold text-[#FFFFFF] uppercase">
              [ MODEL GOVERNANCE & VALIDATION ]
            </span>
          </div>
          <span className="bg-[#070E22] border border-[#1E3A8A] px-1.5 py-0.5">
            Observed Domain: [{observed_range[0].toFixed(1)}, {observed_range[1].toFixed(1)}]
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 pt-0.5">
          <div>
            <span className="text-[#94A3B8] block">Selected Model:</span>
            <span className="font-black text-[#FFFFFF]">{model_metadata.model_id}</span>
          </div>
          <div>
            <span className="text-[#94A3B8] block">Validation RMSE:</span>
            <span className="font-black text-[#FFFFFF]">
              {model_metadata.metrics.rmse.toFixed(4)} s
            </span>
          </div>
          <div>
            <span className="text-[#94A3B8] block">Grouped CV RMSE:</span>
            <span className="font-black text-[#FFFFFF]">
              {model_metadata.metrics.cv_rmse.toFixed(4)} s
            </span>
          </div>
          <div>
            <span className="text-[#94A3B8] block">Fit Coefficient (R²):</span>
            <span className="font-black text-[#FFFFFF]">
              {model_metadata.metrics.r_squared.toFixed(3)}
            </span>
          </div>
        </div>

        <div className="border-t border-[#1E3A8A] pt-1 text-4xs text-[#CBD5E1] flex items-center space-x-1">
          <HelpCircle className="w-3.5 h-3.5 text-[#FFFFFF] shrink-0" />
          <span>
            <strong>NO-CAUSALITY GUARANTEE:</strong> ApexIQ models statistical association within the recorded dataset.
            The predicted change is an estimated response surface evaluation, not a physically guaranteed outcome.
          </span>
        </div>
      </div>
    </div>
  );
};
