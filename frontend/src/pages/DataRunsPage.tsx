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
  FileText,
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

  const [isLoadingSample, setIsLoadingSample] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setInspectionResult(null);
      setIngestionResult(null);
      setErrorMsg(null);
    }
  };

  const handleLoadSampleFile = async () => {
    setIsLoadingSample(true);
    setErrorMsg(null);
    try {
      const file = await api.getSampleTelemetryCsv();
      setSelectedFile(file);
      setIngestionResult(null);
      setIsInspecting(true);
      const res = await api.inspectTelemetry(file);
      setInspectionResult(res);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load sample telemetry CSV');
    } finally {
      setIsLoadingSample(false);
      setIsInspecting(false);
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
    <div className="h-full overflow-y-auto p-4 space-y-4 font-mono text-2xs select-none bg-[#030712] text-[#FFFFFF]">
      {/* Page Header */}
      <div className="matrix-hud-card scanline-container bg-[#0A132E] border border-[#1E3A8A] p-3 flex flex-wrap items-center justify-between shadow-md relative gap-2">
        <div className="scan-beam" />
        <div className="flex items-center space-x-2 relative z-10">
          <span className="w-2.5 h-2.5 bg-[#00F0FF] rounded-full animate-ping shadow-[0_0_8px_#00F0FF]" />
          <FolderTree className="w-4 h-4 text-[#0062FF] stroke-[2.5]" />
          <span className="font-black text-xs text-[#FFFFFF] uppercase tracking-wider font-mono">
            [ DATA INGESTION, LINEAGE &amp; RUN ARCHIVE WORKSTATION ]
          </span>
        </div>
        <span className="relative z-10 text-3xs font-black bg-[#0062FF] text-[#FFFFFF] border border-[#00F0FF] px-2 py-0.5 shadow-matrix-glow flex items-center space-x-1">
          <Cpu className="w-3 h-3 text-[#00F0FF]" />
          <span>STAGE 2 PIPELINE ACTIVE ✕</span>
        </span>
      </div>

      {errorMsg && (
        <div className="p-2.5 bg-[#FF3366]/15 border border-[#1E3A8A] text-[#FF3366] shadow text-3xs flex items-center space-x-2 font-bold">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Ingestion & Inspection (Col 7) + Comparison Engine (Col 5) */}
      <div className="grid grid-cols-12 gap-3">
        {/* Left Column: File Inspection & Ingestion Pipeline */}
        <div className="col-span-7 space-y-3">
          <div className="matrix-hud-card bg-[#0A132E] border border-[#1E3A8A] shadow-md">
            <div className="window-header-retro bg-[#070E22] border-b border-[#1E3A8A] px-3 py-1.5 flex items-center justify-between text-[#FFFFFF] font-extrabold">
              <span className="text-3xs uppercase flex items-center space-x-1.5">
                <Upload className="w-3.5 h-3.5 text-[#0062FF] stroke-[2.5]" />
                <span>[ 1. RAW TELEMETRY FILE INGESTION (CSV / PARQUET) ]</span>
              </span>
              <span className="text-4xs px-1.5 py-0.2 bg-[#070E22] border border-[#1E3A8A]">IMMUTABLE INTAKE</span>
            </div>

            <div className="p-3 space-y-3">
              {/* File Upload Selector */}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  accept=".csv,.parquet,.pq"
                  onChange={handleFileChange}
                  className="block text-3xs text-[#FFFFFF] file:mr-2 file:py-1 file:px-2.5 file:border-2 file:border-[#1E3A8A] file:text-3xs file:font-mono file:bg-[#070E22] file:text-[#FFFFFF] file:font-bold hover:file:bg-[#0062FF] cursor-pointer"
                />
                <button
                  onClick={handleInspect}
                  disabled={!selectedFile || isInspecting}
                  className="btn-matrix-outline text-3xs disabled:opacity-40"
                >
                  <span>{isInspecting ? '[ INSPECTING... ]' : '[ INSPECT SCHEMA ]'}</span>
                </button>
                <button
                  onClick={handleLoadSampleFile}
                  disabled={isLoadingSample}
                  className="btn-matrix-blue text-3xs flex items-center space-x-1"
                  title="Load canonical Monza Q3 reference lap telemetry CSV for immediate pipeline verification"
                >
                  <FileText className="w-3 h-3 text-[#FFFFFF] stroke-[2.5]" />
                  <span>{isLoadingSample ? '[ LOADING... ]' : '[ LOAD MONZA SAMPLE CSV ]'}</span>
                </button>
              </div>

              {/* Inspection Results Panel */}
              {inspectionResult && (
                <div className="p-3 bg-[#070E22] border border-[#1E3A8A] shadow space-y-2 text-2xs">
                  <div className="flex items-center justify-between pb-1 border-b border-[#1E3A8A]">
                    <span className="text-3xs uppercase text-[#FFFFFF] font-extrabold flex items-center space-x-1">
                      <FileCheck className="w-3.5 h-3.5 text-[#0062FF] stroke-[2.5]" />
                      <span>SCHEMA INSPECTION AUDIT</span>
                    </span>
                    <span className="text-3xs text-[#FFFFFF] font-black px-1.5 py-0.2 bg-[#0062FF] border border-[#00F0FF] shadow-matrix-glow">
                      {inspectionResult.file_format} DETECTED
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-3xs">
                    <div className="p-1.5 bg-[#0A132E] border border-[#1E3A8A]">
                      <span className="text-[#94A3B8] font-bold block">ROWS</span>
                      <span className="text-[#FFFFFF] font-extrabold text-xs">
                        {inspectionResult.row_count.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-1.5 bg-[#0A132E] border border-[#1E3A8A]">
                      <span className="text-[#94A3B8] font-bold block">COLUMNS</span>
                      <span className="text-[#FFFFFF] font-extrabold text-xs">
                        {inspectionResult.column_count}
                      </span>
                    </div>
                    <div className="p-1.5 bg-[#0A132E] border border-[#1E3A8A]">
                      <span className="text-[#94A3B8] font-bold block">SAMPLING HZ</span>
                      <span className="text-[#FFFFFF] font-extrabold text-xs">
                        {inspectionResult.estimated_sampling_frequency ? `${inspectionResult.estimated_sampling_frequency} Hz` : 'N/A'}
                      </span>
                    </div>
                    <div className="p-1.5 bg-[#0A132E] border border-[#1E3A8A]">
                      <span className="text-[#94A3B8] font-bold block">CORE CHANNELS</span>
                      <span className="text-[#00E676] font-extrabold text-xs">
                        {inspectionResult.core_channels_found.length} / 10
                      </span>
                    </div>
                  </div>

                  {inspectionResult.warnings.length > 0 && (
                    <div className="p-1.5 bg-[#FFB000]/15 border border-[#1E3A8A] text-[#FBBF24] text-3xs font-bold">
                      {inspectionResult.warnings.join(' | ')}
                    </div>
                  )}

                  {/* Ingestion Parameters Form */}
                  <div className="pt-2 border-t border-[#1E3A8A] space-y-2">
                    <div className="text-3xs text-[#FFFFFF] uppercase font-extrabold">
                      [ TARGET INGESTION ASSIGNMENT ]
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-3xs">
                      <div className="col-span-1">
                        <label className="text-[#94A3B8] font-bold block mb-0.5">Session ID</label>
                        <input
                          type="text"
                          value={sessionId}
                          onChange={(e) => setSessionId(e.target.value)}
                          className="w-full bg-[#070E22] border border-[#1E3A8A] px-1.5 py-0.5 text-[#FFFFFF] font-bold focus:outline-none focus:ring-2 focus:ring-[#0062FF]"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="text-[#94A3B8] font-bold block mb-0.5">Run ID</label>
                        <input
                          type="text"
                          value={runId}
                          onChange={(e) => setRunId(e.target.value)}
                          className="w-full bg-[#070E22] border border-[#1E3A8A] px-1.5 py-0.5 text-[#FFFFFF] font-bold focus:outline-none focus:ring-2 focus:ring-[#0062FF]"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="text-[#94A3B8] font-bold block mb-0.5">Lap ID</label>
                        <input
                          type="text"
                          value={lapId}
                          onChange={(e) => setLapId(e.target.value)}
                          className="w-full bg-[#070E22] border border-[#1E3A8A] px-1.5 py-0.5 text-[#FFFFFF] font-bold focus:outline-none focus:ring-2 focus:ring-[#0062FF]"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="text-[#94A3B8] font-bold block mb-0.5">Lap No.</label>
                        <input
                          type="number"
                          value={lapNumber}
                          onChange={(e) => setLapNumber(Number(e.target.value))}
                          className="w-full bg-[#070E22] border border-[#1E3A8A] px-1.5 py-0.5 text-[#FFFFFF] font-bold focus:outline-none focus:ring-2 focus:ring-[#0062FF]"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="text-[#94A3B8] font-bold block mb-0.5">Time (s)</label>
                        <input
                          type="number"
                          step="0.001"
                          value={lapTime}
                          onChange={(e) => setLapTime(Number(e.target.value))}
                          className="w-full bg-[#070E22] border border-[#1E3A8A] px-1.5 py-0.5 text-[#FFFFFF] font-bold focus:outline-none focus:ring-2 focus:ring-[#0062FF]"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleIngest}
                      disabled={isIngesting}
                      className="w-full btn-matrix-blue py-2 text-2xs font-extrabold flex items-center justify-center space-x-1.5 disabled:opacity-40"
                    >
                      <Cpu className="w-3.5 h-3.5 text-[#FFFFFF] stroke-[2.5]" />
                      <span>
                        {isIngesting ? '[ EXECUTING PIPELINE (NORM -> RESAMPLE -> PARQUET)... ]' : '[ COMMIT & INGEST TELEMETRY ]'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Ingestion Success Banner */}
              {ingestionResult && (
                <div className="p-3 bg-[#00E676]/15 border border-[#1E3A8A] shadow space-y-1.5 text-2xs">
                  <div className="flex items-center justify-between text-[#FFFFFF] font-extrabold">
                    <div className="flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>[ INGESTION COMPLETED &amp; PERSISTED ]</span>
                    </div>
                    <span className="text-3xs uppercase bg-[#0062FF] text-[#FFFFFF] px-1.5 py-0.2 border border-[#00F0FF]">1M SPATIAL GRID</span>
                  </div>
                  <div className="text-3xs text-[#FFFFFF] font-semibold space-y-0.5">
                    <div>Raw Points: {ingestionResult.raw_points.toLocaleString()} | Resampled: {ingestionResult.resampled_points.toLocaleString()} points</div>
                    <div>Quality Score: {ingestionResult.quality.quality_score.toFixed(1)} / 100.0 ({ingestionResult.quality.status})</div>
                    <div className="truncate">Processing Run ID: {ingestionResult.processing_run_id}</div>
                    <div className="truncate font-mono text-[#94A3B8]">SHA-256: {ingestionResult.lineage.source_hash}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Multi-Lap Comparison Signal Engine */}
        <div className="col-span-5 space-y-3">
          <div className="matrix-hud-card bg-[#0A132E] border border-[#1E3A8A] shadow-md">
            <div className="window-header-retro bg-[#070E22] border-b border-[#1E3A8A] px-3 py-1.5 flex items-center justify-between text-[#FFFFFF] font-extrabold">
              <span className="text-3xs uppercase flex items-center space-x-1.5">
                <GitCompare className="w-3.5 h-3.5 text-[#0062FF] stroke-[2.5]" />
                <span>[ 2. MULTI-LAP DELTA SIGNAL ENGINE ]</span>
              </span>
              <span className="text-4xs px-1.5 py-0.2 bg-[#070E22] border border-[#1E3A8A]">MATHEMATICAL</span>
            </div>

            <div className="p-3 space-y-3">
              <div className="space-y-2 text-3xs">
                <div>
                  <label className="text-[#94A3B8] font-bold block mb-0.5">Reference Lap ID</label>
                  <input
                    type="text"
                    value={refLapId}
                    onChange={(e) => setRefLapId(e.target.value)}
                    className="w-full bg-[#070E22] border border-[#1E3A8A] px-2 py-1 text-[#FFFFFF] font-bold focus:outline-none focus:ring-2 focus:ring-[#0062FF]"
                  />
                </div>

                <div>
                  <label className="text-[#94A3B8] font-bold block mb-0.5">Comparison Lap ID</label>
                  <input
                    type="text"
                    value={compLapId}
                    onChange={(e) => setCompLapId(e.target.value)}
                    className="w-full bg-[#070E22] border border-[#1E3A8A] px-2 py-1 text-[#FFFFFF] font-bold focus:outline-none focus:ring-2 focus:ring-[#0062FF]"
                  />
                </div>

                <button
                  onClick={handleCompare}
                  disabled={isComparing}
                  className="w-full btn-matrix-blue py-2 text-2xs font-extrabold flex items-center justify-center space-x-1.5 disabled:opacity-40"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-[#FFFFFF] stroke-[2.5]" />
                  <span>{isComparing ? '[ COMPUTING SIGNAL DELTA... ]' : '[ CALCULATE Δt(s) & Δv(s) ]'}</span>
                </button>
              </div>

              {/* Comparison Results */}
              {comparisonResult && (
                <div className="p-3 bg-[#070E22] border border-[#1E3A8A] shadow space-y-2 text-2xs">
                  <div className="flex justify-between pb-1 border-b border-[#1E3A8A]">
                    <span className="text-3xs uppercase text-[#FFFFFF] font-extrabold">[ SIGNAL SUMMARY ]</span>
                    <span className="text-3xs text-[#FFFFFF] font-bold bg-[#0062FF] px-1.5 py-0.2 border border-[#00F0FF]">
                      {comparisonResult.point_count.toLocaleString()} GRID POINTS
                    </span>
                  </div>
                  <div className="space-y-1 text-3xs">
                    <div className="flex justify-between">
                      <span className="text-[#94A3B8] font-bold">DISTANCE SPAN</span>
                      <span className="text-[#FFFFFF] font-extrabold">
                        {comparisonResult.distance[0]}m → {comparisonResult.distance[comparisonResult.distance.length - 1]}m
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#94A3B8] font-bold">FINAL TIME DELTA Δt</span>
                      <span className={`font-extrabold ${comparisonResult.time_delta[comparisonResult.time_delta.length - 1] > 0 ? 'text-[#FFB000]' : 'text-[#00E676]'}`}>
                        {comparisonResult.time_delta[comparisonResult.time_delta.length - 1] > 0 ? '+' : ''}
                        {comparisonResult.time_delta[comparisonResult.time_delta.length - 1].toFixed(3)} s
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#94A3B8] font-bold">FINAL VELOCITY DELTA Δv</span>
                      <span className="text-[#FFFFFF] font-extrabold">
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
    </div>
  );
};
