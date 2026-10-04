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
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-6 text-center font-mono text-xs text-[#FFFFFF] font-bold shadow-md">
        [ FITTING 2-VARIABLE INTERACTION MODEL AND COMPUTING CONTOUR GRID... ]
      </div>
    );
  }

  if (!surfaceData || surfaceData.x1_values.length === 0) {
    return (
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-6 text-center font-mono text-xs text-[#94A3B8] font-bold shadow-md">
        [ NO 2D RESPONSE SURFACE DATA AVAILABLE ]
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

  // Color generator: low time (green) to high time (amber/orange)
  const getColor = (zVal: number, isInterp: boolean) => {
    const norm = (zVal - minZ) / zSpan; // 0 (fast) to 1 (slow)
    if (!isInterp) {
      // Extrapolation: warm amber hash tone
      return 'rgba(217, 119, 6, 0.4)';
    }
    // High contrast gradient: emerald green -> warm amber
    if (norm < 0.5) {
      const t = norm / 0.5;
      const r = Math.round(20 + t * 40);
      const g = Math.round(180 - t * 30);
      const b = Math.round(80 - t * 40);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      const t = (norm - 0.5) / 0.5;
      const r = Math.round(190 * t + 60 * (1 - t));
      const g = Math.round(140 * (1 - t) + 80 * t);
      const b = Math.round(20 * (1 - t));
      return `rgb(${r}, ${g}, ${b})`;
    }
  };

  const cellW = w / x1_values.length;
  const cellH = h / x2_values.length;

  return (
    <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-3 font-mono text-2xs space-y-2 shadow-md">
      {/* Titanium Header */}
      <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-2 bg-[#070E22] p-2 -mx-3 -mt-3 mb-2">
        <div className="flex items-center space-x-2">
          <Grid className="w-3.5 h-3.5 text-[#FFFFFF]" />
          <span className="font-bold text-[#FFFFFF] tracking-wider uppercase text-xs">
            [ 2D INTERACTION CONTOUR SURFACE ({feature_x1.replace(/_/g, ' ')} × {feature_x2.replace(/_/g, ' ')}) ]
          </span>
        </div>

        <div className="flex items-center space-x-2 text-3xs font-bold">
          <span className="flex items-center space-x-1.5 bg-[#070E22] border border-[#1E3A8A] px-1.5 py-0.5">
            <span className="w-2.5 h-2.5 bg-[#00F0FF] border border-[#1E3A8A] inline-block" />
            <span>Faster (Low Δt)</span>
          </span>
          <span className="flex items-center space-x-1.5 bg-[#070E22] border border-[#1E3A8A] px-1.5 py-0.5">
            <span className="w-2.5 h-2.5 bg-[#0E1A3D] text-[#FBBF24] border border-[#FBBF24]/50 border border-[#1E3A8A] inline-block" />
            <span>Slower (High Δt)</span>
          </span>
          <span className="flex items-center space-x-1.5 bg-[#070E22] border border-[#1E3A8A] px-1.5 py-0.5">
            <span className="w-3 h-2 border-2 border-dashed border-[#1E3A8A] inline-block" />
            <span>Observed Domain</span>
          </span>
        </div>
      </div>

      {/* SVG Contour Surface */}
      <div className="relative bg-[#070E22] border border-[#1E3A8A] p-2 shadow overflow-x-auto">
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
                  opacity={isInterp ? 0.95 : 0.45}
                  stroke="#000000"
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

          {/* Observed Domain Bounding Box */}
          <rect
            x={getX(obsX1Min)}
            y={getY(obsX2Max)}
            width={Math.max(2, getX(obsX1Max) - getX(obsX1Min))}
            height={Math.max(2, getY(obsX2Min) - getY(obsX2Max))}
            fill="none"
            stroke="#000000"
            strokeWidth="2"
            strokeDasharray="5,3"
          />

          {/* Observed Lap Points Scatter */}
          {observed_scatter.map((pt) => (
            <circle
              key={pt.lap_id}
              cx={getX(pt.x1)}
              cy={getY(pt.x2)}
              r="4"
              fill="#FFB000"
              stroke="#000000"
              strokeWidth="1.5"
              className="cursor-pointer hover:r-5 transition-all"
            >
              <title>{`${pt.lap_id}: (${pt.x1.toFixed(1)}, ${pt.x2.toFixed(1)}) → ${pt.y.toFixed(3)}s`}</title>
            </circle>
          ))}

          {/* Axis Labels and Ticks */}
          <text
            x={width / 2}
            y={height - 5}
            textAnchor="middle"
            fill="#000000"
            fontSize="8.5"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {feature_x1.toUpperCase()} (km/h)
          </text>
          <text
            x={-height / 2}
            y={14}
            transform="rotate(-90)"
            textAnchor="middle"
            fill="#000000"
            fontSize="8.5"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {feature_x2.toUpperCase()} (km/h)
          </text>
        </svg>

        {/* Hovered Cell Readout */}
        {hoveredCell && (
          <div className="absolute top-2 right-4 bg-[#070E22] border border-[#1E3A8A] px-2.5 py-1 text-3xs font-mono text-[#FFFFFF] font-bold shadow pointer-events-none flex items-center space-x-2">
            <Eye className="w-3 h-3 text-[#FFFFFF]" />
            <span>
              X1: <strong>{hoveredCell.x1.toFixed(1)}</strong>, X2:{' '}
              <strong>{hoveredCell.x2.toFixed(1)}</strong> → Predicted {target_name}:{' '}
              <strong className="text-[#FFFFFF] bg-[#00F0FF] px-1">{hoveredCell.z.toFixed(3)}s</strong> (
              {hoveredCell.isInterpolation ? 'Interpolation' : 'Extrapolation'})
            </span>
          </div>
        )}
      </div>

      {/* Model metadata footnote */}
      <div className="flex items-center justify-between text-3xs text-[#FFFFFF] font-bold border-t border-[#1E3A8A] pt-1.5">
        <span>
          MODEL: {model_metadata.model_id} (R² = {model_metadata.metrics.r_squared.toFixed(3)}, RMSE ={' '}
          {model_metadata.metrics.rmse.toFixed(4)}s)
        </span>
        <span className="bg-[#0A0D15] border border-[#1E3A8A] px-1.5 py-0.5">
          INTERACTION: Y = β₀ + β₁X₁ + β₂X₂ + β₃(X₁·X₂) + ε
        </span>
      </div>
    </div>
  );
};
