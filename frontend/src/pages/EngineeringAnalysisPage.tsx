import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import {
  LapLossAnalysisResponse,
  SetupScenarioResponse,
  SetupStrategyResponse,
  EngineeringFinding,
  EngineeringAnalysis,
  EngineeringReportResponse,
  TradeoffPoint,
  DomainStatus,
  SetupPreset,
  SETUP_PRESETS,
} from '../types/engineeringAnalysis';
import { EngineeringAnalysisConfigBar } from '../components/decision/EngineeringAnalysisConfigBar';
import { LapLossDecompositionPanel } from '../components/decision/LapLossDecompositionPanel';
import { SetupWhatIfChainPanel } from '../components/decision/SetupWhatIfChainPanel';
import { StrategyConsequencePanel } from '../components/decision/StrategyConsequencePanel';
import { EngineeringFindingsPanel } from '../components/decision/EngineeringFindingsPanel';
import { MultiObjectiveTradeoffPlot } from '../components/decision/MultiObjectiveTradeoffPlot';
import { EngineeringReportModal } from '../components/decision/EngineeringReportModal';
import { DecisionProvenancePanel } from '../components/decision/DecisionProvenancePanel';
import { Layers, Activity, FileText, AlertTriangle } from 'lucide-react';

export const EngineeringAnalysisPage: React.FC = () => {
  // Preset Selection
  const [selectedPresetId, setSelectedPresetId] = useState<string>('nominal');

  // Setups
  const baselineSetup = useMemo<Record<string, number>>(() => ({
    rear_wing_angle: 24.0,
    front_wing_angle: 18.0,
    ride_height_front: 32.0,
    ride_height_rear: 70.0,
  }), []);

  const [activeParamChanges, setActiveParamChanges] = useState<Record<string, number>>({});

  // State payloads
  const [lapLoss, setLapLoss] = useState<LapLossAnalysisResponse | null>(null);
  const [setupScenario, setSetupScenario] = useState<SetupScenarioResponse | null>(null);
  const [setupStrategy, setSetupStrategy] = useState<SetupStrategyResponse | null>(null);
  const [findings, setFindings] = useState<EngineeringFinding[]>([]);
  const [fullAnalysis, setFullAnalysis] = useState<EngineeringAnalysis | null>(null);
  const [report, setReport] = useState<EngineeringReportResponse | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Full Pipeline Execution
  const runFullPipeline = useCallback(async (presetId?: string, overrideChanges?: Record<string, number>) => {
    setIsLoading(true);
    setError(null);
    const targetPresetId = presetId ?? selectedPresetId;
    const preset = SETUP_PRESETS.find((p: SetupPreset) => p.id === targetPresetId);
    const paramChanges = overrideChanges ?? (preset?.changes || {});

    try {
      const res = await api.runFullCrossModulePipeline(
        'lap_ref_1',
        'lap_comp_1',
        baselineSetup,
        paramChanges,
        'strat_1stop_med_hard'
      );

      setFullAnalysis(res);
      setLapLoss(res.lap_loss);
      setSetupScenario(res.setup_scenario);
      setSetupStrategy(res.strategy_consequence);
      setFindings(res.findings);
      setActiveParamChanges(paramChanges);
    } catch (err: unknown) {
      console.error('Failed to run full cross-module pipeline:', err);
      setError(err instanceof Error ? err.message : 'Error executing cross-module analysis pipeline');
    } finally {
      setIsLoading(false);
    }
  }, [selectedPresetId, baselineSetup]);

  // Initial load
  useEffect(() => {
    runFullPipeline('nominal');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Preset Selection
  const handleSelectPreset = async (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = SETUP_PRESETS.find((p: SetupPreset) => p.id === presetId);
    if (!preset) return;

    setIsEvaluating(true);
    try {
      await runFullPipeline(presetId, preset.changes);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Generate Report Handler
  const handleOpenReport = async () => {
    try {
      if (report && fullAnalysis) {
        setIsReportModalOpen(true);
        return;
      }
      let rep: EngineeringReportResponse;
      if (fullAnalysis) {
        rep = await api.generateEngineeringReport(fullAnalysis);
      } else {
        rep = await api.getDefaultEngineeringReport();
      }
      setReport(rep);
      setIsReportModalOpen(true);
    } catch (err: unknown) {
      console.error('Failed to generate engineering report:', err);
      alert('Unable to compile engineering report.');
    }
  };

  // Candidate Setup Points for Multi-Objective Tradeoff Plot
  const candidateTradeoffPoints = useMemo<TradeoffPoint[]>(() => {
    const activeLapDelta = setupScenario?.delta_lap_time_s ?? -0.285;
    const activeRaceDelta = setupStrategy?.delta_race_time_s ?? -15.1;
    const activeDf = setupScenario?.downforce_n ?? 4250;
    const activeDrag = setupScenario?.drag_n ?? 1360;
    const activePI = setupScenario ? (setupScenario.prediction_interval_95[1] - setupScenario.prediction_interval_95[0]) : 0.28;

    return [
      {
        id: 'active',
        name: 'Active Scenario',
        front_wing_angle: setupScenario?.scenario_setup?.front_wing_angle ?? 18.0,
        rear_wing_angle: setupScenario?.scenario_setup?.rear_wing_angle ?? 24.0,
        downforce_n: activeDf,
        drag_n: activeDrag,
        lap_time_delta_s: activeLapDelta,
        race_time_delta_s: activeRaceDelta,
        uncertainty_pi_s: activePI,
        is_current: true,
      },
      {
        id: 'nominal',
        name: 'Nominal Monza Setup',
        front_wing_angle: 18.0,
        rear_wing_angle: 24.0,
        downforce_n: 4250,
        drag_n: 1360,
        lap_time_delta_s: 0.0,
        race_time_delta_s: 0.0,
        uncertainty_pi_s: 0.22,
        is_current: selectedPresetId === 'nominal',
      },
      {
        id: 'low_drag',
        name: 'Low-Drag Sprint Trim',
        front_wing_angle: 16.0,
        rear_wing_angle: 21.0,
        downforce_n: 3950,
        drag_n: 1280,
        lap_time_delta_s: -0.190,
        race_time_delta_s: -10.07,
        uncertainty_pi_s: 0.24,
        is_current: selectedPresetId === 'low_drag',
      },
      {
        id: 'high_df',
        name: 'High Downforce Sector 2',
        front_wing_angle: 19.5,
        rear_wing_angle: 26.5,
        downforce_n: 4490,
        drag_n: 1475,
        lap_time_delta_s: 0.115,
        race_time_delta_s: 6.10,
        uncertainty_pi_s: 0.31,
        is_current: selectedPresetId === 'high_df',
      },
      {
        id: 'ground_effect',
        name: 'Ground Effect Lower Rake',
        front_wing_angle: 18.0,
        rear_wing_angle: 25.0,
        downforce_n: 4320,
        drag_n: 1380,
        lap_time_delta_s: -0.210,
        race_time_delta_s: -11.13,
        uncertainty_pi_s: 0.27,
        is_current: selectedPresetId === 'ground_effect',
      },
      {
        id: 'extrapolation',
        name: 'Extrapolation Audit (RW=34°)',
        front_wing_angle: 18.0,
        rear_wing_angle: 34.0,
        downforce_n: 4850,
        drag_n: 1680,
        lap_time_delta_s: 0.540,
        race_time_delta_s: 28.60,
        uncertainty_pi_s: 0.58,
        is_current: selectedPresetId === 'extrapolation',
      },
    ];
  }, [setupScenario, setupStrategy, selectedPresetId]);

  // Handle Tradeoff point click
  const handleSelectTradeoffPoint = (pt: TradeoffPoint) => {
    if (pt.is_current) return;
    if (SETUP_PRESETS.some((p: SetupPreset) => p.id === pt.id)) {
      handleSelectPreset(pt.id);
    } else {
      setSelectedPresetId(pt.id);
      runFullPipeline(undefined, {
        rear_wing_angle: pt.rear_wing_angle,
        front_wing_angle: pt.front_wing_angle,
      });
    }
  };

  const currentDomainStatus: DomainStatus = setupScenario?.domain_status || 'OBSERVED_DOMAIN';

  return (
    <div className="min-h-screen bg-[#090c10] text-slate-200 font-mono flex flex-col">
      {/* Top Banner / Breadcrumb */}
      <div className="bg-[#0e121a] border-b border-[#1c2230] px-6 py-2.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-cyan-950/80 rounded border border-cyan-800 text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-100 tracking-wide uppercase">
                Stage 8 — Engineering Decision Support & Cross-Module Pipeline
              </h1>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">
                PIPELINE SYNCHRONIZED
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
              <span>Workflow: Obs → Decomp → Sens → Aero/Sim → Strategy → Decision</span>
              <span>•</span>
              <span className="text-slate-500 font-sans italic">
                Non-causal association & physics-modelled sensitivity
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenReport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-950 to-blue-950 hover:from-cyan-900 hover:to-blue-900 text-cyan-300 rounded border border-cyan-700/80 text-xs font-semibold shadow-md transition"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Generate Engineering Report</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="p-5 flex-1 flex flex-col gap-5 max-w-[1720px] w-full mx-auto">
        {/* Config Bar */}
        <EngineeringAnalysisConfigBar
          selectedPresetId={selectedPresetId}
          onSelectPreset={handleSelectPreset}
          domainStatus={currentDomainStatus}
          isLoading={isLoading}
          onRefresh={() => runFullPipeline(selectedPresetId, activeParamChanges)}
          onOpenReport={handleOpenReport}
        />

        {/* Global Error Banner */}
        {error && (
          <div className="p-3 bg-red-950/70 border border-red-800 rounded flex items-center gap-2 text-xs text-red-200">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Evaluation status indicator */}
        {isEvaluating && (
          <div className="p-2 bg-cyan-950/40 border border-cyan-800/60 rounded flex items-center justify-between text-xs text-cyan-300">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Propagating setup delta through surrogate model & race strategy...</span>
            </div>
            <span className="text-[10px] text-slate-400">Monte Carlo N=1,000</span>
          </div>
        )}

        {/* Two-Column Engineering Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
          {/* LEFT COLUMN: Lap Loss & Setup What-If */}
          <div className="space-y-5">
            <LapLossDecompositionPanel lapLoss={lapLoss} isLoading={isLoading} />

            <SetupWhatIfChainPanel scenario={setupScenario} isLoading={isLoading} />
          </div>

          {/* RIGHT COLUMN: Strategy Consequence, Trade-off Plot & Findings */}
          <div className="space-y-5">
            <StrategyConsequencePanel strategy={setupStrategy} isLoading={isLoading} />

            <MultiObjectiveTradeoffPlot
              points={candidateTradeoffPoints}
              selectedPointId="active"
              onSelectPoint={handleSelectTradeoffPoint}
            />

            <EngineeringFindingsPanel findings={findings} isLoading={isLoading} />
          </div>
        </div>

        {/* Provenance & Reproducibility Footer */}
        <DecisionProvenancePanel
          analysisId={fullAnalysis?.analysis_id}
          inputHash={fullAnalysis?.input_hash}
          pipelineVersion="v8.0.0-decision-support"
          simulationSeed={42871}
        />
      </div>

      {/* Engineering Report Modal */}
      <EngineeringReportModal
        report={report}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
};
