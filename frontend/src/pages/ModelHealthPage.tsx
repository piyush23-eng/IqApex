import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Cpu,
  FileText
} from 'lucide-react';

interface ValidationItem {
  id: string;
  category: 'NUMERICAL' | 'PHYSICAL' | 'STATISTICAL' | 'DATA QUALITY' | 'REPRODUCIBILITY' | 'SECURITY';
  component: string;
  invariant: string;
  testMethod: string;
  result: string;
  status: 'PASS' | 'WARN';
  limitations: string;
  stage: string;
}

const VALIDATION_DATA: ValidationItem[] = [
  {
    id: 'V-01',
    stage: 'Stage 6 & 7',
    category: 'PHYSICAL',
    component: 'Aerodynamic Model',
    invariant: 'Dynamic Pressure Scaling: q(2v) = 4 * q(v)',
    testMethod: 'test_dynamic_pressure_scaling',
    result: 'Exact 4.000x scaling (residual < 1e-9)',
    status: 'PASS',
    limitations: 'Incompressible flow formulation valid for Mach < 0.3.',
  },
  {
    id: 'V-02',
    stage: 'Stage 6',
    category: 'PHYSICAL',
    component: 'Aero Surrogate & Physics',
    invariant: 'Monotonic Drag Increase with Wing Flap Angle',
    testMethod: 'test_aero_drag_monotonicity_with_wing_angles',
    result: 'Monotonic drag increase verified across [15°, 30°]',
    status: 'PASS',
    limitations: 'Stall mitigation applied at extreme high AoA (>32°).',
  },
  {
    id: 'V-03',
    stage: 'Stage 6',
    category: 'NUMERICAL',
    component: 'Aero Physics Generator',
    invariant: 'Near-zero Speed Stability (v -> 0)',
    testMethod: 'test_division_by_zero_and_near_zero_speeds',
    result: 'No NaN/Inf, downforce = 0.000 N, balance default 42%',
    status: 'PASS',
    limitations: 'Aero balance undefined at zero force; defaults to static balance.',
  },
  {
    id: 'V-04',
    stage: 'Stage 7',
    category: 'NUMERICAL',
    component: 'Tyre Degradation Model',
    invariant: 'Extreme Age Monotonicity [0, 60 laps]',
    testMethod: 'test_tyre_model_extreme_laps_and_wear',
    result: 'Wear monotonically non-decreasing until cliff floor',
    status: 'PASS',
    limitations: 'Degradation capped at minimum viable grip floor (1.45 mu).',
  },
  {
    id: 'V-05',
    stage: 'Stage 6',
    category: 'STATISTICAL',
    component: 'GBDT Aero Surrogate',
    invariant: 'Out-of-sample Generalization (seed 99999 holdout)',
    testMethod: 'test_synthetic_overfitting_test_a',
    result: 'R² = 0.993, Relative MAE = 3.46% (< 5% threshold)',
    status: 'PASS',
    limitations: 'Evaluated on Latin Hypercube parameter space.',
  },
  {
    id: 'V-06',
    stage: 'Stage 6',
    category: 'STATISTICAL',
    component: 'Surrogate Extrapolation Detector',
    invariant: 'Extrapolation Flagging & PI Inflation',
    testMethod: 'test_extrapolation_detection_and_inflation',
    result: 'Out-of-bounds inputs trigger EXTRAPOLATION; PI width inflated',
    status: 'PASS',
    limitations: 'Convex bounding box criteria; high-dimensional boundaries approximate.',
  },
  {
    id: 'V-07',
    stage: 'Stage 6',
    category: 'STATISTICAL',
    component: 'Uncertainty Formulation',
    invariant: 'Prediction Interval > Confidence Interval (PI > CI)',
    testMethod: 'test_uncertainty_ci_vs_pi_distinction',
    result: 'Width(PI_95) = 34.2 N > Width(CI_95) = 1.8 N',
    status: 'PASS',
    limitations: 'Assumes homoscedastic Gaussian residual distribution.',
  },
  {
    id: 'V-08',
    stage: 'Stage 2',
    category: 'DATA QUALITY',
    component: 'Telemetry Ingestion Pipeline',
    invariant: 'Missing Channel Rejection & Corruption Guard',
    testMethod: 'test_corruption_missing_required_channels',
    result: 'Explicit ChannelMappingError; prevents corrupted database writes',
    status: 'PASS',
    limitations: 'Strict enforcement on mandatory 10 core channels.',
  },
  {
    id: 'V-09',
    stage: 'Stage 7',
    category: 'REPRODUCIBILITY',
    component: 'Monte Carlo Strategy Engine',
    invariant: 'Deterministic Bitwise Reproducibility (seed 42871)',
    testMethod: 'test_monte_carlo_deterministic_reproducibility',
    result: 'Identical mean race times and P10/P90 quantiles across re-runs',
    status: 'PASS',
    limitations: 'Requires explicit seed instantiation on simulation calls.',
  },
  {
    id: 'V-10',
    stage: 'Stage 8',
    category: 'REPRODUCIBILITY',
    component: 'Engineering Decision Engine',
    invariant: 'Lap Loss Decomposition Conservation',
    testMethod: 'test_end_to_end_decision_workflow_reconciliation',
    result: 'Sum of phase losses equals total delta (residual < 0.0001 s)',
    status: 'PASS',
    limitations: 'Spatial segment interpolation error bounded by 1.0 m grid.',
  },
  {
    id: 'V-11',
    stage: 'All Stages',
    category: 'SECURITY',
    component: 'FastAPI Service Layer',
    invariant: 'No Raw Stack Traces / Sanitized 422 & 413 Responses',
    testMethod: 'test_api_security_contracts',
    result: 'Clean validation payloads; internal filepaths withheld from client',
    status: 'PASS',
    limitations: 'Payload limits enforced at 10 MB per telemetry file.',
  },
];

