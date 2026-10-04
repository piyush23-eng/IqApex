import React, { useState, useMemo } from 'react';
import {
  Gauge,
  Sliders,
  ChevronRight,
  Filter,
  Flame,
  ArrowUpRight,
} from 'lucide-react';

export interface CornerKinematicData {
  id: string;
  name: string;
  officialNumber: string;
  type: 'Heavy Braking' | 'Medium Speed' | 'High Speed / Aero' | 'Traction Exit';
  distanceSpan: string;
  apexDistance: number;
  refApexSpeed: number; // HAM #44 km/h
  compApexSpeed: number; // LEC #16 km/h
  apexSpeedDelta: number; // km/h
  entryBrakingG: number; // Peak longitudinal G
  brakePointDeltaMeters: number; // later (-) or earlier (+)
  throttlePickupDistance: string;
  timeDelta: number; // seconds
  cumulativeDelta: number; // seconds
  dominantSetupParam: string;
  setupInfluence: string;
  gear: number;
  lateralG: number;
}

export const MONZA_CORNER_SPECTRUM: CornerKinematicData[] = [
  {
    id: 'T1-T2',
    name: 'Variante del Rettifilo',
    officialNumber: 'T1 - T2',
    type: 'Heavy Braking',
    distanceSpan: '320m → 740m',
    apexDistance: 560,
    refApexSpeed: 78.4,
    compApexSpeed: 74.2,
    apexSpeedDelta: +4.2,
    entryBrakingG: -4.72,
    brakePointDeltaMeters: -6.0,
    throttlePickupDistance: '12m earlier',
    timeDelta: -0.142,
    cumulativeDelta: -0.142,
    dominantSetupParam: 'Front Anti-Roll Bar & Brake Migration',
    setupInfluence: 'Softer front roll bar allows higher kerb compliance over chicane',
    gear: 1,
    lateralG: 2.4,
  },
  {
    id: 'T3',
    name: 'Curva Grande (Biassono)',
    officialNumber: 'T3',
    type: 'High Speed / Aero',
    distanceSpan: '1150m → 1780m',
    apexDistance: 1420,
    refApexSpeed: 304.5,
    compApexSpeed: 301.8,
    apexSpeedDelta: +2.7,
    entryBrakingG: 0.0,
    brakePointDeltaMeters: 0.0,
    throttlePickupDistance: '100% Flat',
    timeDelta: -0.048,
    cumulativeDelta: -0.190,
    dominantSetupParam: 'Aerodynamic Drag (CdA) & Ride Height',
    setupInfluence: 'Low-drag rear wing trim increases speed trap velocity by +2.7 km/h',
    gear: 8,
    lateralG: 3.8,
  },
  {
    id: 'T4-T5',
    name: 'Variante della Roggia',
    officialNumber: 'T4 - T5',
    type: 'Heavy Braking',
    distanceSpan: '2100m → 2480m',
    apexDistance: 2280,
    refApexSpeed: 118.6,
    compApexSpeed: 115.0,
    apexSpeedDelta: +3.6,
    entryBrakingG: -4.45,
    brakePointDeltaMeters: -4.5,
    throttlePickupDistance: '8m earlier',
    timeDelta: -0.086,
    cumulativeDelta: -0.276,
    dominantSetupParam: 'Brake Bias & Low-Speed Bump Damping',
    setupInfluence: 'Forward brake bias (55.5%) prevents rear lockup into compression',
    gear: 2,
    lateralG: 2.8,
  },
  {
    id: 'T6',
    name: 'Curve di Lesmo 1',
    officialNumber: 'T6',
    type: 'Medium Speed',
    distanceSpan: '2720m → 2980m',
    apexDistance: 2850,
    refApexSpeed: 178.2,
    compApexSpeed: 176.0,
    apexSpeedDelta: +2.2,
    entryBrakingG: -2.85,
    brakePointDeltaMeters: -3.0,
    throttlePickupDistance: '5m earlier',
    timeDelta: -0.038,
    cumulativeDelta: -0.314,
    dominantSetupParam: 'Front Camber & Mechanical Turn-in',
    setupInfluence: '-3.6° front camber stabilizes tyre contact patch under 3.2G lateral',
    gear: 4,
    lateralG: 3.2,
  },
  {
    id: 'T7',
    name: 'Curve di Lesmo 2',
    officialNumber: 'T7',
    type: 'Traction Exit',
    distanceSpan: '3150m → 3420m',
    apexDistance: 3280,
    refApexSpeed: 164.5,
    compApexSpeed: 161.8,
    apexSpeedDelta: +2.7,
    entryBrakingG: -2.60,
    brakePointDeltaMeters: -2.0,
    throttlePickupDistance: '14m earlier',
    timeDelta: -0.062,
    cumulativeDelta: -0.376,
    dominantSetupParam: 'Rear Differential Preload & Throttle Map',
    setupInfluence: 'Progressive differential locking provides clean traction onto Serraglio',
    gear: 4,
    lateralG: 2.9,
  },
  {
    id: 'T8-T10',
    name: 'Variante Ascari',
    officialNumber: 'T8 - T10',
    type: 'High Speed / Aero',
    distanceSpan: '4280m → 4760m',
    apexDistance: 4520,
    refApexSpeed: 216.4,
    compApexSpeed: 212.0,
    apexSpeedDelta: +4.4,
    entryBrakingG: -3.65,
    brakePointDeltaMeters: -5.5,
    throttlePickupDistance: 'Full commitment',
    timeDelta: -0.118,
    cumulativeDelta: -0.494,
    dominantSetupParam: 'Roll Stiffness Distribution & Aerodynamic CoP',
    setupInfluence: '43.2% aerodynamic front balance gives sharp direction change T8→T9',
    gear: 5,
    lateralG: 3.6,
  },
  {
    id: 'T11',
    name: 'Curva Parabolica (Alboreto)',
    officialNumber: 'T11',
    type: 'High Speed / Aero',
    distanceSpan: '5350m → 5793m',
    apexDistance: 5540,
    refApexSpeed: 218.8,
    compApexSpeed: 215.0,
    apexSpeedDelta: +3.8,
    entryBrakingG: -2.40,
    brakePointDeltaMeters: -4.0,
    throttlePickupDistance: '18m earlier',
    timeDelta: -0.082,
    cumulativeDelta: -0.576,
    dominantSetupParam: 'Aerodynamic Efficiency (L/D) & Rear Wing Trim',
    setupInfluence: 'High aerodynamic stability on entry allows trailing throttle through long arc',
    gear: 6,
    lateralG: 3.5,
  },
];

