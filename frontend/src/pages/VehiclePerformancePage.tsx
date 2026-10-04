import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import {
  AeroEvaluationResponse,
  AeroMonteCarloResponse,
  ParetoFrontierResponse,
  ResponseSurface2DVehicleResponse,
  TrackSimulationResponse,
  VehicleComparisonResponse,
  VehicleConfig,
  VehicleParameterSpec,
} from '../types/vehiclePerformance';
import { VehicleConfigPanel } from '../components/vehicle/VehicleConfigPanel';
import { AeroOutputPanel } from '../components/vehicle/AeroOutputPanel';
import { ParetoFrontierPlot } from '../components/vehicle/ParetoFrontierPlot';
import { AeroResponseSurfaceContour } from '../components/vehicle/AeroResponseSurfaceContour';
import { TradeoffComparisonTable } from '../components/vehicle/TradeoffComparisonTable';
import { CornerPerformanceTable } from '../components/vehicle/CornerPerformanceTable';
import { StraightPerformanceTable } from '../components/vehicle/StraightPerformanceTable';
import { AeroMonteCarloDistributionPlot } from '../components/vehicle/AeroMonteCarloDistributionPlot';
import { AeroProvenancePanel } from '../components/vehicle/AeroProvenancePanel';
import { Compass, Layers, GitCommit, SplitSquareVertical } from 'lucide-react';

const DEFAULT_CONFIG: VehicleConfig = {
  front_wing_angle: 18.0,
  rear_wing_angle: 24.0,
  ride_height_front: 32.0,
  ride_height_rear: 42.0,
  yaw_angle: 1.5,
  vehicle_speed: 250.0,
  tyre_grip: 1.75,
  mass: 810.0,
};

