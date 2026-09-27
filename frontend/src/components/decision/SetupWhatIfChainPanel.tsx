import React from 'react';
import { SetupScenarioResponse } from '../../types/engineeringAnalysis';
import { Sliders, AlertTriangle, Cpu } from 'lucide-react';

interface SetupWhatIfChainPanelProps {
  scenario: SetupScenarioResponse | null;
  isLoading: boolean;
}

export const SetupWhatIfChainPanel: React.FC<SetupWhatIfChainPanelProps> = ({
  scenario,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="bg-workstation-panel border border-workstation-border rounded p-4 font-mono text-2xs animate-pulse text-workstation-textMuted flex items-center justify-center space-x-2 h-64">
        <Cpu className="w-4 h-4 animate-spin text-workstation-accentCyan" />
        <span>PROPAGATING PARAMETER SCENARIO THROUGH SURROGATE & VEHICLE KINEMATICS...</span>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="bg-workstation-panel border border-workstation-border rounded p-4 font-mono text-2xs text-workstation-textMuted flex items-center justify-center h-64">
        <span>No setup scenario data evaluated.</span>
      </div>
    );
  }

  const {
    baseline_setup,
    scenario_setup,
    delta_parameters,
    downforce_n,
    drag_n,
    lift_to_drag,
    aero_balance_pct,
    delta_downforce_n,
    delta_drag_n,
    delta_corner_time_s,
    delta_straight_time_s,
    delta_lap_time_s,
    confidence_interval_95,
    prediction_interval_95,
    extrapolation_warning,
  } = scenario;

  return (
    <div className="bg-workstation-panel border border-workstation-border rounded p-3 font-mono text-2xs space-y-3">
      {/* Header & Lap-Time Consequence Summary */}
      <div className="flex flex-wrap items-center justify-between border-b border-workstation-borderSubtle pb-2 gap-2">
        <div className="flex items-center space-x-2">
          <Sliders className="w-3.5 h-3.5 text-workstation-accentCyan" />
          <span className="font-bold text-workstation-textBright uppercase tracking-wider text-xs">
            SETUP WHAT-IF CHAIN (AERO → KINEMATICS → LAP TIME)
          </span>
        </div>

        <div className="flex items-center space-x-3 text-3xs">
          <div>
            <span className="text-workstation-textMuted">MODELLED LAP TIME DELTA: </span>
            <strong className={`text-xs ${delta_lap_time_s < 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {delta_lap_time_s >= 0 ? '+' : ''}{delta_lap_time_s.toFixed(3)}s
            </strong>
          </div>
          <span className="text-4xs px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold">
            MODELLED
          </span>
        </div>
      </div>

      {/* Extrapolation Warning Alert */}
      {extrapolation_warning && (
        <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-3xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <div>
            <strong>EXTRAPOLATION NOTICE: </strong>
            <span>{extrapolation_warning}</span>
          </div>
        </div>
      )}

      {/* Core Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Column 1: Setup Changes */}
        <div className="bg-workstation-surface border border-workstation-borderSubtle rounded p-2.5 space-y-1.5">
          <div className="text-3xs text-workstation-textMuted uppercase font-semibold flex items-center justify-between">
            <span>PARAMETER DELTAS</span>
            <span className="text-4xs text-workstation-textSecondary">Baseline → Scenario</span>
          </div>
          <div className="divide-y divide-workstation-borderSubtle text-3xs space-y-1">
            <div className="flex justify-between items-center pt-1">
              <span className="text-workstation-textMuted">Rear Wing:</span>
              <span className="font-mono text-workstation-textBright">
                {baseline_setup.rear_wing_angle?.toFixed(1)}° → {scenario_setup.rear_wing_angle?.toFixed(1)}° (
                <strong className={delta_parameters.rear_wing_angle >= 0 ? 'text-cyan-400' : 'text-amber-400'}>
                  {delta_parameters.rear_wing_angle >= 0 ? '+' : ''}{delta_parameters.rear_wing_angle?.toFixed(1)}°
                </strong>)
              </span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-workstation-textMuted">Front Wing:</span>
              <span className="font-mono text-workstation-textBright">
                {baseline_setup.front_wing_angle?.toFixed(1)}° → {scenario_setup.front_wing_angle?.toFixed(1)}° (
                <strong className={delta_parameters.front_wing_angle >= 0 ? 'text-cyan-400' : 'text-amber-400'}>
                  {delta_parameters.front_wing_angle >= 0 ? '+' : ''}{delta_parameters.front_wing_angle?.toFixed(1)}°
                </strong>)
              </span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-workstation-textMuted">Front Ride Height:</span>
              <span className="font-mono text-workstation-textBright">
                {baseline_setup.ride_height_front?.toFixed(1)}mm → {scenario_setup.ride_height_front?.toFixed(1)}mm
              </span>
            </div>
          </div>
        </div>

        {/* Column 2: Aerodynamic Consequence */}
        <div className="bg-workstation-surface border border-workstation-borderSubtle rounded p-2.5 space-y-1.5">
          <div className="text-3xs text-workstation-textMuted uppercase font-semibold flex items-center justify-between">
            <span>AERODYNAMIC SURROGATE</span>
            <span className="text-4xs text-amber-400">GBR-1.0</span>
          </div>
          <div className="divide-y divide-workstation-borderSubtle text-3xs space-y-1">
            <div className="flex justify-between items-center pt-1">
              <span className="text-workstation-textMuted">Downforce:</span>
              <span className="font-mono text-workstation-textBright">
                {downforce_n.toFixed(0)} N (
                <strong className={delta_downforce_n >= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                  {delta_downforce_n >= 0 ? '+' : ''}{delta_downforce_n.toFixed(0)} N
                </strong>)
              </span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-workstation-textMuted">Drag:</span>
              <span className="font-mono text-workstation-textBright">
                {drag_n.toFixed(0)} N (
                <strong className={delta_drag_n >= 0 ? 'text-amber-400' : 'text-emerald-400'}>
                  {delta_drag_n >= 0 ? '+' : ''}{delta_drag_n.toFixed(0)} N
                </strong>)
              </span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-workstation-textMuted">Efficiency (L/D):</span>
              <span className="font-mono text-workstation-accentCyan font-bold">
                {lift_to_drag.toFixed(3)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-workstation-textMuted">Aero Balance:</span>
              <span className="font-mono text-workstation-textSecondary">
                {aero_balance_pct.toFixed(2)}% Front
              </span>
            </div>
          </div>
        </div>

        {/* Column 3: Kinematic Lap Decomposition */}
        <div className="bg-workstation-surface border border-workstation-borderSubtle rounded p-2.5 space-y-1.5">
          <div className="text-3xs text-workstation-textMuted uppercase font-semibold flex items-center justify-between">
            <span>KINEMATICS DECOMPOSITION</span>
            <span className="text-4xs text-workstation-textSecondary">Monza Quasi-Steady</span>
          </div>
          <div className="divide-y divide-workstation-borderSubtle text-3xs space-y-1">
            <div className="flex justify-between items-center pt-1">
              <span className="text-workstation-textMuted">Cornering Time Delta:</span>
              <span className={`font-mono font-semibold ${delta_corner_time_s < 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {delta_corner_time_s >= 0 ? '+' : ''}{delta_corner_time_s.toFixed(3)}s
              </span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-workstation-textMuted">Straight Time Delta:</span>
              <span className={`font-mono font-semibold ${delta_straight_time_s <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {delta_straight_time_s >= 0 ? '+' : ''}{delta_straight_time_s.toFixed(3)}s
              </span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-workstation-textMuted">Net Lap Consequence:</span>
              <span className={`font-mono font-bold text-xs ${delta_lap_time_s < 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {delta_lap_time_s >= 0 ? '+' : ''}{delta_lap_time_s.toFixed(3)}s
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Uncertainty Bounds Display */}
      <div className="border-t border-workstation-borderSubtle pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-3xs">
        <div className="p-2 rounded bg-workstation-surface flex items-center justify-between">
          <span className="text-workstation-textMuted">95% Confidence Interval (Mean Lap Delta):</span>
          <span className="font-mono text-workstation-textBright font-bold">
            [{confidence_interval_95[0] >= 0 ? '+' : ''}{confidence_interval_95[0].toFixed(3)}s, {confidence_interval_95[1] >= 0 ? '+' : ''}{confidence_interval_95[1].toFixed(3)}s]
          </span>
        </div>

        <div className="p-2 rounded bg-workstation-surface flex items-center justify-between">
          <span className="text-workstation-textMuted">95% Prediction Interval (Single Next Lap):</span>
          <span className="font-mono text-amber-400 font-bold">
            [{prediction_interval_95[0] >= 0 ? '+' : ''}{prediction_interval_95[0].toFixed(3)}s, {prediction_interval_95[1] >= 0 ? '+' : ''}{prediction_interval_95[1].toFixed(3)}s]
          </span>
        </div>
      </div>
    </div>
  );
};
