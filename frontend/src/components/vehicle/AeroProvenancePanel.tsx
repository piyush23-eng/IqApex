import React from 'react';
import { ShieldCheck, Database, Binary, Cpu, Clock, AlertCircle } from 'lucide-react';

interface AeroProvenancePanelProps {
  datasetVersion?: string;
  datasetHash?: string;
  modelVersion?: string;
  simulationSeed?: number;
  sampleCount?: number;
}

export const AeroProvenancePanel: React.FC<AeroProvenancePanelProps> = ({
  datasetVersion = 'v6.0.0-synthetic',
  datasetHash = 'aero-sha256-42871',
  modelVersion = 'AeroSurrogate-GBR-1.0',
  simulationSeed = 42871,
  sampleCount = 1200,
}) => {
  return (
    <footer className="window-retro bg-[#0A0D15] border border-[#1E3A8A] p-2.5 font-mono text-3xs text-[#FFFFFF] space-y-1.5 select-none shadow">
      <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-1.5">
        <div className="flex items-center space-x-2 text-[#FFFFFF] font-bold uppercase">
          <ShieldCheck className="w-3.5 h-3.5 text-[#FFFFFF]" />
          <span>[ STAGE 6 VEHICLE PERFORMANCE SURROGATE GOVERNANCE AUDIT ]</span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 text-[#FFFFFF] font-bold px-2 py-0.5 bg-[#0E1A3D] text-[#FBBF24] border border-[#FBBF24]/50 border border-[#1E3A8A] shadow-sm">
            <AlertCircle className="w-3 h-3 text-[#FFB000]" />
            <span>[ SYNTHETIC ENGINEERING DATASET ]</span>
          </div>

          <div className="flex items-center space-x-1.5 text-[#FFFFFF] font-bold px-2 py-0.5 bg-[#070E22] border border-[#1E3A8A] shadow-sm">
            <Cpu className="w-3 h-3 text-[#FFFFFF]" />
            <span>[ PHYSICS-BASED SYNTHETIC MODEL ]</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 font-bold">
        <div className="flex items-center space-x-1 text-[#FFFFFF]">
          <Database className="w-3 h-3 text-[#FFFFFF]" />
          <span>Dataset: {datasetVersion} ({sampleCount} DoE)</span>
        </div>

        <div className="flex items-center space-x-1 text-[#FFFFFF]">
          <Cpu className="w-3 h-3 text-[#FFFFFF]" />
          <span>Model: {modelVersion}</span>
        </div>

        <div className="flex items-center space-x-1 text-[#FFFFFF]">
          <Binary className="w-3 h-3 text-[#FFFFFF]" />
          <span>Seed: {simulationSeed}</span>
        </div>

        <div className="flex items-center space-x-1 text-[#FFFFFF]">
          <Clock className="w-3 h-3 text-[#FFFFFF]" />
          <span>Hash: {datasetHash}</span>
        </div>

        <div className="flex items-center justify-end space-x-2 text-[#FFFFFF]">
          <span>Cross-Validation: Spatial 5-Fold</span>
          <span>|</span>
          <span className="text-[#00E676] font-black">[ DETERMINISTIC ]</span>
        </div>
      </div>
    </footer>
  );
};
