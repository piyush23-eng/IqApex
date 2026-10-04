import React from 'react';
import { ProvenanceMetadata } from '../../types/decomposition';
import { Database, Binary, Clock, ShieldCheck } from 'lucide-react';

interface ProvenanceFooterProps {
  provenance: ProvenanceMetadata | null;
}

export const ProvenanceFooter: React.FC<ProvenanceFooterProps> = ({ provenance }) => {
  if (!provenance) return null;

  return (
    <footer className="window-retro bg-[#0A0D15] border border-[#1E3A8A] p-2.5 font-mono text-3xs text-[#FFFFFF] flex flex-wrap items-center justify-between gap-2 shadow">
      <div className="flex flex-wrap items-center gap-4 font-bold">
        <div className="flex items-center space-x-1.5 text-[#FFFFFF] font-extrabold">
          <ShieldCheck className="w-3.5 h-3.5 text-[#FFFFFF] stroke-[2.5]" />
          <span>[ PROVENANCE AUDIT TRAIL ]</span>
        </div>

        <div className="flex items-center space-x-1">
          <Database className="w-3 h-3 text-[#FFFFFF]" />
          <span>Ref: {provenance.reference_lap_id}</span>
          <span>↔</span>
          <span>Comp: {provenance.comparison_lap_id}</span>
        </div>

        <div className="flex items-center space-x-1">
          <Binary className="w-3 h-3 text-[#FFFFFF]" />
          <span>Grid: {provenance.spatial_grid_resolution_m.toFixed(1)}m Resampled</span>
        </div>

        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3 text-[#FFFFFF]" />
          <span>Run: {provenance.processing_run_id}</span>
        </div>
      </div>

      <div className="flex items-center space-x-3 font-extrabold">
        <span>Pipeline: v{provenance.pipeline_version}</span>
        <span>|</span>
        <span className="bg-[#00F0FF] px-1.5 py-0.2 border border-[#1E3A8A] text-[#FFFFFF]">{provenance.methodology}</span>
      </div>
    </footer>
  );
};
