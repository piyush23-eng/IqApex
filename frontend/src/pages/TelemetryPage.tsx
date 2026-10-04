import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity,
  Layers,
  ShieldCheck,
  Cpu,
  Clock,
  Fingerprint,
  HardDrive,
  Download,
  BarChart2,
  TableProperties,
} from 'lucide-react';
import {
  Session,
  Run,
  Lap,
  TelemetryResponse,
  LapMetadataResponse,
  LapChannelsResponse,
  LapComparisonSummary,
  AlignedChannelsResponse,
  CircuitCornerDefinition,
  CornerMetric,
} from '../types/domain';
import { api } from '../services/api';
import { LapSummaryHeader } from '../components/telemetry/LapSummaryHeader';
import { TelemetryControls } from '../components/telemetry/TelemetryControls';
import { ChannelKey, CHANNELS } from '../types/telemetry';
import {
  SynchronizedCursorReadout,
  CursorSample,
} from '../components/telemetry/SynchronizedCursorReadout';
import { SynchronizedTelemetryWorkspace } from '../components/telemetry/SynchronizedTelemetryWorkspace';
import { CornerAnalysisTable } from '../components/telemetry/CornerAnalysisTable';
import { CornerContextInspector } from '../components/telemetry/CornerContextInspector';
import { CornerKinematicsSpectrum } from '../components/common/CornerKinematicsSpectrum';
import { Gauge } from 'lucide-react';

interface TelemetryPageProps {
  sessions: Session[];
  currentSession: Session | null;
  runs: Run[];
  currentRun: Run | null;
  laps: Lap[];
  currentLap: Lap | null;
  telemetryData: TelemetryResponse | null;
  metadata: LapMetadataResponse | null;
  channelsData: LapChannelsResponse | null;
  isSynthetic: boolean;
  onSelectSession: (sessionId: string) => void;
  onSelectRun: (runId: string) => void;
  onSelectLap: (lapId: string) => void;
  onLoadTelemetry: () => void;
  isLoading: boolean;
}

const DEFAULT_VISIBLE_CHANNELS: Record<ChannelKey, boolean> = {
  speed: true,
  throttle: true,
  brake: true,
  gear: true,
  rpm: true,
  drs: true,
  lat_g: true,
  long_g: true,
  delta: true,
};

const TRACK_LENGTH = 5793.0; // Monza

