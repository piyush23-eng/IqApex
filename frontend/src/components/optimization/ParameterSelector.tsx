import React from 'react';
import { ParameterDefinition } from '../../types/optimization';
import { Sliders, Compass, Target, Info } from 'lucide-react';

interface ParameterSelectorProps {
  parameters: ParameterDefinition[];
  selectedParam: ParameterDefinition | null;
  onSelectParam: (param: ParameterDefinition) => void;
  selectedCorner: string;
  onSelectCorner: (cornerId: string) => void;
  targetMetric: string;
  onSelectTargetMetric: (metric: string) => void;
  corners?: string[];
}

export const ParameterSelector: React.FC<ParameterSelectorProps> = ({
  parameters,
  selectedParam,
  onSelectParam,
  selectedCorner,
  onSelectCorner,
  targetMetric,
  onSelectTargetMetric,
  corners = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11'],
}) => {
  return (
    <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-3 font-mono text-2xs space-y-2 shadow">
      <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-1.5">
        <div className="flex items-center space-x-2">
          <Sliders className="w-3.5 h-3.5 text-[#FFFFFF] stroke-[2.5]" />
          <span className="font-extrabold text-[#FFFFFF] tracking-wider uppercase text-2xs">
            [ PARAMETER &amp; TARGET CONFIGURATION ]
          </span>
        </div>
        <span className="text-3xs text-[#FFFFFF] font-extrabold uppercase bg-[#070E22] px-1.5 py-0.2 border border-[#1E3A8A] shadow-sm">
          REGISTRY ({parameters.length} REGISTERED) ✕
        </span>
      </div>

      <div className="grid grid-cols-12 gap-3 items-center">
        {/* Corner Selection */}
        <div className="col-span-3 space-y-1">
          <label className="text-3xs text-[#FFFFFF] font-extrabold uppercase flex items-center space-x-1">
            <Compass className="w-3 h-3 text-[#FFFFFF] stroke-[2.5]" />
            <span>CIRCUIT CORNER</span>
          </label>
          <select
            aria-label="Select Circuit Corner"
            className="w-full bg-[#070E22] border border-[#1E3A8A] text-[#FFFFFF] px-2 py-1 text-2xs font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0062FF]"
            value={selectedCorner}
            onChange={(e) => onSelectCorner(e.target.value)}
          >
            {corners.map((c) => (
              <option key={c} value={c}>
                {c} {c === 'T9' ? '(Variante Ascari)' : c === 'T1' ? '(Variante del Rettifilo)' : c === 'T11' ? '(Curva Parabolica)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Parameter Selection */}
        <div className="col-span-5 space-y-1">
          <label className="text-3xs text-[#FFFFFF] font-extrabold uppercase flex items-center space-x-1">
            <Sliders className="w-3 h-3 text-[#FFFFFF] stroke-[2.5]" />
            <span>PERFORMANCE PARAMETER</span>
          </label>
          <select
            aria-label="Select Performance Parameter"
            className="w-full bg-[#070E22] border border-[#1E3A8A] text-[#FFFFFF] px-2 py-1 text-2xs font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0062FF]"
            value={selectedParam?.name || ''}
            onChange={(e) => {
              const p = parameters.find((item) => item.name === e.target.value);
              if (p) onSelectParam(p);
            }}
          >
            {parameters.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name} [{p.unit}] ({p.source})
              </option>
            ))}
          </select>
        </div>

        {/* Target Metric */}
        <div className="col-span-4 space-y-1">
          <label className="text-3xs text-[#FFFFFF] font-extrabold uppercase flex items-center space-x-1">
            <Target className="w-3 h-3 text-[#FFFFFF] stroke-[2.5]" />
            <span>OPTIMIZATION TARGET</span>
          </label>
          <select
            aria-label="Select Optimization Target"
            className="w-full bg-[#070E22] border border-[#1E3A8A] text-[#FFFFFF] px-2 py-1 text-2xs font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0062FF]"
            value={targetMetric}
            onChange={(e) => onSelectTargetMetric(e.target.value)}
          >
            <option value="corner_time">Corner Transit Duration (s)</option>
            <option value="lap_time">Total Lap Time (s)</option>
            <option value="sector_1">Sector 1 Time (s)</option>
            <option value="sector_2">Sector 2 Time (s)</option>
            <option value="sector_3">Sector 3 Time (s)</option>
          </select>
        </div>
      </div>

      {/* Selected Parameter Specifications */}
      {selectedParam && (
        <div className="bg-[#070E22] border border-[#1E3A8A] p-2 shadow-sm flex items-center justify-between text-3xs text-[#FFFFFF]">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1 font-bold text-[#FFFFFF]">
              <Info className="w-3.5 h-3.5 text-[#FFFFFF] stroke-[2.5]" />
              <span>{selectedParam.description}</span>
            </span>
          </div>
          <div className="flex items-center space-x-4 font-bold text-[#CBD5E1]">
            <span>Bounds: <strong className="text-[#FFFFFF] font-extrabold">[{selectedParam.minimum}, {selectedParam.maximum}] {selectedParam.unit}</strong></span>
            <span>Perturbation: <strong className="text-[#FFFFFF] font-extrabold">[{selectedParam.allowed_perturbation[0]}, +{selectedParam.allowed_perturbation[1]}] {selectedParam.unit}</strong></span>
            <span>Step: <strong className="text-[#FFFFFF] font-extrabold">{selectedParam.step} {selectedParam.unit}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};
