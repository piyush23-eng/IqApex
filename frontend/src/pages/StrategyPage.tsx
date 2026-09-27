import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../src/services/api';
import {
  FeasibleStrategy,
  RaceSimulationResponse,
  CompoundCurveResponse,
  StrategyMonteCarloResponse,
  PitWindowResponse,
  ScenarioMatrixResponse,
  StintDefinition,
} from '../types/strategy';
import { StrategyConfigBar } from '../components/strategy/StrategyConfigBar';
import { StrategyTimelineCard } from '../components/strategy/StrategyTimelineCard';
import { StrategyComparisonTable } from '../components/strategy/StrategyComparisonTable';
import { TyreDegradationPlot } from '../components/strategy/TyreDegradationPlot';
import { FuelVehicleMassPlot } from '../components/strategy/FuelVehicleMassPlot';
import { StrategyMonteCarloPlot } from '../components/strategy/StrategyMonteCarloPlot';
import { PitWindowSensitivityPlot } from '../components/strategy/PitWindowSensitivityPlot';
import { ScenarioMatrixTable } from '../components/strategy/ScenarioMatrixTable';
import { StrategyProvenancePanel } from '../components/strategy/StrategyProvenancePanel';
import { GitBranch, Layers, Disc, Binary } from 'lucide-react';

