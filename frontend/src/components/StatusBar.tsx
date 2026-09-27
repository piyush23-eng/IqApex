import React, { useState, useEffect } from 'react';
import { HardDrive, Cpu, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { HealthResponse } from '../types/domain';

interface StatusBarProps {
  health: HealthResponse | null;
  latencyMs: number | null;
  bufferPointCount: number;
  downsampleActive: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  health,
  latencyMs,
  bufferPointCount,
  downsampleActive,
}) => {
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toISOString().substring(11, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isHealthy = health?.status === 'OPERATIONAL';

  return (
    <footer className="h-6 bg-workstation-panel border-t border-workstation-border flex items-center justify-between px-3 text-3xs font-mono text-workstation-textMuted select-none">
      {/* Left system indicators */}
      <div className="flex items-center space-x-4 divide-x divide-workstation-borderSubtle">
        <div className="flex items-center space-x-1.5">
          {isHealthy ? (
            <CheckCircle2 className="w-3 h-3 text-workstation-telemetryGreen" />
          ) : (
            <AlertTriangle className="w-3 h-3 text-workstation-telemetryAmber" />
          )}
          <span className="text-workstation-textSecondary uppercase font-medium">
            API: {health ? health.status : 'CONNECTING...'}
          </span>
          {latencyMs !== null && (
            <span className="text-workstation-textMuted">({latencyMs}ms)</span>
          )}
        </div>

        <div className="flex items-center space-x-1.5 pl-3">
          <HardDrive className="w-3 h-3 text-workstation-textMuted" />
          <span>DB: {health?.database_connected ? 'CONNECTED' : 'DISCONNECTED'}</span>
        </div>

        <div className="flex items-center space-x-1.5 pl-3">
          <Cpu className="w-3 h-3 text-workstation-textMuted" />
          <span>BUFFER: {bufferPointCount.toLocaleString()} SAMPLES</span>
          {downsampleActive && (
            <span className="text-workstation-accentCyan text-3xs px-1 border border-workstation-accentCyan/30 rounded">
              LTTB DOWNSAMPLED
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1.5 pl-3">
          <span>ENV: {health?.environment || 'DEV'}</span>
        </div>
      </div>

      {/* Right clocks and version */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3 text-workstation-textMuted" />
          <span className="text-workstation-textSecondary">{utcTime}</span>
        </div>
        <span className="text-workstation-border">|</span>
        <span className="text-workstation-textMuted">ApexIQ Engine v0.1.0</span>
      </div>
    </footer>
  );
};
