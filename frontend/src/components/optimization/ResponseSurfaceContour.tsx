import React, { useState } from 'react';
import { ResponseSurface2DResponse } from '../../types/optimization';
import { Grid, Eye } from 'lucide-react';

interface ResponseSurfaceContourProps {
  surfaceData: ResponseSurface2DResponse | null;
  isLoading?: boolean;
}

export const ResponseSurfaceContour: React.FC<ResponseSurfaceContourProps> = ({
  surfaceData,
  isLoading = false,
}) => {
  const [hoveredCell, setHoveredCell] = useState<{
    x1: number;
    x2: number;
    z: number;
    isInterpolation: boolean;
  } | null>(null);

  if (isLoading) {
    return (
      <div className="bg-workstation-panel border border-workstation-border rounded p-6 text-center font-mono text-xs text-workstation-textMuted">
        Fitting 2-variable interaction model and computing contour grid...
      </div>
    );
  }

  if (!surfaceData || surfaceData.x1_values.length === 0) {
    return (
      <div className="bg-workstation-panel border border-workstation-border rounded p-6 text-center font-mono text-xs text-workstation-textMuted">
        No 2D response surface data available.
      </div>
    );
  }

  const {
    feature_x1,
    feature_x2,
    target_name,
    x1_values,
    x2_values,
    z_matrix,
    interpolation_mask,
    observed_x1_range,
    observed_x2_range,
    observed_scatter,
    model_metadata,
  } = surfaceData;

  const [obsX1Min, obsX1Max] = observed_x1_range;
  const [obsX2Min, obsX2Max] = observed_x2_range;

  // Flatten Z to find global min and max for color normalization
  const flatZ = z_matrix.flat();
  const minZ = Math.min(...flatZ);
  const maxZ = Math.max(...flatZ);
  const zSpan = maxZ - minZ > 1e-4 ? maxZ - minZ : 1.0;

  // Canvas / SVG layout
  const width = 640;
  const height = 280;
  const pad = { top: 20, right: 30, bottom: 40, left: 60 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;

  const minX1 = x1_values[0];
  const maxX1 = x1_values[x1_values.length - 1];
  const minX2 = x2_values[0];
  const maxX2 = x2_values[x2_values.length - 1];

  const getX = (v1: number) => pad.left + ((v1 - minX1) / (maxX1 - minX1 || 1.0)) * w;
  const getY = (v2: number) => pad.top + h - ((v2 - minX2) / (maxX2 - minX2 || 1.0)) * h;

  // Color generator: low time (green/cyan) to high time (amber/purple)
  const getColor = (zVal: number, isInterp: boolean) => {
    const norm = (zVal - minZ) / zSpan; // 0 (fast) to 1 (slow)
    if (!isInterp) {
      // Extrapolation: faded desaturated shade
      return `rgba(${Math.round(80 + norm * 80)}, ${Math.round(80 + (1 - norm) * 80)}, 100, 0.45)`;
    }
    // Interpolation: clear engineering gradient (cyan -> emerald -> amber)
    if (norm < 0.5) {
      const t = norm / 0.5;
      const r = Math.round(16 + t * (16 - 16));
      const g = Math.round(185 - t * (185 - 150));
      const b = Math.round(129 - t * (129 - 80));
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      const t = (norm - 0.5) / 0.5;
      const r = Math.round(245 * t + 16 * (1 - t));
      const g = Math.round(158 * (1 - t) + 120 * t);
      const b = Math.round(11 * t);
      return `rgb(${r}, ${g}, ${b})`;
    }
  };

  const cellW = w / x1_values.length;
  const cellH = h / x2_values.length;

  return (
    <div className="bg-workstation-panel border border-workstation-border rounded p-3 font-mono text-2xs space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-1.5">
        <div className="flex items-center space-x-2">
          <Grid className="w-3.5 h-3.5 text-workstation-accentCyan" />
          <span className="font-bold text-workstation-textBright tracking-wider uppercase">
            2D INTERACTION CONTOUR SURFACE ({feature_x1.replace(/_/g, ' ')} × {feature_x2.replace(/_/g, ' ')})
          </span>
        </div>

        <div className="flex items-center space-x-3 text-3xs text-workstation-textMuted">
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs inline-block" />
            <span>Faster (Low Δt)</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-xs inline-block" />
            <span>Slower (High Δt)</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-3 h-2 border border-dashed border-cyan-400 inline-block" />
            <span>Observed Domain</span>
          </span>
        </div>
      </div>

      {/* SVG Contour Surface */}
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          style={{ minWidth: '550px' }}
        >
          {/* Surface Cells */}
          {x1_values.map((v1, i) =>
            x2_values.map((v2, j) => {
              const zVal = z_matrix[i][j];
              const isInterp = interpolation_mask[i][j];
              const xPos = pad.left + i * cellW;
              const yPos = pad.top + h - (j + 1) * cellH;

              return (
                <rect
                  key={`${i}-${j}`}
                  x={xPos}
                  y={yPos}
                  width={cellW + 0.5}
                  height={cellH + 0.5}
                  fill={getColor(zVal, isInterp)}
                  opacity={isInterp ? 0.9 : 0.4}
                  stroke="#18181b"
                  strokeWidth={0.2}
                  className="cursor-pointer hover:opacity-100"
                  onMouseEnter={() =>
                    setHoveredCell({
                      x1: v1,
                      x2: v2,
                      z: zVal,
                      isInterpolation: isInterp,
                    })
                  }
                  onMouseLeave={() => setHoveredCell(null)}
                />
              );
            })
          )}

          {/* Observed Domain Bounding Box (Highlighted cyan dashed boundary) */}
          <rect
            x={getX(obsX1Min)}
            y={getY(obsX2Max)}
            width={Math.max(2, getX(obsX1Max) - getX(obsX1Min))}
            height={Math.max(2, getY(obsX2Min) - getY(obsX2Max))}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="1.5"
            strokeDasharray="4,3"
          />

          {/* Observed Lap Points Scatter */}
          {observed_scatter.map((pt) => (
            <circle
              key={pt.lap_id}
              cx={getX(pt.x1)}
              cy={getY(pt.x2)}
              r="4"
              fill="#ffffff"
              stroke="#09090b"
              strokeWidth="1.5"
              className="cursor-pointer"
            >
              <title>{`${pt.lap_id}: (${pt.x1.toFixed(1)}, ${pt.x2.toFixed(1)}) → ${pt.y.toFixed(3)}s`}</title>
            </circle>
          ))}

          {/* Axis Labels and Ticks */}
          <text
            x={width / 2}
            y={height - 5}
            textAnchor="middle"
            fill="#a1a1aa"
            fontSize="8"
            fontFamily="monospace"
          >
            {feature_x1.toUpperCase()} (km/h)
          </text>
          <text
            x={-height / 2}
            y={12}
            transform="rotate(-90)"
            textAnchor="middle"
            fill="#a1a1aa"
            fontSize="8"
            fontFamily="monospace"
          >
            {feature_x2.toUpperCase()} (km/h)
          </text>
        </svg>

        {/* Hovered Cell Readout */}
        {hoveredCell && (
          <div className="absolute top-2 right-4 bg-workstation-surface/95 border border-workstation-accentCyan/60 rounded px-2.5 py-1 text-3xs font-mono text-workstation-textBright shadow-lg pointer-events-none flex items-center space-x-2">
            <Eye className="w-3 h-3 text-workstation-accentCyan" />
            <span>
              X1: <strong>{hoveredCell.x1.toFixed(1)}</strong>, X2:{' '}
              <strong>{hoveredCell.x2.toFixed(1)}</strong> → Predicted {target_name}:{' '}
              <strong className="text-workstation-accentCyan">{hoveredCell.z.toFixed(3)}s</strong> (
              {hoveredCell.isInterpolation ? 'Interpolation' : 'Extrapolation'})
            </span>
          </div>
        )}
      </div>

      {/* Model metadata footnote */}
      <div className="flex items-center justify-between text-3xs text-workstation-textMuted border-t border-workstation-borderSubtle pt-1">
        <span>
          Model: {model_metadata.model_id} (R² = {model_metadata.metrics.r_squared.toFixed(3)}, RMSE ={' '}
          {model_metadata.metrics.rmse.toFixed(4)}s)
        </span>
        <span className="text-workstation-accentCyan">
          Interaction: Y = β₀ + β₁X₁ + β₂X₂ + β₃(X₁·X₂) + ε
        </span>
      </div>
    </div>
  );
};