export const StrategyPage: React.FC = () => {
  const [strategies, setStrategies] = useState<FeasibleStrategy[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('strat_1stop_med_hard');
  const [weather, setWeather] = useState<string>('DRY');
  const [safetyCar, setSafetyCar] = useState<string>('GREEN');
  const [traffic, setTraffic] = useState<string>('LIGHT_TRAFFIC');

  const [activeTab, setActiveTab] = useState<'matrix' | 'tyres_mass' | 'monte_carlo'>('matrix');

  // Simulation Results
  const [simulation, setSimulation] = useState<RaceSimulationResponse | null>(null);
  const [baselineTimes, setBaselineTimes] = useState<Record<string, number>>({});
  const [tyreCurves, setTyreCurves] = useState<Record<string, CompoundCurveResponse>>({});
  const [monteCarloData, setMonteCarloData] = useState<StrategyMonteCarloResponse | null>(null);
  const [pitWindowData, setPitWindowData] = useState<PitWindowResponse | null>(null);
  const [scenarioMatrix, setScenarioMatrix] = useState<ScenarioMatrixResponse | null>(null);

  // Loading States
  const [isLoadingInit, setIsLoadingInit] = useState<boolean>(true);
  const [isLoadingSim, setIsLoadingSim] = useState<boolean>(false);
  const [isLoadingMC, setIsLoadingMC] = useState<boolean>(false);

  // Load Initial Strategies & Tyre Curves
  useEffect(() => {
    const initData = async () => {
      setIsLoadingInit(true);
      try {
        const [stratRes, softC, medC, hardC] = await Promise.all([
          api.getFeasibleStrategies(2),
          api.getTyreCompoundCurve('SOFT', 40),
          api.getTyreCompoundCurve('MEDIUM', 40),
          api.getTyreCompoundCurve('HARD', 40),
        ]);

        setStrategies(stratRes.strategies);
        setTyreCurves({
          SOFT: softC,
          MEDIUM: medC,
          HARD: hardC,
        });

        // Set default strategy
        if (stratRes.strategies.length > 0) {
          const defaultStrat = stratRes.strategies.find((s) => s.strategy_id === 'strat_1stop_med_hard') || stratRes.strategies[0];
          setSelectedStrategyId(defaultStrat.strategy_id);
        }
      } catch (err) {
        console.error('Failed to initialize race strategy models:', err);
      } finally {
        setIsLoadingInit(false);
      }
    };

    initData();
  }, []);

  // Convert selected strategy to StintDefinitions
  const getSelectedStints = useCallback((): StintDefinition[] => {
    const strat = strategies.find((s) => s.strategy_id === selectedStrategyId);
    if (!strat) {
      return [
        { compound: 'MEDIUM', laps: 24 },
        { compound: 'HARD', laps: 29 },
      ];
    }
    return strat.compound_sequence.map((c, idx) => ({
      compound: c,
      laps: strat.stint_lengths[idx],
    }));
  }, [strategies, selectedStrategyId]);

  // Execute Race Simulation & Derived Sensitivities
  const runSimulation = useCallback(async () => {
    if (strategies.length === 0) return;
    setIsLoadingSim(true);
    try {
      const stints = getSelectedStints();
      const [simRes, pitRes, matrixRes] = await Promise.all([
        api.simulateRace(selectedStrategyId, stints, weather, safetyCar, traffic),
        api.getPitWindowSensitivity(stints, 0),
        api.getScenarioMatrix(stints),
      ]);

      setSimulation(simRes);
      setPitWindowData(pitRes);
      setScenarioMatrix(matrixRes);

      // Record baseline race time for comparison table
      setBaselineTimes((prev) => ({
        ...prev,
        [selectedStrategyId]: simRes.total_race_time_s,
      }));
    } catch (err) {
      console.error('Failed to simulate race strategy:', err);
    } finally {
      setIsLoadingSim(false);
    }
  }, [selectedStrategyId, strategies, weather, safetyCar, traffic, getSelectedStints]);

  // Re-run simulation when strategy or scenario flags change
  useEffect(() => {
    if (strategies.length > 0 && selectedStrategyId) {
      runSimulation();
    }
  }, [selectedStrategyId, weather, safetyCar, traffic, runSimulation, strategies.length]);

  // Run Monte Carlo Simulation
  const handleRunMonteCarlo = useCallback(async () => {
    setIsLoadingMC(true);
    try {
      const stints = getSelectedStints();
      const refTime = simulation?.total_race_time_s;
      const mcRes = await api.runStrategyMonteCarlo(
        selectedStrategyId,
        stints,
        1000,
        42871,
        refTime
      );
      setMonteCarloData(mcRes);
    } catch (err) {
      console.error('Monte Carlo simulation failed:', err);
    } finally {
      setIsLoadingMC(false);
    }
  }, [selectedStrategyId, simulation, getSelectedStints]);

  return (
    <div className="flex-1 flex flex-col h-full bg-workstation-bg overflow-y-auto p-4 space-y-3">
      {/* Top Banner / Breadcrumb */}
      <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-2">
        <div className="flex items-center space-x-2.5">
          <GitBranch className="w-5 h-5 text-workstation-accentCyan" />
          <div>
            <h1 className="text-sm font-mono font-bold text-workstation-textBright tracking-wider uppercase">
              RACE STRATEGY & SCENARIO SIMULATION ENGINE
            </h1>
            <p className="text-3xs font-mono text-workstation-textMuted">
              Autodromo Nazionale Monza — 53 Laps · Fuel Depletion · Non-linear Tyre Degradation · Deterministic Monte Carlo
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 bg-workstation-surface border border-workstation-borderSubtle rounded p-0.5 font-mono text-2xs">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded transition-colors ${
              activeTab === 'matrix'
                ? 'bg-workstation-accentCyan text-slate-950 font-bold'
                : 'text-workstation-textSecondary hover:text-workstation-textBright'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>STRATEGY MATRIX & SCENARIOS</span>
          </button>

          <button
            onClick={() => setActiveTab('tyres_mass')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded transition-colors ${
              activeTab === 'tyres_mass'
                ? 'bg-workstation-accentCyan text-slate-950 font-bold'
                : 'text-workstation-textSecondary hover:text-workstation-textBright'
            }`}
          >
            <Disc className="w-3.5 h-3.5" />
            <span>TYRES & VEHICLE MASS</span>
          </button>

          <button
            onClick={() => setActiveTab('monte_carlo')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded transition-colors ${
              activeTab === 'monte_carlo'
                ? 'bg-workstation-accentCyan text-slate-950 font-bold'
                : 'text-workstation-textSecondary hover:text-workstation-textBright'
            }`}
          >
            <Binary className="w-3.5 h-3.5" />
            <span>MONTE CARLO & PIT SENSITIVITY</span>
          </button>
        </div>
      </div>

      {/* Strategy Configuration Bar */}
      <StrategyConfigBar
        strategies={strategies}
        selectedStrategyId={selectedStrategyId}
        onSelectStrategy={setSelectedStrategyId}
        weather={weather}
        onChangeWeather={setWeather}
        safetyCar={safetyCar}
        onChangeSafetyCar={setSafetyCar}
        traffic={traffic}
        onChangeTraffic={setTraffic}
        isLoading={isLoadingSim || isLoadingInit}
        onSimulate={runSimulation}
        onRunMonteCarlo={handleRunMonteCarlo}
      />

      {/* Primary Stint Execution Timeline Card */}
      <StrategyTimelineCard
        simulation={simulation}
        isLoading={isLoadingSim || isLoadingInit}
      />

      {/* Tab Panels */}
      {activeTab === 'matrix' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <StrategyComparisonTable
            strategies={strategies}
            selectedStrategyId={selectedStrategyId}
            baselineRaceTimes={baselineTimes}
            onSelectStrategy={setSelectedStrategyId}
            isLoading={isLoadingInit}
          />
          <ScenarioMatrixTable
            matrixData={scenarioMatrix}
            isLoading={isLoadingSim}
          />
        </div>
      )}

      {activeTab === 'tyres_mass' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <TyreDegradationPlot
            curves={tyreCurves}
            isLoading={isLoadingInit}
          />
          <FuelVehicleMassPlot
            laps={simulation?.laps ?? []}
            isLoading={isLoadingSim}
          />
        </div>
      )}

      {activeTab === 'monte_carlo' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <StrategyMonteCarloPlot
            monteCarloData={monteCarloData}
            isLoading={isLoadingMC}
            onRunMonteCarlo={handleRunMonteCarlo}
          />
          <PitWindowSensitivityPlot
            pitWindowData={pitWindowData}
            isLoading={isLoadingSim}
          />
        </div>
      )}

      {/* Scientific Governance Audit Footer */}
      <StrategyProvenancePanel
        circuit="Autodromo Nazionale Monza"
        totalLaps={53}
        simulationSeed={42871}
        monteCarloIterations={1000}
        fuelBurnRateKg={1.85}
        nominalPitLossS={24.5}
      />
    </div>
  );
};
