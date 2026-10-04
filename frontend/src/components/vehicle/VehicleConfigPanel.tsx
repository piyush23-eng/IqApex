import React from 'react';
import { VehicleConfig, VehicleParameterSpec } from '../../types/vehiclePerformance';
import { Sliders, RotateCcw, ShieldCheck } from 'lucide-react';

interface VehicleConfigPanelProps {
  parameters: VehicleParameterSpec[];
  currentConfig: VehicleConfig;
  onChangeConfig: (newConfig: VehicleConfig) => void;
  onResetToDefault: () => void;
}

export const VehicleConfigPanel: React.FC<VehicleConfigPanelProps> = ({
  parameters,
  currentConfig,
  onChangeConfig,
  onResetToDefault,
}) => {
  const handleChange = (field: keyof VehicleConfig, val: number) => {
    onChangeConfig({
      ...currentConfig,
      [field]: val,
    });
  };

  return (
    <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-3 font-mono text-2xs space-y-3 shadow-md">
      {/* Titanium Header */}
      <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-2 bg-[#070E22] p-2 -mx-3 -mt-3 mb-2">
        <div className="flex items-center space-x-2">
          <Sliders className="w-3.5 h-3.5 text-[#FFFFFF]" />
          <span className="font-bold text-[#FFFFFF] uppercase tracking-wider text-xs">
            [ VEHICLE CONFIGURATION CONTROLS ]
          </span>
        </div>

        <button
          onClick={onResetToDefault}
          className="btn-retro text-3xs flex items-center space-x-1"
          title="Reset to default baseline engineering configuration"
        >
          <RotateCcw className="w-2.5 h-2.5 text-[#FFFFFF]" />
          <span>[ RESET DEFAULTS ]</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {parameters.map((param) => {
          const key = param.name as keyof VehicleConfig;
          const val = currentConfig[key] ?? param.default;

          return (
            <div
              key={param.name}
              className="bg-[#070E22] border border-[#1E3A8A] p-2 flex flex-col justify-between space-y-1.5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-3xs text-[#94A3B8] uppercase font-bold truncate" title={param.name}>
                  {param.name.replace(/_/g, ' ')}
                </span>
                <span className="text-3xs text-[#FFFFFF] font-black bg-[#0A0D15] px-1 border border-[#1E3A8A]">
                  {val.toFixed(param.step < 0.1 ? 2 : 1)} {param.unit}
                </span>
              </div>

              <input
                type="range"
                min={param.minimum}
                max={param.maximum}
                step={param.step}
                value={val}
                onChange={(e) => handleChange(key, parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#070E22] border border-[#1E3A8A] appearance-none cursor-pointer accent-black"
              />

              <div className="flex items-center justify-between text-4xs text-[#94A3B8] font-bold">
                <span>{param.minimum}</span>
                <span className="text-[#888888]">{param.source}</span>
                <span>{param.maximum}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-3xs text-[#CBD5E1] font-bold pt-1.5 border-t border-[#1E3A8A]">
        <div className="flex items-center space-x-1.5">
          <ShieldCheck className="w-3 h-3 text-[#00E676]" />
          <span>[ PARAMETER CLAMPING & EXPERIMENTAL BOUNDS ENFORCED ]</span>
        </div>
        <span>PHYSICS ENGINE: ISO 8855 AXIS CONVENTION</span>
      </div>
    </div>
  );
};
