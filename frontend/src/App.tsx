import React, { useState, useEffect, useCallback } from 'react';
import { WorkstationLayout } from './layouts/WorkstationLayout';
import { OverviewPage } from './pages/OverviewPage';
import { TelemetryPage } from './pages/TelemetryPage';
import { DataRunsPage } from './pages/DataRunsPage';
import { LapAnalysisPage } from './pages/LapAnalysisPage';
import { SensitivityPage } from './pages/SensitivityPage';
import { OptimizationPage } from './pages/OptimizationPage';
import { VehiclePerformancePage } from './pages/VehiclePerformancePage';
import { UninitializedModule } from './components/UninitializedModule';
import { api } from './services/api';
import {
  Session,
  Driver,
  Run,
  Lap,
  TelemetryResponse,
  NavModule,
  HealthResponse,
  LapMetadataResponse,
  LapChannelsResponse,
} from './types/domain';

export const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<NavModule>('overview');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [isLoadingTelem, setIsLoadingTelem] = useState<boolean>(false);

  // Stage 5 Optimization Navigation State
  const [optCorner, setOptCorner] = useState<string>('T9');
  const [optParam, setOptParam] = useState<string>('corner_exit_speed');

  // Engineering Context State
  const [isSynthetic, setIsSynthetic] = useState<boolean>(false);
  const [dataStatus, setDataStatus] = useState<string>('No data loaded');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [referenceDriver, setReferenceDriver] = useState<Driver | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [selectedRun, setSelectedRun] = useState<Run | null>(null);
  const [laps, setLaps] = useState<Lap[]>([]);
  const [selectedLap, setSelectedLap] = useState<Lap | null>(null);
  const [telemetryData, setTelemetryData] = useState<TelemetryResponse | null>(null);
  const [lapMetadata, setLapMetadata] = useState<LapMetadataResponse | null>(null);
  const [lapChannels, setLapChannels] = useState<LapChannelsResponse | null>(null);

  // Health ping
  const checkHealth = useCallback(async () => {
    const t0 = performance.now();
    try {
      const data = await api.getHealth();
      const t1 = performance.now();
      setHealth(data);
      setLatencyMs(Math.round(t1 - t0));
    } catch {
      setHealth(null);
      setLatencyMs(null);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  // Load available sessions list on startup
  useEffect(() => {
    api.getSessions().then(setSessions).catch(() => setSessions([]));
  }, []);

  // Telemetry Workflow Selection Handlers
  const handleSelectSession = useCallback(async (sessionId: string) => {
    if (!sessionId) {
      setSession(null);
      setRuns([]);
      setSelectedRun(null);
      setLaps([]);
      setSelectedLap(null);
      return;
    }
    try {
      const detail = await api.getSession(sessionId);
      setSession(detail.session);
      setDrivers(detail.drivers);
      setRuns(detail.runs);
      if (detail.runs.length > 0) {
        setSelectedRun(detail.runs[0]);
        const runDetail = await api.getRun(detail.runs[0].run_id);
        setLaps(runDetail.laps);
        if (runDetail.laps.length > 0) {
          setSelectedLap(runDetail.laps[0]);
        }
      }
    } catch (err) {
      console.error('Failed to select session:', err);
    }
  }, []);

  const handleSelectRun = useCallback(async (runId: string) => {
    const r = runs.find((item) => item.run_id === runId) || null;
    setSelectedRun(r);
    if (r) {
      try {
        const runDetail = await api.getRun(r.run_id);
        setLaps(runDetail.laps);
        if (runDetail.laps.length > 0) {
          setSelectedLap(runDetail.laps[0]);
        }
      } catch (err) {
        console.error('Failed to select run:', err);
      }
    } else {
      setLaps([]);
      setSelectedLap(null);
    }
  }, [runs]);

  const handleSelectLap = useCallback((lapId: string) => {
    const l = laps.find((item) => item.lap_id === lapId) || null;
    setSelectedLap(l);
  }, [laps]);

  const handleLoadTelemetry = useCallback(async () => {
    if (!selectedLap) return;
    setIsLoadingTelem(true);
    try {
      const [telem, meta, chs] = await Promise.all([
        api.getTelemetry(selectedLap.lap_id),
        api.getLapMetadata(selectedLap.lap_id),
        api.getLapChannels(selectedLap.lap_id),
      ]);
      setTelemetryData(telem);
      setLapMetadata(meta);
      setLapChannels(chs);
      setIsSynthetic(telem.data_label.includes('Synthetic'));
      setDataStatus('Active (' + telem.returned_points + ' pts)');
    } catch (err) {
      console.error('Failed to load telemetry:', err);
    } finally {
      setIsLoadingTelem(false);
    }
  }, [selectedLap]);

  // Load Synthetic Demonstration Dataset
  const loadDemoData = useCallback(async () => {
    try {
      const sessDetail = await api.getSession('demo-session-monza-2026');
      setSession(sessDetail.session);
      setDrivers(sessDetail.drivers);

      const d1 = sessDetail.drivers[0] || null;
      const d2 = sessDetail.drivers[1] || null;
      setSelectedDriver(d1);
      setReferenceDriver(d2);

      setRuns(sessDetail.runs);
      const r1 = sessDetail.runs[0] || null;
      setSelectedRun(r1);

      if (r1) {
        const runDetail = await api.getRun(r1.run_id);
        setLaps(runDetail.laps);
        const l1 = runDetail.laps[0] || null;
        setSelectedLap(l1);

        if (l1) {
          const [telem, meta, chs] = await Promise.all([
            api.getTelemetry(l1.lap_id),
            api.getLapMetadata(l1.lap_id),
            api.getLapChannels(l1.lap_id),
          ]);
          setTelemetryData(telem);
          setLapMetadata(meta);
          setLapChannels(chs);
        }
      }

      setIsSynthetic(true);
      setDataStatus('Active (Synthetic Demo)');
    } catch (err) {
      console.error('Failed to load demo data:', err);
    }
  }, []);

  const unloadDemoData = useCallback(() => {
    setSession(null);
    setDrivers([]);
    setSelectedDriver(null);
    setReferenceDriver(null);
    setRuns([]);
    setSelectedRun(null);
    setLaps([]);
    setSelectedLap(null);
    setTelemetryData(null);
    setLapMetadata(null);
    setLapChannels(null);
    setIsSynthetic(false);
    setDataStatus('No data loaded');
  }, []);

  const toggleDemoData = useCallback(() => {
    if (isSynthetic) {
      unloadDemoData();
    } else {
      loadDemoData();
    }
  }, [isSynthetic, loadDemoData, unloadDemoData]);

  // Global hotkeys for workstation module switching (F1-F11)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMap: Record<string, NavModule> = {
        F1: 'overview',
        F2: 'telemetry',
        F3: 'lap-analysis',
        F4: 'driver-comparison',
        F5: 'vehicle-performance',
        F6: 'tyres',
        F7: 'sensitivity',
        F8: 'optimization',
        F9: 'strategy',
        F10: 'data-runs',
        F11: 'model-health',
      };
      if (keyMap[e.key]) {
        e.preventDefault();
        setActiveModule(keyMap[e.key]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <WorkstationLayout
      session={session}
      drivers={drivers}
      selectedDriver={selectedDriver}
      runs={runs}
      selectedRun={selectedRun}
      referenceDriver={referenceDriver}
      dataStatus={dataStatus}
      isSynthetic={isSynthetic}
      activeModule={activeModule}
      health={health}
      latencyMs={latencyMs}
      bufferPointCount={telemetryData?.returned_points || 0}
      downsampleActive={telemetryData?.downsampled || false}
      onSelectDriver={setSelectedDriver}
      onSelectRun={setSelectedRun}
      onSelectModule={setActiveModule}
      onToggleDemoData={toggleDemoData}
    >
      {activeModule === 'overview' && (
        <OverviewPage
          session={session}
          selectedDriver={selectedDriver}
          selectedRun={selectedRun}
          selectedLap={selectedLap}
          telemetryData={telemetryData}
          isSynthetic={isSynthetic}
          onLoadSyntheticData={loadDemoData}
        />
      )}

      {activeModule === 'telemetry' && (
        <TelemetryPage
          sessions={sessions}
          currentSession={session}
          runs={runs}
          currentRun={selectedRun}
          laps={laps}
          currentLap={selectedLap}
          telemetryData={telemetryData}
          metadata={lapMetadata}
          channelsData={lapChannels}
          isSynthetic={isSynthetic}
          onSelectSession={handleSelectSession}
          onSelectRun={handleSelectRun}
          onSelectLap={handleSelectLap}
          onLoadTelemetry={handleLoadTelemetry}
          isLoading={isLoadingTelem}
        />
      )}

      {activeModule === 'data-runs' && <DataRunsPage />}

      {activeModule === 'lap-analysis' && <LapAnalysisPage />}

      {activeModule === 'sensitivity' && (
        <SensitivityPage
          onNavigateToOptimization={(cornerId, paramName) => {
            setOptCorner(cornerId);
            setOptParam(paramName);
            setActiveModule('optimization');
          }}
        />
      )}

      {activeModule === 'optimization' && (
        <OptimizationPage initialCorner={optCorner} initialParam={optParam} />
      )}

      {activeModule === 'vehicle-performance' && <VehiclePerformancePage />}

      {activeModule !== 'overview' &&
        activeModule !== 'telemetry' &&
        activeModule !== 'data-runs' &&
        activeModule !== 'lap-analysis' &&
        activeModule !== 'sensitivity' &&
        activeModule !== 'optimization' &&
        activeModule !== 'vehicle-performance' && (
          <UninitializedModule
            module={activeModule}
            onReturnToOverview={() => setActiveModule('overview')}
          />
        )}
    </WorkstationLayout>
  );
};

export default App;
