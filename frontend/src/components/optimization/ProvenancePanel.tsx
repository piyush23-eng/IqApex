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
    <footer className="bg-workstation-panel border border-workstation-border rounded p-2.5 font-mono text-3xs text-workstation-textMuted space-y-1.5">
      <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-1">
        <div className="flex items-center space-x-2 text-workstation-textBright font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-workstation-telemetryGreen" />
          <span>STAGE 5 OPTIMIZATION PROVENANCE & GOVERNANCE AUDIT</span>
        </div>

        <div className="flex items-center space-x-1.5 text-amber-400 font-semibold px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded">
          <AlertCircle className="w-3 h-3" />
          <span>TRAINING DATA: Synthetic demonstration dataset</span>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 pt-0.5">
        <div className="flex items-center space-x-1">
          <Database className="w-3 h-3 text-workstation-accentCyan" />
          <span>Dataset: {String(provenance?.session_id ?? 'demo-session-monza-2026')}</span>
        </div>

        <div className="flex items-center space-x-1">
          <Cpu className="w-3 h-3 text-workstation-accentCyan" />
          <span>Model: {String(modelId ?? provenance?.model_version ?? 'v5.0.0')}</span>
        </div>

        <div className="flex items-center space-x-1">
          <Binary className="w-3 h-3 text-workstation-accentCyan" />
          <span>Seed: {String(simulationSeed ?? provenance?.simulation_seed ?? 42871)}</span>
        </div>

        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3 text-workstation-accentCyan" />
          <span>Corner: {String(provenance?.corner_id ?? 'T9')} ({String(provenance?.corner_name ?? 'Variante Ascari')})</span>
        </div>

        <div className="flex items-center justify-end space-x-2 text-workstation-textPrimary">
          <span>Pipeline: v{String(provenance?.pipeline_version ?? '5.0.0')}</span>
          <span>|</span>
          <span className="text-workstation-accentCyan">Grouped CV Validated</span>
        </div>
      </div>
    </footer>
  );
};
