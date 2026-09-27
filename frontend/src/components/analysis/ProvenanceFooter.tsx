import React from 'react';
import { ProvenanceMetadata } from '../../types/decomposition';
import { Database, Binary, Clock, ShieldCheck } from 'lucide-react';

interface ProvenanceFooterProps {
  provenance: ProvenanceMetadata | null;
}

export const ProvenanceFooter: React.FC<ProvenanceFooterProps> = ({ provenance }) => {
  if (!provenance) return null;

  return (
    <footer className="bg-workstation-panel border border-workstation-border rounded p-2.5 font-mono text-3xs text-workstation-textMuted flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5 text-workstation-textBright font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-workstation-telemetryGreen" />
          <span>PROVENANCE AUDIT TRAIL</span>
        </div>

        <div className="flex items-center space-x-1">
          <Database className="w-3 h-3 text-workstation-accentCyan" />
          <span>Ref: {provenance.reference_lap_id}</span>
          <span>↔</span>
          <span>Comp: {provenance.comparison_lap_id}</span>
        </div>

        <div className="flex items-center space-x-1">
          <Binary className="w-3 h-3 text-workstation-accentCyan" />
          <span>Grid: {provenance.spatial_grid_resolution_m.toFixed(1)}m Resampled</span>
        </div>

        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3 text-workstation-accentCyan" />
          <span>Run: {provenance.processing_run_id}</span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <span>Pipeline: v{provenance.pipeline_version}</span>
        <span className="text-workstation-border">|</span>
        <span className="text-workstation-accentCyan">{provenance.methodology}</span>
      </div>
    </footer>
  );
};
