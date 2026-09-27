import React from 'react';
import { StraightSimulationItem } from '../../types/vehiclePerformance';
import { FastForward } from 'lucide-react';

interface StraightPerformanceTableProps {
  straights: StraightSimulationItem[];
  totalStraightTime: number;
}

export const StraightPerformanceTable: React.FC<StraightPerformanceTableProps> = ({
  straights,
  totalStraightTime,
}) => {
  return (
    <div className="bg-workstation-panel border border-workstation-border rounded p-3 font-mono text-2xs space-y-3">
      <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-2">
        <div className="flex items-center space-x-2">
          <FastForward className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-bold text-workstation-textBright uppercase tracking-wider text-xs">
            MONZA STRAIGHT-LINE KINEMATICS & NUMERICAL INTEGRATION
          </span>
        </div>

        <div className="flex items-center space-x-2 text-3xs text-workstation-textMuted">
          <span>TOTAL STRAIGHT DURATION:</span>
          <span className="text-workstation-textBright font-bold">{totalStraightTime.toFixed(3)} s</span>
        </div>
      </div>

      <div className="overflow-x-auto max-h-56">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-workstation-surface">
            <tr className="border-b border-workstation-borderSubtle text-3xs text-workstation-textMuted uppercase">
              <th className="py-1 px-2">STRAIGHT NAME</th>
              <th className="py-1 px-2 text-right">LENGTH (m)</th>
              <th className="py-1 px-2 text-right">ENTRY SPEED (km/h)</th>
              <th className="py-1 px-2 text-right">TOP SPEED (km/h)</th>
              <th className="py-1 px-2 text-right">EXIT SPEED (km/h)</th>
              <th className="py-1 px-2 text-right">MEAN ACCEL (g)</th>
              <th className="py-1 px-2 text-right">EXIT DRAG (N)</th>
              <th className="py-1 px-2 text-right">TRANSIT (s)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-workstation-borderSubtle/50 text-2xs">
            {straights.map((s) => (
              <tr key={s.straight_name} className="hover:bg-workstation-surface/30">
                <td className="py-1.5 px-2 font-medium text-workstation-textBright">
                  {s.straight_name}
                </td>
                <td className="py-1.5 px-2 text-right text-workstation-textSecondary">
                  {s.length_m.toFixed(0)}
                </td>
                <td className="py-1.5 px-2 text-right text-workstation-textSecondary">
                  {s.entry_speed_kph.toFixed(1)}
                </td>
                <td className="py-1.5 px-2 text-right font-bold text-workstation-accentCyan">
                  {s.top_speed_kph.toFixed(1)}
                </td>
                <td className="py-1.5 px-2 text-right text-workstation-textBright">
                  {s.exit_speed_kph.toFixed(1)}
                </td>
                <td className="py-1.5 px-2 text-right text-emerald-400 font-semibold">
                  {s.mean_acceleration_g.toFixed(2)} g
                </td>
                <td className="py-1.5 px-2 text-right text-amber-400 font-mono">
                  {s.drag_at_exit_n.toLocaleString()}
                </td>
                <td className="py-1.5 px-2 text-right font-mono text-workstation-textSecondary">
                  {s.transit_time_s.toFixed(3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-3xs text-workstation-textMuted pt-1 border-t border-workstation-borderSubtle">
        <span>INTEGRATION: FORWARD EULER dt = 50ms | a = (P·η/v - F_drag - F_roll) / m</span>
        <span>AUTODROMO NAZIONALE MONZA (5 SECTORS)</span>
      </div>
    </div>
  );
};
