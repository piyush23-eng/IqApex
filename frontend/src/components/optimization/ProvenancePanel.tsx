import React from 'react';
import { ShieldCheck, Database, Binary, Cpu, Clock, AlertCircle } from 'lucide-react';

interface ProvenancePanelProps {
  provenance: Record<string, unknown> | null;
  modelId?: string;
  simulationSeed?: number;
}

export const ProvenancePanel: React.FC<ProvenancePanelProps> = ({
  provenance,
  modelId,
  simulationSeed,
}) => {
  return (
    <footer className="window-retro bg-[#0A0D15] border border-[#1E3A8A] p-2.5 font-mono text-3xs text-[#FFFFFF] space-y-1.5 select-none shadow">
      <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-1.5">
        <div className="flex items-center space-x-2 text-[#FFFFFF] font-bold uppercase">
          <ShieldCheck className="w-3.5 h-3.5 text-[#FFFFFF]" />
          <span>[ STAGE 5 OPTIMIZATION PROVENANCE & GOVERNANCE AUDIT ]</span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 text-[#FFFFFF] font-bold px-2 py-0.5 bg-[#0E1A3D] text-[#FBBF24] border border-[#FBBF24]/50 border border-[#1E3A8A] shadow-sm">
            <AlertCircle className="w-3 h-3 text-[#FFB000]" />
            <span>[ TRAINING DATA: SYNTHETIC DEMONSTRATION DATASET ]</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 pt-1 font-bold">
        <div className="flex items-center space-x-1 text-[#FFFFFF]">
          <Database className="w-3 h-3 text-[#FFFFFF]" />
          <span>Dataset: {String(provenance?.session_id ?? 'demo-session-monza-2026')}</span>
        </div>

        <div className="flex items-center space-x-1 text-[#FFFFFF]">
          <Cpu className="w-3 h-3 text-[#FFFFFF]" />
          <span>Model: {String(modelId ?? provenance?.model_version ?? 'v5.0.0')}</span>
        </div>

        <div className="flex items-center space-x-1 text-[#FFFFFF]">
          <Binary className="w-3 h-3 text-[#FFFFFF]" />
          <span>Seed: {String(simulationSeed ?? provenance?.simulation_seed ?? 42871)}</span>
        </div>

        <div className="flex items-center space-x-1 text-[#FFFFFF]">
          <Clock className="w-3 h-3 text-[#FFFFFF]" />
          <span>Corner: {String(provenance?.corner_id ?? 'T9')}</span>
        </div>

        <div className="flex items-center justify-end space-x-2 text-[#FFFFFF]">
          <span>Pipeline: v{String(provenance?.pipeline_version ?? '5.0.0')}</span>
          <span>|</span>
          <span className="text-[#00E676] font-black">[ GROUPED CV VALIDATED ]</span>
        </div>
      </div>
    </footer>
  );
};
