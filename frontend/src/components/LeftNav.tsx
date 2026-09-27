import React from 'react';
import {
  LayoutDashboard,
  Activity,
  Timer,
  Users,
  Compass,
  Disc,
  Sliders,
  Cpu,
  GitBranch,
  FolderTree,
  ShieldCheck,
  Layers,
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

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, shortcut: 'F1' },
  { id: 'telemetry', label: 'Telemetry', icon: Activity, shortcut: 'F2' },
  { id: 'lap-analysis', label: 'Lap Analysis', icon: Timer, shortcut: 'F3' },
  { id: 'driver-comparison', label: 'Driver Comparison', icon: Users, shortcut: 'F4' },
  { id: 'vehicle-performance', label: 'Vehicle Performance', icon: Compass, shortcut: 'F5' },
  { id: 'tyres', label: 'Tyres', icon: Disc, shortcut: 'F6' },
  { id: 'sensitivity', label: 'Sensitivity', icon: Sliders, shortcut: 'F7' },
  { id: 'optimization', label: 'Optimization', icon: Cpu, shortcut: 'F8' },
  { id: 'strategy', label: 'Strategy', icon: GitBranch, shortcut: 'F9' },
  { id: 'data-runs', label: 'Data & Runs', icon: FolderTree, shortcut: 'F10' },
  { id: 'model-health', label: 'Model Health', icon: ShieldCheck, shortcut: 'F11' },
  { id: 'engineering-analysis', label: 'Decision Support', icon: Layers, shortcut: 'F12' },
];

export const LeftNav: React.FC<LeftNavProps> = ({ activeModule, onSelectModule }) => {
  return (
    <aside className="w-56 bg-workstation-panel border-r border-workstation-border flex flex-col justify-between select-none">
      <div className="py-2">
        <div className="px-3 pb-2 mb-1 border-b border-workstation-borderSubtle flex items-center justify-between text-3xs font-mono text-workstation-textMuted uppercase tracking-wider">
          <span>WORKSTATION MODULES</span>
          <span className="text-workstation-textMuted/60">[NUM]</span>
        </div>

        <nav className="space-y-0.5 px-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectModule(item.id)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-mono text-left transition-colors duration-100 ${
                  isActive
                    ? 'bg-workstation-surface text-workstation-accentCyan font-medium border-l-2 border-workstation-accentCyan shadow-sm'
                    : 'text-workstation-textSecondary hover:text-workstation-textPrimary hover:bg-workstation-surface/50 border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-workstation-accentCyan' : 'text-workstation-textMuted'}`} />
                  <span className="tracking-tight text-2xs">{item.label}</span>
                </div>
                <span className="text-3xs text-workstation-textMuted font-mono">
                  {item.shortcut}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Trackside System Status Pin */}
      <div className="p-2.5 m-2 bg-workstation-surface/70 border border-workstation-borderSubtle rounded text-3xs font-mono space-y-1">
        <div className="flex items-center justify-between text-workstation-textMuted">
          <span>PIPELINE ENGINE</span>
          <span className="text-workstation-telemetryGreen font-medium">READY</span>
        </div>
        <div className="flex items-center justify-between text-workstation-textMuted">
          <span>ACQUISITION</span>
          <span className="text-workstation-textSecondary">PASSIVE</span>
        </div>
        <div className="pt-1 border-t border-workstation-borderSubtle text-workstation-textMuted/70 flex justify-between">
          <span>SYNC FREQ</span>
          <span>100 Hz CAP</span>
        </div>
      </div>
    </aside>
  );
};
