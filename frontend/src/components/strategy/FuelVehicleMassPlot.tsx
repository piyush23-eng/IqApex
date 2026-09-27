import React from 'react';
import { SimulatedLap } from '../../types/strategy';
import { Fuel, TrendingDown } from 'lucide-react';

interface FuelVehicleMassPlotProps {
  laps: SimulatedLap[];
  isLoading: boolean;
}

export const FuelVehicleMassPlot: React.FC<FuelVehicleMassPlotProps> = ({
  laps,
  isLoading,
}) => {
  const chartDims = { width: 500, height: 180, padX: 45, padY: 20 };

  if (isLoading) {
    return (
      <div className="bg-workstation-panel border border-workstation-border rounded p-4 font-mono text-2xs animate-pulse text-workstation-textMuted flex items-center justify-center space-x-2 h-52">
        <Fuel className="w-4 h-4 animate-spin text-workstation-accentCyan" />
        <span>CALCULATING FUEL BURN & VEHICLE MASS LAP-BY-LAP CORRELATION...</span>
      </div>
    );
  }

  if (!laps || laps.length === 0) {
    return (
      <div className="bg-workstation-panel border border-workstation-border rounded p-4 font-mono text-2xs text-workstation-textMuted flex items-center justify-center h-52">
        <span>No lap simulation data.</span>
      </div>
    );
  }

  const totalLaps = laps.length;
  // Fuel: 0 to 110 kg
  const minFuel = 0;
  const maxFuel = 110;
  // Mass: 790 to 920 kg
  const minMass = 790;
  const maxMass = 920;

  const scaleX = (lapNum: number) =>
    chartDims.padX + ((lapNum - 1) / (totalLaps - 1)) * (chartDims.width - 2 * chartDims.padX);

  const scaleYFuel = (fuel: number) =>
    chartDims.height -
    chartDims.padY -
    ((fuel - minFuel) / (maxFuel - minFuel)) * (chartDims.height - 2 * chartDims.padY);

  const scaleYMass = (mass: number) =>
    chartDims.height -
    chartDims.padY -
    ((mass - minMass) / (maxMass - minMass)) * (chartDims.height - 2 * chartDims.padY);

  // SVG paths
  const fuelPath = laps.reduce((acc, lap, i) => {
    const x = scaleX(lap.lap_number);
    const y = scaleYFuel(lap.fuel_remaining_kg);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const massPath = laps.reduce((acc, lap, i) => {
    const x = scaleX(lap.lap_number);
    const y = scaleYMass(lap.vehicle_mass_kg);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const startFuel = laps[0]?.fuel_remaining_kg ?? 105;
  const endFuel = laps[laps.length - 1]?.fuel_remaining_kg ?? 6.95;
  const fuelBurnTotal = startFuel - endFuel;
  const maxFuelDelta = laps[laps.length - 1]?.fuel_effect_s ?? -3.4;

  return (
    <div className="bg-workstation-panel border border-workstation-border rounded p-3 font-mono text-2xs space-y-2">
      <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-1.5">
        <div className="flex items-center space-x-2">
          <Fuel className="w-3.5 h-3.5 text-workstation-accentCyan" />
          <span className="font-bold text-workstation-textBright uppercase tracking-wider text-xs">
            FUEL CORRECTION & VEHICLE MASS DEPLETION (1.85 kg/lap)
          </span>
        </div>

        <div className="flex items-center space-x-3 text-3xs">
          <span className="text-workstation-textMuted">
            START MASS: <strong className="text-workstation-textBright">{laps[0]?.vehicle_mass_kg.toFixed(1)} kg</strong>
          </span>
          <span className="text-workstation-textMuted">
            FINISH MASS: <strong className="text-workstation-textBright">{laps[laps.length - 1]?.vehicle_mass_kg.toFixed(1)} kg</strong>
          </span>
          <span className="text-workstation-telemetryGreen font-semibold">
            BURNED: {fuelBurnTotal.toFixed(1)} kg ({maxFuelDelta.toFixed(2)}s/lap benefit)
          </span>
        </div>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${chartDims.width} ${chartDims.height}`} className="w-full h-40 select-none">
          {/* Grid lines */}
          {[0, 0.33, 0.66, 1].map((pct, idx) => {
            const fuelVal = minFuel + pct * (maxFuel - minFuel);
            const yPos = scaleYFuel(fuelVal);
            return (
              <g key={idx}>
                <line
                  x1={chartDims.padX}
                  y1={yPos}
                  x2={chartDims.width - chartDims.padX}
                  y2={yPos}
                  stroke="#334155"
                  strokeWidth="0.5"
                  strokeDasharray="2,2"
                />
                <text
                  x={chartDims.padX - 4}
                  y={yPos + 3}
                  textAnchor="end"
                  fill="#06B6D4"
                  fontSize="7"
                  className="font-mono"
                >
                  {fuelVal.toFixed(0)}kg
                </text>
              </g>
            );
          })}

          {/* Mass right axis ticks */}
          {[0, 0.33, 0.66, 1].map((pct, idx) => {
            const massVal = minMass + pct * (maxMass - minMass);
            const yPos = scaleYMass(massVal);
            return (
              <text
                key={`m-${idx}`}
                x={chartDims.width - chartDims.padX + 4}
                y={yPos + 3}
                textAnchor="start"
                fill="#F59E0B"
                fontSize="7"
                className="font-mono"
              >
                {massVal.toFixed(0)}kg
              </text>
            );
          })}

          {/* X ticks */}
          {[1, 10, 20, 30, 40, 50, 53].map((lNum) => {
            const xPos = scaleX(lNum);
            return (
              <g key={lNum}>
                <line
                  x1={xPos}
                  y1={chartDims.height - chartDims.padY}
                  x2={xPos}
                  y2={chartDims.height - chartDims.padY + 4}
                  stroke="#475569"
                  strokeWidth="1"
                />
                <text
                  x={xPos}
                  y={chartDims.height - chartDims.padY + 12}
                  textAnchor="middle"
                  fill="#64748B"
                  fontSize="7"
                  className="font-mono"
                >
                  L{lNum}
                </text>
              </g>
            );
          })}

          {/* Paths */}
          <path d={fuelPath} fill="none" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" />
          <path d={massPath} fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="4,2" strokeLinecap="round" />
        </svg>
      </div>

      {/* Legend & Physical Details */}
      <div className="flex flex-wrap items-center justify-between text-3xs border-t border-workstation-borderSubtle pt-1.5 text-workstation-textMuted">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-workstation-accentCyan inline-block" />
            <span className="text-workstation-textBright">Remaining Fuel (kg)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-amber-400 border-b border-dashed inline-block" />
            <span className="text-workstation-textBright">Vehicle Mass (Base 798kg + Fuel)</span>
          </div>
        </div>

        <div className="flex items-center space-x-1 text-4xs text-workstation-textSecondary">
          <TrendingDown className="w-3 h-3 text-workstation-telemetryGreen" />
          <span>Vehicle accelerates ~0.035s faster per kg fuel burned via Stage 6 simulator coupling</span>
        </div>
      </div>
    </div>
  );
};
