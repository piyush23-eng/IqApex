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
      <div className="bg-workstation-panel border border-workstation-border rounded p-4 text-center font-mono text-xs text-workstation-textMuted">
        Awaiting Monte Carlo uncertainty simulation...
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
    <div className="bg-workstation-panel border border-workstation-border rounded p-3 font-mono text-2xs space-y-2">
      {/* Header & Controls */}
      <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-1.5">
        <div className="flex items-center space-x-2">
          <BarChart2 className="w-3.5 h-3.5 text-workstation-accentCyan" />
          <span className="font-bold text-workstation-textBright tracking-wider uppercase">
            MONTE CARLO UNCERTAINTY PROPAGATION (N={totalIters.toLocaleString()})
          </span>
        </div>

        <div className="flex items-center space-x-2 text-3xs">
          <div className="flex items-center space-x-1">
            <span className="text-workstation-textMuted">Input σ:</span>
            <input
              type="number"
              step="0.1"
              value={paramStd}
              onChange={(e) => setParamStd(parseFloat(e.target.value) || 0.1)}
              className="w-12 bg-workstation-surface border border-workstation-border px-1 py-0.5 rounded text-workstation-textBright text-center"
            />
          </div>

          <div className="flex items-center space-x-1">
            <span className="text-workstation-textMuted">N:</span>
            <input
              type="number"
              step="1000"
              value={iterations}
              onChange={(e) => setIterations(parseInt(e.target.value, 10) || 10000)}
              className="w-16 bg-workstation-surface border border-workstation-border px-1 py-0.5 rounded text-workstation-textBright text-center"
            />
          </div>

          <div className="flex items-center space-x-1">
            <span className="text-workstation-textMuted">Seed:</span>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(parseInt(e.target.value, 10) || 42871)}
              className="w-16 bg-workstation-surface border border-workstation-border px-1 py-0.5 rounded text-workstation-textBright text-center"
            />
          </div>

          <button
            onClick={() => onRunSimulation(paramStd, iterations, seed)}
            disabled={isLoading}
            className="px-2 py-0.5 bg-workstation-accentCyan/20 hover:bg-workstation-accentCyan/30 border border-workstation-accentCyan/50 text-workstation-accentCyan rounded flex items-center space-x-1 font-semibold transition-colors disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            <span>Simulate</span>
          </button>
        </div>
      </div>

      {/* Percentiles Summary Strip */}
      <div className="grid grid-cols-6 gap-2 text-3xs">
        <div className="bg-workstation-surface/60 border border-workstation-borderSubtle p-1 rounded text-center">
          <span className="text-workstation-textMuted block">P05 (95% OPTIMISTIC)</span>
          <span className="font-bold text-workstation-telemetryGreen mt-0.5 block">
            {p05_delta >= 0 ? '+' : ''}{p05_delta.toFixed(3)}s
          </span>
        </div>

        <div className="bg-workstation-surface/60 border border-workstation-borderSubtle p-1 rounded text-center">
          <span className="text-workstation-textMuted block">P50 (MEDIAN EXPECTED)</span>
          <span className="font-bold text-workstation-textBright mt-0.5 block">
            {p50_delta >= 0 ? '+' : ''}{p50_delta.toFixed(3)}s
          </span>
        </div>

        <div className="bg-workstation-surface/60 border border-workstation-borderSubtle p-1 rounded text-center">
          <span className="text-workstation-textMuted block">P95 (95% PESSIMISTIC)</span>
          <span className="font-bold text-workstation-telemetryAmber mt-0.5 block">
            {p95_delta >= 0 ? '+' : ''}{p95_delta.toFixed(3)}s
          </span>
        </div>

        <div className="bg-workstation-surface/60 border border-workstation-borderSubtle p-1 rounded text-center">
          <span className="text-workstation-textMuted block">MEAN OUTCOME (μ)</span>
          <span className="font-bold text-workstation-accentCyan mt-0.5 block">
            {mean_delta >= 0 ? '+' : ''}{mean_delta.toFixed(3)}s
          </span>
        </div>

        <div className="bg-workstation-surface/60 border border-workstation-borderSubtle p-1 rounded text-center">
          <span className="text-workstation-textMuted block">STANDARD DEV (σ)</span>
          <span className="font-bold text-workstation-textMuted mt-0.5 block">
            ±{std_dev_delta.toFixed(4)}s
          </span>
        </div>

        <div className="bg-workstation-surface/60 border border-workstation-borderSubtle p-1 rounded text-center">
          <span className="text-workstation-textMuted block">DETERMINISTIC SEED</span>
          <span className="font-bold text-workstation-textBright mt-0.5 block">
            {simulation_seed}
          </span>
        </div>
      </div>

      {/* SVG Histogram */}
      <div className="relative overflow-x-auto">
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
                fill={isNegative ? '#10b981' : '#f59e0b'}
                fillOpacity="0.7"
                stroke={isNegative ? '#10b981' : '#f59e0b'}
                strokeWidth={0.5}
                className="hover:fill-opacity-100 transition-colors cursor-pointer"
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
            stroke="#ffffff"
            strokeWidth={1}
            strokeDasharray="2,2"
          />

          {/* Median P50 Marker */}
          <line
            x1={getX(p50_delta)}
            y1={pad.top}
            x2={getX(p50_delta)}
            y2={pad.top + h}
            stroke="#38bdf8"
            strokeWidth={1.5}
          />
          <text
            x={getX(p50_delta) + 3}
            y={pad.top + 10}
            fill="#38bdf8"
            fontSize="7"
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
            stroke="#52525b"
            strokeWidth={1}
          />

          {/* Axis Ticks */}
          {[minX, p05_delta, 0.0, p95_delta, maxX].map((tickVal) => (
            <g key={tickVal}>
              <line
                x1={getX(tickVal)}
                y1={pad.top + h}
                x2={getX(tickVal)}
                y2={pad.top + h + 4}
                stroke="#52525b"
                strokeWidth={1}
              />
              <text
                x={getX(tickVal)}
                y={pad.top + h + 12}
                textAnchor="middle"
                fill="#71717a"
                fontSize="7.5"
                fontFamily="monospace"
              >
                {tickVal >= 0 ? '+' : ''}{tickVal.toFixed(3)}s
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="text-4xs text-workstation-textMuted border-t border-workstation-borderSubtle pt-1 flex items-center justify-between">
        <span>{disclaimer}</span>
        <span className="text-workstation-accentCyan flex items-center space-x-1">
          <Layers className="w-2.5 h-2.5" />
          <span>RNG: NumPy default_rng (PCG64)</span>
        </span>
      </div>
    </div>
  );
};
