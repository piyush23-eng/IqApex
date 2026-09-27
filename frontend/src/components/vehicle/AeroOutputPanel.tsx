import React from 'react';
import { AeroEvaluationResponse } from '../../types/vehiclePerformance';
import { Wind, Gauge, Scale, AlertTriangle, ShieldCheck, Cpu } from 'lucide-react';

interface AeroOutputPanelProps {
  evaluation: AeroEvaluationResponse | null;
  isLoading: boolean;
}

export const AeroOutputPanel: React.FC<AeroOutputPanelProps> = ({ evaluation, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-workstation-panel border border-workstation-border rounded p-4 font-mono text-2xs animate-pulse text-workstation-textMuted flex items-center justify-center space-x-2 h-36">
        <Wind className="w-4 h-4 animate-spin text-workstation-accentCyan" />
        <span>EVALUATING SURROGATE PREDICTION RESPONSE...</span>
      </div>
    );
  }

  if (!evaluation) return null;

  const isExtrap = evaluation.domain_status === 'EXTRAPOLATION';

  return (
    <div className="bg-workstation-panel border border-workstation-border rounded p-3 font-mono text-2xs space-y-3">
      <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-2">
        <div className="flex items-center space-x-2">
          <Wind className="w-3.5 h-3.5 text-workstation-accentCyan" />
          <span className="font-bold text-workstation-textBright uppercase tracking-wider text-xs">
            AERODYNAMIC SURROGATE OUTPUT
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span
            className={`px-2 py-0.5 rounded text-3xs font-semibold uppercase flex items-center space-x-1 ${
              isExtrap
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            }`}
          >
            {isExtrap ? <AlertTriangle className="w-2.5 h-2.5" /> : <ShieldCheck className="w-2.5 h-2.5" />}
            <span>{evaluation.domain_status}</span>
          </span>

          <span className="text-3xs text-workstation-textMuted bg-workstation-surface px-1.5 py-0.5 rounded border border-workstation-borderSubtle">
            MOD: {evaluation.model_version}
          </span>
        </div>
      </div>

      {isExtrap && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded p-2 text-3xs text-amber-300 flex items-center space-x-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>
            EXTRAPOLATION WARNING: Current vehicle parameters lie outside the observed experimental DoE domain. Prediction intervals are widened.
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Downforce */}
        <div className="bg-workstation-surface/60 border border-workstation-borderSubtle rounded p-2.5 space-y-1">
          <div className="flex items-center justify-between text-workstation-textMuted text-3xs">
            <span>DOWNFORCE (D)</span>
            <Wind className="w-3 h-3 text-workstation-accentCyan" />
          </div>
          <div className="text-base font-bold text-workstation-textBright">
            {evaluation.downforce_n.toLocaleString()} <span className="text-3xs text-workstation-textMuted">N</span>
          </div>
          <div className="text-3xs text-workstation-textMuted">
            95% PI: [{evaluation.downforce_pi_95[0].toLocaleString()} - {evaluation.downforce_pi_95[1].toLocaleString()}]
          </div>
          <div className="text-3xs text-workstation-accentCyan">
            Cl = {evaluation.cl.toFixed(3)}
          </div>
        </div>

        {/* Drag */}
        <div className="bg-workstation-surface/60 border border-workstation-borderSubtle rounded p-2.5 space-y-1">
          <div className="flex items-center justify-between text-workstation-textMuted text-3xs">
            <span>DRAG (F_drag)</span>
            <Gauge className="w-3 h-3 text-amber-400" />
          </div>
          <div className="text-base font-bold text-workstation-textBright">
            {evaluation.drag_n.toLocaleString()} <span className="text-3xs text-workstation-textMuted">N</span>
          </div>
          <div className="text-3xs text-workstation-textMuted">
            95% PI: [{evaluation.drag_pi_95[0].toLocaleString()} - {evaluation.drag_pi_95[1].toLocaleString()}]
          </div>
          <div className="text-3xs text-amber-400">
            Cd = {evaluation.cd.toFixed(3)}
          </div>
        </div>

        {/* Lift-to-Drag Ratio */}
        <div className="bg-workstation-surface/60 border border-workstation-borderSubtle rounded p-2.5 space-y-1">
          <div className="flex items-center justify-between text-workstation-textMuted text-3xs">
            <span>AERO EFFICIENCY (L/D)</span>
            <Scale className="w-3 h-3 text-emerald-400" />
          </div>
          <div className="text-base font-bold text-workstation-textBright">
            {evaluation.lift_to_drag.toFixed(3)} <span className="text-3xs text-workstation-textMuted">ratio</span>
          </div>
          <div className="text-3xs text-workstation-textMuted">
            Higher indicates greater downforce per unit drag
          </div>
          <div className="text-3xs text-emerald-400">
            Formula Efficiency Index
          </div>
        </div>

        {/* Aero Balance */}
        <div className="bg-workstation-surface/60 border border-workstation-borderSubtle rounded p-2.5 space-y-1">
          <div className="flex items-center justify-between text-workstation-textMuted text-3xs">
            <span>FRONT AERO BALANCE</span>
            <Cpu className="w-3 h-3 text-purple-400" />
          </div>
          <div className="text-base font-bold text-workstation-textBright">
            {evaluation.aero_balance_pct.toFixed(1)}% <span className="text-3xs text-workstation-textMuted">FRONT</span>
          </div>
          <div className="text-3xs text-workstation-textMuted">
            Rear: {(100.0 - evaluation.aero_balance_pct).toFixed(1)}%
          </div>
          <div className="text-3xs text-purple-400">
            Center of Pressure Proxy
          </div>
        </div>
      </div>
    </div>
  );
};
