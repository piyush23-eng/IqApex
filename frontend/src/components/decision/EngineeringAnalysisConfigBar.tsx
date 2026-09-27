import React from 'react';
import { Sliders, RefreshCw, FileText, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { DomainStatus, SETUP_PRESETS } from '../../types/engineeringAnalysis';

interface EngineeringAnalysisConfigBarProps {
  selectedPresetId: string;
  onSelectPreset: (presetId: string) => void;
  domainStatus: DomainStatus;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenReport: () => void;
}

export const EngineeringAnalysisConfigBar: React.FC<EngineeringAnalysisConfigBarProps> = ({
  selectedPresetId,
  onSelectPreset,
  domainStatus,
  isLoading,
  onRefresh,
  onOpenReport,
}) => {
  return (
    <div className="bg-workstation-panel border border-workstation-border rounded p-3 font-mono text-2xs space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Laps Reference Info */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-workstation-textMuted text-3xs uppercase">
            <Layers className="w-3.5 h-3.5 text-workstation-accentCyan" />
            <span>REFERENCE:</span>
            <strong className="text-workstation-textBright bg-workstation-surface px-1.5 py-0.5 rounded border border-workstation-border">
              LAP 14 (LECLERC — 1:21.042)
            </strong>
          </div>

          <div className="flex items-center space-x-1.5 text-workstation-textMuted text-3xs uppercase">
            <span>COMPARISON:</span>
            <strong className="text-workstation-textBright bg-workstation-surface px-1.5 py-0.5 rounded border border-workstation-border">
              LAP 18 (SAINZ — 1:21.248, +0.206s)
            </strong>
          </div>
        </div>

        {/* Setup Scenario Preset Picker */}
        <div className="flex items-center space-x-2">
          <label className="text-workstation-textMuted text-3xs font-semibold uppercase flex items-center space-x-1">
            <Sliders className="w-3 h-3 text-workstation-accentCyan" />
            <span>Setup Scenario:</span>
          </label>
          <select
            value={selectedPresetId}
            onChange={(e) => onSelectPreset(e.target.value)}
            className="bg-workstation-surface border border-workstation-border rounded px-2.5 py-1 text-workstation-textBright text-xs focus:outline-none focus:border-workstation-accentCyan max-w-xs"
          >
            {SETUP_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Domain Status Tag */}
        <div className="flex items-center space-x-2">
          {domainStatus === 'INTERPOLATION' || domainStatus === 'OBSERVED_DOMAIN' ? (
            <div className="flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-3xs font-bold">
              <CheckCircle2 className="w-3 h-3" />
              <span>DOMAIN: INTERPOLATION (VALID)</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-3xs font-bold animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              <span>DOMAIN: {domainStatus} (SURROGATE UNCERTAINTY ELEVATED)</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-workstation-surface border border-workstation-border text-workstation-textSecondary hover:text-workstation-textBright transition-colors text-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>RE-EVALUATE</span>
          </button>

          <button
            onClick={onOpenReport}
            className="flex items-center space-x-1.5 px-3 py-1 rounded bg-workstation-accentCyan text-slate-950 font-bold hover:bg-sky-300 transition-colors text-2xs"
          >
            <FileText className="w-3.5 h-3.5 fill-current" />
            <span>EXPORT REPORT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
