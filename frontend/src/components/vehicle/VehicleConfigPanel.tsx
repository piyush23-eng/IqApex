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
    <div className="bg-workstation-panel border border-workstation-border rounded p-3 font-mono text-2xs space-y-3">
      <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-2">
        <div className="flex items-center space-x-2">
          <Sliders className="w-3.5 h-3.5 text-workstation-accentCyan" />
          <span className="font-bold text-workstation-textBright uppercase tracking-wider text-xs">
            VEHICLE CONFIGURATION CONTROLS
          </span>
        </div>

        <button
          onClick={onResetToDefault}
          className="flex items-center space-x-1 px-2 py-0.5 rounded bg-workstation-surface border border-workstation-border text-workstation-textSecondary hover:text-workstation-textBright transition-colors text-3xs"
          title="Reset to default baseline engineering configuration"
        >
          <RotateCcw className="w-2.5 h-2.5" />
          <span>RESET DEFAULTS</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {parameters.map((param) => {
          const key = param.name as keyof VehicleConfig;
          const val = currentConfig[key] ?? param.default;

          return (
            <div
              key={param.name}
              className="bg-workstation-surface/50 border border-workstation-borderSubtle rounded p-2 flex flex-col justify-between space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-3xs text-workstation-textMuted uppercase font-semibold truncate" title={param.name}>
                  {param.name.replace(/_/g, ' ')}
                </span>
                <span className="text-3xs text-workstation-accentCyan font-bold">
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
                className="w-full h-1 bg-workstation-border rounded-lg appearance-none cursor-pointer accent-workstation-accentCyan"
              />

              <div className="flex items-center justify-between text-3xs text-workstation-textMuted">
                <span>{param.minimum}</span>
                <span className="text-workstation-textMuted/60">{param.source}</span>
                <span>{param.maximum}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-3xs text-workstation-textMuted pt-1 border-t border-workstation-borderSubtle">
        <div className="flex items-center space-x-1.5">
          <ShieldCheck className="w-3 h-3 text-workstation-telemetryGreen" />
          <span>PARAMETER CLAMPING & EXPERIMENTAL BOUNDS ENFORCED</span>
        </div>
        <span>PHYSICS ENGINE: ISO 8855 VEHICLE AXIS CONVENTION</span>
      </div>
    </div>
  );
};
