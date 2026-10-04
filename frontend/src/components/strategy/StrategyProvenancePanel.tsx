import React from 'react';
import { ShieldCheck, Database, Binary, Cpu, Clock, AlertTriangle } from 'lucide-react';

interface StrategyProvenancePanelProps {
  circuit?: string;
  totalLaps?: number;
  simulationSeed?: number;
  monteCarloIterations?: number;
  fuelBurnRateKg?: number;
  nominalPitLossS?: number;
}

export const StrategyProvenancePanel: React.FC<StrategyProvenancePanelProps> = ({
  circuit = 'Autodromo Nazionale Monza',
  totalLaps = 53,
  simulationSeed = 42871,
  monteCarloIterations = 1000,
  fuelBurnRateKg = 1.85,
  nominalPitLossS = 24.5,
}) => {
  return (
    <footer className="window-retro bg-[#0A0D15] border border-[#1E3A8A] p-2.5 font-mono text-3xs text-[#FFFFFF] space-y-1.5 select-none shadow">
      <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-1.5">
        <div className="flex items-center space-x-2 text-[#FFFFFF] font-bold uppercase">
          <ShieldCheck className="w-3.5 h-3.5 text-[#FFFFFF]" />
          <span>[ STAGE 7 RACE STRATEGY & SCENARIO SIMULATION ENGINE ]</span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 text-[#FFFFFF] font-bold px-2 py-0.5 bg-[#0E1A3D] text-[#FBBF24] border border-[#FBBF24]/50 border border-[#1E3A8A] shadow-sm">
            <AlertTriangle className="w-3 h-3 text-[#FFB000]" />
            <span>[ SYNTHETIC ENGINEERING DATASET ]</span>
          </div>

          <div className="flex items-center space-x-1.5 text-[#FFFFFF] font-bold px-2 py-0.5 bg-[#070E22] border border-[#1E3A8A] shadow-sm">
            <Cpu className="w-3 h-3 text-[#FFFFFF]" />
            <span>[ MODELLED SCENARIO — NOT REAL F1 RACE DATA ]</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 font-bold">
        <div className="flex items-center space-x-1 text-[#FFFFFF]">
          <Database className="w-3 h-3 text-[#FFFFFF]" />
          <span>Circuit: {circuit} ({totalLaps} Laps)</span>
        </div>

        <div className="flex items-center space-x-1 text-[#FFFFFF]">
          <Cpu className="w-3 h-3 text-[#FFFFFF]" />
          <span>Coupled: VehicleSurrogate-v6 + Non-linear Tyre</span>
        </div>

        <div className="flex items-center space-x-1 text-[#FFFFFF]">
          <Binary className="w-3 h-3 text-[#FFFFFF]" />
          <span>MC: {monteCarloIterations} runs (Seed {simulationSeed})</span>
        </div>

        <div className="flex items-center space-x-1 text-[#FFFFFF]">
          <Clock className="w-3 h-3 text-[#FFFFFF]" />
          <span>Fuel: {fuelBurnRateKg} kg/lap | Pit: {nominalPitLossS}s</span>
        </div>

        <div className="flex items-center justify-end space-x-2 text-[#FFFFFF]">
          <span>FIA 2-Compound Rule: Enforced</span>
          <span>|</span>
          <span className="text-[#00E676] font-black">[ DETERMINISTIC ]</span>
        </div>
      </div>
    </footer>
  );
};
