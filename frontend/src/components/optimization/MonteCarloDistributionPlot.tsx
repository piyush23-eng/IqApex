import React, { useState } from 'react';
import { MonteCarloSimulationResponse } from '../../types/optimization';
import { BarChart2, Play, RefreshCw, Layers } from 'lucide-react';

interface MonteCarloDistributionPlotProps {
  simulationData: MonteCarloSimulationResponse | null;
  onRunSimulation: (std: number, iterations: number, seed: number) => void;
  isLoading?: boolean;
}

export const MonteCarloDistributionPlot: React.FC<MonteCarloDistributionPlotProps> = ({
  simulationData,
  onRunSimulation,
  isLoading = false,
}) => {
  const [paramStd, setParamStd] = useState<number>(0.8);
  const [iterations, setIterations] = useState<number>(10000);
  const [seed, setSeed] = useState<number>(42871);

  if (!simulationData) {
    return (
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-4 text-center font-mono text-xs text-[#94A3B8] font-bold shadow-md">
        [ AWAITING MONTE CARLO UNCERTAINTY SIMULATION... ]
      </div>
    );
  }

  const {
    mean_delta,
    std_dev_delta,
    p05_delta,
    p50_delta,
    p95_delta,
    bins,
    simulation_seed,
    iterations: totalIters,
    disclaimer,
  } = simulationData;

  // Histogram layout
  const width = 640;
  const height = 180;
  const pad = { top: 20, right: 30, bottom: 35, left: 45 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;

  const maxFreq = Math.max(...bins.map((b) => b.frequency), 0.01);
  const minX = bins[0]?.bin_start ?? -0.05;
  const maxX = bins[bins.length - 1]?.bin_end ?? 0.05;

  const getX = (val: number) => pad.left + ((val - minX) / (maxX - minX || 1.0)) * w;
  const barWidth = w / Math.max(1, bins.length);

  return (
    <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-3 font-mono text-2xs space-y-2 shadow-md">
      {/* Titanium Header */}
      <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-2 bg-[#070E22] p-2 -mx-3 -mt-3 mb-2">
        <div className="flex items-center space-x-2">
          <BarChart2 className="w-3.5 h-3.5 text-[#FFFFFF]" />
          <span className="font-bold text-[#FFFFFF] tracking-wider uppercase text-xs">
            [ MONTE CARLO UNCERTAINTY PROPAGATION (N={totalIters.toLocaleString()}) ]
          </span>
        </div>

        <div className="flex items-center space-x-2 text-3xs font-bold">
          <div className="flex items-center space-x-1 bg-[#070E22] border border-[#1E3A8A] px-1.5 py-0.5">
            <span className="text-[#94A3B8]">Input σ:</span>
            <input
              type="number"
              step="0.1"
              value={paramStd}
              onChange={(e) => setParamStd(parseFloat(e.target.value) || 0.1)}
              className="w-12 bg-[#0A132E] border border-[#1E3A8A] px-1 py-0.5 text-[#FFFFFF] font-black text-center"
            />
          </div>

          <div className="flex items-center space-x-1 bg-[#070E22] border border-[#1E3A8A] px-1.5 py-0.5">
            <span className="text-[#94A3B8]">N:</span>
            <input
              type="number"
              step="1000"
              value={iterations}
              onChange={(e) => setIterations(parseInt(e.target.value, 10) || 10000)}
              className="w-16 bg-[#0A132E] border border-[#1E3A8A] px-1 py-0.5 text-[#FFFFFF] font-black text-center"
            />
          </div>

          <div className="flex items-center space-x-1 bg-[#070E22] border border-[#1E3A8A] px-1.5 py-0.5">
            <span className="text-[#94A3B8]">Seed:</span>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(parseInt(e.target.value, 10) || 42871)}
              className="w-16 bg-[#0A132E] border border-[#1E3A8A] px-1 py-0.5 text-[#FFFFFF] font-black text-center"
            />
          </div>

          <button
            onClick={() => onRunSimulation(paramStd, iterations, seed)}
            disabled={isLoading}
            className="btn-retro-primary text-3xs flex items-center space-x-1 font-bold disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="w-3 h-3 animate-spin text-[#FFFFFF]" /> : <Play className="w-3 h-3 fill-current text-[#FFFFFF]" />}
            <span>[ Simulate ]</span>
          </button>
        </div>
      </div>

      {/* Percentiles Summary Strip */}
      <div className="grid grid-cols-6 gap-2 text-3xs">
        <div className="bg-[#070E22] border border-[#1E3A8A] p-1.5 text-center shadow-sm">
          <span className="text-[#94A3B8] block font-bold uppercase">P05 (95% OPT)</span>
          <span className="font-black text-[#00E676] mt-0.5 block">
            {p05_delta >= 0 ? '+' : ''}{p05_delta.toFixed(3)}s
          </span>
        </div>

        <div className="bg-[#0062FF] border border-[#00F0FF] p-1.5 text-center shadow-matrix-glow">
          <span className="text-[#FFFFFF] block font-bold uppercase">[ P50 MEDIAN ]</span>
          <span className="font-black text-[#FFFFFF] mt-0.5 block">
            {p50_delta >= 0 ? '+' : ''}{p50_delta.toFixed(3)}s
          </span>
        </div>

        <div className="bg-[#070E22] border border-[#1E3A8A] p-1.5 text-center shadow-sm">
          <span className="text-[#94A3B8] block font-bold uppercase">P95 (95% PESS)</span>
          <span className="font-black text-[#FF3366] mt-0.5 block">
            {p95_delta >= 0 ? '+' : ''}{p95_delta.toFixed(3)}s
          </span>
        </div>

        <div className="bg-[#070E22] border border-[#1E3A8A] p-1.5 text-center shadow-sm">
          <span className="text-[#94A3B8] block font-bold uppercase">MEAN (μ)</span>
          <span className="font-black text-[#FFFFFF] mt-0.5 block">
            {mean_delta >= 0 ? '+' : ''}{mean_delta.toFixed(3)}s
          </span>
        </div>

        <div className="bg-[#070E22] border border-[#1E3A8A] p-1.5 text-center shadow-sm">
          <span className="text-[#94A3B8] block font-bold uppercase">STD DEV (σ)</span>
          <span className="font-black text-[#FFFFFF] mt-0.5 block">
            ±{std_dev_delta.toFixed(4)}s
          </span>
        </div>

        <div className="bg-[#070E22] border border-[#1E3A8A] p-1.5 text-center shadow-sm">
          <span className="text-[#94A3B8] block font-bold uppercase">SEED</span>
          <span className="font-black text-[#FFFFFF] mt-0.5 block">
            {simulation_seed}
          </span>
        </div>
      </div>

      {/* SVG Histogram */}
      <div className="relative bg-[#070E22] border border-[#1E3A8A] p-2 shadow overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          style={{ minWidth: '550px' }}
        >
          {/* Histogram Bars */}
          {bins.map((bin, i) => {
            const x = pad.left + i * barWidth;
            const barH = (bin.frequency / maxFreq) * h;
            const y = pad.top + h - barH;
            const isNegative = (bin.bin_start + bin.bin_end) / 2 < 0;

            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={Math.max(1, barWidth - 1)}
                height={barH}
                fill={isNegative ? '#0062FF' : '#0A132E'}
                stroke="#1E3A8A"
                strokeWidth={1}
                className="hover:fill-[#00F0FF] transition-colors cursor-pointer"
              >
                <title>{`Δt: [${bin.bin_start.toFixed(3)}s, ${bin.bin_end.toFixed(3)}s] | Freq: ${(bin.frequency * 100).toFixed(1)}% (${bin.count})`}</title>
              </rect>
            );
          })}

          {/* Vertical Zero Baseline Line */}
          <line
            x1={getX(0.0)}
            y1={pad.top}
            x2={getX(0.0)}
            y2={pad.top + h}
            stroke="#0062FF"
            strokeWidth={1.5}
            strokeDasharray="3,3"
          />

          {/* Median P50 Marker (Solid Pure White) */}
          <line
            x1={getX(p50_delta)}
            y1={pad.top}
            x2={getX(p50_delta)}
            y2={pad.top + h}
            stroke="#FFFFFF"
            strokeWidth="2.5"
          />
          <text
            x={getX(p50_delta) + 4}
            y={pad.top + 10}
            fill="#FFFFFF"
            fontSize="7.5"
            fontFamily="monospace"
            fontWeight="bold"
          >
            P50: {p50_delta.toFixed(3)}s
          </text>

          {/* X Axis */}
          <line
            x1={pad.left}
            y1={pad.top + h}
            x2={pad.left + w}
            y2={pad.top + h}
            stroke="#1E3A8A"
            strokeWidth={1.5}
          />

          {/* Axis Ticks */}
          {[minX, p05_delta, 0.0, p95_delta, maxX].map((tickVal) => (
            <g key={tickVal}>
              <line
                x1={getX(tickVal)}
                y1={pad.top + h}
                x2={getX(tickVal)}
                y2={pad.top + h + 4}
                stroke="#1E3A8A"
                strokeWidth={1.5}
              />
              <text
                x={getX(tickVal)}
                y={pad.top + h + 12}
                textAnchor="middle"
                fill="#93C5FD"
                fontSize="7.5"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {tickVal >= 0 ? '+' : ''}{tickVal.toFixed(3)}s
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="text-4xs text-[#CBD5E1] font-bold border-t border-[#1E3A8A] pt-1.5 flex items-center justify-between">
        <span>{disclaimer}</span>
        <span className="flex items-center space-x-1 bg-[#0A0D15] border border-[#1E3A8A] px-1.5 py-0.5">
          <Layers className="w-2.5 h-2.5 text-[#FFFFFF]" />
          <span>RNG: NUMPY DEFAULT_RNG (PCG64)</span>
        </span>
      </div>
    </div>
  );
};
