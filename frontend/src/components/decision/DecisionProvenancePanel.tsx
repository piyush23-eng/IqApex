import React from 'react';
import { ShieldCheck, Database, Binary, Cpu, Clock, AlertTriangle } from 'lucide-react';

interface DecisionProvenancePanelProps {
  analysisId?: string;
  inputHash?: string;
  pipelineVersion?: string;
  simulationSeed?: number;
}

export const DecisionProvenancePanel: React.FC<DecisionProvenancePanelProps> = ({
  analysisId = 'ANALYSIS-NOMINAL',
  inputHash = 'sha256-42871-deterministic',
  pipelineVersion = 'v8.0.0-decision-support',
  simulationSeed = 42871,
}) => {
  return (
    <footer className="window-retro bg-[#0A0D15] border border-[#1E3A8A] p-2.5 font-mono text-3xs text-[#FFFFFF] space-y-1.5 select-none shadow">
      <div className="flex flex-wrap items-center justify-between border-b border-[#1E3A8A] pb-1 gap-2">
        <div className="flex items-center space-x-2 text-[#FFFFFF] font-extrabold">
          <ShieldCheck className="w-3.5 h-3.5 text-[#FFFFFF] stroke-[2.5]" />
          <span>[ DECISION SUPPORT PIPELINE GOVERNANCE & PROVENANCE ]</span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 text-[#FFFFFF] font-extrabold px-2 py-0.5 bg-[#FFB000] border border-[#1E3A8A] shadow-sm">
            <AlertTriangle className="w-3 h-3 text-[#FFFFFF] stroke-[2.5]" />
            <span>SYNTHETIC ENGINEERING DATASET ✕</span>
          </div>

          <div className="flex items-center space-x-1.5 text-[#FFFFFF] font-extrabold px-2 py-0.5 bg-[#070E22] border border-[#1E3A8A] shadow-sm">
            <Cpu className="w-3 h-3 text-[#FFFFFF] stroke-[2.5]" />
            <span>MODELLED SCENARIOS ✕</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-0.5 text-[#FFFFFF] font-bold">
        <div className="flex items-center space-x-1">
          <Database className="w-3 h-3 text-[#FFFFFF]" />
          <span>ID: {analysisId}</span>
        </div>

        <div className="flex items-center space-x-1">
          <Cpu className="w-3 h-3 text-[#FFFFFF]" />
          <span>Chain: Decomp → Aero → Kinematics</span>
        </div>

        <div className="flex items-center space-x-1">
          <Binary className="w-3 h-3 text-[#FFFFFF]" />
          <span>Seed: {simulationSeed}</span>
        </div>

        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3 text-[#FFFFFF]" />
          <span>Hash: {inputHash.slice(0, 16)}...</span>
        </div>

        <div className="flex items-center justify-end space-x-2 text-[#FFFFFF] font-extrabold">
          <span>{pipelineVersion}</span>
          <span>|</span>
          <span className="bg-[#00F0FF] px-1 border border-[#1E3A8A]">RECONCILED</span>
        </div>
      </div>
    </footer>
  );
};