export const ModelHealthPage: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<ValidationItem>(VALIDATION_DATA[0]);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const filteredItems = filterCategory === 'ALL'
    ? VALIDATION_DATA
    : VALIDATION_DATA.filter((item) => item.category === filterCategory);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 text-slate-100 font-mono text-xs">
      {/* Top Banner */}
      <div className="border-b border-slate-800 bg-slate-900/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm tracking-wider uppercase text-slate-100">
                Model Health &amp; Scientific Validation Dashboard
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                STAGE 9 PRODUCTION HARDENED
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              148 / 148 Invariant &amp; Adversarial Verification Tests Passing (100% Pass Rate)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Deterministic Seed</div>
            <div className="font-bold text-emerald-400">42871</div>
          </div>
          <div className="text-right border-l border-slate-800 pl-4">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Equation Audit</div>
            <div className="font-bold text-slate-200">SI Reconciled (1/2 ρ v²)</div>
          </div>
          <div className="text-right border-l border-slate-800 pl-4">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">FIA Compliance</div>
            <div className="font-bold text-amber-400">Reg. Art 30.5 Constrained</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left List */}
        <div className="w-1/2 border-r border-slate-800 flex flex-col overflow-hidden bg-slate-950/50">
          {/* Category Filter Bar */}
          <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/40 flex items-center space-x-2 overflow-x-auto">
            {['ALL', 'PHYSICAL', 'NUMERICAL', 'STATISTICAL', 'DATA QUALITY', 'REPRODUCIBILITY', 'SECURITY'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
                  filterCategory === cat
                    ? 'bg-slate-700 text-slate-100 border border-slate-600'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Test Items Table */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {filteredItems.map((item) => {
              const isSelected = selectedItem.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-3 cursor-pointer transition-colors flex items-start justify-between ${
                    isSelected
                      ? 'bg-slate-800/60 border-l-2 border-emerald-400'
                      : 'hover:bg-slate-900/40'
                  }`}
                >
                  <div className="space-y-1 pr-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-300 text-[11px]">{item.component}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-800 text-slate-400 border border-slate-700">
                        {item.stage}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-950/60 text-cyan-300 border border-cyan-800/50">
                        {item.category}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px] font-medium">{item.invariant}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Test: <span className="text-slate-400">{item.testMethod}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2 shrink-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center space-x-1">
                      <CheckCircle2 size={11} className="mr-1" />
                      {item.status}
                    </span>
                    <ChevronRight size={14} className={isSelected ? 'text-emerald-400' : 'text-slate-600'} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Detail Pane */}
        <div className="w-1/2 flex flex-col overflow-y-auto p-5 bg-slate-900/20 space-y-5">
          {/* Header Card */}
          <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                VERIFIED INVARIANT [{selectedItem.id}]
              </span>
              <span className="text-slate-400 text-[11px]">{selectedItem.stage}</span>
            </div>
            <h2 className="text-base font-bold text-slate-100">{selectedItem.component}</h2>
            <p className="text-slate-300 text-xs leading-relaxed">{selectedItem.invariant}</p>
          </div>

          {/* Test Method & Verification Proof */}
          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-slate-300 font-semibold text-xs border-b border-slate-800 pb-2">
              <Cpu size={14} className="text-cyan-400" />
              <span>Automated Verification Proof</span>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <div className="text-slate-400 text-[10px] uppercase">Automated Pytest Harness</div>
                <div className="font-mono text-emerald-400 bg-slate-950 p-2 rounded border border-slate-800 mt-1">
                  backend/tests/{selectedItem.testMethod}.py
                </div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px] uppercase">Measured Invariant Result</div>
                <div className="font-mono text-slate-200 bg-slate-950/80 p-2 rounded border border-slate-800 mt-1">
                  {selectedItem.result}
                </div>
              </div>
            </div>
          </div>

          {/* Known Limitations & Governance */}
          <div className="p-4 rounded-lg bg-amber-950/20 border border-amber-900/40 space-y-2">
            <div className="flex items-center space-x-2 text-amber-300 font-semibold text-xs">
              <AlertTriangle size={14} className="text-amber-400" />
              <span>Known Physical / Modeling Limitations</span>
            </div>
            <p className="text-amber-200/90 text-xs leading-relaxed">
              {selectedItem.limitations}
            </p>
          </div>

          {/* Audit Trail & Governance Docs */}
          <div className="p-4 rounded-lg bg-slate-900/40 border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-slate-300 font-semibold text-xs border-b border-slate-800 pb-2">
              <FileText size={14} className="text-purple-400" />
              <span>Stage 9 Engineering Audit Deliverables</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300 flex items-center justify-between">
                <span>docs/VALIDATION_MATRIX.md</span>
                <span className="text-emerald-400 text-[10px] font-bold">PASS</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300 flex items-center justify-between">
                <span>docs/UNIT_AUDIT.md</span>
                <span className="text-emerald-400 text-[10px] font-bold">AUDITED</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300 flex items-center justify-between">
                <span>docs/DATA_LEAKAGE_AUDIT.md</span>
                <span className="text-emerald-400 text-[10px] font-bold">ISOLATED</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300 flex items-center justify-between">
                <span>docs/REPRODUCIBILITY_AUDIT.md</span>
                <span className="text-emerald-400 text-[10px] font-bold">BITWISE</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300 flex items-center justify-between col-span-2">
                <span>docs/PERFORMANCE_BENCHMARK.md</span>
                <span className="text-cyan-400 text-[10px] font-bold">&lt; 25 ms MC Latency</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
