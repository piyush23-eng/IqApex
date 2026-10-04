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
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-4 font-mono text-2xs text-[#FFFFFF] flex items-center justify-center space-x-2 h-52 shadow-md">
        <Fuel className="w-4 h-4 animate-spin text-[#FFFFFF]" />
        <span className="font-bold uppercase">[ CALCULATING FUEL BURN & VEHICLE MASS LAP-BY-LAP CORRELATION... ]</span>
      </div>
    );
  }

  if (!laps || laps.length === 0) {
    return (
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-4 font-mono text-2xs text-[#94A3B8] flex items-center justify-center h-52 shadow-md">
        <span>[ NO LAP SIMULATION DATA ]</span>
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
    <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-3 font-mono text-2xs space-y-2 shadow-md">
      {/* Titanium Header */}
      <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-2 bg-[#070E22] p-2 -mx-3 -mt-3 mb-2">
        <div className="flex items-center space-x-2">
          <Fuel className="w-3.5 h-3.5 text-[#FFFFFF]" />
          <span className="font-bold text-[#FFFFFF] uppercase tracking-wider text-xs">
            [ FUEL CORRECTION & VEHICLE MASS DEPLETION (1.85 kg/lap) ]
          </span>
        </div>

        <div className="flex items-center space-x-2 text-3xs">
          <span className="bg-[#070E22] border border-[#1E3A8A] px-1.5 py-0.5 text-[#FFFFFF] font-bold">
            START: {laps[0]?.vehicle_mass_kg.toFixed(1)}kg
          </span>
          <span className="bg-[#070E22] border border-[#1E3A8A] px-1.5 py-0.5 text-[#FFFFFF] font-bold">
            FINISH: {laps[laps.length - 1]?.vehicle_mass_kg.toFixed(1)}kg
          </span>
          <span className="bg-[#00F0FF] border border-[#1E3A8A] px-1.5 py-0.5 text-[#FFFFFF] font-bold">
            BURNED: {fuelBurnTotal.toFixed(1)}kg ({maxFuelDelta.toFixed(2)}s/lap)
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative bg-[#070E22] border border-[#1E3A8A] p-2 shadow">
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
                  stroke="#1E3A8A"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
                <text
                  x={chartDims.padX - 4}
                  y={yPos + 3}
                  textAnchor="end"
                  fill="#0062FF"
                  fontSize="7"
                  className="font-mono font-bold"
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
                fill="#FFFFFF"
                fontSize="7"
                className="font-mono font-bold"
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
                  stroke="#1E3A8A"
                  strokeWidth="1.5"
                />
                <text
                  x={xPos}
                  y={chartDims.height - chartDims.padY + 12}
                  textAnchor="middle"
                  fill="#93C5FD"
                  fontSize="7"
                  className="font-mono font-bold"
                >
                  L{lNum}
                </text>
              </g>
            );
          })}

          {/* Paths */}
          <path d={fuelPath} fill="none" stroke="#0062FF" strokeWidth="2.5" strokeLinecap="round" />
          <path d={massPath} fill="none" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="4,2" strokeLinecap="round" />
        </svg>
      </div>

      {/* Legend & Physical Details */}
      <div className="flex flex-wrap items-center justify-between text-3xs border-t border-[#1E3A8A] pt-2 text-[#94A3B8]">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 bg-[#070E22] px-2 py-0.5 border border-[#1E3A8A] shadow-sm">
            <span className="w-3 h-1 bg-[#008000] inline-block border border-[#1E3A8A]" />
            <span className="text-[#FFFFFF] font-bold">REMAINING FUEL (kg)</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-[#070E22] px-2 py-0.5 border border-[#1E3A8A] shadow-sm">
            <span className="w-3 h-1 bg-[#C05621] border-b border-dashed inline-block" />
            <span className="text-[#FFFFFF] font-bold">VEHICLE MASS (Base 798kg + Fuel)</span>
          </div>
        </div>

        <div className="flex items-center space-x-1 text-4xs text-[#CBD5E1] font-bold bg-[#0A0D15] px-2 py-0.5 border border-[#1E3A8A]">
          <TrendingDown className="w-3 h-3 text-[#00E676]" />
          <span>Vehicle accelerates ~0.035s faster per kg fuel burned via Stage 6 simulator coupling</span>
        </div>
      </div>
    </div>
  );
};
