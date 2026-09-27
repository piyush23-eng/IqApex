import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { AlignedChannelsResponse, CircuitCornerDefinition } from '../../types/domain';
import { ChannelKey } from '../../types/telemetry';
import { CursorSample } from './SynchronizedCursorReadout';

interface SynchronizedTelemetryWorkspaceProps {
  data: AlignedChannelsResponse | null;
  corners: CircuitCornerDefinition[];
  visibleChannels: Record<ChannelKey, boolean>;
  deltaMode: 'time' | 'speed';
  zoomSpan: { min: number; max: number };
  onZoomChange: (span: { min: number; max: number }) => void;
  onResetZoom: () => void;
  onCursorChange: (sample: CursorSample | null) => void;
  selectedCornerId: string | null;
  onSelectCorner: (cornerId: string) => void;
  trackLength?: number;
}

interface ChannelDef {
  key: ChannelKey;
  label: string;
  unit: string;
  minY: number;
  maxY: number;
  ticks: number[];
  height: number;
  isDiscrete?: boolean;
}

const SECTOR_BOUNDARIES = [
  { name: 'S1', distance: 1842.0 },
  { name: 'S2', distance: 3611.0 },
];

export const SynchronizedTelemetryWorkspace: React.FC<SynchronizedTelemetryWorkspaceProps> = ({
  data,
  corners,
  visibleChannels,
  deltaMode,
  zoomSpan,
  onZoomChange,
  onResetZoom,
  onCursorChange,
  selectedCornerId,
  onSelectCorner,
  trackLength = 5793.0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const [cursorX, setCursorX] = useState<number | null>(null);
  const [dragStartDist, setDragStartDist] = useState<number | null>(null);
  const [dragCurrentDist, setDragCurrentDist] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Compute dynamic delta range
  const deltaRange = useMemo(() => {
    if (!data) return { min: -0.5, max: 0.5 };
    const arr = deltaMode === 'time' ? data.time_delta : data.speed_delta;
    let min = 0;
    let max = 0;
    for (const v of arr) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const absMax = Math.max(Math.abs(min), Math.abs(max), deltaMode === 'time' ? 0.3 : 10.0);
    const padded = Math.ceil(absMax * 1.15 * 10) / 10;
    return { min: -padded, max: padded };
  }, [data, deltaMode]);

  // Channel Layout Definitions
  const channelDefs: ChannelDef[] = useMemo(() => {
    const list: ChannelDef[] = [
      {
        key: 'speed',
        label: 'SPEED',
        unit: 'km/h',
        minY: 0,
        maxY: 360,
        ticks: [0, 100, 200, 300],
        height: 125,
      },
      {
        key: 'throttle',
        label: 'THROTTLE',
        unit: '%',
        minY: 0,
        maxY: 100,
        ticks: [0, 50, 100],
        height: 65,
      },
      {
        key: 'brake',
        label: 'BRAKE',
        unit: '%',
        minY: 0,
        maxY: 100,
        ticks: [0, 50, 100],
        height: 65,
      },
      {
        key: 'gear',
        label: 'GEAR',
        unit: 'index',
        minY: 1,
        maxY: 8,
        ticks: [1, 2, 3, 4, 5, 6, 7, 8],
        height: 55,
        isDiscrete: true,
      },
      {
        key: 'rpm',
        label: 'RPM',
        unit: 'rpm',
        minY: 7000,
        maxY: 13500,
        ticks: [8000, 10000, 12000],
        height: 70,
      },
      {
        key: 'drs',
        label: 'DRS',
        unit: 'state',
        minY: 0,
        maxY: 1,
        ticks: [0, 1],
        height: 40,
        isDiscrete: true,
      },
      {
        key: 'lat_g',
        label: 'LAT G',
        unit: 'G',
        minY: -4.5,
        maxY: 4.5,
        ticks: [-4, -2, 0, 2, 4],
        height: 70,
      },
      {
        key: 'long_g',
        label: 'LONG G',
        unit: 'G',
        minY: -5.5,
        maxY: 2.0,
        ticks: [-5, -3, -1, 0, 1],
        height: 70,
      },
      {
        key: 'delta',
        label: deltaMode === 'time' ? 'TIME DELTA Δt' : 'SPEED DELTA Δv',
        unit: deltaMode === 'time' ? 's' : 'km/h',
        minY: deltaRange.min,
        maxY: deltaRange.max,
        ticks: [deltaRange.min, 0, deltaRange.max],
        height: 90,
      },
    ];

    return list.filter((ch) => visibleChannels[ch.key]);
  }, [visibleChannels, deltaMode, deltaRange]);

  // Total canvas height
  const topHeaderHeight = 28; // Track ribbon
  const totalPlotHeight = channelDefs.reduce((acc, c) => acc + c.height, 0);
  const totalCanvasHeight = topHeaderHeight + totalPlotHeight + 20;

  // Coordinate transforms
  const distToX = useCallback(
    (dist: number, width: number) => {
      const span = zoomSpan.max - zoomSpan.min;
      if (span <= 0) return 0;
      return ((dist - zoomSpan.min) / span) * width;
    },
    [zoomSpan]
  );

  const xToDist = useCallback(
    (x: number, width: number) => {
      const span = zoomSpan.max - zoomSpan.min;
      const dist = zoomSpan.min + (x / width) * span;
      return Math.max(0, Math.min(trackLength, dist));
    },
    [zoomSpan, trackLength]
  );

  // Render Background & Curves
  const renderTraces = useCallback(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas || !data) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = totalCanvasHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    // Dark background
    ctx.fillStyle = '#0f172a'; // workstation-surface
    ctx.fillRect(0, 0, width, height);

    // Track sector backgrounds
    SECTOR_BOUNDARIES.forEach((s) => {
      const sx = distToX(s.distance, width);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Top Track Ribbon
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, width, topHeaderHeight);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, topHeaderHeight);

    // Sector labels on ribbon
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    const s1X = distToX(1842.0, width);
    const s2X = distToX(3611.0, width);
    ctx.fillText('SECTOR 1', 10, 18);
    if (s1X < width) ctx.fillText('SECTOR 2', s1X + 10, 18);
    if (s2X < width) ctx.fillText('SECTOR 3', s2X + 10, 18);

    // Render Corner Flag Badges along ribbon
    corners.forEach((c) => {
      const apexX = distToX(c.apex_distance, width);
      const isSelected = selectedCornerId === c.corner_id;
      if (apexX >= -40 && apexX <= width + 40) {
        // Highlight active corner envelope
        if (isSelected) {
          const entryX = distToX(c.entry_distance, width);
          const exitX = distToX(c.exit_distance, width);
          ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
          ctx.fillRect(entryX, 0, exitX - entryX, height);
        }

        // Apex marker pin on ribbon
        ctx.fillStyle = isSelected ? '#38bdf8' : '#64748b';
        ctx.fillRect(apexX - 1, 0, 2, topHeaderHeight);

        // Badge pill
        ctx.fillStyle = isSelected ? 'rgba(56, 189, 248, 0.9)' : 'rgba(30, 41, 59, 0.9)';
        ctx.strokeStyle = isSelected ? '#38bdf8' : '#475569';
        ctx.lineWidth = 1;
        const text = c.corner_id;
        const tw = ctx.measureText(text).width;
        ctx.beginPath();
        ctx.roundRect(apexX - tw / 2 - 4, 4, tw + 8, 18, 3);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isSelected ? '#000000' : '#e2e8f0';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(text, apexX - tw / 2, 16);
      }
    });

    // Render Each Stacked Channel
    let currentY = topHeaderHeight;

    channelDefs.forEach((ch, idx) => {
      const chHeight = ch.height;
      const bottomY = currentY + chHeight;

      // Channel background alternating subtle tint
      ctx.fillStyle = idx % 2 === 0 ? 'rgba(15, 23, 42, 0.8)' : 'rgba(23, 31, 51, 0.8)';
      ctx.fillRect(0, currentY, width, chHeight);

      // Channel separator bottom border
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, bottomY);
      ctx.lineTo(width, bottomY);
      ctx.stroke();

      // Zero baseline for G-forces and Deltas
      if (ch.minY < 0 && ch.maxY > 0) {
        const zeroY = bottomY - ((0 - ch.minY) / (ch.maxY - ch.minY)) * chHeight;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(0, zeroY);
        ctx.lineTo(width, zeroY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Channel Y-Axis Labels
      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px monospace';
      ctx.fillText(`${ch.label} [${ch.unit}]`, 8, currentY + 12);

      ch.ticks.forEach((t) => {
        const ty = bottomY - ((t - ch.minY) / (ch.maxY - ch.minY)) * chHeight;
        ctx.fillStyle = '#64748b';
        ctx.font = '8px monospace';
        ctx.fillText(`${t}`, 8, ty - 2);

        // Subtle horizontal gridline
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(35, ty);
        ctx.lineTo(width, ty);
        ctx.stroke();
      });

      // Plot Channel Data Traces
      const distances = data.distance;
      const n = distances.length;
      if (n === 0) return;

      const yValToCoord = (val: number) => {
        const clamped = Math.max(ch.minY, Math.min(ch.maxY, val));
        return bottomY - ((clamped - ch.minY) / (ch.maxY - ch.minY)) * chHeight;
      };

      // Handle Delta Channel specially (Fill Green/Amber)
      if (ch.key === 'delta') {
        const deltaVals = deltaMode === 'time' ? data.time_delta : data.speed_delta;
        const zeroY = yValToCoord(0);

        // Fill area between delta and zero baseline
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < n; i++) {
          const d = distances[i];
          if (d < zoomSpan.min || d > zoomSpan.max) continue;
          const x = distToX(d, width);
          const y = yValToCoord(deltaVals[i]);
          if (!started) {
            ctx.moveTo(x, zeroY);
            started = true;
          }
          ctx.lineTo(x, y);
        }
        if (started) {
          const lastD = Math.min(zoomSpan.max, distances[n - 1]);
          ctx.lineTo(distToX(lastD, width), zeroY);
          ctx.closePath();
          ctx.fillStyle = 'rgba(245, 158, 11, 0.15)'; // Amber fill
          ctx.fill();
        }

        // Stroke Delta Line
        ctx.beginPath();
        started = false;
        for (let i = 0; i < n; i++) {
          const d = distances[i];
          if (d < zoomSpan.min || d > zoomSpan.max) continue;
          const x = distToX(d, width);
          const y = yValToCoord(deltaVals[i]);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.8;
        ctx.stroke();
      } else {
        // Standard Reference vs Comparison channels
        let refVals: number[] = [];
        let compVals: number[] = [];

        switch (ch.key) {
          case 'speed':
            refVals = data.ref_speed;
            compVals = data.comp_speed;
            break;
          case 'throttle':
            refVals = data.ref_throttle;
            compVals = data.comp_throttle;
            break;
          case 'brake':
            refVals = data.ref_brake;
            compVals = data.comp_brake;
            break;
          case 'gear':
            refVals = data.ref_gear;
            compVals = data.comp_gear;
            break;
          case 'rpm':
            refVals = data.ref_rpm;
            compVals = data.comp_rpm;
            break;
          case 'drs':
            refVals = data.ref_drs;
            compVals = data.comp_drs;
            break;
          case 'lat_g':
            refVals = data.ref_lat_g;
            compVals = data.comp_lat_g;
            break;
          case 'long_g':
            refVals = data.ref_long_g;
            compVals = data.comp_long_g;
            break;
        }

        // Draw Comparison Lap Trace (Amber - drawn first so Reference sits on top)
        ctx.beginPath();
        let compStarted = false;
        let lastCompY = 0;
        for (let i = 0; i < n; i++) {
          const d = distances[i];
          if (d < zoomSpan.min - 10 || d > zoomSpan.max + 10) continue;
          const x = distToX(d, width);
          const y = yValToCoord(compVals[i]);

          if (ch.isDiscrete && compStarted) {
            // Step interpolation for discrete channels (gear, drs)
            ctx.lineTo(x, lastCompY);
          }

          if (!compStarted) {
            ctx.moveTo(x, y);
            compStarted = true;
          } else {
            ctx.lineTo(x, y);
          }
          lastCompY = y;
        }
        ctx.strokeStyle = '#f59e0b'; // Amber
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // Draw Reference Lap Trace (Cyan)
        ctx.beginPath();
        let refStarted = false;
        let lastRefY = 0;
        for (let i = 0; i < n; i++) {
          const d = distances[i];
          if (d < zoomSpan.min - 10 || d > zoomSpan.max + 10) continue;
          const x = distToX(d, width);
          const y = yValToCoord(refVals[i]);

          if (ch.isDiscrete && refStarted) {
            // Step interpolation
            ctx.lineTo(x, lastRefY);
          }

          if (!refStarted) {
            ctx.moveTo(x, y);
            refStarted = true;
          } else {
            ctx.lineTo(x, y);
          }
          lastRefY = y;
        }
        ctx.strokeStyle = '#38bdf8'; // Cyan
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }

      currentY += chHeight;
    });

    // Bottom distance scale ticks
    ctx.fillStyle = '#64748b';
    ctx.font = '9px monospace';
    const distStep = (zoomSpan.max - zoomSpan.min) / 10;
    for (let s = zoomSpan.min; s <= zoomSpan.max; s += distStep) {
      const sx = distToX(s, width);
      ctx.fillText(`${Math.round(s)}m`, sx - 15, height - 6);
      ctx.strokeStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(sx, height - 20);
      ctx.lineTo(sx, height - 16);
      ctx.stroke();
    }
  }, [
    data,
    channelDefs,
    zoomSpan,
    deltaMode,
    totalCanvasHeight,
    distToX,
    corners,
    selectedCornerId,
  ]);

  // Render traces when data or zoom changes
  useEffect(() => {
    renderTraces();
  }, [renderTraces]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      renderTraces();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderTraces]);

  // Synchronized Crosshair & Drag Overlay (Ultra-fast 60fps)
  const renderOverlay = useCallback(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = totalCanvasHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.resetTransform();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Box Zoom Drag Box
    if (isDragging && dragStartDist !== null && dragCurrentDist !== null) {
      const x1 = distToX(Math.min(dragStartDist, dragCurrentDist), width);
      const x2 = distToX(Math.max(dragStartDist, dragCurrentDist), width);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
      ctx.fillRect(x1, 0, x2 - x1, height);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.strokeRect(x1, 0, x2 - x1, height);
    }

    // Crosshair Hairline
    if (cursorX !== null && cursorX >= 0 && cursorX <= width) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cursorX, 0);
      ctx.lineTo(cursorX, height);
      ctx.stroke();

      // Small hairline distance flag at top
      const dist = xToDist(cursorX, width);
      const flagText = `${Math.round(dist)} m`;
      ctx.font = 'bold 9px monospace';
      const tw = ctx.measureText(flagText).width;
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(cursorX - tw / 2 - 3, 2, tw + 6, 14);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(flagText, cursorX - tw / 2, 12);
    }
  }, [cursorX, isDragging, dragStartDist, dragCurrentDist, distToX, xToDist, totalCanvasHeight]);

  useEffect(() => {
    renderOverlay();
  }, [renderOverlay]);

  // Interpolate sample at given distance
  const getSampleAtDistance = useCallback(
    (dist: number): CursorSample | null => {
      if (!data || data.distance.length === 0) return null;
      const distances = data.distance;

      // Binary search closest distance index
      let low = 0;
      let high = distances.length - 1;
      while (low <= high) {
        const mid = (low + high) >> 1;
        if (distances[mid] < dist) low = mid + 1;
        else high = mid - 1;
      }
      const idx = Math.max(0, Math.min(distances.length - 1, low));

      return {
        distance: distances[idx],
        ref_speed: data.ref_speed[idx],
        comp_speed: data.comp_speed[idx],
        speed_delta: data.speed_delta[idx],
        ref_throttle: data.ref_throttle[idx],
        comp_throttle: data.comp_throttle[idx],
        ref_brake: data.ref_brake[idx],
        comp_brake: data.comp_brake[idx],
        ref_gear: data.ref_gear[idx],
        comp_gear: data.comp_gear[idx],
        ref_rpm: data.ref_rpm[idx],
        comp_rpm: data.comp_rpm[idx],
        ref_drs: data.ref_drs[idx],
        comp_drs: data.comp_drs[idx],
        ref_lat_g: data.ref_lat_g[idx],
        comp_lat_g: data.comp_lat_g[idx],
        ref_long_g: data.ref_long_g[idx],
        comp_long_g: data.comp_long_g[idx],
        time_delta: data.time_delta[idx],
      };
    },
    [data]
  );

  // Mouse Handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setCursorX(x);

    const dist = xToDist(x, canvas.clientWidth);
    const sample = getSampleAtDistance(dist);
    onCursorChange(sample);

    if (isDragging) {
      setDragCurrentDist(dist);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only primary button initiates drag zoom
    if (e.button !== 0) return;
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    // Check if clicked on a corner flag in the ribbon (0 to topHeaderHeight)
    const y = e.clientY - rect.top;
    if (y <= topHeaderHeight) {
      const clickDist = xToDist(x, canvas.clientWidth);
      const clickedCorner = corners.find(
        (c) => Math.abs(c.apex_distance - clickDist) < (zoomSpan.max - zoomSpan.min) * 0.04
      );
      if (clickedCorner) {
        onSelectCorner(clickedCorner.corner_id);
        const margin = (clickedCorner.exit_distance - clickedCorner.entry_distance) * 0.35;
        onZoomChange({
          min: Math.max(0, clickedCorner.entry_distance - margin),
          max: Math.min(trackLength, clickedCorner.exit_distance + margin),
        });
        return;
      }
    }

    setIsDragging(true);
    const startDist = xToDist(x, canvas.clientWidth);
    setDragStartDist(startDist);
    setDragCurrentDist(startDist);
  };

  const handleMouseUp = () => {
    if (isDragging && dragStartDist !== null && dragCurrentDist !== null) {
      const minD = Math.min(dragStartDist, dragCurrentDist);
      const maxD = Math.max(dragStartDist, dragCurrentDist);
      if (maxD - minD > 15.0) {
        // Meaningful box zoom
        onZoomChange({ min: minD, max: maxD });
      }
    }
    setIsDragging(false);
    setDragStartDist(null);
    setDragCurrentDist(null);
  };

  const handleMouseLeave = () => {
    setCursorX(null);
    onCursorChange(null);
    if (isDragging) {
      setIsDragging(false);
      setDragStartDist(null);
      setDragCurrentDist(null);
    }
  };

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const anchorDist = xToDist(x, canvas.clientWidth);

    const zoomFactor = e.deltaY < 0 ? 0.8 : 1.25;
    const curSpan = zoomSpan.max - zoomSpan.min;
    const newSpan = Math.max(40.0, Math.min(trackLength, curSpan * zoomFactor));

    const leftRatio = (anchorDist - zoomSpan.min) / curSpan;
    const newMin = Math.max(0, anchorDist - leftRatio * newSpan);
    const newMax = Math.min(trackLength, newMin + newSpan);

    onZoomChange({ min: newMin, max: newMax });
  };

  // Keyboard navigation (← / → for cursor, R for reset)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

      if (e.key === 'r' || e.key === 'R') {
        onResetZoom();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const step = e.shiftKey ? 100 : 10;
        const currentDist = cursorX !== null && overlayCanvasRef.current
          ? xToDist(cursorX, overlayCanvasRef.current.clientWidth)
          : (zoomSpan.min + zoomSpan.max) / 2;

        const newDist = e.key === 'ArrowLeft' ? Math.max(0, currentDist - step) : Math.min(trackLength, currentDist + step);
        if (overlayCanvasRef.current) {
          const newX = distToX(newDist, overlayCanvasRef.current.clientWidth);
          setCursorX(newX);
          onCursorChange(getSampleAtDistance(newDist));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cursorX, distToX, xToDist, zoomSpan, trackLength, onResetZoom, onCursorChange, getSampleAtDistance]);

  return (
    <div
      ref={containerRef}
      className="relative bg-workstation-panel border border-workstation-border rounded overflow-hidden select-none cursor-crosshair"
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
      onDoubleClick={onResetZoom}
      style={{ height: `${totalCanvasHeight}px` }}
    >
      {/* Background & Data Trace Canvas */}
      <canvas
        ref={bgCanvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      />

      {/* Crosshair & Drag Overlay Canvas */}
      <canvas
        ref={overlayCanvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      />
    </div>
  );
};
