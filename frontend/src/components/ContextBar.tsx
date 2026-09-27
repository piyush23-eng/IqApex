import React from 'react';
import { Database } from 'lucide-react';
import { Session, Driver, Run } from '../types/domain';

interface ContextBarProps {
  session: Session | null;
  drivers: Driver[];
  selectedDriver: Driver | null;
  runs: Run[];
  selectedRun: Run | null;
  referenceDriver: Driver | null;
  dataStatus: string;
  isSynthetic: boolean;
  onSelectDriver: (driver: Driver) => void;
  onSelectRun: (run: Run) => void;
  onToggleDemoData: () => void;
}

export const ContextBar: React.FC<ContextBarProps> = ({
  session,
  drivers,
  selectedDriver,
  runs,
  selectedRun,
  referenceDriver,
  dataStatus,
  isSynthetic,
  onSelectDriver,
  onSelectRun,
  onToggleDemoData,
}) => {
  return (
    <header className="h-10 bg-workstation-panel border-b border-workstation-border flex items-center justify-between px-3 text-2xs select-none tracking-tight">
      {/* Brand & Left context items */}
      <div className="flex items-center space-x-3 divide-x divide-workstation-borderSubtle">
        {/* Neutral Identity Logo */}
        <div className="flex items-center space-x-1.5 pr-2">
          <div className="w-2.5 h-2.5 bg-workstation-accentCyan rounded-none rotate-45 transform" />
          <span className="font-mono font-semibold tracking-wider text-workstation-textBright text-xs">
            APEX<span className="text-workstation-accentCyan">IQ</span>
          </span>
          <span className="text-3xs text-workstation-textMuted uppercase font-mono px-1 py-0.5 border border-workstation-borderSubtle rounded">
            v0.1.0-STD
          </span>
        </div>

        {/* SESSION */}
        <div className="flex items-center space-x-1.5 pl-3">
          <span className="text-workstation-textMuted font-mono uppercase tracking-wider text-3xs">
            SESSION
          </span>
          <span className="font-mono text-workstation-textPrimary font-medium">
            {session ? session.event_name : '2026 Italian GP — FP2'}
          </span>
        </div>

        {/* CIRCUIT */}
        <div className="flex items-center space-x-1.5 pl-3">
          <span className="text-workstation-textMuted font-mono uppercase tracking-wider text-3xs">
            CIRCUIT
          </span>
          <span className="font-mono text-workstation-textPrimary">
            {session ? session.circuit : 'Monza'}
          </span>
        </div>

        {/* DRIVER SELECTOR */}
        <div className="relative flex items-center space-x-1.5 pl-3 group">
          <span className="text-workstation-textMuted font-mono uppercase tracking-wider text-3xs">
            DRIVER
          </span>
          <select
            aria-label="Select Driver"
            className="bg-workstation-surface border border-workstation-border text-workstation-textPrimary px-1.5 py-0.5 rounded font-mono text-2xs focus:outline-none focus:border-workstation-accentCyan cursor-pointer"
            value={selectedDriver?.driver_id || ''}
            onChange={(e) => {
              const d = drivers.find((drv) => drv.driver_id === e.target.value);
              if (d) onSelectDriver(d);
            }}
          >
            <option value="">Select Driver</option>
            {drivers.map((d) => (
              <option key={d.driver_id} value={d.driver_id}>
                #{d.car_number} {d.name} ({d.team})
              </option>
            ))}
          </select>
        </div>

        {/* RUN SELECTOR */}
        <div className="flex items-center space-x-1.5 pl-3">
          <span className="text-workstation-textMuted font-mono uppercase tracking-wider text-3xs">
            RUN
          </span>
          <select
            aria-label="Select Run"
            className="bg-workstation-surface border border-workstation-border text-workstation-textPrimary px-1.5 py-0.5 rounded font-mono text-2xs focus:outline-none focus:border-workstation-accentCyan cursor-pointer"
            value={selectedRun?.run_id || ''}
            onChange={(e) => {
              const r = runs.find((rn) => rn.run_id === e.target.value);
              if (r) onSelectRun(r);
            }}
          >
            <option value="">Select Run</option>
            {runs.map((r) => (
              <option key={r.run_id} value={r.run_id}>
                {r.run_id} ({r.compound}, L{r.tyre_age})
              </option>
            ))}
          </select>
        </div>

        {/* TYRE */}
        <div className="flex items-center space-x-1.5 pl-3">
          <span className="text-workstation-textMuted font-mono uppercase tracking-wider text-3xs">
            TYRE
          </span>
          <span className="font-mono text-workstation-textPrimary px-1.5 py-0.5 bg-workstation-surface border border-workstation-border rounded">
            {selectedRun ? `${selectedRun.compound} (L${selectedRun.tyre_age})` : 'Select Compound'}
          </span>
        </div>

        {/* REFERENCE */}
        <div className="flex items-center space-x-1.5 pl-3">
          <span className="text-workstation-textMuted font-mono uppercase tracking-wider text-3xs">
            REFERENCE
          </span>
          <span className="font-mono text-workstation-textSecondary">
            {referenceDriver ? `#${referenceDriver.car_number} ${referenceDriver.name}` : 'Select Reference'}
          </span>
        </div>
      </div>

      {/* Right status flags */}
      <div className="flex items-center space-x-2.5">
        {/* Demonstration dataset flag */}
        {isSynthetic && (
          <span className="font-mono text-3xs uppercase tracking-wider px-2 py-0.5 bg-workstation-telemetryAmber/10 text-workstation-telemetryAmber border border-workstation-telemetryAmber/30 rounded flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-workstation-telemetryAmber animate-pulse" />
            <span>Synthetic demonstration dataset</span>
          </span>
        )}

        {/* DATA STATUS */}
        <div className="flex items-center space-x-1.5 px-2 py-0.5 bg-workstation-surface border border-workstation-border rounded font-mono">
          <span className="text-workstation-textMuted uppercase text-3xs">DATA STATUS</span>
          <span className={`font-semibold ${dataStatus.includes('Active') || dataStatus.includes('Loaded') ? 'text-workstation-telemetryGreen' : 'text-workstation-textSecondary'}`}>
            {dataStatus}
          </span>
        </div>

        {/* Demo Switch Action */}
        <button
          onClick={onToggleDemoData}
          className="px-2 py-0.5 bg-workstation-surface hover:bg-workstation-card text-workstation-textSecondary hover:text-workstation-textPrimary border border-workstation-border rounded font-mono text-3xs transition-colors flex items-center space-x-1"
          title="Toggle synthetic demonstration session state"
        >
          <Database className="w-3 h-3 text-workstation-accentCyan" />
          <span>{isSynthetic ? 'Unload Demo' : 'Load Demo Set'}</span>
        </button>
      </div>
    </header>
  );
};
