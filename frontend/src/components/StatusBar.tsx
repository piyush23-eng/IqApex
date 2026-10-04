import React, { useState, useEffect } from 'react';
import { HardDrive, Cpu, Clock } from 'lucide-react';
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
    <footer className="h-7 bg-[#0A0D15] border-t border-[#1E3A8A] flex items-center justify-between px-3 text-4xs font-mono text-[#94A3B8] select-none shrink-0">
      {/* Left system indicators */}
      <div className="flex items-center space-x-3 divide-x divide-[#1E3A8A]">
        <div className="flex items-center space-x-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isHealthy ? 'bg-[#00E676] shadow-[0_0_6px_#00E676]' : 'bg-[#FFB000]'}`} />
          <span className="text-[#FFFFFF] uppercase font-bold tracking-wider">
            API: {health ? health.status : 'OFFLINE'}
          </span>
          {latencyMs !== null && (
            <span className="text-[#00F0FF] font-bold bg-[#00F0FF]/15 px-1 rounded border border-[#00F0FF]/30">
              {latencyMs}ms
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1.5 pl-3">
          <HardDrive className="w-2.5 h-2.5 text-[#64748B]" />
          <span>
            DB: <span className={health?.database_connected ? 'text-[#00E676] font-bold' : 'text-[#64748B]'}>{health?.database_connected ? 'CONNECTED' : 'STANDBY'}</span>
          </span>
        </div>

        <div className="flex items-center space-x-1.5 pl-3">
          <Cpu className="w-2.5 h-2.5 text-[#64748B]" />
          <span>
            BUFFER: <span className="text-white font-bold">{bufferPointCount.toLocaleString()}</span> SAMPLES
          </span>
          {downsampleActive && (
            <span className="text-[#00F0FF] text-4xs font-bold px-1 rounded bg-[#00F0FF]/15 border border-[#00F0FF]/30">
              LTTB
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1.5 pl-3">
          <span className="text-[#64748B]">ENV:</span>
          <span className="text-white font-bold px-1 bg-[#070E22] rounded border border-[#1E3A8A]">
            {health?.environment || 'DEV'}
          </span>
        </div>
      </div>

      {/* Right clocks and version */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1 text-[#94A3B8]">
          <Clock className="w-2.5 h-2.5 text-[#00F0FF]" />
          <span className="text-white font-medium">{utcTime}</span>
        </div>
        <span className="text-[#1E3A8A]">|</span>
        <span className="text-[#64748B] font-bold uppercase">APEXIQ WORKSTATION v2.0-ATLAS</span>
      </div>
    </footer>
  );
};
