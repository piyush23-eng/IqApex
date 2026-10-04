import React from 'react';
import { VehicleComparisonResponse } from '../../types/vehiclePerformance';
import { ArrowUpDown, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TradeoffComparisonTableProps {
  comparison: VehicleComparisonResponse | null;
  isLoading: boolean;
}

export const TradeoffComparisonTable: React.FC<TradeoffComparisonTableProps> = ({
  comparison,
  isLoading,
}) => {
  if (isLoading || !comparison) {
    return (
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-4 font-mono text-2xs text-[#FFFFFF] flex items-center justify-center space-x-2 h-48 shadow-md">
        <ArrowUpDown className="w-4 h-4 animate-spin text-[#FFFFFF]" />
        <span className="font-bold uppercase">[ COMPUTING VEHICLE PERFORMANCE TRADE-OFF MATRIX... ]</span>
      </div>
    );
  }

  const lapDelta = comparison.modeled_lap_time_delta_s;

  return (
    <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-3 font-mono text-2xs space-y-3 shadow-md">
      {/* Titanium Header */}
      <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-2 bg-[#070E22] p-2 -mx-3 -mt-3 mb-2">
        <div className="flex items-center space-x-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#FFFFFF]" />
          <span className="font-bold text-[#FFFFFF] uppercase tracking-wider text-xs">
            [ AERODYNAMIC & VEHICLE TRADE-OFF AUDIT ]
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-3xs text-[#FFFFFF] font-bold uppercase">MODELLED LAP TIME CONSEQUENCE:</span>
          <span
            className={`font-black px-2 py-0.5 border border-[#1E3A8A] text-xs ${
              lapDelta < 0
                ? 'bg-[#00F0FF] text-[#FFFFFF]'
                : lapDelta > 0
                ? 'bg-[#0E1A3D] text-[#FBBF24] border border-[#FBBF24]/50 text-[#FFB000]'
                : 'bg-[#070E22] text-[#FFFFFF]'
            }`}
          >
            {lapDelta > 0 ? `+${lapDelta.toFixed(3)}` : lapDelta.toFixed(3)} s
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse border border-[#1E3A8A] bg-[#070E22] shadow">
          <thead>
            <tr className="border-b border-[#1E3A8A] text-3xs text-[#FFFFFF] bg-[#0A0D15] font-bold uppercase">
              <th className="py-2 px-3 border-r border-[#1E3A8A]">[ PERFORMANCE METRIC ]</th>
              <th className="py-2 px-3 text-right border-r border-[#1E3A8A]">[ BASELINE ]</th>
              <th className="py-2 px-3 text-right border-r border-[#1E3A8A]">[ SCENARIO ]</th>
              <th className="py-2 px-3 text-right border-r border-[#1E3A8A]">[ DELTA ]</th>
              <th className="py-2 px-3 text-right border-r border-[#1E3A8A]">[ 95% UNCERTAINTY ]</th>
              <th className="py-2 px-3 text-center">[ TRADE-OFF IMPACT ]</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black text-2xs">
            {comparison.metrics.map((m) => {
              const isPositive = m.delta > 0;
              const isNeutral = Math.abs(m.delta) < 0.0001;

              return (
                <tr key={m.name} className="hover:bg-[#0E1A3D] transition-colors">
                  <td className="py-1.5 px-3 font-bold text-[#FFFFFF] border-r border-[#1E3A8A]">
                    {m.name} <span className="text-3xs text-[#94A3B8] font-normal">({m.unit})</span>
                  </td>
                  <td className="py-1.5 px-3 text-right text-[#94A3B8] font-bold border-r border-[#1E3A8A]">
                    {m.baseline.toLocaleString()}
                  </td>
                  <td className="py-1.5 px-3 text-right text-[#FFFFFF] font-black border-r border-[#1E3A8A]">
                    {m.scenario.toLocaleString()}
                  </td>
                  <td className="py-1.5 px-3 text-right font-black border-r border-[#1E3A8A]">
                    <span
                      className={
                        isNeutral
                          ? 'text-[#94A3B8]'
                          : m.name.includes('Drag') || m.name.includes('Time')
                          ? isPositive
                            ? 'text-[#FFB000]'
                            : 'text-[#00E676]'
                          : isPositive
                          ? 'text-[#00E676]'
                          : 'text-[#FFB000]'
                      }
                    >
                      {m.delta > 0 ? `+${m.delta.toLocaleString()}` : m.delta.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-1.5 px-3 text-right text-[#94A3B8] font-bold text-3xs border-r border-[#1E3A8A]">
                    ±{m.uncertainty_95.toLocaleString()}
                  </td>
                  <td className="py-1.5 px-3 text-center">
                    <span className="inline-flex items-center space-x-1 text-3xs font-bold">
                      {isNeutral ? (
                        <Minus className="w-3 h-3 text-[#94A3B8]" />
                      ) : isPositive ? (
                        <TrendingUp className="w-3 h-3 text-[#FFFFFF]" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-[#FFFFFF]" />
                      )}
                      <span className="text-[#FFFFFF] uppercase">
                        [ {isNeutral ? 'Neutral' : isPositive ? 'Increased' : 'Decreased'} ]
                      </span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-[#0A0D15] border border-[#1E3A8A] p-2 text-3xs text-[#FFFFFF] font-bold flex items-start space-x-2 shadow-sm">
        <AlertCircle className="w-3.5 h-3.5 text-[#FFFFFF] shrink-0 mt-0.5" />
        <span>
          <strong>ENGINEERING DISCIPLINE:</strong> Trade-offs must be evaluated holistically. Increasing downforce reduces corner transit time but increases parasitic drag on straights. No arbitrary &quot;Aero Score&quot; is awarded.
        </span>
      </div>
    </div>
  );
};
