import React from 'react';
import { ParameterDefinition } from '../../types/optimization';
import { AlertTriangle, CheckCircle2, Minus, Plus } from 'lucide-react';

interface EngineeringSliderProps {
  param: ParameterDefinition;
  baselineValue: number;
  scenarioValue: number;
  observedRange: [number, number];
  onChangeScenario: (val: number) => void;
  allowExtrapolationOverride: boolean;
  onToggleOverride: (allowed: boolean) => void;
}

export const EngineeringSlider: React.FC<EngineeringSliderProps> = ({
  param,
  baselineValue,
  scenarioValue,
  observedRange,
  onChangeScenario,
  allowExtrapolationOverride,
  onToggleOverride,
}) => {
  const [obsMin, obsMax] = observedRange;
  const isExtrapolation = scenarioValue < obsMin || scenarioValue > obsMax;

  // Calculate slider minimum and maximum range
  const span = Math.max(2.0, obsMax - obsMin);
  const minSlider = allowExtrapolationOverride
    ? Math.max(param.minimum, obsMin - span * 0.8)
    : Math.max(param.minimum, obsMin);
  const maxSlider = allowExtrapolationOverride
    ? Math.min(param.maximum, obsMax + span * 0.8)
    : Math.min(param.maximum, obsMax);

  const totalRange = maxSlider - minSlider > 1e-4 ? maxSlider - minSlider : 1.0;
  const obsLeftPercent = Math.max(0, Math.min(100, ((obsMin - minSlider) / totalRange) * 100));
  const obsWidthPercent = Math.max(0, Math.min(100 - obsLeftPercent, ((obsMax - obsMin) / totalRange) * 100));
  const valuePercent = Math.max(0, Math.min(100, ((scenarioValue - minSlider) / totalRange) * 100));
  const baselinePercent = Math.max(0, Math.min(100, ((baselineValue - minSlider) / totalRange) * 100));

  const handleStep = (direction: number) => {
    const nextVal = scenarioValue + direction * param.step;
    const clamped = Math.min(maxSlider, Math.max(minSlider, parseFloat(nextVal.toFixed(3))));
    onChangeScenario(clamped);
  };

  return (
    <div className="bg-workstation-panel border border-workstation-border rounded p-3 font-mono text-2xs space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-1.5">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-workstation-textBright tracking-wider uppercase">
            {param.name.replace(/_/g, ' ')} CONTROL
          </span>
          <span className="text-workstation-border">|</span>
          <span className="text-workstation-textMuted">Unit: {param.unit}</span>
        </div>

        <div className="flex items-center space-x-2">
          {isExtrapolation ? (
            <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold rounded flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3" />
              <span>EXTRAPOLATION DOMAIN</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/30 text-workstation-telemetryGreen font-semibold rounded flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>INTERPOLATION (OBSERVED DOMAIN)</span>
            </span>
          )}

          <label className="flex items-center space-x-1 text-3xs text-workstation-textMuted cursor-pointer select-none">
            <input
              type="checkbox"
              className="accent-workstation-accentCyan"
              checked={allowExtrapolationOverride}
              onChange={(e) => onToggleOverride(e.target.checked)}
            />
            <span>Extrapolation Override</span>
          </label>
        </div>
      </div>

      {/* Numerical readouts */}
      <div className="grid grid-cols-12 gap-2 items-center text-3xs">
        <div className="col-span-3 bg-workstation-surface/60 border border-workstation-borderSubtle p-1.5 rounded text-center">
          <span className="text-workstation-textMuted block">BASELINE VALUE</span>
          <span className="text-xs font-bold text-workstation-accentCyan">
            {baselineValue.toFixed(1)} {param.unit}
          </span>
        </div>

        <div className="col-span-3 bg-workstation-surface/60 border border-workstation-borderSubtle p-1.5 rounded text-center">
          <span className="text-workstation-textMuted block">OBSERVED DOMAIN</span>
          <span className="text-xs font-semibold text-workstation-textBright">
            [{obsMin.toFixed(1)} – {obsMax.toFixed(1)}] {param.unit}
          </span>
        </div>

        <div className="col-span-3 bg-workstation-surface/60 border border-workstation-borderSubtle p-1.5 rounded text-center">
          <span className="text-workstation-textMuted block">SCENARIO PERTURBATION</span>
          <span
            className={`text-xs font-bold ${
              scenarioValue - baselineValue > 0
                ? 'text-workstation-telemetryAmber'
                : scenarioValue - baselineValue < 0
                ? 'text-workstation-telemetryGreen'
                : 'text-workstation-textMuted'
            }`}
          >
            {scenarioValue - baselineValue >= 0 ? '+' : ''}
            {(scenarioValue - baselineValue).toFixed(2)} {param.unit}
          </span>
        </div>

        <div className="col-span-3 bg-workstation-surface/80 border border-workstation-borderSubtle p-1.5 rounded flex items-center justify-between">
          <button
            onClick={() => handleStep(-1)}
            className="w-6 h-6 bg-workstation-surface hover:bg-workstation-borderSubtle border border-workstation-border rounded flex items-center justify-center text-workstation-textBright"
            title="Step down"
          >
            <Minus className="w-3 h-3" />
          </button>
          <div className="text-center">
            <span className="text-4xs text-workstation-textMuted block">TARGET VALUE</span>
            <span className="text-sm font-bold text-workstation-textBright">
              {scenarioValue.toFixed(2)}
            </span>
          </div>
          <button
            onClick={() => handleStep(1)}
            className="w-6 h-6 bg-workstation-surface hover:bg-workstation-borderSubtle border border-workstation-border rounded flex items-center justify-center text-workstation-textBright"
            title="Step up"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Visual Engineering Track Slider */}
      <div className="pt-2 pb-1 space-y-1">
        <div className="relative h-6 flex items-center select-none">
          {/* Background track: full possible range */}
          <div className="absolute w-full h-2 bg-workstation-surface border border-workstation-borderSubtle rounded" />

          {/* Extrapolation hatched zones (if override is on) */}
          {allowExtrapolationOverride && (
            <div
              className="absolute h-2 bg-amber-500/20 border-l border-r border-amber-500/40 rounded-xs"
              style={{
                left: '0%',
                width: `${obsLeftPercent}%`,
              }}
              title="Lower Extrapolation Zone"
            />
          )}

          {/* Observed range highlighted bar (Interpolation zone) */}
          <div
            className="absolute h-2.5 bg-workstation-accentCyan/30 border border-workstation-accentCyan/60 rounded-xs transition-all"
            style={{
              left: `${obsLeftPercent}%`,
              width: `${obsWidthPercent}%`,
            }}
            title="Empirically Observed Range"
          />

          {/* Baseline reference tick */}
          <div
            className="absolute h-4 w-0.5 bg-workstation-accentCyan z-10"
            style={{ left: `${baselinePercent}%` }}
            title={`Baseline: ${baselineValue} ${param.unit}`}
          />

          {/* Scenario input slider */}
          <input
            type="range"
            min={minSlider}
            max={maxSlider}
            step={param.step}
            value={scenarioValue}
            onChange={(e) => onChangeScenario(parseFloat(e.target.value))}
            className="absolute w-full opacity-0 h-6 cursor-pointer z-20"
          />

          {/* Custom Slider Thumb Marker */}
          <div
            className={`absolute w-3.5 h-5 rounded-xs border-2 z-15 pointer-events-none transition-transform -ml-1.5 shadow-md flex items-center justify-center ${
              isExtrapolation
                ? 'bg-amber-500 border-amber-300'
                : 'bg-workstation-telemetryGreen border-white'
            }`}
            style={{ left: `${valuePercent}%` }}
          >
            <div className="w-0.5 h-2 bg-workstation-background/80" />
          </div>
        </div>

        {/* Axis range labels */}
        <div className="flex justify-between text-4xs text-workstation-textMuted px-1">
          <span>{minSlider.toFixed(1)} {param.unit}</span>
          <span className="text-workstation-accentCyan">
            Observed: [{obsMin.toFixed(1)} – {obsMax.toFixed(1)}]
          </span>
          <span>{maxSlider.toFixed(1)} {param.unit}</span>
        </div>
      </div>
    </div>
  );
};
