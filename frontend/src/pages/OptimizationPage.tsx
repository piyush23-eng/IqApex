import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import {
  ParameterDefinition,
  ResponseCurveResponse,
  ResponseSurface2DResponse,
  MonteCarloSimulationResponse,
  ConstrainedOptimizationResponse,
} from '../types/optimization';
import { ParameterSelector } from '../components/optimization/ParameterSelector';
import { EngineeringSlider } from '../components/optimization/EngineeringSlider';
import { ResponseCurvePlot } from '../components/optimization/ResponseCurvePlot';
import { ResponseSurfaceContour } from '../components/optimization/ResponseSurfaceContour';
import { WhatIfResultPanel } from '../components/optimization/WhatIfResultPanel';
import { MonteCarloDistributionPlot } from '../components/optimization/MonteCarloDistributionPlot';
import { ConstrainedOptimizationPanel } from '../components/optimization/ConstrainedOptimizationPanel';
import { ProvenancePanel } from '../components/optimization/ProvenancePanel';
import { Sliders, AlertCircle, Cpu, Layers } from 'lucide-react';

interface OptimizationPageProps {
  initialCorner?: string;
  initialParam?: string;
}

export const OptimizationPage: React.FC<OptimizationPageProps> = ({
  initialCorner = 'T9',
  initialParam = 'corner_exit_speed',
}) => {
  const [parameters, setParameters] = useState<ParameterDefinition[]>([]);
  const [selectedParam, setSelectedParam] = useState<ParameterDefinition | null>(null);
  const [selectedCorner, setSelectedCorner] = useState<string>(initialCorner);
  const [targetMetric, setTargetMetric] = useState<string>('corner_time');

  const [baselineValue, setBaselineValue] = useState<number>(181.2);
  const [scenarioValue, setScenarioValue] = useState<number>(183.0);
  const [allowExtrapolationOverride, setAllowExtrapolationOverride] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'1d' | '2d'>('1d');

  // API Data States
  const [curveData, setCurveData] = useState<ResponseCurveResponse | null>(null);
  const [surface2dData, setSurface2dData] = useState<ResponseSurface2DResponse | null>(null);
  const [monteCarloData, setMonteCarloData] = useState<MonteCarloSimulationResponse | null>(null);
  const [optimizationData, setOptimizationData] = useState<ConstrainedOptimizationResponse | null>(null);

  const [isLoadingCurve, setIsLoadingCurve] = useState<boolean>(false);
  const [isLoadingSurface, setIsLoadingSurface] = useState<boolean>(false);
  const [isLoadingMC, setIsLoadingMC] = useState<boolean>(false);
  const [isLoadingOpt, setIsLoadingOpt] = useState<boolean>(false);

  // 1. Load Parameter Registry on Mount
  useEffect(() => {
    let mounted = true;
    api
      .getParameters()
      .then((params) => {
        if (!mounted) return;
        setParameters(params);
        const match = params.find((p) => p.name === initialParam) || params[0];
        if (match) {
          setSelectedParam(match);
        }
      })
      .catch((err) => console.error('Failed to load parameter registry:', err));
    return () => {
      mounted = false;
    };
  }, [initialParam]);

  // 2. Fetch 1D Response Curve & What-If
  const fetchCurveAndWhatIf = useCallback(async () => {
    if (!selectedParam) return;
    setIsLoadingCurve(true);
    try {
      const res = await api.getResponseCurve(
        'demo-session-monza-2026',
        selectedCorner,
        selectedParam.name,
        targetMetric,
        baselineValue,
        scenarioValue
      );
      setCurveData(res);
    } catch (err) {
      console.error('Failed to load response curve:', err);
    } finally {
      setIsLoadingCurve(false);
    }
  }, [selectedParam, selectedCorner, targetMetric, baselineValue, scenarioValue]);

  useEffect(() => {
    fetchCurveAndWhatIf();
  }, [fetchCurveAndWhatIf]);

  // 3. Fetch 2D Surface (if in 2D mode)
  const fetchSurface2D = useCallback(async () => {
    setIsLoadingSurface(true);
    try {
      const res = await api.getResponseSurface2D(
        'demo-session-monza-2026',
        selectedCorner,
        'corner_minimum_speed',
        'corner_exit_speed',
        targetMetric
      );
      setSurface2dData(res);
    } catch (err) {
      console.error('Failed to load 2D surface:', err);
    } finally {
      setIsLoadingSurface(false);
    }
  }, [selectedCorner, targetMetric]);

  useEffect(() => {
    if (viewMode === '2d') {
      fetchSurface2D();
    }
  }, [viewMode, fetchSurface2D]);

  // 4. Fetch Constrained Optimization Scenarios
  const fetchOptimization = useCallback(async () => {
    if (!selectedParam) return;
    setIsLoadingOpt(true);
    try {
      const res = await api.runOptimization({
        parameter_name: selectedParam.name,
        target_name: targetMetric,
        baseline_value: baselineValue,
        allow_extrapolation: allowExtrapolationOverride,
        robust_penalty_lambda: 1.0,
        session_id: 'demo-session-monza-2026',
        corner_id: selectedCorner,
      });
      setOptimizationData(res);
    } catch (err) {
      console.error('Failed to run optimization:', err);
    } finally {
      setIsLoadingOpt(false);
    }
  }, [selectedParam, targetMetric, baselineValue, allowExtrapolationOverride, selectedCorner]);

  useEffect(() => {
    fetchOptimization();
  }, [fetchOptimization]);

  // 5. Initial Monte Carlo run
  const handleRunMonteCarlo = useCallback(
    async (std: number, iterations: number, seed: number) => {
      if (!selectedParam) return;
      setIsLoadingMC(true);
      try {
        const res = await api.runMonteCarlo({
          parameter_name: selectedParam.name,
          target_name: targetMetric,
          baseline_value: baselineValue,
          scenario_mean: scenarioValue,
          scenario_std: std,
          iterations,
          simulation_seed: seed,
          include_residual_variance: true,
          session_id: 'demo-session-monza-2026',
          corner_id: selectedCorner,
        });
        setMonteCarloData(res);
      } catch (err) {
        console.error('Failed to run Monte Carlo:', err);
      } finally {
        setIsLoadingMC(false);
      }
    },
    [selectedParam, targetMetric, baselineValue, scenarioValue, selectedCorner]
  );

  useEffect(() => {
    if (selectedParam) {
      handleRunMonteCarlo(0.8, 10000, 42871);
    }
  }, [selectedParam, selectedCorner, handleRunMonteCarlo]);

  const handleApplyOptimizedScenario = (paramVal: number) => {
    setScenarioValue(paramVal);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#030712] p-4 space-y-4 font-mono text-2xs select-none text-[#FFFFFF]">
      {/* Top Header Strip */}
      <div className="matrix-hud-card scanline-container bg-[#0A132E] border border-[#1E3A8A] p-3 space-y-2 shadow-md relative">
        <div className="scan-beam" />
        <div className="flex flex-wrap items-center justify-between border-b border-[#1E3A8A] pb-2 gap-2 relative z-10">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-[#00F0FF] rounded-full animate-ping shadow-[0_0_8px_#00F0FF]" />
            <Cpu className="w-4 h-4 text-[#0062FF] stroke-[2.5]" />
            <span className="font-black text-[#FFFFFF] tracking-wider uppercase text-xs font-mono">
              [ PERFORMANCE SENSITIVITY &amp; ENGINEERING OPTIMIZATION WORKSPACE ]
            </span>
            <span className="text-[#3B82F6] font-bold">|</span>
            <span className="text-[#93C5FD] font-bold">CIRCUIT: AUTODROMO NAZIONALE MONZA</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 bg-[#0062FF] text-[#FFFFFF] border border-[#00F0FF] font-black text-4xs shadow-matrix-glow flex items-center space-x-1">
              <AlertCircle className="w-3 h-3 text-[#00F0FF] stroke-[2.5]" />
              <span>SYNTHETIC CALIBRATION DATASET ✕</span>
            </span>

            <div className="flex items-center space-x-1 font-mono text-3xs">
              <button
                onClick={() => setViewMode('1d')}
                className={`px-2.5 py-1 border border-[#1E3A8A] font-extrabold uppercase transition-all flex items-center space-x-1 ${
                  viewMode === '1d'
                    ? 'bg-[#0062FF] text-[#FFFFFF] border-[#00F0FF] shadow-matrix-glow'
                    : 'bg-[#070E22] text-[#93C5FD] hover:bg-[#0E1A3D] shadow-sm'
                }`}
              >
                <Sliders className="w-3 h-3" />
                <span>[ 1D CURVE ]</span>
              </button>
              <button
                onClick={() => setViewMode('2d')}
                className={`px-2.5 py-1 border border-[#1E3A8A] font-extrabold uppercase transition-all flex items-center space-x-1 ${
                  viewMode === '2d'
                    ? 'bg-[#0062FF] text-[#FFFFFF] border-[#00F0FF] shadow-matrix-glow'
                    : 'bg-[#070E22] text-[#93C5FD] hover:bg-[#0E1A3D] shadow-sm'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>[ 2D INTERACTION ]</span>
              </button>
            </div>
          </div>
        </div>

        {/* Parameter Registry & Target Selector */}
        <ParameterSelector
          parameters={parameters}
          selectedParam={selectedParam}
          onSelectParam={(p) => {
            setSelectedParam(p);
            setBaselineValue(p.name.includes('speed') ? 181.2 : 4.2);
            setScenarioValue(p.name.includes('speed') ? 183.0 : 4.4);
          }}
          selectedCorner={selectedCorner}
          onSelectCorner={setSelectedCorner}
          targetMetric={targetMetric}
          onSelectTargetMetric={setTargetMetric}
        />
      </div>

      {/* Engineering Precision Slider with Observed & Extrapolation Highlights */}
      {selectedParam && (
        <EngineeringSlider
          param={selectedParam}
          baselineValue={baselineValue}
          scenarioValue={scenarioValue}
          observedRange={curveData?.observed_range || [175, 185]}
          onChangeScenario={setScenarioValue}
          allowExtrapolationOverride={allowExtrapolationOverride}
          onToggleOverride={setAllowExtrapolationOverride}
        />
      )}

      {/* Visual Chart: 1D Response Curve OR 2D Contour Surface */}
      {viewMode === '1d' ? (
        <ResponseCurvePlot curveData={curveData} isLoading={isLoadingCurve} />
      ) : (
        <ResponseSurfaceContour surfaceData={surface2dData} isLoading={isLoadingSurface} />
      )}

      {/* What-If Prediction & Governance Audit Panel */}
      <WhatIfResultPanel curveData={curveData} />

      {/* Constrained Optimization: Nominal vs Conservative vs Robust Scenarios */}
      <ConstrainedOptimizationPanel
        optimizationData={optimizationData}
        onApplyScenario={handleApplyOptimizedScenario}
        isLoading={isLoadingOpt}
      />

      {/* Deterministic Monte Carlo Uncertainty Distribution */}
      <MonteCarloDistributionPlot
        simulationData={monteCarloData}
        onRunSimulation={handleRunMonteCarlo}
        isLoading={isLoadingMC}
      />

      {/* Stage 5 Provenance & Repeatability Footer */}
      <ProvenancePanel
        provenance={curveData?.provenance || null}
        modelId={curveData?.model_metadata.model_id}
        simulationSeed={monteCarloData?.simulation_seed}
      />
    </div>
  );
};
