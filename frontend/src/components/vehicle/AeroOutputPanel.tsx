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
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-4 font-mono text-2xs text-[#FFFFFF] flex items-center justify-center space-x-2 h-36 shadow-md">
        <Wind className="w-4 h-4 animate-spin text-[#FFFFFF]" />
        <span className="font-bold uppercase">[ EVALUATING SURROGATE PREDICTION RESPONSE... ]</span>
      </div>
    );
  }

  if (!evaluation) return null;

  const isExtrap = evaluation.domain_status === 'EXTRAPOLATION';

  return (
    <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-3 font-mono text-2xs space-y-3 shadow-md">
      {/* Titanium Header */}
      <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-2 bg-[#070E22] p-2 -mx-3 -mt-3 mb-2">
        <div className="flex items-center space-x-2">
          <Wind className="w-3.5 h-3.5 text-[#FFFFFF]" />
          <span className="font-bold text-[#FFFFFF] uppercase tracking-wider text-xs">
            [ AERODYNAMIC SURROGATE OUTPUT ]
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span
            className={`px-2 py-0.5 border border-[#1E3A8A] text-3xs font-bold uppercase flex items-center space-x-1 ${
              isExtrap
                ? 'bg-[#0E1A3D] text-[#FBBF24] border border-[#FBBF24]/50 text-[#FFB000]'
                : 'bg-[#00F0FF] text-[#FFFFFF]'
            }`}
          >
            {isExtrap ? <AlertTriangle className="w-2.5 h-2.5" /> : <ShieldCheck className="w-2.5 h-2.5" />}
            <span>[ {evaluation.domain_status} ]</span>
          </span>

          <span className="text-3xs text-[#FFFFFF] font-bold bg-[#070E22] px-1.5 py-0.5 border border-[#1E3A8A]">
            MOD: {evaluation.model_version}
          </span>
        </div>
      </div>

      {isExtrap && (
        <div className="bg-[#0E1A3D] text-[#FBBF24] border border-[#FBBF24]/50 border border-[#1E3A8A] p-2 text-3xs text-[#FFFFFF] font-bold flex items-center space-x-2 shadow">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[#FFB000]" />
          <span>
            [ EXTRAPOLATION WARNING ]: Current vehicle parameters lie outside the observed experimental DoE domain. Prediction intervals are widened.
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Downforce */}
        <div className="bg-[#070E22] border border-[#1E3A8A] p-2.5 space-y-1 shadow">
          <div className="flex items-center justify-between text-[#94A3B8] text-3xs font-bold uppercase">
            <span>DOWNFORCE (D)</span>
            <Wind className="w-3.5 h-3.5 text-[#FFFFFF]" />
          </div>
          <div className="text-base font-black text-[#FFFFFF]">
            {evaluation.downforce_n.toLocaleString()} <span className="text-3xs font-normal text-[#94A3B8]">N</span>
          </div>
          <div className="text-4xs text-[#94A3B8] font-bold">
            95% PI: [{evaluation.downforce_pi_95[0].toLocaleString()} - {evaluation.downforce_pi_95[1].toLocaleString()}]
          </div>
          <div className="text-3xs text-[#00E676] font-black">
            Cl = {evaluation.cl.toFixed(3)}
          </div>
        </div>

        {/* Drag */}
        <div className="bg-[#070E22] border border-[#1E3A8A] p-2.5 space-y-1 shadow">
          <div className="flex items-center justify-between text-[#94A3B8] text-3xs font-bold uppercase">
            <span>DRAG (F_drag)</span>
            <Gauge className="w-3.5 h-3.5 text-[#FFFFFF]" />
          </div>
          <div className="text-base font-black text-[#FFFFFF]">
            {evaluation.drag_n.toLocaleString()} <span className="text-3xs font-normal text-[#94A3B8]">N</span>
          </div>
          <div className="text-4xs text-[#94A3B8] font-bold">
            95% PI: [{evaluation.drag_pi_95[0].toLocaleString()} - {evaluation.drag_pi_95[1].toLocaleString()}]
          </div>
          <div className="text-3xs text-[#FFB000] font-black">
            Cd = {evaluation.cd.toFixed(3)}
          </div>
        </div>

        {/* Lift-to-Drag Ratio */}
        <div className="bg-[#070E22] border border-[#1E3A8A] p-2.5 space-y-1 shadow">
          <div className="flex items-center justify-between text-[#94A3B8] text-3xs font-bold uppercase">
            <span>EFFICIENCY (L/D)</span>
            <Scale className="w-3.5 h-3.5 text-[#FFFFFF]" />
          </div>
          <div className="text-base font-black text-[#FFFFFF]">
            {evaluation.lift_to_drag.toFixed(3)} <span className="text-3xs font-normal text-[#94A3B8]">ratio</span>
          </div>
          <div className="text-4xs text-[#94A3B8] font-bold">
            Downforce per unit drag
          </div>
          <div className="text-3xs text-[#00E676] font-black">
            Formula Efficiency Index
          </div>
        </div>

        {/* Aero Balance */}
        <div className="bg-[#070E22] border border-[#1E3A8A] p-2.5 space-y-1 shadow">
          <div className="flex items-center justify-between text-[#94A3B8] text-3xs font-bold uppercase">
            <span>FRONT AERO BAL</span>
            <Cpu className="w-3.5 h-3.5 text-[#FFFFFF]" />
          </div>
          <div className="text-base font-black text-[#FFFFFF]">
            {evaluation.aero_balance_pct.toFixed(1)}% <span className="text-3xs font-normal text-[#94A3B8]">FRONT</span>
          </div>
          <div className="text-4xs text-[#94A3B8] font-bold">
            Rear: {(100.0 - evaluation.aero_balance_pct).toFixed(1)}%
          </div>
          <div className="text-3xs text-[#FFFFFF] font-black">
            Center of Pressure Proxy
          </div>
        </div>
      </div>
    </div>
  );
};
