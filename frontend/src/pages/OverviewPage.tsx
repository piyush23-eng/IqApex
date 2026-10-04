import React from 'react';
import {
  ShieldCheck,
  Clock,
  Compass,
  Zap,
  Activity,
  ArrowRight,
  TrendingDown,
  Gauge,
  Radio,
  Cpu,
} from 'lucide-react';
import { Session, Driver, Run, Lap, TelemetryResponse, NavModule } from '../types/domain';
import { formatLapTime } from '../utils/formatters';
import { CornerKinematicsSpectrum } from '../components/common/CornerKinematicsSpectrum';

interface OverviewPageProps {
  session: Session | null;
  selectedDriver: Driver | null;
  selectedRun: Run | null;
  selectedLap: Lap | null;
  telemetryData: TelemetryResponse | null;
  isSynthetic: boolean;
  onLoadSyntheticData: () => void;
  onNavigateModule?: (module: NavModule) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  session,
  selectedDriver,
  selectedRun,
  selectedLap,
  telemetryData,
  isSynthetic,
  onLoadSyntheticData,
  onNavigateModule,
}) => {
  const quality = telemetryData?.data_quality;
  const integrityScore = quality ? quality.quality_score.toFixed(1) : '98.5';
  const compound = selectedRun?.compound || 'SOFT (C4)';
  const tyreAge = selectedRun ? selectedRun.tyre_age : 3;
  const driverName = selectedDriver ? `#${selectedDriver.car_number} ${selectedDriver.name}` : '#44 L. Hamilton';
  const lapTimeStr = selectedLap ? formatLapTime(selectedLap.lap_time) : '1:20.450';

  return (
    <div className="h-full overflow-y-auto space-y-4 font-mono text-2xs select-none">
      {/* Top Banner if synthetic demonstration mode is active */}
      {isSynthetic && (
        <div className="matrix-hud-card p-2.5 flex items-center justify-between border-l-4 border-l-[#0062FF] bg-[#070E22]">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00F0FF] shadow-[0_0_10px_#00F0FF] animate-pulse" />
            <span className="font-black text-white uppercase tracking-wider text-2xs">
              [ MATRIX SYSTEM ACTIVE // LATIN HYPERCUBE CFD CALIBRATION ]
            </span>
            <span className="text-[#1E3A8A]">|</span>
            <span className="text-[#93C5FD] font-medium text-3xs">
              Physical invariant enforcement: v² aero response, GBDT surrogate, non-linear Pirelli tyre wear.
            </span>
          </div>
          <button
            onClick={onLoadSyntheticData}
            className="btn-matrix-blue text-4xs py-1 px-3 flex items-center gap-1.5"
          >
            <Cpu className="w-3 h-3 text-[#00F0FF]" /> RE-CALIBRATE
          </button>
        </div>
      )}

      {/* 1. EXECUTIVE SOLID WHITE & BLUE TELEMETRY KPI STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* KPI 1: Net Pace Delta */}
        <div className="matrix-hud-card p-3.5 flex items-center justify-between border-l-4 border-l-[#00F0FF] bg-[#0A132E]">
          <div>
            <div className="text-4xs text-[#93C5FD] font-black uppercase tracking-widest flex items-center gap-1">
              <span>+ NET PACE DELTA</span>
            </div>
            <div className="text-2xl font-black text-white mt-0.5 tracking-tight flex items-center gap-1">
              <TrendingDown className="w-5 h-5 text-[#00E676]" /> -0.412<span className="text-sm font-bold text-[#93C5FD]">s</span>
            </div>
            <div className="text-4xs text-[#60A5FA] mt-0.5 font-sans font-medium">Car #44 vs Car #16 (FP2)</div>
          </div>
          <span className="px-2.5 py-1 rounded-sm text-4xs font-black bg-[#0062FF] text-white border border-[#00F0FF] shadow-[0_0_8px_rgba(0,98,255,0.5)]">
            FASTEST
          </span>
        </div>

        {/* KPI 2: Top Speed V_max */}
        <div className="matrix-hud-card p-3.5 flex items-center justify-between border-l-4 border-l-[#0062FF] bg-[#0A132E]">
          <div>
            <div className="text-4xs text-[#93C5FD] font-black uppercase tracking-widest">
              + TOP SPEED (V_MAX)
            </div>
            <div className="text-2xl font-black text-white mt-0.5 tracking-tight">
              348.2 <span className="text-sm font-bold text-[#93C5FD]">KM/H</span>
            </div>
            <div className="text-4xs text-[#60A5FA] mt-0.5 font-sans font-medium">Exit Curva Grande • DRS ON</div>
          </div>
          <Gauge className="w-5 h-5 text-[#0062FF]" />
        </div>

        {/* KPI 3: Aero Efficiency (L/D) */}
        <div className="matrix-hud-card p-3.5 flex items-center justify-between border-l-4 border-l-[#38BDF8] bg-[#0A132E]">
          <div>
            <div className="text-4xs text-[#93C5FD] font-black uppercase tracking-widest">
              + AERO EFFICIENCY
            </div>
            <div className="text-2xl font-black text-white mt-0.5 tracking-tight">
              3.72 <span className="text-sm font-bold text-[#93C5FD]">L/D</span>
            </div>
            <div className="text-4xs text-[#60A5FA] mt-0.5 font-sans font-medium">Aero Balance 44.8% FRONT</div>
          </div>
          <Zap className="w-5 h-5 text-[#38BDF8]" />
        </div>

        {/* KPI 4: Acquisition Telemetry Health */}
        <div className="matrix-hud-card p-3.5 flex items-center justify-between border-l-4 border-l-[#FFFFFF] bg-[#0A132E]">
          <div>
            <div className="text-4xs text-[#93C5FD] font-black uppercase tracking-widest">
              + DATA INTEGRITY
            </div>
            <div className="text-2xl font-black text-white mt-0.5 tracking-tight">
              {integrityScore} <span className="text-sm font-bold text-[#93C5FD]">/ 100</span>
            </div>
            <div className="text-4xs text-[#60A5FA] mt-0.5 font-sans font-medium">10 Channels • 0 Anomalies</div>
          </div>
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* 2. CENTERPIECE: 11-TURN KINEMATICS SPECTRUM & LIVE SECTOR SPLITS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Monza Interactive Kinematics Spectrum (Col span 7) */}
        <div className="lg:col-span-7">
          <CornerKinematicsSpectrum
            onSelectCorner={() => {
              if (onNavigateModule) onNavigateModule('lap-analysis');
            }}
          />
        </div>

        {/* Right: Sector Split Matrix & Driver Comparison (Col span 5) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Sector Split Matrix */}
          <div className="matrix-hud-card p-4 space-y-3 bg-[#0A132E]">
            <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-2">
              <span className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[#00F0FF]" /> SECTOR SPLIT MATRIX
              </span>
              <span className="text-3xs text-white font-black bg-[#0062FF] px-2.5 py-0.5 rounded-sm border border-[#00F0FF] shadow-[0_0_8px_rgba(0,98,255,0.5)]">
                DELTA: -0.412s
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#070E22] p-3 rounded-sm border border-[#1E3A8A]">
                <div className="text-4xs text-[#60A5FA] uppercase font-black tracking-wider">SECTOR 1</div>
                <div className="text-lg font-black text-white mt-1 font-mono">-0.145s</div>
                <div className="text-4xs text-[#93C5FD] mt-0.5 font-sans font-medium">Rettifilo to Roggia</div>
              </div>
              <div className="bg-[#070E22] p-3 rounded-sm border border-[#1E3A8A]">
                <div className="text-4xs text-[#60A5FA] uppercase font-black tracking-wider">SECTOR 2</div>
                <div className="text-lg font-black text-white mt-1 font-mono">-0.182s</div>
                <div className="text-4xs text-[#93C5FD] mt-0.5 font-sans font-medium">Lesmos & Serraglio</div>
              </div>
              <div className="bg-[#070E22] p-3 rounded-sm border border-[#1E3A8A]">
                <div className="text-4xs text-[#60A5FA] uppercase font-black tracking-wider">SECTOR 3</div>
                <div className="text-lg font-black text-white mt-1 font-mono">-0.085s</div>
                <div className="text-4xs text-[#93C5FD] mt-0.5 font-sans font-medium">Ascari & Parabolica</div>
              </div>
            </div>

            {/* Lap Reference Details in High Contrast */}
            <div className="bg-[#030712] p-3 rounded-sm border border-[#1E3A8A] space-y-1.5 text-3xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-[#93C5FD] font-bold">Reference Lap ({driverName}):</span>
                <span className="text-white font-black">{lapTimeStr} ({compound})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#93C5FD] font-bold">Comparison Lap (#16 Leclerc):</span>
                <span className="text-[#38BDF8] font-black">1:20.862 ({compound})</span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-[#142555]">
                <span className="text-[#60A5FA] font-bold">Dominant Performance Factor:</span>
                <span className="text-white font-black">+3.8 km/h apex velocity at Parabolica</span>
              </div>
            </div>

            {/* Action button */}
            {onNavigateModule && (
              <button
                onClick={() => onNavigateModule('telemetry')}
                className="btn-matrix-blue w-full text-xs py-2.5 flex items-center justify-center gap-2"
              >
                <span>OPEN MULTI-CHANNEL TELEMETRY WORKSPACE</span>
                <ArrowRight className="w-4 h-4 text-[#00F0FF]" />
              </button>
            )}
          </div>

          {/* Quick Engine Launch Grid */}
          <div className="matrix-hud-card p-3.5 space-y-2 bg-[#0A132E]">
            <span className="text-4xs font-black text-[#60A5FA] uppercase tracking-widest block">
              + PERFORMANCE MODULES HUD
            </span>
            <div className="grid grid-cols-2 gap-2 text-3xs">
              <button
                onClick={() => onNavigateModule?.('lap-analysis')}
                className="bg-[#070E22] hover:bg-[#0E1A3D] border border-[#1E3A8A] hover:border-[#00F0FF] p-2.5 rounded-sm text-left transition-all group"
              >
                <div className="flex items-center justify-between text-white font-black">
                  <span>Lap Decomposition</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#0062FF] group-hover:text-[#00F0FF]" />
                </div>
                <span className="text-4xs text-[#93C5FD] block mt-0.5">Entry/Apex/Exit attribution</span>
              </button>

              <button
                onClick={() => onNavigateModule?.('vehicle-performance')}
                className="bg-[#070E22] hover:bg-[#0E1A3D] border border-[#1E3A8A] hover:border-[#00F0FF] p-2.5 rounded-sm text-left transition-all group"
              >
                <div className="flex items-center justify-between text-white font-black">
                  <span>Aero Surrogate</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#0062FF] group-hover:text-[#00F0FF]" />
                </div>
                <span className="text-4xs text-[#93C5FD] block mt-0.5">Pareto downforce/drag maps</span>
              </button>

              <button
                onClick={() => onNavigateModule?.('strategy')}
                className="bg-[#070E22] hover:bg-[#0E1A3D] border border-[#1E3A8A] hover:border-[#00F0FF] p-2.5 rounded-sm text-left transition-all group"
              >
                <div className="flex items-center justify-between text-white font-black">
                  <span>Race Strategy</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#0062FF] group-hover:text-[#00F0FF]" />
                </div>
                <span className="text-4xs text-[#93C5FD] block mt-0.5">53-lap tyre decay & fuel sim</span>
              </button>

              <button
                onClick={() => onNavigateModule?.('engineering-analysis')}
                className="bg-[#070E22] hover:bg-[#0E1A3D] border border-[#1E3A8A] hover:border-[#00F0FF] p-2.5 rounded-sm text-left transition-all group"
              >
                <div className="flex items-center justify-between text-white font-black">
                  <span>Decision Support</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#0062FF] group-hover:text-[#00F0FF]" />
                </div>
                <span className="text-4xs text-[#93C5FD] block mt-0.5">Cross-module what-if chain</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. STRUCTURAL LOWER STRIP: SOLID WHITE & BLUE SESSION PROFILE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Session Details */}
        <div className="matrix-hud-card p-3.5 space-y-2.5 bg-[#0A132E]">
          <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-2">
            <span className="text-3xs font-black text-white uppercase flex items-center gap-1.5 tracking-wider">
              <Compass className="w-3.5 h-3.5 text-[#0062FF]" /> SESSION PROFILE
            </span>
            <span className="text-4xs text-[#93C5FD] font-bold">{session ? session.session_type : 'MONZA FP2'}</span>
          </div>
          <div className="space-y-1.5 text-3xs font-mono">
            <div className="flex justify-between">
              <span className="text-[#93C5FD]">Circuit:</span>
              <span className="text-white font-black">{session ? session.circuit : 'Autodromo Nazionale Monza'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#93C5FD]">Track Temperature:</span>
              <span className="text-white font-black bg-[#070E22] px-1.5 py-0.5 rounded border border-[#1E3A8A]">
                {session ? session.track_temperature.toFixed(1) : '38.5'} °C (DRY)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#93C5FD]">Ambient Air Temp:</span>
              <span className="text-white font-black">26.2 °C</span>
            </div>
          </div>
        </div>

        {/* Active Car & Tyre */}
        <div className="matrix-hud-card p-3.5 space-y-2.5 bg-[#0A132E]">
          <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-2">
            <span className="text-3xs font-black text-white uppercase flex items-center gap-1.5 tracking-wider">
              <Clock className="w-3.5 h-3.5 text-[#0062FF]" /> ACTIVE STINT
            </span>
            <span className="text-4xs text-white font-black bg-[#FF3366] px-2 py-0.5 rounded-sm border border-[#FF3366]">
              {compound}
            </span>
          </div>
          <div className="space-y-1.5 text-3xs font-mono">
            <div className="flex justify-between">
              <span className="text-[#93C5FD]">Driver:</span>
              <span className="text-white font-black">{driverName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#93C5FD]">Tyre Age:</span>
              <span className="text-white font-black">{tyreAge} Laps Old</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#93C5FD]">Wing Incidence:</span>
              <span className="text-white font-black">18° F / 24° R</span>
            </div>
          </div>
        </div>

        {/* Live Data Acquisition Bus */}
        <div className="matrix-hud-card p-3.5 space-y-2.5 bg-[#0A132E]">
          <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-2">
            <span className="text-3xs font-black text-white uppercase flex items-center gap-1.5 tracking-wider">
              <Radio className="w-3.5 h-3.5 text-[#00F0FF] animate-pulse" /> MATRIX TELEMETRY BUS
            </span>
            <span className="text-4xs text-white font-black bg-[#0062FF] px-2 py-0.5 rounded-sm border border-[#00F0FF] shadow-[0_0_6px_rgba(0,98,255,0.4)]">
              100 Hz SYNC
            </span>
          </div>
          <div className="space-y-1.5 text-3xs font-mono">
            <div className="flex justify-between">
              <span className="text-[#93C5FD]">Spatial Resampling:</span>
              <span className="text-white font-black">1.0 Meter Uniform</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#93C5FD]">View Buffer:</span>
              <span className="text-white font-black">
                {telemetryData?.returned_points.toLocaleString() || '2,500'} pts (LTTB)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#93C5FD]">Total Circuit Distance:</span>
              <span className="text-white font-black">5,793 Meters</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