export const VehiclePerformancePage: React.FC = () => {
  const [parameters, setParameters] = useState<VehicleParameterSpec[]>([]);
  const [currentConfig, setCurrentConfig] = useState<VehicleConfig>(DEFAULT_CONFIG);
  const baselineConfig = DEFAULT_CONFIG;

  const [evaluation, setEvaluation] = useState<AeroEvaluationResponse | null>(null);
  const [comparison, setComparison] = useState<VehicleComparisonResponse | null>(null);
  const [paretoData, setParetoData] = useState<ParetoFrontierResponse | null>(null);
  const [surfaceData, setSurfaceData] = useState<ResponseSurface2DVehicleResponse | null>(null);
  const [trackSim, setTrackSim] = useState<TrackSimulationResponse | null>(null);
  const [monteCarloData, setMonteCarloData] = useState<AeroMonteCarloResponse | null>(null);

  const [surfaceTarget, setSurfaceTarget] = useState<string>('downforce_n');
  const [activeTab, setActiveTab] = useState<'surfaces' | 'pareto' | 'kinematics'>('surfaces');

  const [isLoadingParams, setIsLoadingParams] = useState<boolean>(true);
  const [isLoadingEval, setIsLoadingEval] = useState<boolean>(false);
  const [isLoadingMC, setIsLoadingMC] = useState<boolean>(false);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setIsLoadingParams(true);
      try {
        const [paramRes, pData] = await Promise.all([
          api.getVehicleParameters(),
          api.getAeroParetoFrontier(100),
        ]);
        setParameters(paramRes.parameters);
        setParetoData(pData);
      } catch (err) {
        console.error('Failed to initialize vehicle performance data:', err);
      } finally {
        setIsLoadingParams(false);
      }
    };
    init();
  }, []);

  // Update evaluation & track simulation whenever currentConfig changes
  const evaluateCurrent = useCallback(async (cfg: VehicleConfig) => {
    setIsLoadingEval(true);
    try {
      const [evalRes, simRes, compRes] = await Promise.all([
        api.evaluateVehicleConfig(cfg),
        api.simulateTrackPerformance(cfg),
        api.compareVehicleConfigs(baselineConfig, cfg),
      ]);
      setEvaluation(evalRes);
      setTrackSim(simRes);
      setComparison(compRes);
    } catch (err) {
      console.error('Failed to evaluate configuration:', err);
    } finally {
      setIsLoadingEval(false);
    }
  }, [baselineConfig]);

  useEffect(() => {
    evaluateCurrent(currentConfig);
  }, [currentConfig, evaluateCurrent]);

  // Update 2D surface when target changes
  useEffect(() => {
    const fetchSurface = async () => {
      try {
        const sData = await api.getAeroResponseSurface2D(surfaceTarget, 'front_wing_angle', 'rear_wing_angle', 25);
        setSurfaceData(sData);
      } catch (err) {
        console.error('Failed to reload response surface:', err);
      }
    };
    fetchSurface();
  }, [surfaceTarget]);

  // Run Monte Carlo simulation on demand
  const handleRunMonteCarlo = async () => {
    setIsLoadingMC(true);
    try {
      const res = await api.runAeroMonteCarlo(currentConfig, 500, 42871);
      setMonteCarloData(res);
    } catch (err) {
      console.error('Failed to run Monte Carlo:', err);
    } finally {
      setIsLoadingMC(false);
    }
  };

  const handleReset = () => {
    setCurrentConfig(DEFAULT_CONFIG);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#030712] p-4 space-y-4 font-mono text-2xs select-none text-[#FFFFFF]">
      {/* 1. Header Bar */}
      <div className="matrix-hud-card scanline-container bg-[#0A132E] border border-[#1E3A8A] p-3 space-y-2 shadow-md relative">
        <div className="scan-beam" />
        <div className="flex flex-wrap items-center justify-between border-b border-[#1E3A8A] pb-2 gap-2 relative z-10">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-[#00F0FF] rounded-full animate-ping shadow-[0_0_8px_#00F0FF]" />
            <Compass className="w-4 h-4 text-[#0062FF]" />
            <span className="font-black text-[#FFFFFF] tracking-wider uppercase text-xs font-mono">
              [ VEHICLE PERFORMANCE &amp; AERODYNAMIC SURROGATE WORKSTATION ]
            </span>
            <span className="text-[#3B82F6] font-bold">|</span>
            <span className="text-[#93C5FD] font-mono text-3xs font-semibold">CIRCUIT: AUTODROMO NAZIONALE MONZA</span>
          </div>

          {/* Sub-view switch tabs */}
          <div className="flex items-center space-x-2 font-mono text-2xs">
            <button
              onClick={() => setActiveTab('surfaces')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 border border-[#1E3A8A] text-3xs font-bold uppercase transition-all ${
                activeTab === 'surfaces'
                  ? 'bg-[#0062FF] text-[#FFFFFF] border-[#00F0FF] shadow-matrix-glow'
                  : 'bg-[#070E22] text-[#93C5FD] hover:bg-[#0E1A3D] shadow-sm'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>[ 2D SURFACES ]</span>
            </button>

            <button
              onClick={() => setActiveTab('pareto')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 border border-[#1E3A8A] text-3xs font-bold uppercase transition-all ${
                activeTab === 'pareto'
                  ? 'bg-[#0062FF] text-[#FFFFFF] border-[#00F0FF] shadow-matrix-glow'
                  : 'bg-[#070E22] text-[#93C5FD] hover:bg-[#0E1A3D] shadow-sm'
              }`}
            >
              <GitCommit className="w-3.5 h-3.5" />
              <span>[ PARETO FRONTIER ]</span>
            </button>

            <button
              onClick={() => setActiveTab('kinematics')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 border border-[#1E3A8A] text-3xs font-bold uppercase transition-all ${
                activeTab === 'kinematics'
                  ? 'bg-[#0062FF] text-[#FFFFFF] border-[#00F0FF] shadow-matrix-glow'
                  : 'bg-[#070E22] text-[#93C5FD] hover:bg-[#0E1A3D] shadow-sm'
              }`}
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span>[ TRACK KINEMATICS ]</span>
            </button>
          </div>
        </div>

        <p className="text-3xs text-[#94A3B8] font-semibold">
          Multi-variable aerodynamic surrogate models (GBR/LHS) estimating downforce, drag, aero balance, and vehicle track-segment lap times.
        </p>
      </div>

      {/* 2. Top Interactive Section: Controls & Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-7">
          <VehicleConfigPanel
            parameters={parameters}
            currentConfig={currentConfig}
            onChangeConfig={setCurrentConfig}
            onResetToDefault={handleReset}
          />
        </div>

        <div className="lg:col-span-5">
          <AeroOutputPanel evaluation={evaluation} isLoading={isLoadingEval} />
        </div>
      </div>

      {/* 3. Mid Section: Trade-Off Analysis */}
      <TradeoffComparisonTable comparison={comparison} isLoading={isLoadingEval} />

      {/* 4. Tabbed Exploratory Analytics */}
      {activeTab === 'surfaces' && (
        <AeroResponseSurfaceContour
          surfaceData={surfaceData}
          currentX={currentConfig.front_wing_angle}
          currentY={currentConfig.rear_wing_angle}
          targetMetric={surfaceTarget}
          onChangeTarget={setSurfaceTarget}
          isLoading={isLoadingParams}
        />
      )}

      {activeTab === 'pareto' && (
        <ParetoFrontierPlot
          paretoData={paretoData}
          currentConfig={currentConfig}
          currentDownforce={evaluation?.downforce_n}
          currentDrag={evaluation?.drag_n}
          isLoading={isLoadingParams}
        />
      )}

      {activeTab === 'kinematics' && trackSim && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <CornerPerformanceTable
            corners={trackSim.corners}
            totalCornerTime={trackSim.total_corner_time_s}
          />
          <StraightPerformanceTable
            straights={trackSim.straights}
            totalStraightTime={trackSim.total_straight_time_s}
          />
        </div>
      )}

      {/* 5. Monte Carlo Lap-Time Uncertainty Propagation */}
      <AeroMonteCarloDistributionPlot
        monteCarloData={monteCarloData}
        isLoading={isLoadingMC}
        onRunSimulation={handleRunMonteCarlo}
      />

      {/* 6. Provenance & Scientific Integrity Footer */}
      <AeroProvenancePanel
        datasetVersion={evaluation?.dataset_version}
        datasetHash={evaluation?.dataset_hash}
        modelVersion={evaluation?.model_version}
      />
    </div>
  );
};
