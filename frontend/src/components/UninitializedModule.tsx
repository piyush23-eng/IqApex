import React from 'react';
import { Construction, ArrowLeft } from 'lucide-react';
import { NavModule } from '../types/domain';

interface UninitializedModuleProps {
  module: NavModule;
  onReturnToOverview: () => void;
}

const MODULE_DESCRIPTIONS: Record<NavModule, { title: string; stage: string; spec: string }> = {
  overview: { title: 'Overview', stage: 'Stage 1', spec: 'Active' },
  telemetry: {
    title: 'High-Frequency Telemetry Channel Viewer',
    stage: 'Stage 2 Ingestion & Analytics Pipeline',
    spec: 'Sub-sampled 100 Hz synchronized channel strip (Speed, Throttle, Brake, RPM, Gear, Lateral/Longitudinal G).',
  },
  'lap-analysis': {
    title: 'Lap Analysis & Corner Decomposition',
    stage: 'Stage 2 Kinematic Decomposition Engine',
    spec: 'Turn entry, apex, and exit velocity differential matrices with spatial distance warping.',
  },
  'driver-comparison': {
    title: 'Multi-Driver Telemetry Overlay & G-G Diagram',
    stage: 'Stage 3 Comparative Performance',
    spec: 'Friction circle utilization, braking point deltas, and micro-sector gain/loss metrics.',
  },
  'vehicle-performance': {
    title: 'Vehicle Dynamics & Aero Balance Model',
    stage: 'Stage 3 Kinematics & Aero Fitting',
    spec: 'Front/rear ride-height vs. downforce mapping, aero balance estimation, mechanical grip ratio.',
  },
  tyres: {
    title: 'Tyre Degradation & Thermal Dissipation Model',
    stage: 'Stage 4 Compound & Thermal Modeling',
    spec: 'Surface and carcass thermal estimation, sliding work accumulation, stint longevity regression.',
  },
  sensitivity: {
    title: 'Parametric Setup Sensitivity Sweeps',
    stage: 'Stage 4 Sensitivity & Gradient Solvers',
    spec: 'Jacobian sensitivity matrix: dLapTime / dRideHeight, dLapTime / dCamber, dLapTime / dWingAngle.',
  },
  optimization: {
    title: 'Optimal Lap Time Solver & Setup Optimizer',
    stage: 'Stage 5 Simulation Engine',
    spec: 'Quasi-static point mass and non-linear numerical boundary value solvers.',
  },
  strategy: {
    title: 'Stint Strategy & Undercut Probability Engine',
    stage: 'Stage 5 Race Operations Support',
    spec: 'Monte Carlo pit stop window evaluation and traffic degradation penalty models.',
  },
  'data-runs': {
    title: 'Run Ingestion & Telemetry Data Lake',
    stage: 'Stage 1 Storage Layer',
    spec: 'PostgreSQL / Parquet time-series archive, session export/import, calibration profiles.',
  },
  'model-health': {
    title: 'Analytical Model Verification & Residuals',
    stage: 'Stage 4 Diagnostics Engine',
    spec: 'Model error distributions, Kalman filter residual checks, sensor calibration drift.',
  },
  'engineering-analysis': {
    title: 'Cross-Module Engineering Decision Support & Pipeline',
    stage: 'Stage 8 Decision Support Layer',
    spec: 'Evidence attribution, surrogate what-if propagation, strategy coupling, and reproducible reporting.',
  },
};

export const UninitializedModule: React.FC<UninitializedModuleProps> = ({
  module,
  onReturnToOverview,
}) => {
  const info = MODULE_DESCRIPTIONS[module] || {
    title: module,
    stage: 'Future Engineering Phase',
    spec: 'Specification pending architectural approval.',
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center font-mono">
      <div className="max-w-lg p-6 window-retro bg-[#0A132E] border border-[#1E3A8A] shadow-lg text-left space-y-4">
        {/* Titanium Header */}
        <div className="flex items-center space-x-2 text-[#FFFFFF] border-b border-[#1E3A8A] pb-2 bg-[#070E22] p-2 -mx-6 -mt-6">
          <Construction className="w-4 h-4 text-[#FFFFFF]" />
          <span className="text-2xs font-bold uppercase tracking-wider">
            [ MODULE NOT INITIALIZED — {info.stage} ]
          </span>
        </div>

        <div>
          <h2 className="text-sm font-bold text-[#FFFFFF] uppercase mb-1">{info.title}</h2>
          <p className="text-xs text-[#CBD5E1] leading-relaxed font-bold">{info.spec}</p>
        </div>

        <div className="p-3 bg-[#070E22] border border-[#1E3A8A] space-y-1.5 text-3xs shadow">
          <div className="text-[#FFFFFF] uppercase font-black">[ PRECONDITIONS FOR INITIALIZATION ]</div>
          <div className="text-[#FFFFFF] font-bold flex items-center space-x-2">
            <span className="w-2.5 h-2.5 border border-[#1E3A8A] bg-[#00F0FF] inline-block" />
            <span>Stage 1 Foundation & Domain Schema: [ ESTABLISHED ]</span>
          </div>
          <div className="text-[#FFFFFF] font-bold flex items-center space-x-2">
            <span className="w-2.5 h-2.5 border border-[#1E3A8A] bg-[#0E1A3D] text-[#FBBF24] border border-[#FBBF24]/50 inline-block" />
            <span>Target Stage Engine: [ AWAITING INGESTION ENGINE INTEGRATION ]</span>
          </div>
        </div>

        <div className="pt-2 flex justify-start">
          <button
            onClick={onReturnToOverview}
            className="btn-retro-primary text-xs flex items-center space-x-2"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#FFFFFF]" />
            <span>[ RETURN TO OVERVIEW (F1) ]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
