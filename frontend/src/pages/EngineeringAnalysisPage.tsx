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
    <div className="h-full overflow-y-auto p-4 space-y-4 font-mono text-2xs select-none bg-[#030712] text-[#FFFFFF]">
      {/* Top Banner / Breadcrumb */}
      <div className="matrix-hud-card scanline-container bg-[#0A132E] border border-[#1E3A8A] p-3 flex flex-wrap items-center justify-between gap-3 shadow-md relative">
        <div className="scan-beam" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-1.5 bg-[#0062FF] border border-[#00F0FF] shadow-matrix-glow">
            <Layers className="w-4 h-4 text-[#FFFFFF] stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-black text-[#FFFFFF] tracking-wider uppercase font-mono">
                [ STAGE 8 — ENGINEERING DECISION SUPPORT &amp; CROSS-MODULE PIPELINE ]
              </h1>
              <span className="text-4xs bg-[#0062FF] text-[#FFFFFF] border border-[#00F0FF] px-2 py-0.5 font-black shadow-matrix-glow">
                PIPELINE SYNCHRONIZED ✕
              </span>
            </div>
            <div className="text-3xs text-[#93C5FD] flex items-center gap-2 mt-0.5 font-bold font-mono">
              <span>Workflow: Obs → Decomp → Sens → Aero/Sim → Strategy → Decision</span>
              <span className="text-[#3B82F6]">|</span>
              <span className="text-[#FFFFFF] font-semibold">
                Physics-modelled sensitivity &amp; Bayesian uncertainty propagation
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <button
            onClick={handleOpenReport}
            className="btn-matrix-blue text-3xs font-extrabold flex items-center gap-1.5 shadow"
          >
            <FileText className="w-3.5 h-3.5 text-[#FFFFFF] stroke-[2.5]" />
            <span>[ GENERATE ENGINEERING REPORT ]</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="space-y-4">
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
          <div className="p-2.5 bg-[#FF3366]/15 border border-[#1E3A8A] text-[#FF3366] shadow text-3xs flex items-center gap-2 font-bold">
            <AlertTriangle className="w-4 h-4 text-[#FF3366] flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Evaluation status indicator */}
        {isEvaluating && (
          <div className="p-2.5 bg-[#00E676]/15 border border-[#00E676] text-[#FFFFFF] shadow flex items-center justify-between text-3xs font-extrabold">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 animate-spin text-[#00F0FF]" />
              <span>Propagating setup delta through surrogate model &amp; race strategy...</span>
            </div>
            <span className="text-4xs px-2 py-0.5 bg-[#070E22] border border-[#0062FF] text-[#00F0FF]">Monte Carlo N=1,000</span>
          </div>
        )}

        {/* Two-Column Engineering Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
          {/* LEFT COLUMN: Lap Loss & Setup What-If */}
          <div className="space-y-4">
            <LapLossDecompositionPanel lapLoss={lapLoss} isLoading={isLoading} />

            <SetupWhatIfChainPanel scenario={setupScenario} isLoading={isLoading} />
          </div>

          {/* RIGHT COLUMN: Strategy Consequence, Trade-off Plot & Findings */}
          <div className="space-y-4">
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
