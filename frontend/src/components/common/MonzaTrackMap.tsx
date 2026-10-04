import React, { useState } from 'react';
import { Crosshair, MapPin, Radio, Activity } from 'lucide-react';

export interface CornerDetail {
  id: string;
  name: string;
  turnNumber: number;
  type: 'CHICANE' | 'MEDIUM_SPEED' | 'HIGH_SPEED' | 'HAIRPIN';
  speedHamilton: number;
  speedLeclerc: number;
  deltaS: number;
  x: number;
  y: number;
}

const MONZA_CORNERS: CornerDetail[] = [
  { id: 'T1', name: 'Variante del Rettifilo (T1-T2)', turnNumber: 1, type: 'CHICANE', speedHamilton: 78.4, speedLeclerc: 76.1, deltaS: -0.048, x: 280, y: 340 },
  { id: 'T3', name: 'Curva Grande (Biassono)', turnNumber: 3, type: 'HIGH_SPEED', speedHamilton: 295.2, speedLeclerc: 293.0, deltaS: -0.012, x: 380, y: 310 },
  { id: 'T4', name: 'Variante della Roggia (T4-T5)', turnNumber: 4, type: 'CHICANE', speedHamilton: 118.6, speedLeclerc: 120.2, deltaS: 0.035, x: 420, y: 220 },
  { id: 'T6', name: 'Curve di Lesmo 1', turnNumber: 6, type: 'MEDIUM_SPEED', speedHamilton: 168.0, speedLeclerc: 165.5, deltaS: -0.032, x: 450, y: 150 },
  { id: 'T7', name: 'Curve di Lesmo 2', turnNumber: 7, type: 'MEDIUM_SPEED', speedHamilton: 178.4, speedLeclerc: 176.2, deltaS: -0.028, x: 410, y: 90 },
  { id: 'T8', name: 'Variante Ascari (T8-T10)', turnNumber: 8, type: 'HIGH_SPEED', speedHamilton: 215.0, speedLeclerc: 212.8, deltaS: -0.042, x: 230, y: 110 },
  { id: 'T11', name: 'Curva Parabolica (Alboreto)', turnNumber: 11, type: 'HIGH_SPEED', speedHamilton: 192.5, speedLeclerc: 195.0, deltaS: 0.024, x: 120, y: 240 },
];

interface MonzaTrackMapProps {
  activeDistanceM?: number;
  selectedCornerId?: string | null;
  onSelectCorner?: (cornerId: string) => void;
  className?: string;
  showDetails?: boolean;
}

