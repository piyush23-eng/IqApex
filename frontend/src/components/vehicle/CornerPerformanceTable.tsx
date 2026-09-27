import React from 'react';
import { CornerSimulationItem } from '../../types/vehiclePerformance';
import { Compass } from 'lucide-react';

interface CornerPerformanceTableProps {
  corners: CornerSimulationItem[];
  totalCornerTime: number;
}

export const CornerPerformanceTable: React.FC<CornerPerformanceTableProps> = ({
  corners,
  totalCornerTime,
}) => {
  return (
    <div className="bg-workstation-panel border border-workstation-border rounded p-3 font-mono text-2xs space-y-3">
      <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-2">
        <div className="flex items-center space-x-2">
          <Compass className="w-3.5 h-3.5 text-workstation-accentCyan" />
          <span className="font-bold text-workstation-textBright uppercase tracking-wider text-xs">
            MONZA CORNER KINEMATICS & LATERAL EQUILIBRIUM
          </span>
        </div>

        <div className="flex items-center space-x-2 text-3xs text-workstation-textMuted">
          <span>TOTAL CORNER DURATION:</span>
          <span className="text-workstation-textBright font-bold">{totalCornerTime.toFixed(3)} s</span>
        </div>
      </div>

      <div className="overflow-x-auto max-h-56">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-workstation-surface">
            <tr className="border-b border-workstation-borderSubtle text-3xs text-workstation-textMuted uppercase">
              <th className="py-1 px-2">ID</th>
              <th className="py-1 px-2">CORNER NAME</th>
              <th className="py-1 px-2 text-right">RADIUS (m)</th>
              <th className="py-1 px-2 text-right">DOWNFORCE (N)</th>
              <th className="py-1 px-2 text-right">F_LAT,MAX (N)</th>
              <th className="py-1 px-2 text-right">LAT ACCEL (g)</th>
              <th className="py-1 px-2 text-right">V_MAX (km/h)</th>
              <th className="py-1 px-2 text-right">TRANSIT (s)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-workstation-borderSubtle/50 text-2xs">
            {corners.map((c) => (
              <tr key={c.corner_id} className="hover:bg-workstation-surface/30">
                <td className="py-1.5 px-2 font-bold text-workstation-accentCyan">{c.corner_id}</td>
                <td className="py-1.5 px-2 text-workstation-textBright truncate max-w-[140px]" title={c.corner_name}>
                  {c.corner_name}
                </td>
                <td className="py-1.5 px-2 text-right text-workstation-textSecondary">
                  {c.curvature_radius_m.toFixed(0)}
                </td>
                <td className="py-1.5 px-2 text-right text-workstation-textSecondary">
                  {c.downforce_n.toLocaleString()}
                </td>
                <td className="py-1.5 px-2 text-right text-workstation-textSecondary">
                  {c.max_lateral_force_n.toLocaleString()}
                </td>
                <td className="py-1.5 px-2 text-right font-semibold text-emerald-400">
                  {c.max_lateral_accel_g.toFixed(2)} g
                </td>
                <td className="py-1.5 px-2 text-right font-semibold text-workstation-textBright">
                  {c.max_corner_speed_kph.toFixed(1)}
                </td>
                <td className="py-1.5 px-2 text-right font-mono text-workstation-textSecondary">
                  {c.transit_time_s.toFixed(3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-3xs text-workstation-textMuted pt-1 border-t border-workstation-borderSubtle">
        <span>MODEL: POINT-MASS QUASI-STEADY LATERAL EQUILIBRIUM: F_lat,max = μ · (m·g + D)</span>
        <span>AUTODROMO NAZIONALE MONZA (11 TURNS)</span>
      </div>
    </div>
  );
};
