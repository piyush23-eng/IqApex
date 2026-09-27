import React, { useState } from 'react';
import {
  FolderTree,
  Upload,
  FileCheck,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  GitCompare,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/api';
import {
  TelemetryInspectionResult,
  IngestionResult,
  LapComparisonResponse,
} from '../types/domain';

export const DataRunsPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [inspectionResult, setInspectionResult] = useState<TelemetryInspectionResult | null>(null);
  const [ingestionResult, setIngestionResult] = useState<IngestionResult | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Comparison State
  const [refLapId, setRefLapId] = useState('lap-demo-02');
  const [compLapId, setCompLapId] = useState('lap-demo-03');
  const [comparisonResult, setComparisonResult] = useState<LapComparisonResponse | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  // Ingestion Parameters
  const [sessionId, setSessionId] = useState('demo-session-monza-2026');
  const [runId, setRunId] = useState('run-03-soft-stint');
  const [lapId, setLapId] = useState('lap-ingested-stint-01');
  const [lapNumber, setLapNumber] = useState(4);
  const [lapTime, setLapTime] = useState(80.5);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setInspectionResult(null);
      setIngestionResult(null);
      setErrorMsg(null);
    }
  };

  const handleInspect = async () => {
    if (!selectedFile) return;
    setIsInspecting(true);
    setErrorMsg(null);
    try {
      const res = await api.inspectTelemetry(selectedFile);
      setInspectionResult(res);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Inspection failed');
    } finally {
      setIsInspecting(false);
    }
  };

  const handleIngest = async () => {
    if (!selectedFile) return;
    setIsIngesting(true);
    setErrorMsg(null);
    try {
      const res = await api.ingestTelemetry(
        selectedFile,
        sessionId,
        runId,
        lapId,
        lapNumber,
        lapTime,
        1.0
      );
      setIngestionResult(res);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Ingestion failed');
    } finally {
      setIsIngesting(false);
    }
  };

  const handleCompare = async () => {
    setIsComparing(true);
    setErrorMsg(null);
    try {
      const res = await api.compareLaps(refLapId, compLapId, 1.0);
      setComparisonResult(res);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Comparison failed');
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-3 space-y-3 font-mono text-2xs select-none">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-2 border-b border-workstation-borderSubtle">
        <div className="flex items-center space-x-2">
          <FolderTree className="w-4 h-4 text-workstation-accentCyan" />
          <span className="font-semibold text-xs text-workstation-textBright uppercase tracking-wider">
            DATA INGESTION, LINEAGE & RUN ARCHIVE WORKSTATION
          </span>
        </div>
        <span className="text-3xs text-workstation-textMuted font-mono">STAGE 2 PIPELINE ACTIVE</span>
      </div>

      {errorMsg && (
        <div className="p-2.5 bg-workstation-telemetryRed/10 border border-workstation-telemetryRed/30 rounded text-workstation-telemetryRed text-3xs flex items-center space-x-2">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Ingestion & Inspection (Col 7) + Comparison Engine (Col 5) */}
      <div className="grid grid-cols-12 gap-3">
        {/* Left Column: File Inspection & Ingestion Pipeline */}
        <div className="col-span-7 space-y-3">
          <div className="p-3 bg-workstation-panel border border-workstation-border rounded space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-workstation-borderSubtle">
              <span className="text-3xs uppercase font-semibold text-workstation-textMuted flex items-center space-x-1.5">
                <Upload className="w-3 h-3 text-workstation-accentCyan" />
                <span>1. RAW TELEMETRY FILE INGESTION (CSV / PARQUET)</span>
              </span>
              <span className="text-3xs text-workstation-textMuted">IMMUTABLE INTAKE</span>
            </div>

            {/* File Upload Selector */}
            <div className="flex items-center space-x-3">
              <input
                type="file"
                accept=".csv,.parquet,.pq"
                onChange={handleFileChange}
                className="block text-3xs text-workstation-textSecondary file:mr-2 file:py-1 file:px-2.5 file:rounded file:border file:border-workstation-border file:text-3xs file:font-mono file:bg-workstation-surface file:text-workstation-accentCyan hover:file:bg-workstation-card cursor-pointer"
              />
              <button
                onClick={handleInspect}
                disabled={!selectedFile || isInspecting}
                className="px-2.5 py-1 bg-workstation-surface hover:bg-workstation-card text-workstation-textBright border border-workstation-border rounded text-3xs disabled:opacity-40"
              >
                {isInspecting ? 'Inspecting Schema...' : 'Inspect Schema'}
              </button>
            </div>

            {/* Inspection Results Panel */}
            {inspectionResult && (
              <div className="p-3 bg-workstation-surface border border-workstation-borderSubtle rounded space-y-2 text-2xs">
                <div className="flex items-center justify-between pb-1 border-b border-workstation-borderMuted">
                  <span className="text-3xs uppercase text-workstation-textMuted font-semibold flex items-center space-x-1">
                    <FileCheck className="w-3 h-3 text-workstation-telemetryGreen" />
                    <span>SCHEMA INSPECTION AUDIT</span>
                  </span>
                  <span className="text-3xs text-workstation-telemetryGreen font-semibold">
                    {inspectionResult.file_format} DETECTED
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-3xs">
                  <div>
                    <span className="text-workstation-textMuted">ROWS:</span>{' '}
                    <span className="text-workstation-textBright font-semibold">
                      {inspectionResult.row_count.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-workstation-textMuted">COLUMNS:</span>{' '}
                    <span className="text-workstation-textBright font-semibold">
                      {inspectionResult.column_count}
                    </span>
                  </div>
                  <div>
                    <span className="text-workstation-textMuted">SAMPLING HZ:</span>{' '}
                    <span className="text-workstation-accentCyan font-semibold">
                      {inspectionResult.estimated_sampling_frequency ? `${inspectionResult.estimated_sampling_frequency} Hz` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-workstation-textMuted">CORE CHANNELS:</span>{' '}
                    <span className="text-workstation-telemetryGreen font-semibold">
                      {inspectionResult.core_channels_found.length} / 10
                    </span>
                  </div>
                </div>

                {inspectionResult.warnings.length > 0 && (
                  <div className="p-1.5 bg-workstation-telemetryAmber/10 border border-workstation-telemetryAmber/20 rounded text-workstation-telemetryAmber text-3xs">
                    {inspectionResult.warnings.join(' | ')}
                  </div>
                )}

                {/* Ingestion Parameters Form */}
                <div className="pt-2 border-t border-workstation-borderMuted space-y-2">
                  <div className="text-3xs text-workstation-textMuted uppercase font-semibold">
                    Target Ingestion Assignment
                  </div>
                  <div className="grid grid-cols-5 gap-2 text-3xs">
                    <div className="col-span-1">
                      <label className="text-workstation-textMuted block mb-0.5">Session ID</label>
                      <input
                        type="text"
                        value={sessionId}
                        onChange={(e) => setSessionId(e.target.value)}
                        className="w-full bg-workstation-panel border border-workstation-border rounded px-1.5 py-0.5 text-workstation-textPrimary"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="text-workstation-textMuted block mb-0.5">Run ID</label>
                      <input
                        type="text"
                        value={runId}
                        onChange={(e) => setRunId(e.target.value)}
                        className="w-full bg-workstation-panel border border-workstation-border rounded px-1.5 py-0.5 text-workstation-textPrimary"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="text-workstation-textMuted block mb-0.5">Lap ID</label>
                      <input
                        type="text"
                        value={lapId}
                        onChange={(e) => setLapId(e.target.value)}
                        className="w-full bg-workstation-panel border border-workstation-border rounded px-1.5 py-0.5 text-workstation-textPrimary"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="text-workstation-textMuted block mb-0.5">Lap No.</label>
                      <input
                        type="number"
                        value={lapNumber}
                        onChange={(e) => setLapNumber(Number(e.target.value))}
                        className="w-full bg-workstation-panel border border-workstation-border rounded px-1.5 py-0.5 text-workstation-textPrimary"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="text-workstation-textMuted block mb-0.5">Time (s)</label>
                      <input
                        type="number"
                        step="0.001"
                        value={lapTime}
                        onChange={(e) => setLapTime(Number(e.target.value))}
                        className="w-full bg-workstation-panel border border-workstation-border rounded px-1.5 py-0.5 text-workstation-textPrimary"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleIngest}
                    disabled={isIngesting}
                    className="w-full py-1.5 bg-workstation-accent hover:bg-workstation-accent/80 text-white rounded text-2xs font-semibold flex items-center justify-center space-x-1.5 disabled:opacity-40 transition-colors"
                  >
                    <Cpu className="w-3 h-3" />
                    <span>
                      {isIngesting ? 'Executing Pipeline (Norm -> Resample -> Parquet)...' : 'Commit & Ingest Telemetry'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Ingestion Success Banner */}
            {ingestionResult && (
              <div className="p-3 bg-workstation-telemetryGreen/10 border border-workstation-telemetryGreen/30 rounded space-y-1.5 text-2xs">
                <div className="flex items-center justify-between text-workstation-telemetryGreen font-semibold">
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>INGESTION COMPLETED & PERSISTED</span>
                  </div>
                  <span className="text-3xs uppercase">1M SPATIAL GRID</span>
                </div>
                <div className="text-3xs text-workstation-textSecondary space-y-0.5">
                  <div>Raw Points: {ingestionResult.raw_points.toLocaleString()} | Resampled: {ingestionResult.resampled_points.toLocaleString()} points</div>
                  <div>Quality Score: {ingestionResult.quality.quality_score.toFixed(1)} / 100.0 ({ingestionResult.quality.status})</div>
                  <div className="truncate">Processing Run ID: {ingestionResult.processing_run_id}</div>
                  <div className="truncate font-mono text-workstation-textMuted">SHA-256: {ingestionResult.lineage.source_hash}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Multi-Lap Comparison Signal Engine */}
        <div className="col-span-5 space-y-3">
          <div className="p-3 bg-workstation-panel border border-workstation-border rounded space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-workstation-borderSubtle">
              <span className="text-3xs uppercase font-semibold text-workstation-textMuted flex items-center space-x-1.5">
                <GitCompare className="w-3 h-3 text-workstation-accentCyan" />
                <span>2. MULTI-LAP DELTA SIGNAL ENGINE</span>
              </span>
              <span className="text-3xs text-workstation-textMuted">MATHEMATICAL</span>
            </div>

            <div className="space-y-2 text-3xs">
              <div>
                <label className="text-workstation-textMuted block mb-0.5">Reference Lap ID</label>
                <input
                  type="text"
                  value={refLapId}
                  onChange={(e) => setRefLapId(e.target.value)}
                  className="w-full bg-workstation-surface border border-workstation-border rounded px-2 py-1 text-workstation-textPrimary"
                />
              </div>

              <div>
                <label className="text-workstation-textMuted block mb-0.5">Comparison Lap ID</label>
                <input
                  type="text"
                  value={compLapId}
                  onChange={(e) => setCompLapId(e.target.value)}
                  className="w-full bg-workstation-surface border border-workstation-border rounded px-2 py-1 text-workstation-textPrimary"
                />
              </div>

              <button
                onClick={handleCompare}
                disabled={isComparing}
                className="w-full py-1.5 bg-workstation-surface hover:bg-workstation-card text-workstation-accentCyan border border-workstation-border rounded text-2xs font-semibold flex items-center justify-center space-x-1.5 disabled:opacity-40 transition-colors"
              >
                <ArrowRight className="w-3 h-3" />
                <span>{isComparing ? 'Computing Signal Delta...' : 'Calculate Δt(s) & Δv(s)'}</span>
              </button>
            </div>

            {/* Comparison Results */}
            {comparisonResult && (
              <div className="p-3 bg-workstation-surface border border-workstation-borderSubtle rounded space-y-2 text-2xs">
                <div className="flex justify-between pb-1 border-b border-workstation-borderMuted">
                  <span className="text-3xs uppercase text-workstation-textMuted font-semibold">SIGNAL SUMMARY</span>
                  <span className="text-3xs text-workstation-accentCyan">{comparisonResult.point_count.toLocaleString()} GRID POINTS</span>
                </div>
                <div className="space-y-1 text-3xs">
                  <div className="flex justify-between">
                    <span className="text-workstation-textMuted">DISTANCE SPAN</span>
                    <span className="text-workstation-textBright font-semibold">
                      {comparisonResult.distance[0]}m → {comparisonResult.distance[comparisonResult.distance.length - 1]}m
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-workstation-textMuted">FINAL TIME DELTA Δt</span>
                    <span className={`font-semibold ${comparisonResult.time_delta[comparisonResult.time_delta.length - 1] > 0 ? 'text-workstation-telemetryAmber' : 'text-workstation-telemetryGreen'}`}>
                      {comparisonResult.time_delta[comparisonResult.time_delta.length - 1] > 0 ? '+' : ''}
                      {comparisonResult.time_delta[comparisonResult.time_delta.length - 1].toFixed(3)} s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-workstation-textMuted">FINAL VELOCITY DELTA Δv</span>
                    <span className="text-workstation-textPrimary font-semibold">
                      {comparisonResult.speed_delta[comparisonResult.speed_delta.length - 1].toFixed(1)} km/h
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
