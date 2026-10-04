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
    <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-3 font-mono text-2xs space-y-2 shadow">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Laps Reference Info */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-[#FFFFFF] text-3xs uppercase font-extrabold">
            <Layers className="w-3.5 h-3.5 text-[#FFFFFF] stroke-[2.5]" />
            <span>REF:</span>
            <strong className="text-[#FFFFFF] bg-[#070E22] px-2 py-0.5 border border-[#1E3A8A] shadow-sm">
              LAP 14 (LECLERC — 1:21.042)
            </strong>
          </div>

          <div className="flex items-center space-x-1.5 text-[#FFFFFF] text-3xs uppercase font-extrabold">
            <span>COMP:</span>
            <strong className="text-[#FFFFFF] bg-[#070E22] px-2 py-0.5 border border-[#1E3A8A] shadow-sm">
              LAP 18 (SAINZ — 1:21.248, +0.206s)
            </strong>
          </div>
        </div>

        {/* Setup Scenario Preset Picker */}
        <div className="flex items-center space-x-2">
          <label className="text-[#FFFFFF] text-3xs font-extrabold uppercase flex items-center space-x-1">
            <Sliders className="w-3.5 h-3.5 text-[#FFFFFF] stroke-[2.5]" />
            <span>Preset:</span>
          </label>
          <select
            value={selectedPresetId}
            onChange={(e) => onSelectPreset(e.target.value)}
            className="bg-[#070E22] border border-[#1E3A8A] text-[#FFFFFF] font-extrabold px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0062FF] max-w-xs"
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
            <div className="flex items-center space-x-1 px-2 py-0.5 bg-[#00F0FF] border border-[#1E3A8A] text-[#FFFFFF] text-3xs font-extrabold shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>DOMAIN: INTERPOLATION (VALID) ✕</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 px-2 py-0.5 bg-[#FFB000] border border-[#1E3A8A] text-[#FFFFFF] text-3xs font-extrabold shadow-sm animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>DOMAIN: {domainStatus} ✕</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="btn-retro text-3xs flex items-center space-x-1 shadow disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>[ RE-EVALUATE ]</span>
          </button>

          <button
            onClick={onOpenReport}
            className="btn-retro-primary text-3xs flex items-center space-x-1.5 shadow"
          >
            <FileText className="w-3.5 h-3.5 fill-current" />
            <span>[ EXPORT REPORT ]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
