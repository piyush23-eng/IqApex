import React from 'react';
import {
  ShieldCheck,
  Clock,
  Compass,
  Zap,
  Activity,
  FileSpreadsheet,
  Cpu,
} from 'lucide-react';
import { Session, Driver, Run, Lap, TelemetryResponse } from '../types/domain';
import { formatLapTime } from '../utils/formatters';

interface OverviewPageProps {
  session: Session | null;
  selectedDriver: Driver | null;
  selectedRun: Run | null;
  selectedLap: Lap | null;
  telemetryData: TelemetryResponse | null;
  isSynthetic: boolean;
  onLoadSyntheticData: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  session,
  selectedDriver,
  selectedRun,
  selectedLap,
  telemetryData,
  isSynthetic,
  onLoadSyntheticData,
}) => {
  const quality = telemetryData?.data_quality;

  return (
    <div className="h-full overflow-y-auto p-3 space-y-3 font-mono text-2xs">
      {/* Top Banner if synthetic demonstration mode is active */}
      {isSynthetic && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-workstation-telemetryAmber/10 border border-workstation-telemetryAmber/30 rounded text-workstation-telemetryAmber text-3xs">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-workstation-telemetryAmber" />
            <span className="font-semibold uppercase tracking-wider">
              DATA ENVIRONMENT: Synthetic demonstration dataset active
            </span>
            <span className="text-workstation-textMuted">|</span>
            <span className="text-workstation-textSecondary">
              All rendered telemetry structures reflect mathematical simulation traces for workstation calibration.
            </span>
          </div>
          <span className="text-workstation-textMuted font-mono">STAGE 1 VERIFICATION</span>
        </div>
      )}

      {/* Grid of Structural Placeholders */}
      <div className="grid grid-cols-12 gap-2.5">

        {/* 1. SESSION CONTEXT (Col span 4) */}
        <div className="col-span-4 bg-workstation-panel border border-workstation-border rounded p-2.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-workstation-borderSubtle">
              <span className="text-3xs uppercase tracking-wider text-workstation-textMuted font-semibold flex items-center space-x-1.5">
                <Compass className="w-3 h-3 text-workstation-accentCyan" />
                <span>SESSION CONTEXT</span>
              </span>
              <span className="text-3xs text-workstation-textMuted">SC-01</span>
            </div>

            {session ? (
              <div className="space-y-1.5 text-2xs">
                <div className="flex justify-between">
                  <span className="text-workstation-textMuted">EVENT</span>
                  <span className="text-workstation-textBright font-medium">{session.event_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-workstation-textMuted">CIRCUIT</span>
                  <span className="text-workstation-textPrimary">{session.circuit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-workstation-textMuted">TYPE / DATE</span>
                  <span className="text-workstation-textSecondary">{session.session_type} / {session.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-workstation-textMuted">TRACK CONDITION</span>
                  <span className="text-workstation-textSecondary">{session.weather}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-workstation-textMuted">TRACK TEMP</span>
                  <span className="text-workstation-telemetryAmber font-medium">{session.track_temperature.toFixed(1)} °C</span>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-workstation-textMuted">
                <p>Synthetic dataset not loaded</p>
                <button
                  onClick={onLoadSyntheticData}
                  className="mt-2 text-3xs px-2 py-1 bg-workstation-surface hover:bg-workstation-card text-workstation-accentCyan border border-workstation-border rounded"
                >
                  Load Calibration Dataset
                </button>
              </div>
            )}
          </div>
          <div className="pt-2 mt-2 border-t border-workstation-borderSubtle text-3xs text-workstation-textMuted flex justify-between">
            <span>BAROMETRIC: 1014 hPa</span>
            <span>AIR TEMP: 26.2 °C</span>
          </div>
        </div>

        {/* 2. ACTIVE RUN (Col span 4) */}
        <div className="col-span-4 bg-workstation-panel border border-workstation-border rounded p-2.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-workstation-borderSubtle">
              <span className="text-3xs uppercase tracking-wider text-workstation-textMuted font-semibold flex items-center space-x-1.5">
                <Clock className="w-3 h-3 text-workstation-accentCyan" />
                <span>ACTIVE RUN</span>
              </span>
              <span className="text-3xs text-workstation-textMuted">RN-02</span>
            </div>

            {selectedRun && selectedDriver ? (
              <div className="space-y-1.5 text-2xs">
                <div className="flex justify-between">
                  <span className="text-workstation-textMuted">RUN IDENTIFIER</span>
                  <span className="text-workstation-textBright font-medium">{selectedRun.run_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-workstation-textMuted">DRIVER</span>
                  <span className="text-workstation-textPrimary">#{selectedDriver.car_number} {selectedDriver.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-workstation-textMuted">PROGRAM</span>
                  <span className="text-workstation-textSecondary">{selectedRun.run_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-workstation-textMuted">COMPOUND / AGE</span>
                  <span className="text-workstation-textPrimary">
                    {selectedRun.compound} — <span className="text-workstation-accentCyan">{selectedRun.tyre_age} laps old</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-workstation-textMuted">LAP TIMING</span>
                  <span className="text-workstation-telemetryGreen font-semibold">
                    {selectedLap ? formatLapTime(selectedLap.lap_time) : 'Waiting for telemetry'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-workstation-textMuted">
                <p>No analysis available</p>
                <span className="text-3xs text-workstation-textMuted/60">Awaiting run acquisition</span>
              </div>
            )}
          </div>
          <div className="pt-2 mt-2 border-t border-workstation-borderSubtle text-3xs text-workstation-textMuted flex justify-between">
            <span>OUT LAP: 15:18:20</span>
            <span>IN LAP: 15:32:45</span>
          </div>
        </div>

        {/* 3. DATA QUALITY (Col span 4) */}
        <div className="col-span-4 bg-workstation-panel border border-workstation-border rounded p-2.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-workstation-borderSubtle">
              <span className="text-3xs uppercase tracking-wider text-workstation-textMuted font-semibold flex items-center space-x-1.5">
                <ShieldCheck className="w-3 h-3 text-workstation-accentCyan" />
                <span>DATA QUALITY</span>
              </span>
              <span className="text-3xs text-workstation-textMuted">DQ-03</span>
            </div>

            {quality ? (
              <div className="space-y-1.5 text-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-workstation-textMuted">STATUS</span>
                  <span className={`px-1.5 py-0.5 rounded text-3xs font-semibold ${
                    quality.status === 'PASS'
                      ? 'bg-workstation-telemetryGreen/15 text-workstation-telemetryGreen border border-workstation-telemetryGreen/30'
                      : quality.status === 'WARNING'
                      ? 'bg-workstation-telemetryAmber/15 text-workstation-telemetryAmber border border-workstation-telemetryAmber/30'
                      : 'bg-workstation-telemetryRed/15 text-workstation-telemetryRed border border-workstation-telemetryRed/30'
                  }`}>
                    {quality.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-workstation-textMuted">INTEGRITY SCORE</span>
                  <span className="text-workstation-textBright font-semibold">{quality.quality_score.toFixed(1)} / 100.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-workstation-textMuted">MISSING VALUES</span>
                  <span className="text-workstation-textSecondary">{quality.missing_percentage.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-workstation-textMuted">INVALID INTERVALS</span>
                  <span className="text-workstation-textSecondary">{quality.invalid_percentage.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-workstation-textMuted">ACTIVE ANOMALIES</span>
                  <span className="text-workstation-textSecondary">{quality.warnings.length} detected</span>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-workstation-textMuted">
                <p>Synthetic dataset not loaded</p>
                <span className="text-3xs text-workstation-textMuted/60">Quality engine awaiting sample input</span>
              </div>
            )}
          </div>
          <div className="pt-2 mt-2 border-t border-workstation-borderSubtle text-3xs text-workstation-textMuted flex justify-between">
            <span>PHYSICAL BOUNDS: ENFORCED</span>
            <span>JITTER FILTER: ACTIVE</span>
          </div>
        </div>

        {/* 4. PERFORMANCE SUMMARY (Col span 6) */}
        <div className="col-span-6 bg-workstation-panel border border-workstation-border rounded p-2.5">
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-workstation-borderSubtle">
            <span className="text-3xs uppercase tracking-wider text-workstation-textMuted font-semibold flex items-center space-x-1.5">
              <Zap className="w-3 h-3 text-workstation-accentCyan" />
              <span>PERFORMANCE SUMMARY</span>
            </span>
            <span className="text-3xs text-workstation-textMuted">PS-04</span>
          </div>

          <div className="h-36 flex flex-col items-center justify-center border border-dashed border-workstation-borderSubtle rounded p-4 text-center">
            <p className="text-workstation-textSecondary font-semibold">No analysis available</p>
            <p className="text-3xs text-workstation-textMuted mt-1 max-w-sm">
              Kinematic balance, tyre thermal dissipation rates, and aerodynamic load coefficients will be evaluated when Stage 2 analytical engines are connected.
            </p>
          </div>
        </div>

        {/* 5. LAP DELTA (Col span 6) */}
        <div className="col-span-6 bg-workstation-panel border border-workstation-border rounded p-2.5">
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-workstation-borderSubtle">
            <span className="text-3xs uppercase tracking-wider text-workstation-textMuted font-semibold flex items-center space-x-1.5">
              <Activity className="w-3 h-3 text-workstation-accentCyan" />
              <span>LAP DELTA</span>
            </span>
            <span className="text-3xs text-workstation-textMuted">LD-05</span>
          </div>

          <div className="h-36 flex flex-col items-center justify-center border border-dashed border-workstation-borderSubtle rounded p-4 text-center">
            <p className="text-workstation-textSecondary font-semibold">Waiting for telemetry</p>
            <p className="text-3xs text-workstation-textMuted mt-1 max-w-sm">
              Multi-lap spatial distance alignment requires primary and reference lap traces from the telemetry ingestion engine.
            </p>
          </div>
        </div>

        {/* 6. TELEMETRY STATUS (Col span 6) */}
        <div className="col-span-6 bg-workstation-panel border border-workstation-border rounded p-2.5">
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-workstation-borderSubtle">
            <span className="text-3xs uppercase tracking-wider text-workstation-textMuted font-semibold flex items-center space-x-1.5">
              <FileSpreadsheet className="w-3 h-3 text-workstation-accentCyan" />
              <span>TELEMETRY STATUS</span>
            </span>
            <span className="text-3xs text-workstation-textMuted">TS-06</span>
          </div>

          {telemetryData ? (
            <div className="space-y-2 text-2xs">
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-workstation-surface p-2 border border-workstation-borderSubtle rounded">
                  <div className="text-3xs text-workstation-textMuted">TOTAL INGESTED</div>
                  <div className="text-sm font-semibold text-workstation-textBright">
                    {telemetryData.total_raw_points.toLocaleString()}
                  </div>
                </div>
                <div className="bg-workstation-surface p-2 border border-workstation-borderSubtle rounded">
                  <div className="text-3xs text-workstation-textMuted">VIEW BUFFER</div>
                  <div className="text-sm font-semibold text-workstation-accentCyan">
                    {telemetryData.returned_points.toLocaleString()}
                  </div>
                </div>
                <div className="bg-workstation-surface p-2 border border-workstation-borderSubtle rounded">
                  <div className="text-3xs text-workstation-textMuted">CHANNELS</div>
                  <div className="text-sm font-semibold text-workstation-telemetryGreen">10 SYNC</div>
                </div>
              </div>

              <div className="p-2 bg-workstation-surface border border-workstation-borderSubtle rounded space-y-1 text-3xs text-workstation-textSecondary">
                <div className="flex justify-between">
                  <span>CHANNELS LOGGED:</span>
                  <span className="font-mono text-workstation-textPrimary">Speed, Throttle, Brake, Gear, RPM, DRS, LatAccel, LongAccel</span>
                </div>
                <div className="flex justify-between">
                  <span>DECIMATION ENGINE:</span>
                  <span className="font-mono text-workstation-accentCyan">LTTB (Largest Triangle Three Buckets) Active</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-28 flex flex-col items-center justify-center border border-dashed border-workstation-borderSubtle rounded p-4 text-center">
              <p className="text-workstation-textSecondary font-semibold">Waiting for telemetry</p>
              <p className="text-3xs text-workstation-textMuted mt-1">
                Zero channel points present in local acquisition buffer.
              </p>
            </div>
          )}
        </div>

        {/* 7. MODEL STATUS (Col span 6) */}
        <div className="col-span-6 bg-workstation-panel border border-workstation-border rounded p-2.5">
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-workstation-borderSubtle">
            <span className="text-3xs uppercase tracking-wider text-workstation-textMuted font-semibold flex items-center space-x-1.5">
              <Cpu className="w-3 h-3 text-workstation-accentCyan" />
              <span>MODEL STATUS</span>
            </span>
            <span className="text-3xs text-workstation-textMuted">MS-07</span>
          </div>

          <div className="h-28 flex flex-col items-center justify-center border border-dashed border-workstation-borderSubtle rounded p-4 text-center">
            <p className="text-workstation-textSecondary font-semibold">No analysis available</p>
            <p className="text-3xs text-workstation-textMuted mt-1 max-w-sm">
              Aerodynamic map regression, vehicle kinematic models, and tyre degradation estimators are uninitialized in Stage 1.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
