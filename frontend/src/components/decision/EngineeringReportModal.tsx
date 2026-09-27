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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
      <div className="bg-[#0f131a] border border-[#232936] rounded-lg w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1c2230] bg-[#141922]">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-cyan-400" />
            <div>
              <div className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <span>{report.title}</span>
                <span className="text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800">
                  ID: {report.analysis_id.slice(0, 8)}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span>SHA-256: <code className="text-slate-300">{report.input_hash.slice(0, 16)}...</code></span>
                <span>•</span>
                <span>{new Date(report.created_at).toUTCString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(report.markdown_content, 'md')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#1a2230] hover:bg-[#232e42] text-slate-200 rounded border border-slate-700 transition"
              title="Copy Markdown Report"
            >
              {copiedType === 'md' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedType === 'md' ? 'Copied MD' : 'Copy MD'}</span>
            </button>

            <button
              onClick={() => handleCopy(JSON.stringify(report, null, 2), 'json')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#1a2230] hover:bg-[#232e42] text-slate-200 rounded border border-slate-700 transition"
              title="Copy JSON Payload"
            >
              {copiedType === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Code className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedType === 'json' ? 'Copied JSON' : 'Copy JSON'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-cyan-950 hover:bg-cyan-900 text-cyan-300 rounded border border-cyan-700 transition"
              title="Download Markdown"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#202736] rounded transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#1c2230] bg-[#111620] px-5 text-xs">
          <button
            onClick={() => setActiveTab('rendered')}
            className={`py-2 px-4 border-b-2 font-medium transition ${
              activeTab === 'rendered'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Rendered Report
          </button>
          <button
            onClick={() => setActiveTab('markdown')}
            className={`py-2 px-4 border-b-2 font-medium transition ${
              activeTab === 'markdown'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Raw Markdown
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`py-2 px-4 border-b-2 font-medium transition ${
              activeTab === 'json'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Structured Data (JSON)
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0a0d14] text-slate-300 text-xs">
          {activeTab === 'rendered' && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Executive Banner */}
              <div className="bg-[#121824] border border-[#232f45] rounded p-4">
                <div className="flex items-center gap-2 mb-2 text-cyan-400 font-bold uppercase tracking-wider text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Executive Decision Summary</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Reference Lap Loss</span>
                    <span className="text-base font-bold text-amber-400">
                      +{Number(report.executive_summary.total_lap_loss_s ?? 0).toFixed(3)} s
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Dominant Phase</span>
                    <span className="text-base font-bold text-slate-200">
                      {String(report.executive_summary.dominant_loss_phase ?? 'N/A')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Modelled Scenario Delta</span>
                    <span className="text-base font-bold text-emerald-400">
                      {Number(report.executive_summary.modelled_lap_delta_s ?? 0) > 0 ? '+' : ''}
                      {Number(report.executive_summary.modelled_lap_delta_s ?? 0).toFixed(3)} s
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Strategy Net Impact</span>
                    <span className="text-base font-bold text-emerald-400">
                      {Number(report.executive_summary.race_time_delta_s ?? 0) > 0 ? '+' : ''}
                      {Number(report.executive_summary.race_time_delta_s ?? 0).toFixed(2)} s
                    </span>
                  </div>
                </div>
              </div>

              {/* Formatted Markdown Sections */}
              <div className="prose prose-invert max-w-none space-y-4 text-slate-300 leading-relaxed font-sans">
                <pre className="whitespace-pre-wrap font-mono text-xs bg-[#0f141f] p-4 rounded border border-[#1e2738] text-slate-300 overflow-x-auto leading-5">
                  {report.markdown_content}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'markdown' && (
            <div className="relative">
              <pre className="p-4 bg-[#080b10] border border-[#1b2230] rounded text-slate-300 font-mono text-xs overflow-x-auto select-all leading-relaxed whitespace-pre-wrap">
                {report.markdown_content}
              </pre>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="relative">
              <pre className="p-4 bg-[#080b10] border border-[#1b2230] rounded text-emerald-400/90 font-mono text-xs overflow-x-auto select-all leading-relaxed">
                {JSON.stringify(report, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-[#1c2230] bg-[#111620] flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span>ApexIQ v1.0 Motorsport Engineering Suite</span>
            <span>•</span>
            <span className="text-slate-500">Seed: 42871</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1 bg-[#1e2535] hover:bg-[#283247] text-slate-200 rounded text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
