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
    <footer className="bg-workstation-panel border border-workstation-border rounded p-2.5 font-mono text-3xs text-workstation-textMuted space-y-1.5 select-none">
      <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-1">
        <div className="flex items-center space-x-2 text-workstation-textBright font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-workstation-telemetryGreen" />
          <span>STAGE 7 RACE STRATEGY & SCENARIO SIMULATION ENGINE</span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 text-amber-400 font-semibold px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded">
            <AlertTriangle className="w-3 h-3" />
            <span>SYNTHETIC ENGINEERING DATASET</span>
          </div>

          <div className="flex items-center space-x-1.5 text-sky-400 font-semibold px-2 py-0.5 bg-sky-500/10 border border-sky-500/30 rounded">
            <Cpu className="w-3 h-3" />
            <span>MODELLED SCENARIO — NOT REAL F1 RACE DATA</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-0.5">
        <div className="flex items-center space-x-1">
          <Database className="w-3 h-3 text-workstation-accentCyan" />
          <span>Circuit: {circuit} ({totalLaps} Laps)</span>
        </div>

        <div className="flex items-center space-x-1">
          <Cpu className="w-3 h-3 text-workstation-accentCyan" />
          <span>Coupled: VehicleSurrogate-v6 + Non-linear Tyre</span>
        </div>

        <div className="flex items-center space-x-1">
          <Binary className="w-3 h-3 text-workstation-accentCyan" />
          <span>MC: {monteCarloIterations} runs (Seed {simulationSeed})</span>
        </div>

        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3 text-workstation-accentCyan" />
          <span>Fuel: {fuelBurnRateKg} kg/lap | Pit: {nominalPitLossS}s</span>
        </div>

        <div className="flex items-center justify-end space-x-2 text-workstation-textPrimary">
          <span>FIA 2-Compound Rule: Enforced</span>
          <span>|</span>
          <span className="text-workstation-telemetryGreen">Deterministic</span>
        </div>
      </div>
    </footer>
  );
};
