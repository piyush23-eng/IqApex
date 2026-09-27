import React from 'react';
import { EngineeringFinding, EvidenceType } from '../../types/engineeringAnalysis';
import { FileCheck } from 'lucide-react';

interface EngineeringFindingsPanelProps {
  findings: EngineeringFinding[];
  isLoading: boolean;
}

const EVIDENCE_STYLE: Record<EvidenceType, { bg: string; text: string; border: string; label: string }> = {
  OBSERVED: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    label: 'OBSERVED TELEMETRY',
  },
  STATISTICAL_ASSOCIATION: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    label: 'STATISTICAL ASSOCIATION',
  },
  MODELLED: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    label: 'MODELLED SURROGATE',
  },
  SCENARIO: {
    bg: 'bg-sky-500/10',
    text: 'text-sky-400',
    border: 'border-sky-500/30',
    label: 'SCENARIO ESTIMATE',
  },
  OPTIMIZATION: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    label: 'OPTIMIZATION FRONTIER',
  },
  VALIDATED: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    label: 'INDEPENDENTLY VALIDATED',
  },
};

export const EngineeringFindingsPanel: React.FC<EngineeringFindingsPanelProps> = ({
  findings,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="bg-workstation-panel border border-workstation-border rounded p-4 font-mono text-2xs animate-pulse text-workstation-textMuted flex items-center justify-center space-x-2 h-64">
        <FileCheck className="w-4 h-4 animate-spin text-workstation-accentCyan" />
        <span>GENERATING STRUCTURED CROSS-MODULE FINDINGS & EVIDENCE AUDIT...</span>
      </div>
    );
  }

  if (findings.length === 0) {
    return (
      <div className="bg-workstation-panel border border-workstation-border rounded p-4 font-mono text-2xs text-workstation-textMuted flex items-center justify-center h-64">
        <span>No engineering findings generated.</span>
      </div>
    );
  }

  return (
    <div className="bg-workstation-panel border border-workstation-border rounded p-3 font-mono text-2xs space-y-2.5">
      <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-1.5">
        <div className="flex items-center space-x-2">
          <FileCheck className="w-3.5 h-3.5 text-workstation-accentCyan" />
          <span className="font-bold text-workstation-textBright uppercase tracking-wider text-xs">
            STRUCTURED ENGINEERING FINDINGS & DECISION SUPPORT
          </span>
        </div>
        <span className="text-3xs text-workstation-textMuted">
          {findings.length} TRACEABLE STATEMENTS (STRICT EVIDENCE TYPING)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {findings.map((f, idx) => {
          const style = EVIDENCE_STYLE[f.evidence_type] || EVIDENCE_STYLE.MODELLED;
          return (
            <div
              key={f.finding_id}
              className="bg-workstation-surface border border-workstation-borderSubtle rounded p-2.5 space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                {/* Header: Finding ID + Evidence Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-4xs text-workstation-textMuted font-bold">
                    FINDING {String(idx + 1).padStart(2, '0')}: {f.source_module.toUpperCase()}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded border text-4xs font-bold uppercase tracking-wider ${style.bg} ${style.text} ${style.border}`}
                  >
                    {style.label}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-workstation-textBright text-xs">
                  {f.title}
                </h3>

                {/* Description */}
                <p className="text-3xs text-workstation-textSecondary leading-relaxed">
                  {f.description}
                </p>
              </div>

              {/* Metric & Provenance Metadata */}
              <div className="border-t border-workstation-borderSubtle pt-1.5 space-y-1 text-4xs text-workstation-textMuted">
                <div className="flex items-center justify-between">
                  <span>Metric: <strong className="text-workstation-textBright">{f.metric}</strong></span>
                  <span>Delta: <strong className={f.delta < 0 ? 'text-emerald-400' : 'text-amber-400'}>
                    {f.delta >= 0 ? '+' : ''}{f.delta} {f.unit}
                  </strong></span>
                </div>

                {f.assumptions.length > 0 && (
                  <div>
                    Assumptions: <span className="text-workstation-textSecondary">{f.assumptions.join(' · ')}</span>
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
