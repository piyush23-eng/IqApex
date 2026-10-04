import React from 'react';
import { EngineeringFinding, EvidenceType } from '../../types/engineeringAnalysis';
import { FileCheck } from 'lucide-react';

interface EngineeringFindingsPanelProps {
  findings: EngineeringFinding[];
  isLoading: boolean;
}

const EVIDENCE_STYLE: Record<EvidenceType, { bg: string; text: string; label: string }> = {
  OBSERVED: {
    bg: 'bg-[#00F0FF]',
    text: 'text-[#FFFFFF]',
    label: 'OBSERVED TELEMETRY ✕',
  },
  STATISTICAL_ASSOCIATION: {
    bg: 'bg-[#0E1A3D] text-[#00F0FF]',
    text: 'text-[#FFFFFF]',
    label: 'STATISTICAL ASSOCIATION ✕',
  },
  MODELLED: {
    bg: 'bg-[#FFB000]',
    text: 'text-[#FFFFFF]',
    label: 'MODELLED SURROGATE ✕',
  },
  SCENARIO: {
    bg: 'bg-[#070E22]',
    text: 'text-[#FFFFFF]',
    label: 'SCENARIO ESTIMATE ✕',
  },
  OPTIMIZATION: {
    bg: 'bg-[#00F0FF]/50',
    text: 'text-[#FFFFFF]',
    label: 'OPTIMIZATION FRONTIER ✕',
  },
  VALIDATED: {
    bg: 'bg-[#00F0FF]',
    text: 'text-[#FFFFFF]',
    label: 'INDEPENDENTLY VALIDATED ✕',
  },
};

export const EngineeringFindingsPanel: React.FC<EngineeringFindingsPanelProps> = ({
  findings,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-4 font-mono text-2xs animate-pulse text-[#FFFFFF] flex items-center justify-center space-x-2 h-64 shadow-md">
        <FileCheck className="w-4 h-4 animate-spin text-[#FFFFFF]" />
        <span className="font-extrabold uppercase">GENERATING STRUCTURED CROSS-MODULE FINDINGS & EVIDENCE AUDIT...</span>
      </div>
    );
  }

  if (findings.length === 0) {
    return (
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-4 font-mono text-2xs text-[#94A3B8] flex items-center justify-center h-64 shadow-md">
        <span className="font-bold">No engineering findings generated.</span>
      </div>
    );
  }

  return (
    <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-0 shadow-md font-mono">
      <div className="window-header-retro bg-[#070E22] border-b border-[#1E3A8A] px-3 py-1.5 flex items-center justify-between text-[#FFFFFF] font-extrabold">
        <div className="flex items-center space-x-2">
          <FileCheck className="w-3.5 h-3.5 text-[#FFFFFF] stroke-[2.5]" />
          <span className="font-extrabold text-[#FFFFFF] uppercase tracking-wider text-2xs">
            [ STRUCTURED ENGINEERING FINDINGS & DECISION SUPPORT ]
          </span>
        </div>
        <span className="text-3xs text-[#FFFFFF] font-bold">
          {findings.length} TRACEABLE STATEMENTS (STRICT EVIDENCE TYPING)
        </span>
      </div>

      <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {findings.map((f, idx) => {
          const style = EVIDENCE_STYLE[f.evidence_type] || EVIDENCE_STYLE.MODELLED;
          return (
            <div
              key={f.finding_id}
              className="bg-[#070E22] border border-[#1E3A8A] p-2.5 space-y-2 flex flex-col justify-between shadow"
            >
              <div className="space-y-1.5">
                {/* Header: Finding ID + Evidence Badge */}
                <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-1">
                  <span className="text-4xs text-[#94A3B8] font-black uppercase">
                    FINDING {String(idx + 1).padStart(2, '0')}: {f.source_module.toUpperCase()}
                  </span>
                  <span
                    className={`px-2 py-0.5 border border-[#1E3A8A] text-4xs font-extrabold uppercase tracking-wider shadow-sm ${style.bg} ${style.text}`}
                  >
                    {style.label}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-black text-[#FFFFFF] text-xs">
                  {f.title}
                </h3>

                {/* Description */}
                <p className="text-3xs text-[#E2E8F0] font-medium leading-relaxed">
                  {f.description}
                </p>
              </div>

              {/* Metric & Provenance Metadata */}
              <div className="border-t border-[#1E3A8A]/20 pt-1.5 space-y-1 text-4xs text-[#94A3B8] font-bold">
                <div className="flex items-center justify-between">
                  <span>Metric: <strong className="text-[#FFFFFF] font-black">{f.metric}</strong></span>
                  <span>Delta: <strong className={f.delta < 0 ? 'text-[#00E676] font-black' : 'text-[#FFB000] font-black'}>
                    {f.delta >= 0 ? '+' : ''}{f.delta} {f.unit}
                  </strong></span>
                </div>

                {f.assumptions.length > 0 && (
                  <div>
                    Assumptions: <span className="text-[#FFFFFF] font-semibold">{f.assumptions.join(' · ')}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
