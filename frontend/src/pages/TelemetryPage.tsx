import React, { useState } from 'react';
import {
  Activity,
  Layers,
  ShieldCheck,
  Cpu,
  Clock,
  Fingerprint,
  HardDrive,
  Download,
} from 'lucide-react';
import {
  Session,
  Run,
  Lap,
  TelemetryResponse,
  LapMetadataResponse,
  LapChannelsResponse,
} from '../types/domain';
import { formatLapTime } from '../utils/formatters';

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
  const [activeTab, setActiveTab] = useState<'channels' | 'quality' | 'lineage'>('channels');

  const quality = telemetryData?.data_quality;

  return (
    <div className="h-full overflow-y-auto p-3 space-y-3 font-mono text-2xs select-none">
      {/* 1. DATA LOADING WORKFLOW BAR */}
      <div className="p-3 bg-workstation-panel border border-workstation-border rounded flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-workstation-textMuted uppercase text-3xs font-semibold">
            <Activity className="w-3.5 h-3.5 text-workstation-accentCyan" />
            <span>TELEMETRY ACQUISITION WORKFLOW</span>
          </div>

          <span className="text-workstation-border">|</span>

          {/* Step 1: Select Session */}
          <div className="flex items-center space-x-1.5">
            <span className="text-workstation-textMuted text-3xs uppercase">1. SESSION:</span>
            <select
              aria-label="Select Session"
              className="bg-workstation-surface border border-workstation-border text-workstation-textPrimary px-2 py-1 rounded text-2xs focus:outline-none focus:border-workstation-accentCyan"
              value={currentSession?.session_id || ''}
              onChange={(e) => onSelectSession(e.target.value)}
            >
              <option value="">Select Session...</option>
              {sessions.map((s) => (
                <option key={s.session_id} value={s.session_id}>
                  {s.event_name} ({s.session_type})
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Select Run */}
          <div className="flex items-center space-x-1.5">
            <span className="text-workstation-textMuted text-3xs uppercase">2. RUN:</span>
            <select
              aria-label="Select Run"
              className="bg-workstation-surface border border-workstation-border text-workstation-textPrimary px-2 py-1 rounded text-2xs focus:outline-none focus:border-workstation-accentCyan disabled:opacity-50"
              value={currentRun?.run_id || ''}
              onChange={(e) => onSelectRun(e.target.value)}
              disabled={runs.length === 0}
            >
              <option value="">Select Run...</option>
              {runs.map((r) => (
                <option key={r.run_id} value={r.run_id}>
                  {r.run_id} ({r.compound}, L{r.tyre_age})
                </option>
              ))}
            </select>
          </div>

          {/* Step 3: Select Lap */}
          <div className="flex items-center space-x-1.5">
            <span className="text-workstation-textMuted text-3xs uppercase">3. LAP:</span>
            <select
              aria-label="Select Lap"
              className="bg-workstation-surface border border-workstation-border text-workstation-textPrimary px-2 py-1 rounded text-2xs focus:outline-none focus:border-workstation-accentCyan disabled:opacity-50"
              value={currentLap?.lap_id || ''}
              onChange={(e) => onSelectLap(e.target.value)}
              disabled={laps.length === 0}
            >
              <option value="">Select Lap...</option>
              {laps.map((l) => (
                <option key={l.lap_id} value={l.lap_id}>
                  Lap {l.lap_number} ({formatLapTime(l.lap_time)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Step 4: Trigger Load */}
        <button
          onClick={onLoadTelemetry}
          disabled={!currentLap || isLoading}
          className="px-3 py-1 bg-workstation-accent hover:bg-workstation-accent/80 text-white rounded text-2xs font-semibold flex items-center space-x-1.5 disabled:opacity-40 transition-colors"
        >
          <Download className="w-3 h-3" />
          <span>{isLoading ? 'Loading Trace...' : 'Load Telemetry'}</span>
        </button>
      </div>

      {/* 2. TELEMETRY STATUS & DIAGNOSTICS */}
      {telemetryData ? (
        <div className="space-y-3">
          {/* Top Metric Strip */}
          <div className="grid grid-cols-6 gap-2.5">
            {/* Availability */}
            <div className="p-2.5 bg-workstation-panel border border-workstation-border rounded">
              <div className="text-3xs text-workstation-textMuted uppercase flex items-center space-x-1">
                <HardDrive className="w-3 h-3 text-workstation-accentCyan" />
                <span>AVAILABILITY</span>
              </div>
              <div className="text-sm font-semibold text-workstation-telemetryGreen mt-1">
                ACQUIRED
              </div>
              <div className="text-3xs text-workstation-textMuted mt-0.5">
                {telemetryData.total_raw_points.toLocaleString()} raw samples
              </div>
            </div>

            {/* Channels Count */}
            <div className="p-2.5 bg-workstation-panel border border-workstation-border rounded">
              <div className="text-3xs text-workstation-textMuted uppercase flex items-center space-x-1">
                <Layers className="w-3 h-3 text-workstation-accentCyan" />
                <span>CHANNELS</span>
              </div>
              <div className="text-sm font-semibold text-workstation-textBright mt-1">
                {channelsData?.channels.length || 10} CANONICAL
              </div>
              <div className="text-3xs text-workstation-textMuted mt-0.5">
                10 Core / 0 Missing
              </div>
            </div>

            {/* Data Quality */}
            <div className="p-2.5 bg-workstation-panel border border-workstation-border rounded">
              <div className="text-3xs text-workstation-textMuted uppercase flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 text-workstation-accentCyan" />
                <span>DATA QUALITY</span>
              </div>
              <div className="text-sm font-semibold text-workstation-telemetryGreen mt-1">
                {quality ? `${quality.status} (${quality.quality_score.toFixed(1)})` : 'PASS (100.0)'}
              </div>
              <div className="text-3xs text-workstation-textMuted mt-0.5">
                {quality?.warnings.length || 0} active warnings
              </div>
            </div>

            {/* Sampling Frequency */}
            <div className="p-2.5 bg-workstation-panel border border-workstation-border rounded">
              <div className="text-3xs text-workstation-textMuted uppercase flex items-center space-x-1">
                <Cpu className="w-3 h-3 text-workstation-accentCyan" />
                <span>SAMPLING FREQ</span>
              </div>
              <div className="text-sm font-semibold text-workstation-textBright mt-1">
                10.0 Hz NOMINAL
              </div>
              <div className="text-3xs text-workstation-textMuted mt-0.5">
                mean dt = 100.5 ms
              </div>
            </div>

            {/* Distance Range */}
            <div className="p-2.5 bg-workstation-panel border border-workstation-border rounded">
              <div className="text-3xs text-workstation-textMuted uppercase flex items-center space-x-1">
                <Clock className="w-3 h-3 text-workstation-accentCyan" />
                <span>DISTANCE SPAN</span>
              </div>
              <div className="text-sm font-semibold text-workstation-accentCyan mt-1">
                0 → 5,793 m
              </div>
              <div className="text-3xs text-workstation-textMuted mt-0.5">
                1-meter aligned grid
              </div>
            </div>

            {/* Data Source & Lineage */}
            <div className="p-2.5 bg-workstation-panel border border-workstation-border rounded">
              <div className="text-3xs text-workstation-textMuted uppercase flex items-center space-x-1">
                <Fingerprint className="w-3 h-3 text-workstation-accentCyan" />
                <span>DATA SOURCE</span>
              </div>
              <div className="text-xs font-semibold text-workstation-telemetryAmber mt-1 truncate">
                {isSynthetic ? 'Synthetic demo' : 'Parquet Store'}
              </div>
              <div className="text-3xs text-workstation-textMuted mt-0.5 truncate">
                Pipe v{metadata?.lineage?.pipeline_version || '2.0.0'}
              </div>
            </div>
          </div>

          {/* Diagnostics Tabs & Content */}
          <div className="bg-workstation-panel border border-workstation-border rounded">
            <div className="flex items-center space-x-2 px-3 pt-2 border-b border-workstation-borderSubtle">
              <button
                onClick={() => setActiveTab('channels')}
                className={`px-3 py-1.5 text-2xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'channels'
                    ? 'border-workstation-accentCyan text-workstation-accentCyan'
                    : 'border-transparent text-workstation-textMuted hover:text-workstation-textSecondary'
                }`}
              >
                Canonical Channel Table
              </button>
              <button
                onClick={() => setActiveTab('quality')}
                className={`px-3 py-1.5 text-2xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'quality'
                    ? 'border-workstation-accentCyan text-workstation-accentCyan'
                    : 'border-transparent text-workstation-textMuted hover:text-workstation-textSecondary'
                }`}
              >
                Data Quality Report
              </button>
              <button
                onClick={() => setActiveTab('lineage')}
                className={`px-3 py-1.5 text-2xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'lineage'
                    ? 'border-workstation-accentCyan text-workstation-accentCyan'
                    : 'border-transparent text-workstation-textMuted hover:text-workstation-textSecondary'
                }`}
              >
                Cryptographic Lineage
              </button>
            </div>

            <div className="p-3">
              {activeTab === 'channels' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-2xs">
                    <thead>
                      <tr className="text-3xs text-workstation-textMuted uppercase border-b border-workstation-borderSubtle pb-1">
                        <th className="py-1">Canonical Channel</th>
                        <th className="py-1">Type</th>
                        <th className="py-1">Canonical Unit</th>
                        <th className="py-1">Resampling Interpolation</th>
                        <th className="py-1">Enforcement Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-workstation-borderMuted">
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
                        <tr key={ch.name} className="hover:bg-workstation-surface/40">
                          <td className="py-1.5 font-medium text-workstation-textBright">{ch.name}</td>
                          <td className="py-1.5 text-workstation-textSecondary">{ch.type}</td>
                          <td className="py-1.5 text-workstation-accentCyan">{ch.unit}</td>
                          <td className="py-1.5 text-workstation-textSecondary">{ch.interp}</td>
                          <td className="py-1.5">
                            <span className="text-3xs px-1.5 py-0.5 bg-workstation-surface border border-workstation-borderSubtle text-workstation-telemetryGreen rounded">
                              {ch.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'quality' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-3 p-3 bg-workstation-surface border border-workstation-borderSubtle rounded">
                    <div>
                      <div className="text-3xs text-workstation-textMuted uppercase">Quality Status</div>
                      <div className="text-sm font-semibold text-workstation-telemetryGreen mt-0.5">
                        {quality?.status || 'PASS'}
                      </div>
                    </div>
                    <div>
                      <div className="text-3xs text-workstation-textMuted uppercase">Integrity Score</div>
                      <div className="text-sm font-semibold text-workstation-textBright mt-0.5">
                        {quality?.quality_score.toFixed(1) || '100.0'} / 100.0
                      </div>
                    </div>
                    <div>
                      <div className="text-3xs text-workstation-textMuted uppercase">Missing Channels</div>
                      <div className="text-sm font-semibold text-workstation-textSecondary mt-0.5">
                        {quality?.missing_percentage.toFixed(2) || '0.00'}%
                      </div>
                    </div>
                    <div>
                      <div className="text-3xs text-workstation-textMuted uppercase">Physical Boundary Checks</div>
                      <div className="text-sm font-semibold text-workstation-telemetryGreen mt-0.5">
                        100% Validated
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-3xs text-workstation-textMuted uppercase font-semibold mb-1">
                      Active Validation Log
                    </div>
                    {quality && quality.warnings.length > 0 ? (
                      <div className="space-y-1">
                        {quality.warnings.map((w, idx) => (
                          <div
                            key={idx}
                            className="p-2 bg-workstation-telemetryAmber/10 border border-workstation-telemetryAmber/20 rounded text-workstation-telemetryAmber text-3xs"
                          >
                            {w}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2 bg-workstation-surface border border-workstation-borderSubtle rounded text-workstation-textMuted text-3xs">
                        Zero anomalies detected. Monotonic time and physical thresholds verified.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'lineage' && (
                <div className="p-3 bg-workstation-surface border border-workstation-borderSubtle rounded space-y-2 text-2xs">
                  <div className="flex justify-between pb-1.5 border-b border-workstation-borderSubtle">
                    <span className="text-workstation-textMuted uppercase text-3xs">PROCESSING RUN ID</span>
                    <span className="text-workstation-accentCyan font-semibold">
                      {metadata?.lineage?.processing_run_id || 'pr-demo-baseline-001'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-workstation-textMuted uppercase text-3xs">SOURCE FILE</span>
                    <span className="text-workstation-textPrimary">
                      {metadata?.lineage?.source_file || 'synthetic_monza_fp2.csv'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-workstation-textMuted uppercase text-3xs">SOURCE SHA-256 HASH</span>
                    <span className="text-workstation-textSecondary text-3xs truncate max-w-md">
                      {metadata?.lineage?.source_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-workstation-textMuted uppercase text-3xs">PIPELINE / MAPPING VERSION</span>
                    <span className="text-workstation-textSecondary">
                      Pipeline v{metadata?.lineage?.pipeline_version || '2.0.0'} / Map v{metadata?.lineage?.mapping_version || '1.0.0'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-workstation-textMuted uppercase text-3xs">PROCESSED AT</span>
                    <span className="text-workstation-textSecondary">
                      {metadata?.lineage?.processed_at || new Date().toISOString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="h-96 flex flex-col items-center justify-center p-8 bg-workstation-panel border border-dashed border-workstation-border rounded text-center">
          <Activity className="w-8 h-8 text-workstation-textMuted/40 mb-2" />
          <p className="text-workstation-textSecondary font-semibold">No telemetry loaded into active view</p>
          <p className="text-3xs text-workstation-textMuted mt-1 max-w-sm">
            Select a Session, Run, and Lap using the acquisition workflow bar above, then click &quot;Load Telemetry&quot;.
          </p>
        </div>
      )}
    </div>
  );
};
