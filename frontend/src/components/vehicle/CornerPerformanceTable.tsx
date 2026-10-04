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
    <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-3 font-mono text-2xs space-y-3 shadow-md">
      {/* Titanium Header */}
      <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-2 bg-[#070E22] p-2 -mx-3 -mt-3 mb-2">
        <div className="flex items-center space-x-2">
          <Compass className="w-3.5 h-3.5 text-[#FFFFFF]" />
          <span className="font-bold text-[#FFFFFF] uppercase tracking-wider text-xs">
            [ MONZA CORNER KINEMATICS & LATERAL EQUILIBRIUM ]
          </span>
        </div>

        <div className="flex items-center space-x-2 text-3xs text-[#FFFFFF] font-bold">
          <span>TOTAL CORNER DURATION:</span>
          <span className="bg-[#070E22] px-1.5 py-0.5 border border-[#1E3A8A] font-black">{totalCornerTime.toFixed(3)} s</span>
        </div>
      </div>

      <div className="overflow-x-auto max-h-56">
        <table className="w-full text-left border-collapse border border-[#1E3A8A] bg-[#070E22] shadow">
          <thead className="sticky top-0 bg-[#0A0D15]">
            <tr className="border-b border-[#1E3A8A] text-3xs text-[#FFFFFF] font-bold uppercase">
              <th className="py-1.5 px-2 border-r border-[#1E3A8A]">[ ID ]</th>
              <th className="py-1.5 px-2 border-r border-[#1E3A8A]">[ CORNER NAME ]</th>
              <th className="py-1.5 px-2 text-right border-r border-[#1E3A8A]">[ RADIUS (m) ]</th>
              <th className="py-1.5 px-2 text-right border-r border-[#1E3A8A]">[ DOWNFORCE (N) ]</th>
              <th className="py-1.5 px-2 text-right border-r border-[#1E3A8A]">[ F_LAT,MAX (N) ]</th>
              <th className="py-1.5 px-2 text-right border-r border-[#1E3A8A]">[ LAT ACCEL (g) ]</th>
              <th className="py-1.5 px-2 text-right border-r border-[#1E3A8A]">[ V_MAX (km/h) ]</th>
              <th className="py-1.5 px-2 text-right">[ TRANSIT (s) ]</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black text-2xs">
            {corners.map((c) => (
              <tr key={c.corner_id} className="hover:bg-[#0E1A3D] transition-colors">
                <td className="py-1.5 px-2 font-bold text-[#FFFFFF] border-r border-[#1E3A8A]">{c.corner_id}</td>
                <td className="py-1.5 px-2 text-[#FFFFFF] font-semibold truncate max-w-[140px] border-r border-[#1E3A8A]" title={c.corner_name}>
                  {c.corner_name}
                </td>
                <td className="py-1.5 px-2 text-right text-[#94A3B8] font-bold border-r border-[#1E3A8A]">
                  {c.curvature_radius_m.toFixed(0)}
                </td>
                <td className="py-1.5 px-2 text-right text-[#94A3B8] font-bold border-r border-[#1E3A8A]">
                  {c.downforce_n.toLocaleString()}
                </td>
                <td className="py-1.5 px-2 text-right text-[#94A3B8] font-bold border-r border-[#1E3A8A]">
                  {c.max_lateral_force_n.toLocaleString()}
                </td>
                <td className="py-1.5 px-2 text-right font-black text-[#00E676] border-r border-[#1E3A8A]">
                  {c.max_lateral_accel_g.toFixed(2)} g
                </td>
                <td className="py-1.5 px-2 text-right font-black text-[#FFFFFF] border-r border-[#1E3A8A]">
                  {c.max_corner_speed_kph.toFixed(1)}
                </td>
                <td className="py-1.5 px-2 text-right font-mono font-bold text-[#FFFFFF]">
                  {c.transit_time_s.toFixed(3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-3xs text-[#CBD5E1] font-bold pt-1.5 border-t border-[#1E3A8A]">
        <span>MODEL: POINT-MASS QUASI-STEADY LATERAL EQUILIBRIUM: F_lat,max = μ · (m·g + D)</span>
        <span>AUTODROMO NAZIONALE MONZA (11 TURNS)</span>
      </div>
    </div>
  );
};
