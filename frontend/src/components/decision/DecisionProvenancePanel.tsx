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
    <footer className="bg-workstation-panel border border-workstation-border rounded p-2.5 font-mono text-3xs text-workstation-textMuted space-y-1.5 select-none">
      <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-1">
        <div className="flex items-center space-x-2 text-workstation-textBright font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-workstation-telemetryGreen" />
          <span>STAGE 8 CROSS-MODULE ENGINEERING DECISION SUPPORT GOVERNANCE</span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 text-amber-400 font-semibold px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded">
            <AlertTriangle className="w-3 h-3" />
            <span>SYNTHETIC ENGINEERING DATASET</span>
          </div>

          <div className="flex items-center space-x-1.5 text-sky-400 font-semibold px-2 py-0.5 bg-sky-500/10 border border-sky-500/30 rounded">
            <Cpu className="w-3 h-3" />
            <span>MODELLED SCENARIOS — NOT REAL F1 TEAM DATA</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-0.5">
        <div className="flex items-center space-x-1">
          <Database className="w-3 h-3 text-workstation-accentCyan" />
          <span>ID: {analysisId}</span>
        </div>

        <div className="flex items-center space-x-1">
          <Cpu className="w-3 h-3 text-workstation-accentCyan" />
          <span>Chain: Decomp → Aero → Kinematics → Strategy</span>
        </div>

        <div className="flex items-center space-x-1">
          <Binary className="w-3 h-3 text-workstation-accentCyan" />
          <span>Seed: {simulationSeed} (Deterministic MC)</span>
        </div>

        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3 text-workstation-accentCyan" />
          <span>Hash: {inputHash.slice(0, 16)}...</span>
        </div>

        <div className="flex items-center justify-end space-x-2 text-workstation-textPrimary">
          <span>Version: {pipelineVersion}</span>
          <span>|</span>
          <span className="text-workstation-telemetryGreen">Reconciled</span>
        </div>
      </div>
    </footer>
  );
};
