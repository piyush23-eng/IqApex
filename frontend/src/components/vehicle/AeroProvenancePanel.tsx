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
    <footer className="bg-workstation-panel border border-workstation-border rounded p-2.5 font-mono text-3xs text-workstation-textMuted space-y-1.5 select-none">
      <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-1">
        <div className="flex items-center space-x-2 text-workstation-textBright font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-workstation-telemetryGreen" />
          <span>STAGE 6 VEHICLE PERFORMANCE SURROGATE GOVERNANCE AUDIT</span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 text-amber-400 font-semibold px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded">
            <AlertCircle className="w-3 h-3" />
            <span>TRAINING DATA: Synthetic engineering dataset</span>
          </div>

          <div className="flex items-center space-x-1.5 text-sky-400 font-semibold px-2 py-0.5 bg-sky-500/10 border border-sky-500/30 rounded">
            <Cpu className="w-3 h-3" />
            <span>MODEL: Physics-based synthetic model</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-0.5">
        <div className="flex items-center space-x-1">
          <Database className="w-3 h-3 text-workstation-accentCyan" />
          <span>Dataset: {datasetVersion} ({sampleCount} DoE)</span>
        </div>

        <div className="flex items-center space-x-1">
          <Cpu className="w-3 h-3 text-workstation-accentCyan" />
          <span>Model: {modelVersion}</span>
        </div>

        <div className="flex items-center space-x-1">
          <Binary className="w-3 h-3 text-workstation-accentCyan" />
          <span>Seed: {simulationSeed}</span>
        </div>

        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3 text-workstation-accentCyan" />
          <span>Hash: {datasetHash}</span>
        </div>

        <div className="flex items-center justify-end space-x-2 text-workstation-textPrimary">
          <span>Cross-Validation: Spatial 5-Fold</span>
          <span>|</span>
          <span className="text-workstation-telemetryGreen">Deterministic</span>
        </div>
      </div>
    </footer>
  );
};
