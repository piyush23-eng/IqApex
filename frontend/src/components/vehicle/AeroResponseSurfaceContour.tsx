import React from 'react';
import { ResponseSurface2DVehicleResponse } from '../../types/vehiclePerformance';
import { Layers, AlertTriangle } from 'lucide-react';

interface AeroResponseSurfaceContourProps {
  surfaceData: ResponseSurface2DVehicleResponse | null;
  currentX?: number;
  currentY?: number;
  targetMetric: string;
  onChangeTarget: (target: string) => void;
  isLoading: boolean;
}

export const AeroResponseSurfaceContour: React.FC<AeroResponseSurfaceContourProps> = ({
  surfaceData,
  currentX,
  currentY,
  targetMetric,
  onChangeTarget,
  isLoading,
}) => {
  if (isLoading || !surfaceData) {
    return (
      <div className="bg-workstation-panel border border-workstation-border rounded p-4 font-mono text-2xs animate-pulse text-workstation-textMuted flex items-center justify-center space-x-2 h-72">
        <Layers className="w-4 h-4 animate-spin text-workstation-accentCyan" />
        <span>EVALUATING 2D AERODYNAMIC RESPONSE SURFACE...</span>
      </div>
    );
  }

  const { x_values, y_values, z_matrix, interpolation_mask, observed_x_bounds, observed_y_bounds } = surfaceData;

  const allZ = z_matrix.flat();
  const minZ = Math.min(...allZ);
  const maxZ = Math.max(...allZ);
  const zRange = maxZ - minZ || 1;

  const getColor = (val: number, isInterp: boolean) => {
    if (!isInterp) {
      // Extrapolated territory gets diagonal amber hash or desaturated tone
      return 'rgba(180, 83, 9, 0.45)';
    }
    const norm = Math.max(0, Math.min(1, (val - minZ) / zRange));
    // Color scale: deep blue -> cyan -> emerald -> amber
    const r = Math.round(norm > 0.6 ? (norm - 0.6) * 2.5 * 245 : 14);
    const g = Math.round(norm < 0.5 ? norm * 2 * 180 + 30 : 185);
    const b = Math.round(norm < 0.6 ? 220 - norm * 150 : 50);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const padX = 40;
  const padY = 25;
  const width = 450;
  const height = 240;
  const plotW = width - 2 * padX;
  const plotH = height - 2 * padY;

  const cellW = plotW / x_values.length;
  const cellH = plotH / y_values.length;

  const minX = x_values[0];
  const maxX = x_values[x_values.length - 1];
  const minY = y_values[0];
  const maxY = y_values[y_values.length - 1];

  const scaleX = (val: number) => padX + ((val - minX) / (maxX - minX || 1)) * plotW;
  const scaleY = (val: number) => height - padY - ((val - minY) / (maxY - minY || 1)) * plotH;

  return (
    <div className="bg-workstation-panel border border-workstation-border rounded p-3 font-mono text-2xs space-y-2">
      <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-1.5">
        <div className="flex items-center space-x-2">
          <Layers className="w-3.5 h-3.5 text-workstation-accentCyan" />
          <span className="font-bold text-workstation-textBright uppercase tracking-wider text-xs">
            2D AERODYNAMIC RESPONSE SURFACE
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={targetMetric}
            onChange={(e) => onChangeTarget(e.target.value)}
            className="bg-workstation-surface border border-workstation-border rounded px-2 py-0.5 text-3xs text-workstation-textBright focus:outline-none focus:border-workstation-accentCyan"
          >
            <option value="downforce_n">Downforce (N)</option>
            <option value="drag_n">Drag (N)</option>
            <option value="cl">Lift Coeff (Cl)</option>
            <option value="cd">Drag Coeff (Cd)</option>
            <option value="aero_balance_pct">Aero Balance (%)</option>
          </select>

          <span className="text-3xs text-workstation-textMuted bg-workstation-surface px-1.5 py-0.5 rounded border border-workstation-borderSubtle">
            MOD: {surfaceData.model_version}
          </span>
        </div>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56 select-none">
          {/* Contour heatmap cells */}
          {y_values.map((yVal, i) =>
            x_values.map((xVal, j) => {
              const zVal = z_matrix[i][j];
              const isInterp = interpolation_mask[i][j];
              const xPos = padX + j * cellW;
              const yPos = height - padY - (i + 1) * cellH;

              return (
                <rect
                  key={`${i}-${j}`}
                  x={xPos}
                  y={yPos}
                  width={cellW + 0.5}
                  height={cellH + 0.5}
                  fill={getColor(zVal, isInterp)}
                >
                  <title>{`FW: ${xVal.toFixed(1)}°, RW: ${yVal.toFixed(1)}°\n${targetMetric}: ${zVal.toFixed(1)}\nDomain: ${
                    isInterp ? 'Interpolation' : 'Extrapolation (Outside Observed Range)'
                  }`}</title>
                </rect>
              );
            })
          )}

          {/* Observed Domain Bounding Box */}
          <rect
            x={scaleX(observed_x_bounds[0])}
            y={scaleY(observed_y_bounds[1])}
            width={scaleX(observed_x_bounds[1]) - scaleX(observed_x_bounds[0])}
            height={scaleY(observed_y_bounds[0]) - scaleY(observed_y_bounds[1])}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />

          {/* Current Setup Marker */}
          {currentX !== undefined && currentY !== undefined && (
            <circle
              cx={scaleX(currentX)}
              cy={scaleY(currentY)}
              r="5"
              fill="#ffffff"
              stroke="#0f172a"
              strokeWidth="2"
              className="animate-pulse"
            >
              <title>{`Current Operating Setup:\nFront Wing: ${currentX}°\nRear Wing: ${currentY}°`}</title>
            </circle>
          )}

          {/* Axes */}
          <line x1={padX} y1={padY} x2={padX} y2={height - padY} stroke="#475569" strokeWidth="1" />
          <line
            x1={padX}
            y1={height - padY}
            x2={width - padX}
            y2={height - padY}
            stroke="#475569"
            strokeWidth="1"
          />

          {/* Axis Labels */}
          <text
            x={width / 2}
            y={height - 6}
            fill="#94a3b8"
            fontSize="9"
            textAnchor="middle"
            fontFamily="monospace"
          >
            FRONT WING ANGLE (DEG)
          </text>

          <text
            x={12}
            y={height / 2}
            fill="#94a3b8"
            fontSize="9"
            textAnchor="middle"
            fontFamily="monospace"
            transform={`rotate(-90 12 ${height / 2})`}
          >
            REAR WING ANGLE (DEG)
          </text>
        </svg>
      </div>

      <div className="flex items-center justify-between text-3xs text-workstation-textMuted pt-1 border-t border-workstation-borderSubtle">
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-1.5 border border-sky-400 border-dashed inline-block" />
          <span>Dashed line: Observed experimental training domain</span>
        </div>
        <div className="flex items-center space-x-1.5 text-amber-400">
          <AlertTriangle className="w-3 h-3" />
          <span>Amber outer region: Extrapolated model response</span>
        </div>
      </div>
    </div>
  );
};
