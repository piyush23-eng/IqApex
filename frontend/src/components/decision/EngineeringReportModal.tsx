import React, { useState } from 'react';
import { X, Copy, Check, Download, FileText, Code, ShieldCheck } from 'lucide-react';
import type { EngineeringReportResponse } from '../../types/engineeringAnalysis';

interface EngineeringReportModalProps {
  report: EngineeringReportResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EngineeringReportModal: React.FC<EngineeringReportModalProps> = ({
  report,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'rendered' | 'markdown' | 'json'>('rendered');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen || !report) return null;

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([report.markdown_content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `apexiq-engineering-report-${report.analysis_id.slice(0, 8)}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-mono select-none">
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] w-full max-w-5xl max-h-[90vh] flex flex-col shadow-lg overflow-hidden">
        {/* Header */}
        <div className="window-header-retro bg-[#070E22] border-b border-[#1E3A8A] px-4 py-2 flex items-center justify-between text-[#FFFFFF] font-extrabold">
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-[#FFFFFF] stroke-[2.5]" />
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2">
                <span>{report.title}</span>
                <span className="text-4xs bg-[#00F0FF] text-[#FFFFFF] px-1.5 py-0.2 border border-[#1E3A8A] shadow-sm">
                  ID: {report.analysis_id.slice(0, 8)}
                </span>
              </div>
              <div className="text-4xs text-[#94A3B8] flex items-center gap-2 mt-0.5 font-bold">
                <span>SHA-256: <code>{report.input_hash.slice(0, 16)}...</code></span>
                <span>|</span>
                <span>{new Date(report.created_at).toUTCString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(report.markdown_content, 'md')}
              className="btn-retro text-3xs font-extrabold"
              title="Copy Markdown Report"
            >
              {copiedType === 'md' ? <Check className="w-3 h-3 text-[#00E676]" /> : <Copy className="w-3 h-3" />}
              <span>{copiedType === 'md' ? '[ COPIED MD ]' : '[ COPY MD ]'}</span>
            </button>

            <button
              onClick={() => handleCopy(JSON.stringify(report, null, 2), 'json')}
              className="btn-retro text-3xs font-extrabold"
              title="Copy JSON Payload"
            >
              {copiedType === 'json' ? <Check className="w-3 h-3 text-[#00E676]" /> : <Code className="w-3 h-3" />}
              <span>{copiedType === 'json' ? '[ COPIED JSON ]' : '[ COPY JSON ]'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="btn-retro-primary text-3xs font-extrabold"
              title="Download Markdown"
            >
              <Download className="w-3 h-3 text-[#FFFFFF] stroke-[2.5]" />
              <span>[ EXPORT ]</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 border border-[#1E3A8A] bg-[#070E22] hover:bg-black hover:text-white font-extrabold text-xs shadow-sm ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#1E3A8A] bg-[#070E22] px-4 py-1.5 gap-2 text-3xs font-extrabold">
          <button
            onClick={() => setActiveTab('rendered')}
            className={activeTab === 'rendered' ? 'tab-retro-active text-3xs' : 'tab-retro-inactive text-3xs'}
          >
            [ RENDERED REPORT ]
          </button>
          <button
            onClick={() => setActiveTab('markdown')}
            className={activeTab === 'markdown' ? 'tab-retro-active text-3xs' : 'tab-retro-inactive text-3xs'}
          >
            [ RAW MARKDOWN ]
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={activeTab === 'json' ? 'tab-retro-active text-3xs' : 'tab-retro-inactive text-3xs'}
          >
            [ STRUCTURED JSON ]
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#030712] text-[#FFFFFF] text-xs">
          {activeTab === 'rendered' && (
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Executive Banner */}
              <div className="bg-[#070E22] border border-[#1E3A8A] p-3 shadow">
                <div className="flex items-center gap-2 mb-2 text-[#FFFFFF] font-extrabold uppercase tracking-wider text-xs">
                  <ShieldCheck className="w-4 h-4 text-[#00E676] stroke-[2.5]" />
                  <span>[ EXECUTIVE DECISION SUMMARY ]</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2 font-mono">
                  <div className="p-2 bg-[#0A132E] border border-[#1E3A8A]">
                    <span className="text-4xs text-[#94A3B8] font-bold block uppercase">Reference Lap Loss</span>
                    <span className="text-base font-extrabold text-[#FFB000]">
                      +{Number(report.executive_summary.total_lap_loss_s ?? 0).toFixed(3)} s
                    </span>
                  </div>
                  <div className="p-2 bg-[#0A132E] border border-[#1E3A8A]">
                    <span className="text-4xs text-[#94A3B8] font-bold block uppercase">Dominant Phase</span>
                    <span className="text-base font-extrabold text-[#FFFFFF]">
                      {String(report.executive_summary.dominant_loss_phase ?? 'N/A')}
                    </span>
                  </div>
                  <div className="p-2 bg-[#0A132E] border border-[#1E3A8A]">
                    <span className="text-4xs text-[#94A3B8] font-bold block uppercase">Modelled Scenario Delta</span>
                    <span className="text-base font-extrabold text-[#00E676]">
                      {Number(report.executive_summary.modelled_lap_delta_s ?? 0) > 0 ? '+' : ''}
                      {Number(report.executive_summary.modelled_lap_delta_s ?? 0).toFixed(3)} s
                    </span>
                  </div>
                  <div className="p-2 bg-[#0A132E] border border-[#1E3A8A]">
                    <span className="text-4xs text-[#94A3B8] font-bold block uppercase">Strategy Net Impact</span>
                    <span className="text-base font-extrabold text-[#00E676]">
                      {Number(report.executive_summary.race_time_delta_s ?? 0) > 0 ? '+' : ''}
                      {Number(report.executive_summary.race_time_delta_s ?? 0).toFixed(2)} s
                    </span>
                  </div>
                </div>
              </div>

              {/* Formatted Markdown Sections */}
              <div className="bg-[#070E22] border border-[#1E3A8A] p-4 shadow">
                <pre className="whitespace-pre-wrap font-mono text-xs text-[#FFFFFF] overflow-x-auto leading-relaxed select-text">
                  {report.markdown_content}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'markdown' && (
            <div className="bg-[#070E22] border border-[#1E3A8A] p-4 shadow">
              <pre className="text-[#FFFFFF] font-mono text-xs overflow-x-auto select-all leading-relaxed whitespace-pre-wrap">
                {report.markdown_content}
              </pre>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="bg-[#070E22] border border-[#1E3A8A] p-4 shadow">
              <pre className="text-[#FFFFFF] font-mono text-xs overflow-x-auto select-all leading-relaxed">
                {JSON.stringify(report, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[#1E3A8A] bg-[#070E22] flex items-center justify-between text-3xs text-[#FFFFFF] font-bold">
          <div className="flex items-center gap-2">
            <span>ApexIQ v2.0 Industrial Engineering Workstation</span>
            <span>|</span>
            <span className="text-[#94A3B8]">Seed: 42871</span>
          </div>
          <button
            onClick={onClose}
            className="btn-retro text-3xs font-extrabold"
          >
            [ CLOSE ]
          </button>
        </div>
      </div>
    </div>
  );
};
