import React from 'react';
import { Radio, Thermometer, Cpu, Compass } from 'lucide-react';
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
  onSelectReferenceDriver?: (driver: Driver) => void;
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
  onSelectReferenceDriver,
  onToggleDemoData,
}) => {
  const compound = selectedRun?.compound?.toUpperCase() || 'MEDIUM';
  const compoundBadge =
    compound.includes('SOFT')
      ? 'border-[#FF3366] text-white bg-[#FF3366]'
      : compound.includes('HARD')
      ? 'border-white text-[#030712] bg-white'
      : 'border-[#0062FF] text-white bg-[#0062FF]';

  return (
    <header className="h-11 bg-[#070E22] border-b border-[#1E3A8A] flex items-center justify-between px-3 text-2xs select-none tracking-tight shadow-lg gap-3 overflow-hidden">
      {/* Brand & Left Context */}
      <div className="flex items-center space-x-2.5 overflow-x-auto min-w-0 flex-1">
        {/* Brand identity chip */}
        <div className="flex items-center space-x-2 pr-3 border-r border-[#1E3A8A] shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00F0FF] shadow-[0_0_10px_#00F0FF] animate-pulse" />
          <span className="font-mono font-black tracking-widest text-white text-xs uppercase flex items-center">
            APEX<span className="text-[#00F0FF] ml-0.5">IQ</span>
          </span>
          <span className="text-4xs text-white font-mono px-1.5 py-0.2 bg-[#0062FF] border border-[#00F0FF] font-black rounded-sm shadow-[0_0_6px_rgba(0,98,255,0.4)]">
            MATRIX HUD
          </span>
        </div>

        {/* SESSION BADGE */}
        <div className="flex items-center space-x-1.5 px-2 py-0.5 bg-[#0A132E] border border-[#1E3A8A] rounded-sm font-mono text-3xs shrink-0">
          <span className="text-[#60A5FA] font-black uppercase">SESSION:</span>
          <span className="text-white font-black truncate max-w-[160px]">
            {session ? session.event_name : '2026 Italian GP — FP2'}
          </span>
        </div>

        {/* TRACK & CONDITIONS */}
        <div className="hidden md:flex items-center space-x-2 text-3xs font-mono text-[#93C5FD] border-r border-[#1E3A8A] pr-2.5 shrink-0">
          <span className="flex items-center gap-1 text-white font-bold">
            <Compass className="w-3 h-3 text-[#0062FF]" /> Monza Circuit (5.79 km)
          </span>
          <span className="flex items-center gap-0.5 text-white font-bold bg-[#0A132E] px-1.5 py-0.5 border border-[#1E3A8A] rounded-sm">
            <Thermometer className="w-3 h-3 text-[#00F0FF]" /> 38.5°C
          </span>
        </div>

        {/* DRIVER #1 (SOLID BLUE - CAR #44 HAMILTON) */}
        <div className="flex items-center space-x-1.5 bg-[#0062FF] border border-[#00F0FF] px-2 py-0.5 rounded-sm shadow-[0_0_10px_rgba(0,98,255,0.4)] shrink-0">
          <span className="text-white font-black font-mono text-3xs">#44</span>
          <select
            value={selectedDriver?.driver_id || 'drv-44'}
            onChange={(e) => {
              const d = drivers.find((x) => x.driver_id === e.target.value);
              if (d) onSelectDriver(d);
            }}
            className="bg-transparent text-white font-mono font-black text-3xs focus:outline-none cursor-pointer"
          >
            {drivers.map((d) => (
              <option key={d.driver_id} value={d.driver_id} className="bg-[#070E22] text-white">
                {d.name} ({d.team})
              </option>
            ))}
          </select>
        </div>

        {/* DRIVER #2 (SOLID WHITE - CAR #16 LECLERC) */}
        <div className="flex items-center space-x-1.5 bg-white text-[#030712] border border-white px-2 py-0.5 rounded-sm shadow-[0_0_10px_rgba(255,255,255,0.4)] shrink-0">
          <span className="text-[#030712] font-black font-mono text-3xs">#16</span>
          <select
            value={referenceDriver?.driver_id || 'drv-16'}
            onChange={(e) => {
              const d = drivers.find((x) => x.driver_id === e.target.value);
              if (d && onSelectReferenceDriver) onSelectReferenceDriver(d);
            }}
            className="bg-transparent text-[#030712] font-mono font-black text-3xs focus:outline-none cursor-pointer"
          >
            {drivers.map((d) => (
              <option key={d.driver_id} value={d.driver_id} className="bg-[#070E22] text-white">
                {d.name} ({d.team})
              </option>
            ))}
          </select>
        </div>

        {/* ACTIVE RUN & TYRE COMPOUND */}
        <div className="hidden lg:flex items-center space-x-2 shrink-0">
          <div className="flex items-center space-x-1.5 px-2 py-0.5 bg-[#0A132E] border border-[#1E3A8A] rounded-sm font-mono text-3xs">
            <span className="text-[#60A5FA] font-bold">RUN:</span>
            <select
              value={selectedRun?.run_id || ''}
              onChange={(e) => {
                const r = runs.find((x) => x.run_id === e.target.value);
                if (r) onSelectRun(r);
              }}
              className="bg-transparent text-white font-mono font-bold text-3xs focus:outline-none cursor-pointer"
            >
              {runs.map((r) => (
                <option key={r.run_id} value={r.run_id} className="bg-[#070E22] text-white">
                  {r.run_id.replace('run-', 'R')} ({r.compound})
                </option>
              ))}
            </select>
          </div>

          <span className={`px-2 py-0.5 rounded-sm font-mono text-4xs font-black uppercase ${compoundBadge}`}>
            {compound}
          </span>
        </div>
      </div>

      {/* Right Matrix Telemetry Engine Status */}
      <div className="flex items-center space-x-2 shrink-0">
        <button
          onClick={onToggleDemoData}
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm font-mono text-3xs font-black transition-all border ${
            isSynthetic
              ? 'bg-[#0062FF] border-[#00F0FF] text-white shadow-[0_0_12px_rgba(0,98,255,0.6)]'
              : 'bg-[#0A132E] border-[#1E3A8A] text-[#93C5FD] hover:text-white'
          }`}
          title="Toggle CFD / DoE synthetic engineering dataset"
        >
          <Cpu className="w-3 h-3 text-[#00F0FF]" />
          <span>CFD DOE: {isSynthetic ? '200 RUNS' : 'OFF'}</span>
        </button>

        <div
          className="flex items-center gap-1.5 px-2 py-0.5 bg-[#0062FF]/20 border border-[#00F0FF] text-white rounded-sm font-mono text-3xs font-black"
          title={`Bus Status: ${dataStatus}`}
        >
          <Radio className="w-3 h-3 text-[#00F0FF] animate-pulse" />
          <span>100Hz MATRIX</span>
        </div>
      </div>
    </header>
  );
};
