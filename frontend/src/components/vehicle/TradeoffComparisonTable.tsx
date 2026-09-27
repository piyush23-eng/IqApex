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
      <div className="bg-workstation-panel border border-workstation-border rounded p-4 font-mono text-2xs animate-pulse text-workstation-textMuted flex items-center justify-center space-x-2 h-48">
        <ArrowUpDown className="w-4 h-4 animate-spin text-workstation-accentCyan" />
        <span>COMPUTING VEHICLE PERFORMANCE TRADE-OFF MATRIX...</span>
      </div>
    );
  }

  const lapDelta = comparison.modeled_lap_time_delta_s;

  return (
    <div className="bg-workstation-panel border border-workstation-border rounded p-3 font-mono text-2xs space-y-3">
      <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-2">
        <div className="flex items-center space-x-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-workstation-accentCyan" />
          <span className="font-bold text-workstation-textBright uppercase tracking-wider text-xs">
            AERODYNAMIC & VEHICLE TRADE-OFF AUDIT
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-3xs text-workstation-textMuted">MODELLED LAP TIME CONSEQUENCE:</span>
          <span
            className={`font-bold px-2 py-0.5 rounded text-xs ${
              lapDelta < 0
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : lapDelta > 0
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'bg-slate-700 text-slate-300'
            }`}
          >
            {lapDelta > 0 ? `+${lapDelta.toFixed(3)}` : lapDelta.toFixed(3)} s
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-workstation-borderSubtle text-3xs text-workstation-textMuted uppercase">
              <th className="py-1 px-2">PERFORMANCE METRIC</th>
              <th className="py-1 px-2 text-right">BASELINE</th>
              <th className="py-1 px-2 text-right">SCENARIO</th>
              <th className="py-1 px-2 text-right">DELTA</th>
              <th className="py-1 px-2 text-right">95% UNCERTAINTY</th>
              <th className="py-1 px-2 text-center">TRADE-OFF IMPACT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-workstation-borderSubtle/50 text-2xs">
            {comparison.metrics.map((m) => {
              const isPositive = m.delta > 0;
              const isNeutral = Math.abs(m.delta) < 0.0001;

              return (
                <tr key={m.name} className="hover:bg-workstation-surface/30">
                  <td className="py-1.5 px-2 font-medium text-workstation-textBright">
                    {m.name} <span className="text-3xs text-workstation-textMuted font-normal">({m.unit})</span>
                  </td>
                  <td className="py-1.5 px-2 text-right text-workstation-textSecondary">
                    {m.baseline.toLocaleString()}
                  </td>
                  <td className="py-1.5 px-2 text-right text-workstation-textBright font-semibold">
                    {m.scenario.toLocaleString()}
                  </td>
                  <td className="py-1.5 px-2 text-right">
                    <span
                      className={`font-semibold ${
                        isNeutral
                          ? 'text-workstation-textMuted'
                          : m.name.includes('Drag') || m.name.includes('Time')
                          ? isPositive
                            ? 'text-rose-400'
                            : 'text-emerald-400'
                          : isPositive
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {m.delta > 0 ? `+${m.delta.toLocaleString()}` : m.delta.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-1.5 px-2 text-right text-workstation-textMuted text-3xs">
                    ±{m.uncertainty_95.toLocaleString()}
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    <span className="inline-flex items-center space-x-1 text-3xs">
                      {isNeutral ? (
                        <Minus className="w-3 h-3 text-slate-500" />
                      ) : isPositive ? (
                        <TrendingUp className="w-3 h-3 text-workstation-accentCyan" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-amber-400" />
                      )}
                      <span className="text-workstation-textMuted capitalize">
                        {isNeutral ? 'Neutral' : isPositive ? 'Increased' : 'Decreased'}
                      </span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-workstation-surface/40 border border-workstation-borderSubtle rounded p-2 text-3xs text-workstation-textMuted flex items-start space-x-2">
        <AlertCircle className="w-3.5 h-3.5 text-workstation-accentCyan shrink-0 mt-0.5" />
        <span>
          <strong>Engineering Discipline:</strong> Trade-offs must be evaluated holistically. Increasing downforce reduces corner transit time but increases parasitic drag on straights. No arbitrary "Aero Score" is awarded.
        </span>
      </div>
    </div>
  );
};