export const MonzaTrackMap: React.FC<MonzaTrackMapProps> = ({
  selectedCornerId,
  onSelectCorner,
  className = '',
  showDetails = true,
}) => {
  const [hoveredCorner, setHoveredCorner] = useState<CornerDetail | null>(null);

  const activeCorner = MONZA_CORNERS.find(c => c.id === (selectedCornerId || hoveredCorner?.id)) || null;

  return (
    <div className={`matrix-hud-card p-4 flex flex-col justify-between scanline-container ${className}`}>
      {/* Animated Matrix Scanning Beam */}
      <div className="scan-beam" />

      {/* Header with Blueprint Matrix Branding */}
      <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-2.5 mb-3 relative z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 bg-[#00F0FF] rounded-full shadow-[0_0_10px_#00F0FF] animate-ping" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black font-mono tracking-widest text-white uppercase flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#0062FF]" />
                CIRCUIT MATRIX // AUTODROMO NAZIONALE MONZA
              </h3>
              <span className="text-4xs px-1.5 py-0.2 bg-[#0062FF] text-white font-mono font-black border border-[#00F0FF] rounded-sm">
                RADAR ACTIVE
              </span>
            </div>
            <span className="text-3xs text-[#93C5FD] font-mono">
              [COORD // 45.620°N 09.281°E] • 5.793 KM • 11 TURNS • GPS 100Hz
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-3xs font-mono">
          <span className="flex items-center gap-1 text-white bg-[#0062FF]/30 px-2 py-0.5 border border-[#00F0FF] rounded-sm">
            <Radio className="w-3 h-3 text-[#00F0FF] animate-pulse" /> SCANNING SENSORS
          </span>
        </div>
      </div>

      {/* Interactive Cyber Matrix Circuit Viewport */}
      <div className="relative w-full h-[280px] flex items-center justify-center bg-[#030712] rounded border border-[#1E3A8A] overflow-hidden">
        {/* Animated Radar Sweep Origin in Center */}
        <div className="radar-sweep-beam opacity-40" />

        {/* Technical Coordinate Blueprint Matrix Grid */}
        <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
          <defs>
            <pattern id="matrix-grid-pattern" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#0062FF" strokeWidth="0.75" />
              <circle cx="12" cy="12" r="0.75" fill="#00F0FF" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#matrix-grid-pattern)" />
        </svg>

        {/* Matrix Technical HUD Markings */}
        <div className="absolute top-2 left-2 text-4xs font-mono text-[#60A5FA] select-none pointer-events-none flex flex-col gap-0.5">
          <span>+ TARGET_ACQ: MONZA_IT</span>
          <span>+ GRID_RESOLUTION: 1.0M</span>
          <span>+ SECTORS: S1 | S2 | S3</span>
        </div>

        <div className="absolute top-2 right-2 text-4xs font-mono text-[#60A5FA] select-none pointer-events-none text-right">
          <span>SYS.ELEVATION: 183M</span>
          <span>AZIMUTH: 18.4° NNE</span>
          <span className="text-[#00F0FF] block">+ TRACK_TEMP: 38.5°C</span>
        </div>

        {/* Main Circuit SVG with Glowing Blue/White Ribbon */}
        <svg viewBox="80 50 420 320" className="w-full h-full max-h-[270px] p-2 relative z-20">
          <defs>
            {/* Electric Blue Circuit Glow Filter */}
            <filter id="circuit-laser-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Circuit Outer Solid Shadow Path */}
          <path
            d="M 120 340 L 270 340 C 290 340 300 330 310 320 L 370 290 C 390 280 405 250 415 220 L 435 170 C 445 140 455 120 440 95 C 430 75 400 80 390 95 L 360 135 C 340 160 300 150 260 130 L 220 110 C 190 95 160 120 150 150 L 120 220 C 100 270 100 320 120 340 Z"
            fill="none"
            stroke="#071230"
            strokeWidth="16"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Electric Blue Mid-Track Ribbon */}
          <path
            d="M 120 340 L 270 340 C 290 340 300 330 310 320 L 370 290 C 390 280 405 250 415 220 L 435 170 C 445 140 455 120 440 95 C 430 75 400 80 390 95 L 360 135 C 340 160 300 150 260 130 L 220 110 C 190 95 160 120 150 150 L 120 220 C 100 270 100 320 120 340 Z"
            fill="none"
            stroke="#0062FF"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#circuit-laser-glow)"
          />

          {/* Core White Trajectory Line */}
          <path
            d="M 120 340 L 270 340 C 290 340 300 330 310 320 L 370 290 C 390 280 405 250 415 220 L 435 170 C 445 140 455 120 440 95 C 430 75 400 80 390 95 L 360 135 C 340 160 300 150 260 130 L 220 110 C 190 95 160 120 150 150 L 120 220 C 100 270 100 320 120 340 Z"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Start/Finish Line with Laser Flag */}
          <line x1="170" y1="330" x2="170" y2="350" stroke="#00F0FF" strokeWidth="4" />
          <text x="175" y="365" fill="#00F0FF" fontSize="9" fontFamily="monospace" fontWeight="900">S/F</text>

          {/* Corner Interactive Matrix Hotspots */}
          {MONZA_CORNERS.map((corner) => {
            const isSelected = (selectedCornerId || hoveredCorner?.id) === corner.id;
            const isGain = corner.deltaS <= 0;
            const dotColor = isGain ? '#00F0FF' : '#38BDF8';

            return (
              <g
                key={corner.id}
                className="cursor-pointer transition-transform duration-150"
                onMouseEnter={() => setHoveredCorner(corner)}
                onMouseLeave={() => setHoveredCorner(null)}
                onClick={() => onSelectCorner?.(corner.id)}
              >
                {/* Active radar pulse beacon */}
                {isSelected && (
                  <circle
                    cx={corner.x}
                    cy={corner.y}
                    r="14"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    className="animate-ping opacity-85"
                  />
                )}

                {/* Outer solid marker with blue ring */}
                <circle
                  cx={corner.x}
                  cy={corner.y}
                  r={isSelected ? '7' : '5'}
                  fill="#030712"
                  stroke={isSelected ? '#FFFFFF' : '#0062FF'}
                  strokeWidth="2.5"
                />

                {/* Inner White / Cyan core dot */}
                <circle
                  cx={corner.x}
                  cy={corner.y}
                  r={isSelected ? '3.5' : '2.5'}
                  fill={dotColor}
                />

                {/* Technical Corner Crosshair Reticle */}
                {isSelected && (
                  <>
                    <line x1={corner.x - 12} y1={corner.y} x2={corner.x - 7} y2={corner.y} stroke="#00F0FF" strokeWidth="1.5" />
                    <line x1={corner.x + 7} y1={corner.y} x2={corner.x + 12} y2={corner.y} stroke="#00F0FF" strokeWidth="1.5" />
                    <line x1={corner.x} y1={corner.y - 12} x2={corner.x} y2={corner.y - 7} stroke="#00F0FF" strokeWidth="1.5" />
                    <line x1={corner.x} y1={corner.y + 7} x2={corner.x} y2={corner.y + 12} stroke="#00F0FF" strokeWidth="1.5" />
                  </>
                )}

                {/* Corner Label with Solid White font */}
                <text
                  x={corner.x + 9}
                  y={corner.y + 4}
                  fill={isSelected ? '#FFFFFF' : '#93C5FD'}
                  fontSize={isSelected ? '10' : '8'}
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight={isSelected ? '900' : '700'}
                >
                  {corner.id}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover / Active Corner Live HUD Card */}
        {activeCorner && showDetails && (
          <div className="absolute bottom-3 left-3 bg-[#070E22]/95 backdrop-blur-md border border-[#0062FF] p-3 rounded shadow-2xl text-3xs font-mono max-w-[280px] z-30 animate-fadeIn">
            <div className="flex items-center justify-between gap-3 border-b border-[#1E3A8A] pb-1.5 mb-2">
              <span className="font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-[#00F0FF]" />
                {activeCorner.name}
              </span>
              <span className={`px-2 py-0.5 rounded font-black border ${activeCorner.deltaS <= 0 ? 'bg-[#0062FF] text-white border-[#00F0FF]' : 'bg-[#FF3366]/20 text-[#FF3366] border-[#FF3366]'}`}>
                {activeCorner.deltaS <= 0 ? `${activeCorner.deltaS.toFixed(3)}s` : `+${activeCorner.deltaS.toFixed(3)}s`}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-4xs">
              <div className="bg-[#0A132E] p-1.5 rounded border border-[#1E3A8A]">
                <span className="text-[#93C5FD] block font-bold">CAR #44 APEX:</span>
                <span className="text-white font-black text-xs">{activeCorner.speedHamilton.toFixed(1)} km/h</span>
              </div>
              <div className="bg-[#0A132E] p-1.5 rounded border border-[#1E3A8A]">
                <span className="text-[#93C5FD] block font-bold">CAR #16 APEX:</span>
                <span className="text-[#38BDF8] font-black text-xs">{activeCorner.speedLeclerc.toFixed(1)} km/h</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Solid White & Blue Corner Navigation Strip */}
      {showDetails && (
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 border-t border-[#1E3A8A] mt-2.5 text-3xs font-mono scrollbar-none relative z-30">
          <span className="text-[#93C5FD] uppercase text-4xs shrink-0 flex items-center gap-1 font-bold">
            <Activity className="w-3.5 h-3.5 text-[#0062FF]" /> SECTORS:
          </span>
          {MONZA_CORNERS.map((corner) => {
            const isSelected = (selectedCornerId || hoveredCorner?.id) === corner.id;
            return (
              <button
                key={corner.id}
                onClick={() => onSelectCorner?.(corner.id)}
                className={`px-2.5 py-1 rounded text-4xs font-black transition-all whitespace-nowrap border ${
                  isSelected
                    ? 'bg-[#FFFFFF] text-[#030712] border-[#FFFFFF] shadow-[0_0_12px_rgba(255,255,255,0.6)]'
                    : 'bg-[#0A132E] text-[#93C5FD] hover:bg-[#0E1A3D] hover:text-white border-[#1E3A8A]'
                }`}
              >
                {corner.id} ({corner.deltaS <= 0 ? `${corner.deltaS.toFixed(3)}s` : `+${corner.deltaS.toFixed(3)}s`})
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