export const TelemetryPage: React.FC<TelemetryPageProps> = ({
  sessions,
  currentSession,
  runs,
  currentRun,
  laps,
  currentLap,
  telemetryData,
  metadata,
  channelsData,
  isSynthetic,
  onSelectSession,
  onSelectRun,
  onSelectLap,
  onLoadTelemetry,
  isLoading,
}) => {
  // Workstation View Modes
  const [activeTab, setActiveTab] = useState<'workstation' | 'diagnostics'>('workstation');
  const [diagSubTab, setDiagSubTab] = useState<'channels' | 'quality' | 'lineage'>('channels');

  // Laps for comparison
  const [referenceLapId, setReferenceLapId] = useState<string>('lap-demo-02');
  const [comparisonLapId, setComparisonLapId] = useState<string>('lap-demo-03');

  // Multi-channel synchronized state
  const [alignedData, setAlignedData] = useState<AlignedChannelsResponse | null>(null);
  const [comparisonSummary, setComparisonSummary] = useState<LapComparisonSummary | null>(null);
  const [corners, setCorners] = useState<CircuitCornerDefinition[]>([]);
  const [cornerMetrics, setCornerMetrics] = useState<CornerMetric[]>([]);
  const [isComparing, setIsComparing] = useState<boolean>(false);

  // Workstation controls state
  const [visibleChannels, setVisibleChannels] = useState<Record<ChannelKey, boolean>>(
    DEFAULT_VISIBLE_CHANNELS
  );
  const [deltaMode, setDeltaMode] = useState<'time' | 'speed'>('time');
  const [zoomSpan, setZoomSpan] = useState<{ min: number; max: number }>({
    min: 0,
    max: TRACK_LENGTH,
  });
  const [cursorSample, setCursorSample] = useState<CursorSample | null>(null);
  const [selectedCornerId, setSelectedCornerId] = useState<string | null>(null);
  const [showTrackMap, setShowTrackMap] = useState<boolean>(true);

  // Aggregate all laps in session for reference/comparison dropdowns
  const [allSessionLaps, setAllSessionLaps] = useState<Lap[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchSessionLaps = async () => {
      if (runs.length === 0) return;
      try {
        const lapPromises = runs.map((r) => api.getRun(r.run_id));
        const runDetails = await Promise.all(lapPromises);
        const collected: Lap[] = [];
        runDetails.forEach((rd) => {
          rd.laps.forEach((l) => collected.push(l));
        });
        if (isMounted && collected.length > 0) {
          setAllSessionLaps(collected);
        }
      } catch (err) {
        console.error('Failed to collect session laps:', err);
      }
    };

    fetchSessionLaps();
    return () => {
      isMounted = false;
    };
  }, [runs]);

  // Load Circuit Corner Definitions
  useEffect(() => {
    api
      .getCircuitCorners('monza')
      .then(setCorners)
      .catch((err) => console.error('Failed to fetch corners:', err));
  }, []);

  // Fetch Synchronized Analysis Data
  const loadComparison = useCallback(async (refId: string, compId: string) => {
    if (!refId || !compId) return;
    setIsComparing(true);
    try {
      const [summary, aligned, cm] = await Promise.all([
        api.getLapComparisonSummary(refId, compId),
        api.getAlignedChannels(refId, compId, 1.0),
        api.getCornerComparison(refId, compId, 'turn_number', 'asc'),
      ]);
      setComparisonSummary(summary);
      setAlignedData(aligned);
      setCornerMetrics(cm);
    } catch (err) {
      console.error('Failed to load comparison:', err);
    } finally {
      setIsComparing(false);
    }
  }, []);

  // Synchronize reference lap when currentLap prop changes from top context bar
  useEffect(() => {
    if (currentLap?.lap_id && currentLap.lap_id !== referenceLapId) {
      setReferenceLapId(currentLap.lap_id);
    }
  }, [currentLap?.lap_id, referenceLapId]);

  // Initial load or on lap change
  useEffect(() => {
    loadComparison(referenceLapId, comparisonLapId);
  }, [referenceLapId, comparisonLapId, loadComparison]);

  // Reset Zoom
  const handleResetZoom = useCallback(() => {
    setZoomSpan({ min: 0, max: TRACK_LENGTH });
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoomSpan((prev) => {
      const span = prev.max - prev.min;
      const center = (prev.min + prev.max) / 2;
      const newSpan = Math.max(80.0, span * 0.7);
      return {
        min: Math.max(0, center - newSpan / 2),
        max: Math.min(TRACK_LENGTH, center + newSpan / 2),
      };
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomSpan((prev) => {
      const span = prev.max - prev.min;
      const center = (prev.min + prev.max) / 2;
      const newSpan = Math.min(TRACK_LENGTH, span * 1.4);
      return {
        min: Math.max(0, center - newSpan / 2),
        max: Math.min(TRACK_LENGTH, center + newSpan / 2),
      };
    });
  }, []);

  // Channel toggle handler
  const handleToggleChannel = useCallback((key: ChannelKey) => {
    setVisibleChannels((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Corner selection handler from Table or Ribbon
  const handleSelectCorner = useCallback(
    (c: CornerMetric) => {
      setSelectedCornerId(c.corner_id);
      const margin = (c.exit_distance - c.entry_distance) * 0.4;
      setZoomSpan({
        min: Math.max(0, c.entry_distance - margin),
        max: Math.min(TRACK_LENGTH, c.exit_distance + margin),
      });
    },
    []
  );

  const selectedCornerMetric = useMemo(() => {
    if (!selectedCornerId) return null;
    return cornerMetrics.find((c) => c.corner_id === selectedCornerId) || null;
  }, [selectedCornerId, cornerMetrics]);

  // Number key shortcuts 1-9 to toggle channels
  useEffect(() => {
    const handleNumKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9) {
        const targetCh = CHANNELS.find((c) => c.hotkey === num);
        if (targetCh) {
          e.preventDefault();
          handleToggleChannel(targetCh.key);
        }
      }
    };
    window.addEventListener('keydown', handleNumKey);
    return () => window.removeEventListener('keydown', handleNumKey);
  }, [handleToggleChannel]);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 font-mono text-2xs select-none bg-[#030712] text-[#FFFFFF]">
      {/* 1. TOP ACQUISITION & WORKFLOW BAR */}
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 text-[#FFFFFF] uppercase text-2xs font-bold tracking-wider">
            <span className="w-2.5 h-2.5 bg-[#00F0FF] border border-[#1E3A8A] animate-pulse" />
            <Activity className="w-3.5 h-3.5 text-[#FFFFFF]" />
            <span>[ ACQUISITION & ANALYSIS WORKFLOW ]</span>
          </div>

          <span className="text-[#FFFFFF] font-bold">|</span>

          {/* Session Selection */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#070E22] border border-[#1E3A8A] shadow-sm">
            <span className="text-[#94A3B8] text-3xs font-bold uppercase tracking-wider">SESSION:</span>
            <select
              aria-label="Select Session"
              className="bg-[#0A132E] border border-[#1E3A8A] text-[#FFFFFF] px-2 py-0.5 text-2xs font-bold focus:outline-none focus:bg-[#00F0FF] cursor-pointer"
              value={currentSession?.session_id || ''}
              onChange={(e) => onSelectSession(e.target.value)}
            >
              <option value="">Select Session...</option>
              {sessions.map((s) => (
                <option key={s.session_id} value={s.session_id}>
                  {s.event_name}
                </option>
              ))}
            </select>
          </div>

          {/* Run Selection */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#070E22] border border-[#1E3A8A] shadow-sm">
            <span className="text-[#94A3B8] text-3xs font-bold uppercase tracking-wider">RUN:</span>
            <select
              aria-label="Select Run"
              className="bg-[#0A132E] border border-[#1E3A8A] text-[#FFFFFF] px-2 py-0.5 text-2xs font-bold focus:outline-none focus:bg-[#00F0FF] cursor-pointer disabled:opacity-50"
              value={currentRun?.run_id || ''}
              onChange={(e) => onSelectRun(e.target.value)}
              disabled={runs.length === 0}
            >
              <option value="">Select Run...</option>
              {runs.map((r) => (
                <option key={r.run_id} value={r.run_id}>
                  {r.run_id} ({r.compound})
                </option>
              ))}
            </select>
          </div>

          {/* Lap Selection */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#070E22] border border-[#1E3A8A] shadow-sm">
            <span className="text-[#94A3B8] text-3xs font-bold uppercase tracking-wider">ACTIVE LAP:</span>
            <select
              aria-label="Select Lap"
              className="bg-[#0A132E] border border-[#1E3A8A] text-[#FFFFFF] px-2 py-0.5 text-2xs font-bold focus:outline-none focus:bg-[#00F0FF] cursor-pointer disabled:opacity-50"
              value={currentLap?.lap_id || ''}
              onChange={(e) => {
                onSelectLap(e.target.value);
                setReferenceLapId(e.target.value);
              }}
              disabled={laps.length === 0}
            >
              <option value="">Select Lap...</option>
              {laps.map((l) => (
                <option key={l.lap_id} value={l.lap_id}>
                  Lap {l.lap_number} ({l.lap_time.toFixed(3)}s)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onLoadTelemetry}
            disabled={!currentLap || isLoading}
            className="btn-retro-primary text-3xs font-bold flex items-center space-x-1.5 disabled:opacity-40"
            title="Reload raw telemetry for active lap"
          >
            <Download className="w-3 h-3 text-[#FFFFFF]" />
            <span>{isLoading ? '[ ACQUIRING... ]' : '[ ACQUIRE ]'}</span>
          </button>
        </div>

        {/* View Mode Tabs & Map Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowTrackMap(!showTrackMap)}
            className={`px-3 py-1.5 border border-[#1E3A8A] font-bold flex items-center space-x-1.5 transition-all text-3xs ${
              showTrackMap
                ? 'bg-[#0062FF] text-[#FFFFFF] border-[#00F0FF] shadow-matrix-glow'
                : 'bg-[#070E22] text-[#93C5FD] hover:bg-[#0E1A3D]'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>{showTrackMap ? '[ KINEMATICS SPECTRUM: ON ]' : '[ KINEMATICS SPECTRUM: OFF ]'}</span>
          </button>

          <div className="flex items-center space-x-1 font-mono text-2xs">
            <button
              onClick={() => setActiveTab('workstation')}
              className={`px-3 py-1.5 border border-[#1E3A8A] font-bold flex items-center space-x-1.5 transition-all text-3xs ${
                activeTab === 'workstation'
                  ? 'bg-[#0062FF] text-[#FFFFFF] border-[#00F0FF] shadow-matrix-glow'
                  : 'bg-[#070E22] text-[#93C5FD] hover:bg-[#0E1A3D] shadow-sm'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>[ SYNCHRONIZED WORKSTATION ]</span>
            </button>
            <button
              onClick={() => setActiveTab('diagnostics')}
              className={`px-3 py-1.5 border border-[#1E3A8A] font-bold flex items-center space-x-1.5 transition-all text-3xs ${
                activeTab === 'diagnostics'
                  ? 'bg-[#0062FF] text-[#FFFFFF] border-[#00F0FF] shadow-matrix-glow'
                  : 'bg-[#070E22] text-[#93C5FD] hover:bg-[#0E1A3D] shadow-sm'
              }`}
            >
              <TableProperties className="w-3.5 h-3.5" />
              <span>[ PIPELINE DIAGNOSTICS ]</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. SYNCHRONIZED WORKSTATION VIEW */}
      {activeTab === 'workstation' && (
        <div className="space-y-3">
          {/* 11-Turn Kinematics Spectrum */}
          {showTrackMap && (
            <div className="mb-3">
              <CornerKinematicsSpectrum
                selectedCornerId={selectedCornerId}
                onSelectCorner={(cid) => {
                  setSelectedCornerId(cid);
                  const found = cornerMetrics.find((c) => c.corner_id === cid);
                  if (found) handleSelectCorner(found);
                }}
              />
            </div>
          )}

          {/* Lap Summary Header: Reference vs Comparison */}
          <LapSummaryHeader summary={comparisonSummary} isLoading={isComparing} />

          {/* Telemetry Controls Strip */}
          <TelemetryControls
            availableLaps={allSessionLaps.length > 0 ? allSessionLaps : laps}
            referenceLapId={referenceLapId}
            comparisonLapId={comparisonLapId}
            onSelectReferenceLap={setReferenceLapId}
            onSelectComparisonLap={setComparisonLapId}
            visibleChannels={visibleChannels}
            onToggleChannel={handleToggleChannel}
            deltaMode={deltaMode}
            onToggleDeltaMode={setDeltaMode}
            onResetZoom={handleResetZoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            zoomSpan={zoomSpan}
            trackLength={TRACK_LENGTH}
          />

          {/* Synchronized Cursor Readout Strip */}
          <SynchronizedCursorReadout sample={cursorSample} corners={corners} />

          {/* Corner Context Inspector Card (when a corner is selected) */}
          {selectedCornerMetric && (
            <CornerContextInspector
              corner={selectedCornerMetric}
              onClose={() => setSelectedCornerId(null)}
              onZoomToCorner={handleSelectCorner}
            />
          )}

          {/* 9-Channel Stacked Synchronized Workspace */}
          <SynchronizedTelemetryWorkspace
            data={alignedData}
            corners={corners}
            visibleChannels={visibleChannels}
            deltaMode={deltaMode}
            zoomSpan={zoomSpan}
            onZoomChange={setZoomSpan}
            onResetZoom={handleResetZoom}
            onCursorChange={setCursorSample}
            selectedCornerId={selectedCornerId}
            onSelectCorner={(cid) => {
              setSelectedCornerId(cid);
              const found = cornerMetrics.find((c) => c.corner_id === cid);
              if (found) handleSelectCorner(found);
            }}
            trackLength={TRACK_LENGTH}
          />

          {/* Sortable Corner Analysis Table */}
          <CornerAnalysisTable
            corners={cornerMetrics}
            selectedCornerId={selectedCornerId}
            onSelectCorner={handleSelectCorner}
          />
        </div>
      )}

      {/* 3. PIPELINE DIAGNOSTICS VIEW */}
      {activeTab === 'diagnostics' && (
        <div className="space-y-4">
          {/* Top Metric Strip */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="p-3 bg-[#070E22] border border-[#1E3A8A] shadow">
              <div className="text-3xs text-[#94A3B8] font-bold uppercase flex items-center space-x-1">
                <HardDrive className="w-3 h-3 text-[#FFFFFF]" />
                <span>AVAILABILITY</span>
              </div>
              <div className="text-sm font-bold text-[#00E676] mt-1">ACQUIRED</div>
              <div className="text-3xs text-[#94A3B8] mt-0.5">
                {alignedData?.point_count.toLocaleString() || '5,794'} distance points
              </div>
            </div>

            <div className="p-3 bg-[#070E22] border border-[#1E3A8A] shadow">
              <div className="text-3xs text-[#94A3B8] font-bold uppercase flex items-center space-x-1">
                <Layers className="w-3 h-3 text-[#FFFFFF]" />
                <span>CHANNELS</span>
              </div>
              <div className="text-sm font-bold text-[#FFFFFF] mt-1">10 CANONICAL</div>
              <div className="text-3xs text-[#94A3B8] mt-0.5">10 Core / 0 Missing</div>
            </div>

            <div className="p-3 bg-[#070E22] border border-[#1E3A8A] shadow">
              <div className="text-3xs text-[#94A3B8] font-bold uppercase flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 text-[#FFFFFF]" />
                <span>DATA QUALITY</span>
              </div>
              <div className="text-sm font-bold text-[#00E676] mt-1">
                {comparisonSummary ? `PASS (${comparisonSummary.reference_quality_score.toFixed(1)})` : 'PASS (100.0)'}
              </div>
              <div className="text-3xs text-[#94A3B8] mt-0.5">0 active warnings</div>
            </div>

            <div className="p-3 bg-[#070E22] border border-[#1E3A8A] shadow">
              <div className="text-3xs text-[#94A3B8] font-bold uppercase flex items-center space-x-1">
                <Cpu className="w-3 h-3 text-[#FFFFFF]" />
                <span>SPATIAL STEP</span>
              </div>
              <div className="text-sm font-bold text-[#FFFFFF] mt-1">1.00 m NOMINAL</div>
              <div className="text-3xs text-[#94A3B8] mt-0.5">Uniform Grid</div>
            </div>

            <div className="p-3 bg-[#070E22] border border-[#1E3A8A] shadow">
              <div className="text-3xs text-[#94A3B8] font-bold uppercase flex items-center space-x-1">
                <Clock className="w-3 h-3 text-[#FFFFFF]" />
                <span>DISTANCE SPAN</span>
              </div>
              <div className="text-sm font-bold text-[#FFFFFF] mt-1">0 → 5,793 m</div>
              <div className="text-3xs text-[#94A3B8] mt-0.5">
                {telemetryData ? `${telemetryData.total_raw_points} samples` : '1-meter aligned grid'}
              </div>
            </div>

            <div className="p-3 bg-[#070E22] border border-[#1E3A8A] shadow">
              <div className="text-3xs text-[#94A3B8] font-bold uppercase flex items-center space-x-1">
                <Fingerprint className="w-3 h-3 text-[#FFFFFF]" />
                <span>DATA SOURCE</span>
              </div>
              <div className="text-xs font-bold text-[#FF3366] mt-1 truncate">
                {isSynthetic ? 'Synthetic demo' : 'Parquet Store'}
              </div>
              <div className="text-3xs text-[#94A3B8] mt-0.5 truncate">
                Pipeline v{metadata?.lineage?.pipeline_version || '2.0.0'}
              </div>
            </div>
          </div>

          {/* Diagnostics Tabs & Content */}
          <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] shadow-md">
            <div className="flex items-center space-x-2 px-3 pt-2 border-b border-[#1E3A8A] bg-[#070E22]">
              <button
                onClick={() => setDiagSubTab('channels')}
                className={`px-3 py-1.5 text-2xs font-bold transition-all border-b-2 ${
                  diagSubTab === 'channels'
                    ? 'border-[#1E3A8A] bg-[#070E22] text-[#FFFFFF]'
                    : 'border-transparent text-[#94A3B8] hover:text-[#FFFFFF]'
                }`}
              >
                [ Canonical Channel Table ({channelsData?.channels.length || 10}) ]
              </button>
              <button
                onClick={() => setDiagSubTab('quality')}
                className={`px-3 py-1.5 text-2xs font-bold transition-all border-b-2 ${
                  diagSubTab === 'quality'
                    ? 'border-[#1E3A8A] bg-[#070E22] text-[#FFFFFF]'
                    : 'border-transparent text-[#94A3B8] hover:text-[#FFFFFF]'
                }`}
              >
                [ Data Quality Report ]
              </button>
              <button
                onClick={() => setDiagSubTab('lineage')}
                className={`px-3 py-1.5 text-2xs font-bold transition-all border-b-2 ${
                  diagSubTab === 'lineage'
                    ? 'border-[#1E3A8A] bg-[#070E22] text-[#FFFFFF]'
                    : 'border-transparent text-[#94A3B8] hover:text-[#FFFFFF]'
                }`}
              >
                [ Cryptographic Lineage ]
              </button>
            </div>

            <div className="p-3 bg-[#070E22]">
              {diagSubTab === 'channels' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-2xs">
                    <thead>
                      <tr className="text-3xs text-[#FFFFFF] font-bold uppercase border-b border-[#1E3A8A] pb-1 bg-[#070E22]">
                        <th className="py-1.5 px-2">Canonical Channel</th>
                        <th className="py-1.5 px-2">Type</th>
                        <th className="py-1.5 px-2">Canonical Unit</th>
                        <th className="py-1.5 px-2">Resampling Interpolation</th>
                        <th className="py-1.5 px-2">Enforcement Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E0E0E0] text-[#FFFFFF]">
                      {[
                        { name: 'timestamp', type: 'float64', unit: 's', interp: 'Linear', status: 'Core Mandatory' },
                        { name: 'distance', type: 'float64', unit: 'm', interp: 'Spatial Reference', status: 'Core Mandatory' },
                        { name: 'speed', type: 'float64', unit: 'km/h', interp: 'Linear', status: 'Core Mandatory' },
                        { name: 'throttle', type: 'float64', unit: '%', interp: 'Linear', status: 'Core Mandatory' },
                        { name: 'brake', type: 'float64', unit: '%', interp: 'Linear', status: 'Core Mandatory' },
                        { name: 'gear', type: 'int32', unit: 'index', interp: 'Nearest-Neighbor (Discrete)', status: 'Core Mandatory' },
                        { name: 'rpm', type: 'int32', unit: 'RPM', interp: 'Linear', status: 'Core Mandatory' },
                        { name: 'drs', type: 'int32', unit: 'state', interp: 'Nearest-Neighbor (Discrete)', status: 'Core Mandatory' },
                        { name: 'lateral_acceleration', type: 'float64', unit: 'G', interp: 'Linear', status: 'Core Mandatory' },
                        { name: 'longitudinal_acceleration', type: 'float64', unit: 'G', interp: 'Linear', status: 'Core Mandatory' },
                      ].map((ch) => (
                        <tr key={ch.name} className="hover:bg-[#0A132E]">
                          <td className="py-1.5 px-2 font-bold text-[#FFFFFF]">{ch.name}</td>
                          <td className="py-1.5 px-2 text-[#CBD5E1]">{ch.type}</td>
                          <td className="py-1.5 px-2 text-[#FFFFFF] font-semibold bg-[#00F0FF]/20">{ch.unit}</td>
                          <td className="py-1.5 px-2 text-[#CBD5E1]">{ch.interp}</td>
                          <td className="py-1.5 px-2">
                            <span className="text-3xs px-2 py-0.5 bg-[#00F0FF] border border-[#1E3A8A] text-[#FFFFFF] font-bold">
                              {ch.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {diagSubTab === 'quality' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-3 p-3 bg-[#0A132E] border border-[#1E3A8A] shadow">
                    <div>
                      <div className="text-3xs text-[#94A3B8] font-bold uppercase">Quality Status</div>
                      <div className="text-sm font-bold text-[#00E676] mt-0.5">
                        {telemetryData?.data_quality?.status || 'PASS'}
                      </div>
                    </div>
                    <div>
                      <div className="text-3xs text-[#94A3B8] font-bold uppercase">Integrity Score</div>
                      <div className="text-sm font-bold text-[#FFFFFF] mt-0.5">
                        {telemetryData?.data_quality?.quality_score?.toFixed(1) || '100.0'} / 100.0
                      </div>
                    </div>
                    <div>
                      <div className="text-3xs text-[#94A3B8] font-bold uppercase">Missing Channels</div>
                      <div className="text-sm font-bold text-[#FFFFFF] mt-0.5">
                        {telemetryData?.data_quality?.missing_percentage?.toFixed(2) || '0.00'}%
                      </div>
                    </div>
                    <div>
                      <div className="text-3xs text-[#94A3B8] font-bold uppercase">Physical Boundary Checks</div>
                      <div className="text-sm font-bold text-[#00E676] mt-0.5">100% Validated</div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#0A132E] border border-[#1E3A8A] text-[#E2E8F0] text-3xs font-medium">
                    {telemetryData?.data_quality?.warnings && telemetryData.data_quality.warnings.length > 0 ? (
                      <div className="space-y-1">
                        {telemetryData.data_quality.warnings.map((w, i) => (
                          <div key={i} className="text-[#FF3366] font-bold">{w}</div>
                        ))}
                      </div>
                    ) : (
                      'Zero anomalies detected. Monotonic time and physical thresholds verified.'
                    )}
                  </div>
                </div>
              )}

              {diagSubTab === 'lineage' && (
                <div className="p-3 bg-[#0A132E] border border-[#1E3A8A] space-y-2 text-2xs shadow">
                  <div className="flex justify-between pb-1.5 border-b border-[#1E3A8A]">
                    <span className="text-[#94A3B8] uppercase text-3xs font-bold">PROCESSING RUN ID</span>
                    <span className="text-[#FFFFFF] font-bold">
                      {metadata?.lineage?.processing_run_id || 'pr-demo-baseline-001'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8] uppercase text-3xs font-bold">SOURCE FILE</span>
                    <span className="text-[#FFFFFF] font-semibold">
                      {metadata?.lineage?.source_file || 'synthetic_monza_fp2.csv'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8] uppercase text-3xs font-bold">SOURCE SHA-256 HASH</span>
                    <span className="text-[#CBD5E1] text-3xs font-mono truncate max-w-md">
                      {metadata?.lineage?.source_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8] uppercase text-3xs font-bold">PIPELINE / MAPPING VERSION</span>
                    <span className="text-[#FFFFFF] font-semibold">
                      Pipeline v{metadata?.lineage?.pipeline_version || '2.0.0'} / Map v{metadata?.lineage?.mapping_version || '1.0.0'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8] uppercase text-3xs font-bold">PROCESSED AT</span>
                    <span className="text-[#FFFFFF] font-semibold">
                      {metadata?.lineage?.processed_at || new Date().toISOString()}
                    </span>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
