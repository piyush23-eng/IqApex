import React from 'react';
import { ContextBar } from '../components/ContextBar';
import { LeftNav } from '../components/LeftNav';
import { StatusBar } from '../components/StatusBar';
import { Session, Driver, Run, NavModule, HealthResponse } from '../types/domain';

interface WorkstationLayoutProps {
  session: Session | null;
  drivers: Driver[];
  selectedDriver: Driver | null;
  runs: Run[];
  selectedRun: Run | null;
  referenceDriver: Driver | null;
  dataStatus: string;
  isSynthetic: boolean;
  activeModule: NavModule;
  health: HealthResponse | null;
  latencyMs: number | null;
  bufferPointCount: number;
  downsampleActive: boolean;
  onSelectDriver: (driver: Driver) => void;
  onSelectRun: (run: Run) => void;
  onSelectReferenceDriver?: (driver: Driver) => void;
  onSelectModule: (module: NavModule) => void;
  onToggleDemoData: () => void;
  children: React.ReactNode;
}

export const WorkstationLayout: React.FC<WorkstationLayoutProps> = ({
  session,
  drivers,
  selectedDriver,
  runs,
  selectedRun,
  referenceDriver,
  dataStatus,
  isSynthetic,
  activeModule,
  health,
  latencyMs,
  bufferPointCount,
  downsampleActive,
  onSelectDriver,
  onSelectRun,
  onSelectReferenceDriver,
  onSelectModule,
  onToggleDemoData,
  children,
}) => {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#030712] text-[#FFFFFF] select-none">
      {/* 1. TOP ENGINEERING CONTEXT BAR (F1 Pit-Wall Standard) */}
      <ContextBar
        session={session}
        drivers={drivers}
        selectedDriver={selectedDriver}
        runs={runs}
        selectedRun={selectedRun}
        referenceDriver={referenceDriver}
        dataStatus={dataStatus}
        isSynthetic={isSynthetic}
        onSelectDriver={onSelectDriver}
        onSelectRun={onSelectRun}
        onSelectReferenceDriver={onSelectReferenceDriver}
        onToggleDemoData={onToggleDemoData}
      />

      {/* 2. MAIN ENGINEERING WORKSPACE WITH SLEEK F1 LEFT NAV */}
      <div className="flex-1 flex overflow-hidden">
        <LeftNav activeModule={activeModule} onSelectModule={onSelectModule} />
        <main className="flex-1 overflow-y-auto bg-[#030712] p-3 relative">
          {children}
        </main>
      </div>

      {/* 3. BOTTOM WORKSTATION STATUS AREA */}
      <StatusBar
        health={health}
        latencyMs={latencyMs}
        bufferPointCount={bufferPointCount}
        downsampleActive={downsampleActive}
      />
    </div>
  );
};