export interface SpeedTrapData {
  location: string;
  distance: string;
  refSpeed: number; // HAM #44
  compSpeed: number; // LEC #16
  delta: number;
}

export const MONZA_SPEED_TRAPS: SpeedTrapData[] = [
  {
    location: 'Prima Variante Speed Trap',
    distance: 's = 480m',
    refSpeed: 352.4,
    compSpeed: 348.2,
    delta: +4.2,
  },
  {
    location: 'Roggia Approach Speed Trap',
    distance: 's = 2120m',
    refSpeed: 336.8,
    compSpeed: 334.1,
    delta: +2.7,
  },
  {
    location: 'Ascari Approach Speed Trap',
    distance: 's = 4220m',
    refSpeed: 342.1,
    compSpeed: 339.5,
    delta: +2.6,
  },
  {
    location: 'Finish Line Speed Trap',
    distance: 's = 5790m',
    refSpeed: 356.2,
    compSpeed: 352.0,
    delta: +4.2,
  },
];

interface CornerKinematicsSpectrumProps {
  selectedCornerId?: string | null;
  onSelectCorner?: (cornerId: string) => void;
  className?: string;
}

export const CornerKinematicsSpectrum: React.FC<CornerKinematicsSpectrumProps> = ({
  selectedCornerId,
  onSelectCorner,
  className = '',
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [activeCornerId, setActiveCornerId] = useState<string>(selectedCornerId || 'T1-T2');

  React.useEffect(() => {
    if (selectedCornerId) {
      setActiveCornerId(selectedCornerId);
    }
  }, [selectedCornerId]);

  const filteredCorners = useMemo(() => {
    if (filterType === 'ALL') return MONZA_CORNER_SPECTRUM;
    return MONZA_CORNER_SPECTRUM.filter((c) => c.type === filterType);
  }, [filterType]);

  const activeCorner = useMemo(() => {
    return (
      MONZA_CORNER_SPECTRUM.find((c) => c.id === activeCornerId) ||
      MONZA_CORNER_SPECTRUM[0]
    );
  }, [activeCornerId]);

  const handleCornerClick = (id: string) => {
    setActiveCornerId(id);
    if (onSelectCorner) {
      onSelectCorner(id);
    }
  };

  return (
    <div className={`matrix-hud-card bg-[#0A132E] border border-[#1E3A8A] p-4 flex flex-col justify-between scanline-container space-y-4 shadow-xl ${className}`}>
      {/* Animated Matrix Scanning Beam */}
      <div className="scan-beam" />

      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#1E3A8A] pb-3 gap-2 relative z-10">
        <div className="flex items-center space-x-2.5">
          <span className="w-2.5 h-2.5 bg-[#00F0FF] rounded-full animate-ping shadow-[0_0_10px_#00F0FF]" />
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-black font-mono tracking-widest text-[#FFFFFF] uppercase flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-[#0062FF]" />
                CORNER KINEMATICS &amp; VELOCITY SPECTRUM // MONZA 5.793 KM
              </h3>
              <span className="text-4xs px-2 py-0.5 bg-[#0062FF] text-[#FFFFFF] font-mono font-black border border-[#00F0FF] shadow-matrix-glow rounded-sm">
                SPATIAL 1.0M ALIGNED
              </span>
            </div>
            <span className="text-3xs text-[#93C5FD] font-mono">
              [AUTODROMO NAZIONALE MONZA] • 11 TURNS • 4 SPEED TRAPS • DUAL TELEMETRY KINEMATICS
            </span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center space-x-1 font-mono text-3xs">
          <Filter className="w-3.5 h-3.5 text-[#93C5FD] mr-1" />
          {['ALL', 'Heavy Braking', 'Medium Speed', 'High Speed / Aero'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2 py-0.5 text-3xs font-extrabold uppercase border transition-all ${
                filterType === type
                  ? 'bg-[#0062FF] text-[#FFFFFF] border-[#00F0FF] shadow-matrix-glow'
                  : 'bg-[#070E22] text-[#93C5FD] border-[#1E3A8A] hover:bg-[#0E1A3D]'
              }`}
            >
              [ {type} ]
            </button>
          ))}
        </div>
      </div>

      {/* Main 2-Column Diagnostic Body */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 relative z-10">
        {/* Left Column: Turn Spectrum Cards List (Col 7) */}
        <div className="xl:col-span-7 space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {filteredCorners.map((corner) => {
            const isSelected = corner.id === activeCornerId;
            return (
              <div
                key={corner.id}
                onClick={() => handleCornerClick(corner.id)}
                className={`p-2.5 rounded-sm border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#0E1A3D] border-[#0062FF] border-l-4 border-l-[#00F0FF] shadow-matrix-glow'
                    : 'bg-[#070E22] border-[#1E3A8A]/60 hover:bg-[#0A132E] hover:border-[#1E3A8A]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-1.5 py-0.5 bg-[#0062FF]/30 text-[#00F0FF] border border-[#0062FF] font-black text-2xs font-mono">
                      {corner.officialNumber}
                    </span>
                    <span className="font-extrabold text-[#FFFFFF] text-2xs font-mono">{corner.name}</span>
                    <span className="text-4xs px-1.5 py-0.2 bg-[#0A132E] border border-[#1E3A8A] text-[#93C5FD]">
                      {corner.type}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-2xs font-mono">
                    <span className="text-[#00E676] font-black flex items-center">
                      <ArrowUpRight className="w-3 h-3 mr-0.5" />
                      +{corner.apexSpeedDelta.toFixed(1)} km/h
                    </span>
                    <span className="text-[#00E676] font-black bg-[#00E676]/10 px-1.5 py-0.2 border border-[#00E676]/40">
                      {corner.timeDelta.toFixed(3)}s
                    </span>
                    <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-[#00F0FF]' : 'text-[#475569]'}`} />
                  </div>
                </div>

                {/* Sub-Metrics Row */}
                <div className="grid grid-cols-4 gap-2 mt-2 pt-2 border-t border-[#142555] text-4xs font-mono">
                  <div>
                    <span className="text-[#64748B] block">APEX V_MIN</span>
                    <span className="text-[#0062FF] font-black">{corner.refApexSpeed.toFixed(0)}</span> vs{' '}
                    <span className="text-[#FFFFFF] font-bold">{corner.compApexSpeed.toFixed(0)} km/h</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block">BRAKE POINT</span>
                    <span className="text-[#00E676] font-bold">{corner.brakePointDeltaMeters}m later</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block">PEAK DECEL</span>
                    <span className="text-[#FFFFFF] font-black">{corner.entryBrakingG}G</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block">THROTTLE PICKUP</span>
                    <span className="text-[#93C5FD] font-semibold">{corner.throttlePickupDistance}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Detailed Corner Deep-Dive Inspector (Col 5) */}
        <div className="xl:col-span-5 flex flex-col justify-between space-y-3 bg-[#070E22] p-3 rounded-sm border border-[#1E3A8A]">
          <div>
            <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-2">
              <div>
                <span className="text-4xs text-[#00F0FF] uppercase font-black tracking-widest block font-mono">
                  + SELECTED CORNER INSPECTOR
                </span>
                <h4 className="text-sm font-black text-[#FFFFFF] uppercase font-mono mt-0.5">
                  {activeCorner.officialNumber}: {activeCorner.name}
                </h4>
              </div>
              <span className="px-2 py-0.5 text-3xs font-black bg-[#0062FF] text-[#FFFFFF] border border-[#00F0FF] shadow-matrix-glow font-mono">
                {activeCorner.type}
              </span>
            </div>

            {/* Apex Velocity Comparison Box */}
            <div className="grid grid-cols-2 gap-2 my-2.5 text-2xs font-mono">
              <div className="bg-[#0A132E] p-2 rounded border border-[#0062FF]">
                <span className="text-4xs text-[#93C5FD] font-black block uppercase">
                  HAMILTON #44 (REF)
                </span>
                <span className="text-base font-black text-[#0062FF]">
                  {activeCorner.refApexSpeed.toFixed(1)}{' '}
                  <span className="text-3xs font-normal text-[#93C5FD]">km/h</span>
                </span>
                <span className="text-4xs text-[#64748B] block mt-0.5">Gear {activeCorner.gear} • {activeCorner.lateralG}G Lat</span>
              </div>

              <div className="bg-[#0A132E] p-2 rounded border border-[#FFFFFF]">
                <span className="text-4xs text-[#93C5FD] font-black block uppercase">
                  LECLERC #16 (COMP)
                </span>
                <span className="text-base font-black text-[#FFFFFF]">
                  {activeCorner.compApexSpeed.toFixed(1)}{' '}
                  <span className="text-3xs font-normal text-[#93C5FD]">km/h</span>
                </span>
                <span className="text-4xs text-[#00E676] font-black block mt-0.5">
                  +{activeCorner.apexSpeedDelta.toFixed(1)} km/h Delta
                </span>
              </div>
            </div>

            {/* Governing Engineering Parameter Recommendation */}
            <div className="bg-[#0A132E] p-2.5 rounded border border-[#1E3A8A] space-y-1 text-3xs font-mono">
              <div className="flex items-center space-x-1.5 text-[#00F0FF] font-black">
                <Sliders className="w-3 h-3 text-[#00F0FF]" />
                <span className="uppercase">[ GOVERNING VEHICLE SETUP PARAMETER ]</span>
              </div>
              <div className="text-[#FFFFFF] font-extrabold text-2xs">
                {activeCorner.dominantSetupParam}
              </div>
              <p className="text-[#93C5FD] text-3xs leading-relaxed font-sans font-medium">
                {activeCorner.setupInfluence}
              </p>
            </div>
          </div>

          {/* Micro-Sector Kinematic Progress */}
          <div className="pt-2 border-t border-[#142555] space-y-1.5 text-3xs font-mono">
            <div className="flex justify-between items-center text-4xs text-[#94A3B8] font-bold">
              <span>DISTANCE RANGE</span>
              <span className="text-[#FFFFFF] font-black">{activeCorner.distanceSpan}</span>
            </div>
            <div className="flex justify-between items-center text-4xs text-[#94A3B8] font-bold">
              <span>CUMULATIVE LAP ADVANTAGE</span>
              <span className="text-[#00E676] font-black">{activeCorner.cumulativeDelta.toFixed(3)}s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Speed Trap Terminal Velocity Strip */}
      <div className="pt-3 border-t border-[#1E3A8A] relative z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-4xs text-[#93C5FD] font-mono font-black uppercase tracking-widest flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-[#00F0FF]" />
            RADAR SPEED TRAPS // TERMINAL VELOCITY TELEMETRY
          </span>
          <span className="text-4xs font-mono text-[#64748B]">RESAMPLED @ 1.0M SPATIAL STEP</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 font-mono text-3xs">
          {MONZA_SPEED_TRAPS.map((trap) => (
            <div
              key={trap.location}
              className="bg-[#070E22] p-2 border border-[#1E3A8A] rounded-sm flex flex-col justify-between shadow-sm"
            >
              <div>
                <span className="text-4xs text-[#93C5FD] font-bold block truncate">{trap.location}</span>
                <span className="text-4xs text-[#64748B] block">{trap.distance}</span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xs font-black text-[#FFFFFF]">
                  {trap.refSpeed.toFixed(1)}{' '}
                  <span className="text-4xs font-normal text-[#93C5FD]">km/h</span>
                </span>
                <span className="text-4xs font-black text-[#00E676] flex items-center">
                  +{trap.delta.toFixed(1)} km/h
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
