import React, { useState, useEffect, useCallback } from 'react';
import { WorkstationLayout } from './layouts/WorkstationLayout';
import { OverviewPage } from './pages/OverviewPage';
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
} from './types/domain';

export const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<NavModule>('overview');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  // Engineering Context State
  const [isSynthetic, setIsSynthetic] = useState<boolean>(false);
  const [dataStatus, setDataStatus] = useState<string>('No data loaded');
  const [session, setSession] = useState<Session | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [referenceDriver, setReferenceDriver] = useState<Driver | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [selectedRun, setSelectedRun] = useState<Run | null>(null);
  const [selectedLap, setSelectedLap] = useState<Lap | null>(null);
  const [telemetryData, setTelemetryData] = useState<TelemetryResponse | null>(null);

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
        const l1 = runDetail.laps[0] || null;
        setSelectedLap(l1);

        if (l1) {
          const telem = await api.getTelemetry(l1.lap_id);
          setTelemetryData(telem);
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
    setSelectedLap(null);
    setTelemetryData(null);
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

  // Handle Driver change
  const handleSelectDriver = useCallback((driver: Driver) => {
    setSelectedDriver(driver);
  }, []);

  // Handle Run change
  const handleSelectRun = useCallback((run: Run) => {
    setSelectedRun(run);
  }, []);

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
      onSelectDriver={handleSelectDriver}
      onSelectRun={handleSelectRun}
      onSelectModule={setActiveModule}
      onToggleDemoData={toggleDemoData}
    >
      {activeModule === 'overview' ? (
        <OverviewPage
          session={session}
          selectedDriver={selectedDriver}
          selectedRun={selectedRun}
          selectedLap={selectedLap}
          telemetryData={telemetryData}
          isSynthetic={isSynthetic}
          onLoadSyntheticData={loadDemoData}
        />
      ) : (
        <UninitializedModule
          module={activeModule}
          onReturnToOverview={() => setActiveModule('overview')}
        />
      )}
    </WorkstationLayout>
  );
};

export default App;
