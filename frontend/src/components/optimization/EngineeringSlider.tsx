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
    <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-3 font-mono text-2xs space-y-2 shadow-md">
      {/* Titanium Header */}
      <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-2 bg-[#070E22] p-2 -mx-3 -mt-3 mb-2">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-[#FFFFFF] tracking-wider uppercase text-xs">
            [ {param.name.replace(/_/g, ' ')} CONTROL ]
          </span>
          <span className="text-[#FFFFFF] font-bold">|</span>
          <span className="text-[#94A3B8] font-bold">UNIT: {param.unit}</span>
        </div>

        <div className="flex items-center space-x-2">
          {isExtrapolation ? (
            <span className="px-2 py-0.5 bg-[#0E1A3D] text-[#FBBF24] border border-[#FBBF24]/50 border border-[#1E3A8A] text-[#FFB000] font-black rounded-none flex items-center space-x-1 shadow-sm">
              <AlertTriangle className="w-3 h-3" />
              <span>[ EXTRAPOLATION DOMAIN ]</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-[#00F0FF] border border-[#1E3A8A] text-[#FFFFFF] font-black rounded-none flex items-center space-x-1 shadow-sm">
              <CheckCircle2 className="w-3 h-3" />
              <span>[ INTERPOLATION (OBSERVED) ]</span>
            </span>
          )}

          <label className="flex items-center space-x-1 text-3xs text-[#FFFFFF] font-bold cursor-pointer select-none bg-[#070E22] border border-[#1E3A8A] px-1.5 py-0.5 shadow-sm">
            <input
              type="checkbox"
              className="accent-black"
              checked={allowExtrapolationOverride}
              onChange={(e) => onToggleOverride(e.target.checked)}
            />
            <span>[ OVERRIDE ]</span>
          </label>
        </div>
      </div>

      {/* Numerical Readouts */}
      <div className="grid grid-cols-12 gap-2 items-center text-3xs">
        <div className="col-span-3 bg-[#070E22] border border-[#1E3A8A] p-1.5 text-center shadow-sm">
          <span className="text-[#94A3B8] block font-bold uppercase">BASELINE VALUE</span>
          <span className="text-xs font-black text-[#FFFFFF]">
            {baselineValue.toFixed(1)} {param.unit}
          </span>
        </div>

        <div className="col-span-3 bg-[#070E22] border border-[#1E3A8A] p-1.5 text-center shadow-sm">
          <span className="text-[#94A3B8] block font-bold uppercase">OBSERVED DOMAIN</span>
          <span className="text-xs font-black text-[#FFFFFF]">
            [{obsMin.toFixed(1)} – {obsMax.toFixed(1)}] {param.unit}
          </span>
        </div>

        <div className="col-span-3 bg-[#070E22] border border-[#1E3A8A] p-1.5 text-center shadow-sm">
          <span className="text-[#94A3B8] block font-bold uppercase">PERTURBATION</span>
          <span
            className={`text-xs font-black ${
              scenarioValue - baselineValue > 0
                ? 'text-[#FFB000]'
                : scenarioValue - baselineValue < 0
                ? 'text-[#00E676]'
                : 'text-[#94A3B8]'
            }`}
          >
            {scenarioValue - baselineValue >= 0 ? '+' : ''}
            {(scenarioValue - baselineValue).toFixed(2)} {param.unit}
          </span>
        </div>

        <div className="col-span-3 bg-[#070E22] border border-[#1E3A8A] p-1.5 flex items-center justify-between shadow-sm">
          <button
            onClick={() => handleStep(-1)}
            className="w-6 h-6 bg-[#0A132E] border border-[#1E3A8A] hover:bg-[#070E22] flex items-center justify-center text-[#FFFFFF] font-black"
            title="Step down"
          >
            <Minus className="w-3 h-3" />
          </button>
          <div className="text-center">
            <span className="text-4xs text-[#94A3B8] block font-bold uppercase">TARGET VALUE</span>
            <span className="text-sm font-black text-[#FFFFFF]">
              {scenarioValue.toFixed(2)}
            </span>
          </div>
          <button
            onClick={() => handleStep(1)}
            className="w-6 h-6 bg-[#0A132E] border border-[#1E3A8A] hover:bg-[#070E22] flex items-center justify-center text-[#FFFFFF] font-black"
            title="Step up"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Visual Engineering Track Slider */}
      <div className="pt-2 pb-1 space-y-1">
        <div className="relative h-7 flex items-center select-none bg-[#070E22] border border-[#1E3A8A] p-1 shadow">
          {/* Background track: full possible range */}
          <div className="absolute w-full h-2.5 bg-[#070E22] border border-[#1E3A8A]" />

          {/* Extrapolation hatched zones (if override is on) */}
          {allowExtrapolationOverride && (
            <div
              className="absolute h-2.5 bg-[#0E1A3D] text-[#FBBF24] border border-[#FBBF24]/50 border-l-2 border-r border-[#1E3A8A]"
              style={{
                left: '0%',
                width: `${obsLeftPercent}%`,
              }}
              title="Lower Extrapolation Zone"
            />
          )}

          {/* Observed range highlighted bar (Interpolation zone) */}
          <div
            className="absolute h-3 bg-[#00F0FF]/40 border-l-2 border-r border-[#1E3A8A] transition-all"
            style={{
              left: `${obsLeftPercent}%`,
              width: `${obsWidthPercent}%`,
            }}
            title="Empirically Observed Range"
          />

          {/* Baseline reference tick */}
          <div
            className="absolute h-5 w-1 bg-black z-10"
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
            className="absolute w-full opacity-0 h-7 cursor-pointer z-20"
          />

          {/* Custom Slider Thumb Marker */}
          <div
            className={`absolute w-4 h-6 border border-[#1E3A8A] z-15 pointer-events-none transition-transform -ml-2 shadow-sm flex items-center justify-center ${
              isExtrapolation ? 'bg-[#FFB000]' : 'bg-[#00F0FF]'
            }`}
            style={{ left: `${valuePercent}%` }}
          >
            <div className="w-0.5 h-3 bg-black" />
          </div>
        </div>

        {/* Axis range labels */}
        <div className="flex justify-between text-4xs text-[#FFFFFF] font-bold px-1">
          <span>{minSlider.toFixed(1)} {param.unit}</span>
          <span className="bg-[#0A0D15] border border-[#1E3A8A] px-1">
            Observed: [{obsMin.toFixed(1)} – {obsMax.toFixed(1)}]
          </span>
          <span>{maxSlider.toFixed(1)} {param.unit}</span>
        </div>
      </div>
    </div>
  );
};
