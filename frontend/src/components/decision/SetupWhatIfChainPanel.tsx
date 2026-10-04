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
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-4 font-mono text-2xs text-[#FFFFFF] flex items-center justify-center space-x-2 h-64 shadow-md">
        <Cpu className="w-4 h-4 animate-spin text-[#FFFFFF]" />
        <span className="font-bold uppercase">[ PROPAGATING PARAMETER SCENARIO THROUGH SURROGATE & VEHICLE KINEMATICS... ]</span>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-4 font-mono text-2xs text-[#94A3B8] font-bold flex items-center justify-center h-64 shadow-md">
        <span>[ NO SETUP SCENARIO DATA EVALUATED ]</span>
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
    <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-0 shadow-md font-mono">
      {/* Header & Lap-Time Consequence Summary */}
      <div className="window-header-retro bg-[#070E22] border-b border-[#1E3A8A] px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[#FFFFFF] font-extrabold">
        <div className="flex items-center space-x-2">
          <Sliders className="w-3.5 h-3.5 text-[#FFFFFF] stroke-[2.5]" />
          <span className="font-extrabold text-[#FFFFFF] uppercase tracking-wider text-2xs">
            [ SETUP WHAT-IF CHAIN (AERO → KINEMATICS → LAP TIME) ]
          </span>
        </div>

        <div className="flex items-center space-x-3 text-3xs">
          <div>
            <span className="text-[#94A3B8] font-bold">MODELLED LAP TIME DELTA: </span>
            <strong className={`text-xs font-black ${delta_lap_time_s < 0 ? 'text-[#00E676]' : 'text-[#FFB000]'}`}>
              {delta_lap_time_s >= 0 ? '+' : ''}{delta_lap_time_s.toFixed(3)}s
            </strong>
          </div>
          <span className="text-3xs px-2 py-0.5 bg-[#FFB000] border border-[#1E3A8A] text-[#FFFFFF] font-extrabold shadow-sm">
            MODELLED ✕
          </span>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Extrapolation Warning Alert */}
        {extrapolation_warning && (
          <div className="p-2 bg-[#FFB000]/15 border border-[#1E3A8A] text-[#FBBF24] text-3xs flex items-center space-x-2 font-bold shadow">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-[#FBBF24]" />
            <div>
              <strong className="uppercase">EXTRAPOLATION NOTICE: </strong>
              <span>{extrapolation_warning}</span>
            </div>
          </div>
        )}

        {/* Core Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Column 1: Setup Changes */}
          <div className="bg-[#070E22] border border-[#1E3A8A] p-2.5 space-y-1.5 shadow">
            <div className="text-3xs text-[#FFFFFF] uppercase font-black flex items-center justify-between border-b border-[#1E3A8A] pb-1">
              <span>PARAMETER DELTAS</span>
              <span className="text-4xs text-[#94A3B8]">Baseline → Scenario</span>
            </div>
            <div className="divide-y divide-black/20 text-3xs space-y-1">
              <div className="flex justify-between items-center pt-1">
                <span className="text-[#94A3B8] font-bold">Rear Wing:</span>
                <span className="font-mono text-[#FFFFFF] font-bold">
                  {baseline_setup.rear_wing_angle?.toFixed(1)}° → {scenario_setup.rear_wing_angle?.toFixed(1)}° (
                  <strong className={delta_parameters.rear_wing_angle >= 0 ? 'text-[#00E676]' : 'text-[#FFB000]'}>
                    {delta_parameters.rear_wing_angle >= 0 ? '+' : ''}{delta_parameters.rear_wing_angle?.toFixed(1)}°
                  </strong>)
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-[#94A3B8] font-bold">Front Wing:</span>
                <span className="font-mono text-[#FFFFFF] font-bold">
                  {baseline_setup.front_wing_angle?.toFixed(1)}° → {scenario_setup.front_wing_angle?.toFixed(1)}° (
                  <strong className={delta_parameters.front_wing_angle >= 0 ? 'text-[#00E676]' : 'text-[#FFB000]'}>
                    {delta_parameters.front_wing_angle >= 0 ? '+' : ''}{delta_parameters.front_wing_angle?.toFixed(1)}°
                  </strong>)
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-[#94A3B8] font-bold">Front Ride Height:</span>
                <span className="font-mono text-[#FFFFFF] font-bold">
                  {baseline_setup.ride_height_front?.toFixed(1)}mm → {scenario_setup.ride_height_front?.toFixed(1)}mm
                </span>
              </div>
            </div>
          </div>

          {/* Column 2: Aerodynamic Consequence */}
          <div className="bg-[#070E22] border border-[#1E3A8A] p-2.5 space-y-1.5 shadow">
            <div className="text-3xs text-[#FFFFFF] uppercase font-black flex items-center justify-between border-b border-[#1E3A8A] pb-1">
              <span>AERODYNAMIC SURROGATE</span>
              <span className="text-4xs bg-[#00F0FF] px-1 py-0.2 border border-[#1E3A8A] font-bold text-[#FFFFFF]">GBR-1.0</span>
            </div>
            <div className="divide-y divide-black/20 text-3xs space-y-1">
              <div className="flex justify-between items-center pt-1">
                <span className="text-[#94A3B8] font-bold">Downforce:</span>
                <span className="font-mono text-[#FFFFFF] font-bold">
                  {downforce_n.toFixed(0)} N (
                  <strong className={delta_downforce_n >= 0 ? 'text-[#00E676]' : 'text-[#FFB000]'}>
                    {delta_downforce_n >= 0 ? '+' : ''}{delta_downforce_n.toFixed(0)} N
                  </strong>)
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-[#94A3B8] font-bold">Drag:</span>
                <span className="font-mono text-[#FFFFFF] font-bold">
                  {drag_n.toFixed(0)} N (
                  <strong className={delta_drag_n >= 0 ? 'text-[#FFB000]' : 'text-[#00E676]'}>
                    {delta_drag_n >= 0 ? '+' : ''}{delta_drag_n.toFixed(0)} N
                  </strong>)
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-[#94A3B8] font-bold">Efficiency (L/D):</span>
                <span className="font-mono text-[#FFFFFF] font-black">
                  {lift_to_drag.toFixed(3)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-[#94A3B8] font-bold">Aero Balance:</span>
                <span className="font-mono text-[#FFFFFF] font-bold">
                  {aero_balance_pct.toFixed(2)}% Front
                </span>
              </div>
            </div>
          </div>

          {/* Column 3: Kinematic Lap Decomposition */}
          <div className="bg-[#070E22] border border-[#1E3A8A] p-2.5 space-y-1.5 shadow">
            <div className="text-3xs text-[#FFFFFF] uppercase font-black flex items-center justify-between border-b border-[#1E3A8A] pb-1">
              <span>KINEMATICS DECOMPOSITION</span>
              <span className="text-4xs text-[#94A3B8] font-bold">Monza Quasi-Steady</span>
            </div>
            <div className="divide-y divide-black/20 text-3xs space-y-1">
              <div className="flex justify-between items-center pt-1">
                <span className="text-[#94A3B8] font-bold">Cornering Time Delta:</span>
                <span className={`font-mono font-black ${delta_corner_time_s < 0 ? 'text-[#00E676]' : 'text-[#FFB000]'}`}>
                  {delta_corner_time_s >= 0 ? '+' : ''}{delta_corner_time_s.toFixed(3)}s
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-[#94A3B8] font-bold">Straight Time Delta:</span>
                <span className={`font-mono font-black ${delta_straight_time_s <= 0 ? 'text-[#00E676]' : 'text-[#FFB000]'}`}>
                  {delta_straight_time_s >= 0 ? '+' : ''}{delta_straight_time_s.toFixed(3)}s
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-[#94A3B8] font-bold">Net Lap Consequence:</span>
                <span className={`font-mono font-black text-xs ${delta_lap_time_s < 0 ? 'text-[#00E676]' : 'text-[#FFB000]'}`}>
                  {delta_lap_time_s >= 0 ? '+' : ''}{delta_lap_time_s.toFixed(3)}s
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Uncertainty Bounds Display */}
        <div className="border-t border-[#1E3A8A] pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-3xs">
          <div className="p-2 bg-[#070E22] border border-[#1E3A8A] flex items-center justify-between shadow">
            <span className="text-[#94A3B8] font-bold">95% Confidence Interval (Mean Lap Delta):</span>
            <span className="font-mono text-[#FFFFFF] font-black">
              [{confidence_interval_95[0] >= 0 ? '+' : ''}{confidence_interval_95[0].toFixed(3)}s, {confidence_interval_95[1] >= 0 ? '+' : ''}{confidence_interval_95[1].toFixed(3)}s]
            </span>
          </div>

          <div className="p-2 bg-[#070E22] border border-[#1E3A8A] flex items-center justify-between shadow">
            <span className="text-[#94A3B8] font-bold">95% Prediction Interval (Single Next Lap):</span>
            <span className="font-mono text-[#FFB000] font-black">
              [{prediction_interval_95[0] >= 0 ? '+' : ''}{prediction_interval_95[0].toFixed(3)}s, {prediction_interval_95[1] >= 0 ? '+' : ''}{prediction_interval_95[1].toFixed(3)}s]
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
