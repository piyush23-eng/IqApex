import React from 'react';
import { FeasibleStrategy } from '../../types/strategy';
import { Play, Binary, RefreshCw, Sliders, CloudSun, ShieldAlert, Car } from 'lucide-react';

interface StrategyConfigBarProps {
  strategies: FeasibleStrategy[];
  selectedStrategyId: string;
  onSelectStrategy: (strategyId: string) => void;
  weather: string;
  onChangeWeather: (weather: string) => void;
  safetyCar: string;
  onChangeSafetyCar: (sc: string) => void;
  traffic: string;
  onChangeTraffic: (traffic: string) => void;
  isLoading: boolean;
  onSimulate: () => void;
  onRunMonteCarlo: () => void;
}

export const StrategyConfigBar: React.FC<StrategyConfigBarProps> = ({
  strategies,
  selectedStrategyId,
  onSelectStrategy,
  weather,
  onChangeWeather,
  safetyCar,
  onChangeSafetyCar,
  traffic,
  onChangeTraffic,
  isLoading,
  onSimulate,
  onRunMonteCarlo,
}) => {
  return (
    <div className="bg-workstation-panel border border-workstation-border rounded p-3 font-mono text-2xs space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Strategy Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-workstation-textMuted text-3xs font-semibold uppercase tracking-wider flex items-center space-x-1">
            <Sliders className="w-3 h-3 text-workstation-accentCyan" />
            <span>Strategy:</span>
          </label>
          <select
            value={selectedStrategyId}
            onChange={(e) => onSelectStrategy(e.target.value)}
            className="bg-workstation-surface border border-workstation-border rounded px-2.5 py-1 text-workstation-textBright text-xs focus:outline-none focus:border-workstation-accentCyan max-w-xs"
          >
            {strategies.map((s) => (
              <option key={s.strategy_id} value={s.strategy_id}>
                {s.name} ({s.pit_stops_count} stop{s.pit_stops_count !== 1 ? 's' : ''})
              </option>
            ))}
          </select>
        </div>

        {/* Environmental & Race Scenario Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Weather */}
          <div className="flex items-center space-x-1.5">
            <CloudSun className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-workstation-textMuted text-3xs uppercase">Weather:</span>
            <select
              value={weather}
              onChange={(e) => onChangeWeather(e.target.value)}
              className="bg-workstation-surface border border-workstation-border rounded px-2 py-0.5 text-workstation-textBright text-2xs focus:outline-none focus:border-workstation-accentCyan"
            >
              <option value="DRY">Dry (Nominal)</option>
              <option value="COOL">Cool (-5°C, 0.9x therm)</option>
              <option value="HOT">Hot (+10°C, 1.25x therm)</option>
            </select>
          </div>

          {/* Safety Car */}
          <div className="flex items-center space-x-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-workstation-textMuted text-3xs uppercase">Intervention:</span>
            <select
              value={safetyCar}
              onChange={(e) => onChangeSafetyCar(e.target.value)}
              className="bg-workstation-surface border border-workstation-border rounded px-2 py-0.5 text-workstation-textBright text-2xs focus:outline-none focus:border-workstation-accentCyan"
            >
              <option value="GREEN">Green Flag (Normal)</option>
              <option value="VSC">VSC (L20-22, 14.5s pit)</option>
              <option value="SC">Full SC (L20-24, 11.5s pit)</option>
            </select>
          </div>

          {/* Traffic */}
          <div className="flex items-center space-x-1.5">
            <Car className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-workstation-textMuted text-3xs uppercase">Traffic:</span>
            <select
              value={traffic}
              onChange={(e) => onChangeTraffic(e.target.value)}
              className="bg-workstation-surface border border-workstation-border rounded px-2 py-0.5 text-workstation-textBright text-2xs focus:outline-none focus:border-workstation-accentCyan"
            >
              <option value="CLEAN_AIR">Clean Air (0.0s)</option>
              <option value="LIGHT_TRAFFIC">Light (+0.3s avg)</option>
              <option value="HEAVY_TRAFFIC">Heavy (+0.8s avg)</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onSimulate}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3 py-1 rounded bg-workstation-accentCyan text-slate-950 font-bold hover:bg-sky-300 transition-colors text-2xs disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
            <span>SIMULATE RACE</span>
          </button>

          <button
            onClick={onRunMonteCarlo}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3 py-1 rounded bg-workstation-surface border border-workstation-border text-workstation-textBright hover:bg-workstation-surface/80 hover:border-workstation-accentCyan transition-colors text-2xs disabled:opacity-50"
          >
            <Binary className="w-3 h-3 text-workstation-accentCyan" />
            <span>RUN 1000x MC</span>
          </button>
        </div>
      </div>
    </div>
  );
};
