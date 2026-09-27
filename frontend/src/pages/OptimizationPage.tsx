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
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-workstation-background p-3 space-y-3 font-mono text-2xs select-none">
      {/* Top Header Strip */}
      <div className="bg-workstation-panel border border-workstation-border rounded p-3 space-y-2">
        <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-2">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-workstation-accentCyan" />
            <span className="font-bold text-workstation-textBright tracking-wider uppercase text-xs">
              PERFORMANCE SENSITIVITY & ENGINEERING OPTIMIZATION WORKSPACE
            </span>
            <span className="text-workstation-border">|</span>
            <span className="text-workstation-textMuted">CIRCUIT: AUTODROMO NAZIONALE MONZA</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold rounded text-3xs flex items-center space-x-1">
              <AlertCircle className="w-3 h-3" />
              <span>SYNTHETIC DEMONSTRATION DATASET</span>
            </span>

            <div className="flex items-center bg-workstation-surface border border-workstation-border rounded p-0.5 text-3xs">
              <button
                onClick={() => setViewMode('1d')}
                className={`px-2 py-0.5 rounded font-semibold transition-colors flex items-center space-x-1 ${
                  viewMode === '1d'
                    ? 'bg-workstation-accentCyan text-workstation-background'
                    : 'text-workstation-textMuted hover:text-workstation-textBright'
                }`}
              >
                <Sliders className="w-3 h-3" />
                <span>1D Curve</span>
              </button>
              <button
                onClick={() => setViewMode('2d')}
                className={`px-2 py-0.5 rounded font-semibold transition-colors flex items-center space-x-1 ${
                  viewMode === '2d'
                    ? 'bg-workstation-accentCyan text-workstation-background'
                    : 'text-workstation-textMuted hover:text-workstation-textBright'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>2D Interaction</span>
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
