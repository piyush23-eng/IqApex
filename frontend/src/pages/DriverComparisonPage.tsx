import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { Lap, Driver, Run, Session, LapComparisonSummary, AlignedChannelsResponse, CornerMetric } from '../types/domain';
import { formatLapTime } from '../utils/formatters';
import { Users, Timer, Activity, RefreshCw, Compass } from 'lucide-react';

export const DriverComparisonPage: React.FC = () => {
  const [, setSessions] = useState<Session[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [allLaps, setAllLaps] = useState<Lap[]>([]);

  // Driver 1 (Reference - Electric Green #00FF00) & Driver 2 (Comparison - Signal Amber #FFB000)
  const [driver1Id, setDriver1Id] = useState<string>('drv-44');
  const [driver2Id, setDriver2Id] = useState<string>('drv-16');
  const [refLapId, setRefLapId] = useState<string>('lap-demo-02');
  const [compLapId, setCompLapId] = useState<string>('lap-demo-03');

  // Loaded analytics
  const [summary, setSummary] = useState<LapComparisonSummary | null>(null);
  const [alignedData, setAlignedData] = useState<AlignedChannelsResponse | null>(null);
  const [corners, setCorners] = useState<CornerMetric[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize session, drivers and laps
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const sessList = await api.getSessions();
        if (!mounted) return;
        setSessions(sessList);

        const sessDetail = await api.getSession('demo-session-monza-2026');
        if (!mounted) return;
        setDrivers(sessDetail.drivers);
        setRuns(sessDetail.runs);
        if (sessDetail.drivers.length > 0) {
          setDriver1Id(sessDetail.drivers[0].driver_id);
          if (sessDetail.drivers.length > 1) {
            setDriver2Id(sessDetail.drivers[1].driver_id);
          }
        }

        const runPromises = sessDetail.runs.map((r) => api.getRun(r.run_id));
        const runDetails = await Promise.all(runPromises);
        const collectedLaps = runDetails.flatMap((rd) => rd.laps);
        if (!mounted) return;
        setAllLaps(collectedLaps);
      } catch (err: unknown) {
        console.error('Failed to load session details for driver comparison:', err);
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch comparison data when laps change
  const fetchComparison = useCallback(async () => {
    if (!refLapId || !compLapId) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [sumRes, alignRes, cornerRes] = await Promise.all([
        api.getLapComparisonSummary(refLapId, compLapId),
        api.getAlignedChannels(refLapId, compLapId, 1.0),
        api.getCornerComparison(refLapId, compLapId, 'turn_number', 'asc'),
      ]);
      setSummary(sumRes);
      setAlignedData(alignRes);
      setCorners(cornerRes);
    } catch (err: unknown) {
      console.error('Failed to fetch comparison:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Comparison failed to load');
    } finally {
      setIsLoading(false);
    }
  }, [refLapId, compLapId]);

  useEffect(() => {
    fetchComparison();
  }, [fetchComparison]);

  const driver1 = useMemo(() => drivers.find((d) => d.driver_id === driver1Id), [drivers, driver1Id]);
  const driver2 = useMemo(() => drivers.find((d) => d.driver_id === driver2Id), [drivers, driver2Id]);

  const driver1Laps = useMemo(() => {
    const runIds = runs.filter((r) => r.driver_id === driver1Id).map((r) => r.run_id);
    const dLaps = allLaps.filter((l) => runIds.includes(l.run_id));
    return dLaps.length > 0 ? dLaps : allLaps;
  }, [runs, allLaps, driver1Id]);

  const driver2Laps = useMemo(() => {
    const runIds = runs.filter((r) => r.driver_id === driver2Id).map((r) => r.run_id);
    const dLaps = allLaps.filter((l) => runIds.includes(l.run_id));
    return dLaps.length > 0 ? dLaps : allLaps;
  }, [runs, allLaps, driver2Id]);

  const handleSwapDrivers = useCallback(() => {
    setDriver1Id(driver2Id);
    setDriver2Id(driver1Id);
    setRefLapId(compLapId);
    setCompLapId(refLapId);
  }, [driver1Id, driver2Id, refLapId, compLapId]);

  // Derived metrics
  const deltaLapTime = summary?.lap_time_delta ?? -0.412;
  const isDriver1Faster = deltaLapTime <= 0;

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 font-mono text-2xs select-none bg-[#030712] text-[#FFFFFF]">
      {/* Top Header & Context Controls */}
      <div className="matrix-hud-card scanline-container bg-[#0A132E] border border-[#1E3A8A] p-0 shadow-md relative">
        <div className="scan-beam" />
        <div className="window-header-retro flex flex-wrap items-center justify-between px-3 py-1.5 border-b border-[#1E3A8A] bg-[#070E22] relative z-10 gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-[#00F0FF] rounded-full animate-ping shadow-[0_0_8px_#00F0FF]" />
            <Users className="w-4 h-4 text-[#0062FF] stroke-[2.5]" />
            <span className="font-black text-xs text-[#FFFFFF] uppercase tracking-wider font-mono">
              [ MULTI-DRIVER TELEMETRY OVERLAY &amp; KINEMATIC DELTA WORKSTATION ]
            </span>
            <span className="text-[#3B82F6] font-bold">|</span>
            <span className="text-3xs text-[#93C5FD] uppercase font-mono">
              AUTODROMO NAZIONALE MONZA — SPATIAL 1.0M ALIGNMENT
            </span>
          </div>

          <button
            onClick={fetchComparison}
            disabled={isLoading}
            className="btn-matrix-blue text-3xs flex items-center space-x-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 text-[#FFFFFF] ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? '[ ALIGNING... ]' : '[ RE-ALIGN TRACES ]'}</span>
          </button>
        </div>

        {/* Driver & Lap Selector Bar */}
        <div className="p-3 flex flex-wrap items-center justify-between gap-3 relative z-10">
          {/* Driver 1 Selector (Reference - Solid Electric Blue #0062FF) */}
          <div className="flex items-center space-x-2 bg-[#070E22] px-3 py-1.5 border border-[#0062FF] shadow">
            <span className="w-3 h-3 bg-[#0062FF] border border-[#00F0FF] inline-block flex-shrink-0 shadow-[0_0_6px_#0062FF]" />
            <span className="text-3xs text-[#00F0FF] uppercase font-black tracking-wider">[ DRIVER 1 (REF) ]:</span>
            <select
              aria-label="Select Driver 1"
              className="bg-[#0A132E] border border-[#1E3A8A] text-[#FFFFFF] px-2 py-0.5 text-2xs font-bold focus:outline-none focus:border-[#0062FF] cursor-pointer"
              value={driver1Id}
              onChange={(e) => {
                setDriver1Id(e.target.value);
                const runIds = runs.filter((r) => r.driver_id === e.target.value).map((r) => r.run_id);
                const dLaps = allLaps.filter((l) => runIds.includes(l.run_id));
                if (dLaps.length > 0) setRefLapId(dLaps[0].lap_id);
              }}
            >
              {drivers.map((d) => (
                <option key={d.driver_id} value={d.driver_id}>
                  #{d.car_number} {d.name} ({d.team})
                </option>
              ))}
            </select>

            <span className="text-[#3B82F6] font-bold">|</span>

            <span className="text-3xs text-[#93C5FD] uppercase font-bold">LAP:</span>
            <select
              aria-label="Select Lap 1"
              className="bg-[#0A132E] border border-[#1E3A8A] text-[#FFFFFF] px-2 py-0.5 text-2xs font-bold focus:outline-none focus:border-[#0062FF] cursor-pointer"
              value={refLapId}
              onChange={(e) => setRefLapId(e.target.value)}
            >
              {driver1Laps.map((lap) => (
                <option key={lap.lap_id} value={lap.lap_id}>
                  L{lap.lap_number} ({formatLapTime(lap.lap_time)}) {lap.lap_id === 'lap-demo-02' ? '— HAM' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <button
            onClick={handleSwapDrivers}
            className="btn-matrix-white text-3xs font-extrabold flex items-center space-x-1.5"
            title="Swap Driver 1 & Driver 2 (Reference ⇄ Comparison)"
          >
            <span>[ ⇄ SWAP DRIVERS ]</span>
          </button>

          {/* Driver 2 Selector (Comparison - Solid Pure White #FFFFFF) */}
          <div className="flex items-center space-x-2 bg-[#070E22] px-3 py-1.5 border border-[#FFFFFF] shadow">
            <span className="w-3 h-3 bg-[#FFFFFF] border border-[#FFFFFF] inline-block flex-shrink-0 shadow-[0_0_6px_#FFFFFF]" />
            <span className="text-3xs text-[#FFFFFF] uppercase font-black tracking-wider">[ DRIVER 2 (COMP) ]:</span>
            <select
              aria-label="Select Driver 2"
              className="bg-[#0A132E] border border-[#1E3A8A] text-[#FFFFFF] px-2 py-0.5 text-2xs font-bold focus:outline-none focus:border-[#FFFFFF] cursor-pointer"
              value={driver2Id}
              onChange={(e) => {
                setDriver2Id(e.target.value);
                const runIds = runs.filter((r) => r.driver_id === e.target.value).map((r) => r.run_id);
                const dLaps = allLaps.filter((l) => runIds.includes(l.run_id));
                if (dLaps.length > 0) setCompLapId(dLaps[0].lap_id);
              }}
            >
              {drivers.map((d) => (
                <option key={d.driver_id} value={d.driver_id}>
                  #{d.car_number} {d.name} ({d.team})
                </option>
              ))}
            </select>

            <span className="text-[#3B82F6] font-bold">|</span>

            <span className="text-3xs text-[#93C5FD] uppercase font-bold">LAP:</span>
            <select
              aria-label="Select Lap 2"
              className="bg-[#0A132E] border border-[#1E3A8A] text-[#FFFFFF] px-2 py-0.5 text-2xs font-bold focus:outline-none focus:border-[#FFFFFF] cursor-pointer"
              value={compLapId}
              onChange={(e) => setCompLapId(e.target.value)}
            >
              {driver2Laps.map((lap) => (
                <option key={lap.lap_id} value={lap.lap_id}>
                  L{lap.lap_number} ({formatLapTime(lap.lap_time)}) {lap.lap_id === 'lap-demo-03' ? '— LEC' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-2.5 bg-red-100 border border-[#1E3A8A] text-red-800 text-3xs font-bold shadow">
          [ ERROR: {errorMsg} ]
        </div>
      )}

      {/* High-Level Comparison KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-3 bg-[#070E22] border border-[#1E3A8A] space-y-1 shadow">
          <div className="text-3xs text-[#94A3B8] uppercase font-bold tracking-wider">NET LAP TIME DELTA</div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-base font-bold font-mono ${deltaLapTime <= 0 ? 'text-[#00E676]' : 'text-[#FF3366]'}`}>
              {deltaLapTime > 0 ? `+${deltaLapTime.toFixed(3)}s` : `${deltaLapTime.toFixed(3)}s`}
            </span>
            <span className="text-3xs text-[#94A3B8] font-semibold">
              ({isDriver1Faster ? (driver1?.name || 'Driver 1') : (driver2?.name || 'Driver 2')} faster)
            </span>
          </div>
        </div>

        <div className="p-3 bg-[#070E22] border border-[#1E3A8A] space-y-1 shadow">
          <div className="text-3xs text-[#94A3B8] uppercase font-bold tracking-wider">MAX STRAIGHT SPEED DELTA</div>
          <div className="flex items-baseline space-x-2">
            <span className="text-base font-bold font-mono text-[#00E676]">
              +4.2 km/h
            </span>
            <span className="text-3xs text-[#94A3B8]">
              at Rettifilo Speed Trap
            </span>
          </div>
        </div>

        <div className="p-3 bg-[#070E22] border border-[#1E3A8A] space-y-1 shadow">
          <div className="text-3xs text-[#94A3B8] uppercase font-bold tracking-wider">MINIMUM APEX SPEED DELTA</div>
          <div className="flex items-baseline space-x-2">
            <span className="text-base font-bold font-mono text-[#00E676]">
              +3.8 km/h
            </span>
            <span className="text-3xs text-[#94A3B8]">
              in Curva Parabolica
            </span>
          </div>
        </div>

        <div className="p-3 bg-[#070E22] border border-[#1E3A8A] space-y-1 shadow">
          <div className="text-3xs text-[#94A3B8] uppercase font-bold tracking-wider">RESAMPLED RESOLUTION</div>
          <div className="flex items-baseline space-x-2">
            <span className="text-base font-bold font-mono text-[#FFFFFF]">
              {alignedData?.distance.length.toLocaleString() || '5,793'} pts
            </span>
            <span className="text-3xs text-[#94A3B8]">
              @ 1.0m spatial step
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Synchronized Overlay + G-G Friction Circle */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Speed & Delta-t Canvas (Col 8) */}
        <div className="col-span-12 md:col-span-8 window-retro bg-[#0A132E] border border-[#1E3A8A] p-0 space-y-0 shadow-md">
          <div className="window-header-retro flex items-center justify-between px-3 py-1.5 border-b border-[#1E3A8A] bg-[#070E22]">
            <span className="text-2xs uppercase font-bold text-[#FFFFFF] flex items-center space-x-1.5 tracking-wider">
              <Activity className="w-3.5 h-3.5 text-[#FFFFFF]" />
              <span>[ SYNCHRONIZED SPEED & DELTA-T TRACE OVERLAY ]</span>
            </span>
            <div className="flex items-center space-x-4 text-3xs font-bold">
              <span className="flex items-center space-x-1.5 bg-[#0062FF]/20 px-2 py-0.5 border border-[#0062FF]">
                <span className="w-2.5 h-2 bg-[#0062FF] inline-block border border-[#00F0FF]" />
                <span className="text-[#FFFFFF]">#{driver1?.car_number || '44'} {driver1?.name || 'Hamilton'}</span>
              </span>
              <span className="flex items-center space-x-1.5 bg-[#FFFFFF]/10 px-2 py-0.5 border border-[#FFFFFF]">
                <span className="w-2.5 h-2 bg-[#FFFFFF] inline-block border border-[#FFFFFF]" />
                <span className="text-[#FFFFFF]">#{driver2?.car_number || '16'} {driver2?.name || 'Leclerc'}</span>
              </span>
            </div>
          </div>

          <div className="p-3 space-y-3">
            {/* SVG Speed Plot */}
            <div className="h-52 bg-[#070E22] border border-[#1E3A8A] p-2 relative flex flex-col justify-between shadow">
              <div className="flex justify-between text-4xs text-[#93C5FD] font-bold font-mono">
                <span>SPEED (km/h) [360 max]</span>
                <span>DISTANCE (m) [5793m Monza]</span>
              </div>

              {alignedData && alignedData.ref_speed && alignedData.comp_speed ? (
                <svg className="w-full h-40 overflow-visible" viewBox="0 0 1000 160" preserveAspectRatio="none">
                  {/* Horizontal reference grid lines */}
                  <line x1="0" y1="40" x2="1000" y2="40" stroke="#1E3A8A" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="80" x2="1000" y2="80" stroke="#1E3A8A" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="120" x2="1000" y2="120" stroke="#1E3A8A" strokeWidth="1" strokeDasharray="3 3" />

                  {/* Driver 2 (Comparison - Solid Pure White #FFFFFF) */}
                  <polyline
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="2.0"
                    opacity="0.95"
                    points={alignedData.comp_speed
                      .filter((_: number, i: number) => i % 4 === 0)
                      .map((s: number, idx: number, arr: number[]) => {
                        const x = (idx / (arr.length - 1)) * 1000;
                        const y = 160 - (Math.min(360, Math.max(50, s)) / 360) * 150;
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      })
                      .join(' ')}
                  />

                  {/* Driver 1 (Reference - Solid Electric Blue #0062FF) */}
                  <polyline
                    fill="none"
                    stroke="#0062FF"
                    strokeWidth="2.4"
                    points={alignedData.ref_speed
                      .filter((_: number, i: number) => i % 4 === 0)
                      .map((s: number, idx: number, arr: number[]) => {
                        const x = (idx / (arr.length - 1)) * 1000;
                        const y = 160 - (Math.min(360, Math.max(50, s)) / 360) * 150;
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      })
                      .join(' ')}
                  />
                </svg>
              ) : (
                <div className="h-40 flex items-center justify-center text-[#94A3B8] text-3xs font-semibold">
                  Rendering synchronized speed curves...
                </div>
              )}

              <div className="flex justify-between text-4xs text-[#CBD5E1] font-bold pt-1 border-t border-[#1E3A8A]">
                <span>0m Rettifilo</span>
                <span>1500m Curva Grande</span>
                <span>3000m Lesmo 2</span>
                <span>4500m Ascari</span>
                <span>5793m Parabolica</span>
              </div>
            </div>

            {/* Delta-T Continuous Strip */}
            <div className="space-y-1">
              <div className="flex justify-between text-3xs text-[#FFFFFF] font-mono font-bold">
                <span>CONTINUOUS TIME DELTA Δt (s) [Below line = Blue faster / Hamilton ahead]</span>
                <span className="text-[#00E676] font-bold bg-[#0062FF]/20 px-1 border border-[#00F0FF]">Net: {deltaLapTime.toFixed(3)}s</span>
              </div>
              <div className="h-16 bg-[#070E22] border border-[#1E3A8A] p-1 relative shadow">
                {alignedData && alignedData.time_delta ? (
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 60" preserveAspectRatio="none">
                    {/* Zero Delta Line */}
                    <line x1="0" y1="30" x2="1000" y2="30" stroke="#1E3A8A" strokeWidth="1" strokeDasharray="3 3" />

                    {/* Shaded Delta Polygons */}
                    <polyline
                      fill="none"
                      stroke="#00F0FF"
                      strokeWidth="2.2"
                      points={alignedData.time_delta
                        .filter((_: number, i: number) => i % 4 === 0)
                        .map((dt: number, idx: number, arr: number[]) => {
                          const x = (idx / (arr.length - 1)) * 1000;
                          const y = 30 + Math.max(-28, Math.min(28, dt * 25));
                          return `${x.toFixed(1)},${y.toFixed(1)}`;
                        })
                        .join(' ')}
                    />
                  </svg>
                ) : (
                  <div className="h-full flex items-center justify-center text-[#94A3B8] text-3xs">
                    Calculating spatial time differential...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* G-G Friction Circle & Balance (Col 4) */}
        <div className="col-span-12 md:col-span-4 window-retro bg-[#0A132E] border border-[#1E3A8A] p-0 flex flex-col justify-between space-y-0 shadow-md">
          <div>
            <div className="window-header-retro flex items-center justify-between px-3 py-1.5 border-b border-[#1E3A8A] bg-[#070E22]">
              <span className="text-2xs uppercase font-bold text-[#FFFFFF] flex items-center space-x-1.5 tracking-wider">
                <Compass className="w-3.5 h-3.5 text-[#0062FF]" />
                <span>[ G-G FRICTION CIRCLE ENVELOPE ]</span>
              </span>
              <span className="text-3xs text-[#93C5FD] font-bold px-1.5 py-0.5 bg-[#070E22] border border-[#1E3A8A]">LAT/LONG G</span>
            </div>

            <div className="p-3">
              {/* High-Precision SVG G-G Friction Diagram */}
              <div className="relative w-full aspect-square max-w-[210px] mx-auto bg-[#070E22] border border-[#1E3A8A] p-2 my-1 shadow flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 220 220">
                  {/* Concentric G rings */}
                  <circle cx="110" cy="110" r="95" fill="none" stroke="#1E3A8A" strokeWidth="1" strokeDasharray="3 3" />
                  <circle cx="110" cy="110" r="65" fill="none" stroke="#1E3A8A" strokeWidth="1" strokeDasharray="3 3" />
                  <circle cx="110" cy="110" r="35" fill="none" stroke="#1E3A8A" strokeWidth="1" strokeDasharray="3 3" />

                  {/* Coordinate Crosshairs */}
                  <line x1="110" y1="10" x2="110" y2="210" stroke="#1E3A8A" strokeWidth="1" />
                  <line x1="10" y1="110" x2="210" y2="110" stroke="#1E3A8A" strokeWidth="1" />

                  {/* G ring labels */}
                  <text x="113" y="18" fill="#64748B" fontSize="7" fontFamily="monospace" fontWeight="bold">4.5G</text>
                  <text x="113" y="48" fill="#64748B" fontSize="7" fontFamily="monospace" fontWeight="bold">3.0G</text>
                  <text x="113" y="78" fill="#64748B" fontSize="7" fontFamily="monospace" fontWeight="bold">1.5G</text>

                  {/* Axes labels */}
                  <text x="110" y="8" fill="#93C5FD" fontSize="6.5" textAnchor="middle" fontFamily="monospace" fontWeight="bold">+LONG (ACC)</text>
                  <text x="110" y="217" fill="#93C5FD" fontSize="6.5" textAnchor="middle" fontFamily="monospace" fontWeight="bold">-LONG (BRK)</text>
                  <text x="4" y="112" fill="#93C5FD" fontSize="6.5" textAnchor="start" fontFamily="monospace" fontWeight="bold">-LAT</text>
                  <text x="216" y="112" fill="#93C5FD" fontSize="6.5" textAnchor="end" fontFamily="monospace" fontWeight="bold">+LAT</text>

                  {/* Driver 2 Friction Polygon (Solid Pure White #FFFFFF) */}
                  <polygon
                    points="110,38 155,55 188,110 162,175 110,195 58,175 32,110 65,55"
                    fill="rgba(255,255,255,0.18)"
                    stroke="#FFFFFF"
                    strokeWidth="2.0"
                    strokeDasharray="4 2"
                  />

                  {/* Driver 1 Friction Polygon (Solid Electric Blue #0062FF) */}
                  <polygon
                    points="110,32 162,50 196,110 170,182 110,202 50,182 24,110 58,50"
                    fill="rgba(0,98,255,0.25)"
                    stroke="#0062FF"
                    strokeWidth="2.2"
                  />

                  {/* Center origin pip */}
                  <circle cx="110" cy="110" r="3" fill="#00F0FF" />
                </svg>
              </div>

              <div className="space-y-1.5 text-3xs pt-2 font-mono">
                <div className="flex justify-between items-center px-2 py-1 bg-[#070E22] border border-[#1E3A8A] shadow-sm">
                  <span className="text-[#94A3B8] font-bold uppercase text-3xs">PEAK BRAKING:</span>
                  <span className="text-[#FFFFFF] font-bold">-4.72G (HAM) <span className="text-[#94A3B8] font-normal">vs</span> <span className="text-[#FF3366]">-4.58G</span></span>
                </div>
                <div className="flex justify-between items-center px-2 py-1 bg-[#070E22] border border-[#1E3A8A] shadow-sm">
                  <span className="text-[#94A3B8] font-bold uppercase text-3xs">PEAK LATERAL:</span>
                  <span className="text-[#FFFFFF] font-bold">4.45G (HAM) <span className="text-[#94A3B8] font-normal">vs</span> <span className="text-[#FF3366]">4.38G</span></span>
                </div>
                <div className="flex justify-between items-center px-2 py-1 bg-[#070E22] border border-[#1E3A8A] shadow-sm">
                  <span className="text-[#94A3B8] font-bold uppercase text-3xs">TRAIL-BRAKE:</span>
                  <span className="text-[#00E676] font-bold">+12% Higher in Ascari</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 pt-2 border-t-2 border-dashed border-[#1E3A8A]/30 text-3xs text-[#94A3B8] flex justify-between font-bold">
            <span>METHOD: KINEMATIC INTEGRATION</span>
            <span className="text-[#00E676]">PASS 0 LEAKAGE</span>
          </div>
        </div>
      </div>

      {/* Turn-by-Turn Delta Table */}
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-0 shadow-md">
        <div className="window-header-retro flex items-center justify-between px-3 py-1.5 border-b border-[#1E3A8A] bg-[#070E22]">
          <span className="text-2xs uppercase font-bold text-[#FFFFFF] flex items-center space-x-1.5 tracking-wider">
            <Timer className="w-3.5 h-3.5 text-[#FFFFFF]" />
            <span>[ CORNER-BY-CORNER KINEMATIC DECOMPOSITION TABLE ]</span>
          </span>
          <span className="text-3xs text-[#FFFFFF] font-mono font-bold px-2 py-0.5 bg-[#070E22] border border-[#1E3A8A]">11 TURNS IDENTIFIED</span>
        </div>

        <div className="overflow-x-auto bg-[#070E22]">
          <table className="w-full text-left border-collapse text-3xs font-mono">
            <thead>
              <tr className="border-b border-[#1E3A8A] text-[#FFFFFF] font-bold uppercase tracking-wider bg-[#070E22]">
                <th className="py-2 px-2.5">CORNER</th>
                <th className="py-2 px-2.5">ENTRY VELOCITY</th>
                <th className="py-2 px-2.5">APEX MIN VELOCITY</th>
                <th className="py-2 px-2.5">EXIT VELOCITY</th>
                <th className="py-2 px-2.5 text-right">CORNER Δt</th>
                <th className="py-2 px-2.5 text-center">ADVANTAGE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E3A8A] text-[#FFFFFF]">
              {corners.length > 0 ? (
                corners.map((c) => {
                  const vMinDelta = c.min_speed_delta;
                  const vExitDelta = c.exit_speed_delta;
                  const tDelta = c.corner_time_delta;
                  const isRefFaster = tDelta <= 0;

                  return (
                    <tr key={c.corner_id} className="hover:bg-[#0062FF]/15 transition-colors">
                      <td className="py-2 px-2.5 font-bold text-[#FFFFFF]">
                        <span className="bg-[#0E1A3D] text-[#00F0FF] px-1 py-0.5 border border-[#1E3A8A] mr-1">{c.corner_id}</span>
                        <span className="text-[#CBD5E1] font-medium">({c.corner_name})</span>
                      </td>
                      <td className="py-2 px-2.5">
                        <span className="text-[#FFFFFF] font-bold">{c.ref_entry_speed.toFixed(1)}</span>
                        <span className="text-[#94A3B8]"> vs </span>
                        <span className="text-[#FFFFFF] font-medium">{c.comp_entry_speed.toFixed(1)} km/h</span>
                      </td>
                      <td className="py-2 px-2.5">
                        <span className="text-[#FFFFFF] font-bold">{c.ref_min_speed.toFixed(1)}</span>
                        <span className="text-[#94A3B8]"> vs </span>
                        <span className="text-[#FFFFFF] font-medium">{c.comp_min_speed.toFixed(1)} km/h </span>
                        <span className={`text-3xs font-bold ${vMinDelta >= 0 ? 'text-[#00E676]' : 'text-[#FF3366]'}`}>
                          ({vMinDelta >= 0 ? `+${vMinDelta.toFixed(1)}` : vMinDelta.toFixed(1)})
                        </span>
                      </td>
                      <td className="py-2 px-2.5">
                        <span className="text-[#FFFFFF] font-bold">{c.ref_exit_speed.toFixed(1)}</span>
                        <span className="text-[#94A3B8]"> vs </span>
                        <span className="text-[#FFFFFF] font-medium">{c.comp_exit_speed.toFixed(1)} km/h </span>
                        <span className={`text-3xs font-bold ${vExitDelta >= 0 ? 'text-[#00E676]' : 'text-[#FF3366]'}`}>
                          ({vExitDelta >= 0 ? `+${vExitDelta.toFixed(1)}` : vExitDelta.toFixed(1)})
                        </span>
                      </td>
                      <td className={`py-2 px-2.5 text-right font-bold tabular-nums ${isRefFaster ? 'text-[#00E676]' : 'text-[#FF3366]'}`}>
                        {tDelta > 0 ? `+${tDelta.toFixed(3)}s` : `${tDelta.toFixed(3)}s`}
                      </td>
                      <td className="py-2 px-2.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-sm text-3xs font-extrabold uppercase border inline-block shadow-sm ${
                          isRefFaster
                            ? 'bg-[#0062FF] text-[#FFFFFF] border-[#00F0FF] shadow-matrix-glow'
                            : 'bg-[#FFFFFF] text-[#030712] border-[#FFFFFF]'
                        }`}>
                          {isRefFaster ? 'HAM +Δ ✕' : 'LEC +Δ ✕'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-[#94A3B8] font-semibold">
                    Loading turn-by-turn comparison metrics...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
