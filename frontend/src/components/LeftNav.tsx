import React from 'react';
import {
  LayoutDashboard,
  Activity,
  Timer,
  Users,
  Compass,
  Sliders,
  Cpu,
  GitBranch,
  FolderTree,
  ShieldCheck,
  Layers,
  Radio,
} from 'lucide-react';
import { NavModule } from '../types/domain';

interface LeftNavProps {
  activeModule: NavModule;
  onSelectModule: (module: NavModule) => void;
}

interface NavItemConfig {
  id: NavModule;
  label: string;
  icon: React.ElementType;
  shortcut: string;
}

interface NavGroup {
  title: string;
  items: NavItemConfig[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'ACQUISITION & TELEMETRY',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard, shortcut: 'F1' },
      { id: 'telemetry', label: 'Telemetry Workspace', icon: Activity, shortcut: 'F2' },
      { id: 'lap-analysis', label: 'Lap Decomposition', icon: Timer, shortcut: 'F3' },
      { id: 'driver-comparison', label: 'Driver Comparison', icon: Users, shortcut: 'F4' },
    ],
  },
  {
    title: 'VEHICLE DYNAMICS',
    items: [
      { id: 'vehicle-performance', label: 'Aero Surrogate', icon: Compass, shortcut: 'F5' },
      { id: 'sensitivity', label: 'Sensitivity Matrix', icon: Sliders, shortcut: 'F7' },
      { id: 'optimization', label: 'Setup Optimizer', icon: Cpu, shortcut: 'F8' },
    ],
  },
  {
    title: 'RACE ENGINEERING',
    items: [
      { id: 'strategy', label: 'Race Strategy', icon: GitBranch, shortcut: 'F9' },
      { id: 'engineering-analysis', label: 'Decision Support', icon: Layers, shortcut: 'F12' },
    ],
  },
  {
    title: 'DATA GOVERNANCE',
    items: [
      { id: 'data-runs', label: 'Data & Runs', icon: FolderTree, shortcut: 'F10' },
      { id: 'model-health', label: 'Model Verification', icon: ShieldCheck, shortcut: 'F11' },
    ],
  },
];

export const LeftNav: React.FC<LeftNavProps> = ({ activeModule, onSelectModule }) => {
  return (
    <aside className="w-56 bg-[#070E22] border-r border-[#1E3A8A] flex flex-col justify-between select-none shadow-xl shrink-0">
      <div className="py-2.5 overflow-y-auto">
        {NAV_GROUPS.map((group, gIdx) => (
          <div key={group.title} className={gIdx > 0 ? 'mt-3 pt-2.5 border-t border-[#142555]' : ''}>
            <div className="px-3 pb-1 text-4xs font-mono font-black tracking-widest text-[#60A5FA] uppercase flex items-center justify-between">
              <span>{group.title}</span>
            </div>

            <nav className="space-y-1 px-2">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectModule(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 font-mono text-left rounded-sm transition-all text-xs border ${
                      isActive
                        ? 'bg-[#0062FF] text-white font-black border-[#00F0FF] shadow-[0_0_12px_rgba(0,98,255,0.6)]'
                        : 'text-[#93C5FD] hover:bg-[#0E1A3D] hover:text-white font-bold border-transparent hover:border-[#1E3A8A]'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#60A5FA]'}`} />
                      <span className="tracking-tight text-3xs truncate uppercase">{item.label}</span>
                    </div>
                    <span className={`kbd-cap ml-1 flex-shrink-0 text-4xs ${isActive ? 'bg-white text-[#030712] border-white' : 'bg-[#0A132E] text-[#60A5FA] border-[#1E3A8A]'}`}>
                      {item.shortcut}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Cyber Matrix Telemetry Grid Monitor Card */}
      <div className="p-2.5 m-2 bg-[#0A132E] border border-[#1E3A8A] rounded-sm shadow-md text-3xs font-mono space-y-1.5 relative overflow-hidden">
        {/* Matrix coordinate watermark */}
        <div className="flex items-center justify-between">
          <span className="text-white uppercase font-black tracking-wider text-4xs flex items-center gap-1.5">
            <Radio className="w-2.5 h-2.5 text-[#00F0FF] animate-pulse" /> TELEMETRY GRID
          </span>
          <span className="px-1.5 py-0.2 rounded-sm text-4xs font-black bg-[#0062FF] text-white border border-[#00F0FF] shadow-[0_0_6px_rgba(0,98,255,0.4)]">
            ONLINE
          </span>
        </div>
        <div className="flex items-center justify-between text-[#93C5FD] text-4xs font-bold">
          <span>SAMPLING FREQ</span>
          <span className="text-white font-black">100 Hz SYNC</span>
        </div>
        <div className="pt-1 border-t border-[#142555] text-[#93C5FD] flex justify-between text-4xs font-bold">
          <span>SPATIAL GRID</span>
          <span className="text-[#00F0FF] font-black">1.0 METER</span>
        </div>
      </div>
    </aside>
  );
};
