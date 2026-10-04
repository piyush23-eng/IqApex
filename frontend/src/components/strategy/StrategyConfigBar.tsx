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
    <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-3 font-mono text-2xs space-y-2.5 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Strategy Selector */}
        <div className="flex items-center space-x-2 bg-[#070E22] px-3 py-1.5 border border-[#1E3A8A] shadow">
          <label className="text-[#FFFFFF] text-3xs font-bold uppercase tracking-wider flex items-center space-x-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#FFFFFF]" />
            <span>[ STRATEGY ]:</span>
          </label>
          <select
            value={selectedStrategyId}
            onChange={(e) => onSelectStrategy(e.target.value)}
            className="bg-[#0A132E] border border-[#1E3A8A] px-2 py-0.5 text-[#FFFFFF] font-bold text-xs focus:outline-none focus:bg-[#00F0FF] cursor-pointer shadow-sm max-w-xs"
          >
            {strategies.map((s) => (
              <option key={s.strategy_id} value={s.strategy_id}>
                {s.name} ({s.pit_stops_count} stop{s.pit_stops_count !== 1 ? 's' : ''})
              </option>
            ))}
          </select>
        </div>

        {/* Environmental & Race Scenario Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Weather */}
          <div className="flex items-center space-x-1.5 bg-[#070E22] px-2.5 py-1 border border-[#1E3A8A] shadow">
            <CloudSun className="w-3.5 h-3.5 text-[#FFFFFF]" />
            <span className="text-[#FFFFFF] text-3xs font-bold uppercase">WEATHER:</span>
            <select
              value={weather}
              onChange={(e) => onChangeWeather(e.target.value)}
              className="bg-[#0A132E] border border-[#1E3A8A] px-2 py-0.5 text-[#FFFFFF] font-bold text-2xs focus:outline-none focus:bg-[#00F0FF] cursor-pointer"
            >
              <option value="DRY">Dry (Nominal)</option>
              <option value="COOL">Cool (-5°C, 0.9x therm)</option>
              <option value="HOT">Hot (+10°C, 1.25x therm)</option>
            </select>
          </div>

          {/* Safety Car */}
          <div className="flex items-center space-x-1.5 bg-[#070E22] px-2.5 py-1 border border-[#1E3A8A] shadow">
            <ShieldAlert className="w-3.5 h-3.5 text-[#FFFFFF]" />
            <span className="text-[#FFFFFF] text-3xs font-bold uppercase">INTERVENTION:</span>
            <select
              value={safetyCar}
              onChange={(e) => onChangeSafetyCar(e.target.value)}
              className="bg-[#0A132E] border border-[#1E3A8A] px-2 py-0.5 text-[#FFFFFF] font-bold text-2xs focus:outline-none focus:bg-[#00F0FF] cursor-pointer"
            >
              <option value="GREEN">Green Flag (Normal)</option>
              <option value="VSC">VSC (L20-22, 14.5s pit)</option>
              <option value="SC">Full SC (L20-24, 11.5s pit)</option>
            </select>
          </div>

          {/* Traffic */}
          <div className="flex items-center space-x-1.5 bg-[#070E22] px-2.5 py-1 border border-[#1E3A8A] shadow">
            <Car className="w-3.5 h-3.5 text-[#FFFFFF]" />
            <span className="text-[#FFFFFF] text-3xs font-bold uppercase">TRAFFIC:</span>
            <select
              value={traffic}
              onChange={(e) => onChangeTraffic(e.target.value)}
              className="bg-[#0A132E] border border-[#1E3A8A] px-2 py-0.5 text-[#FFFFFF] font-bold text-2xs focus:outline-none focus:bg-[#00F0FF] cursor-pointer"
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
            className="btn-retro-primary text-2xs flex items-center space-x-1.5 disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="w-3 h-3 animate-spin text-[#FFFFFF]" /> : <Play className="w-3 h-3 fill-current text-[#FFFFFF]" />}
            <span>[ SIMULATE RACE ]</span>
          </button>

          <button
            onClick={onRunMonteCarlo}
            disabled={isLoading}
            className="btn-retro text-2xs flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Binary className="w-3 h-3 text-[#FFFFFF]" />
            <span>[ RUN 1000x MC ]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
