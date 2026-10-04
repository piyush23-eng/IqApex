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
    <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-3 font-mono text-2xs space-y-3 shadow-md">
      {/* Titanium Header */}
      <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-2 bg-[#070E22] p-2 -mx-3 -mt-3 mb-2">
        <div className="flex items-center space-x-2">
          <FastForward className="w-3.5 h-3.5 text-[#FFFFFF]" />
          <span className="font-bold text-[#FFFFFF] uppercase tracking-wider text-xs">
            [ MONZA STRAIGHT-LINE KINEMATICS & NUMERICAL INTEGRATION ]
          </span>
        </div>

        <div className="flex items-center space-x-2 text-3xs text-[#FFFFFF] font-bold">
          <span>TOTAL STRAIGHT DURATION:</span>
          <span className="bg-[#070E22] px-1.5 py-0.5 border border-[#1E3A8A] font-black">{totalStraightTime.toFixed(3)} s</span>
        </div>
      </div>

      <div className="overflow-x-auto max-h-56">
        <table className="w-full text-left border-collapse border border-[#1E3A8A] bg-[#070E22] shadow">
          <thead className="sticky top-0 bg-[#0A0D15]">
            <tr className="border-b border-[#1E3A8A] text-3xs text-[#FFFFFF] font-bold uppercase">
              <th className="py-1.5 px-2 border-r border-[#1E3A8A]">[ STRAIGHT NAME ]</th>
              <th className="py-1.5 px-2 text-right border-r border-[#1E3A8A]">[ LENGTH (m) ]</th>
              <th className="py-1.5 px-2 text-right border-r border-[#1E3A8A]">[ ENTRY V (km/h) ]</th>
              <th className="py-1.5 px-2 text-right border-r border-[#1E3A8A]">[ TOP V (km/h) ]</th>
              <th className="py-1.5 px-2 text-right border-r border-[#1E3A8A]">[ EXIT V (km/h) ]</th>
              <th className="py-1.5 px-2 text-right border-r border-[#1E3A8A]">[ MEAN ACCEL (g) ]</th>
              <th className="py-1.5 px-2 text-right border-r border-[#1E3A8A]">[ EXIT DRAG (N) ]</th>
              <th className="py-1.5 px-2 text-right">[ TRANSIT (s) ]</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black text-2xs">
            {straights.map((s) => (
              <tr key={s.straight_name} className="hover:bg-[#0E1A3D] transition-colors">
                <td className="py-1.5 px-2 font-bold text-[#FFFFFF] border-r border-[#1E3A8A]">
                  {s.straight_name}
                </td>
                <td className="py-1.5 px-2 text-right text-[#94A3B8] font-bold border-r border-[#1E3A8A]">
                  {s.length_m.toFixed(0)}
                </td>
                <td className="py-1.5 px-2 text-right text-[#94A3B8] font-bold border-r border-[#1E3A8A]">
                  {s.entry_speed_kph.toFixed(1)}
                </td>
                <td className="py-1.5 px-2 text-right font-black text-[#FFFFFF] border-r border-[#1E3A8A]">
                  {s.top_speed_kph.toFixed(1)}
                </td>
                <td className="py-1.5 px-2 text-right text-[#FFFFFF] font-bold border-r border-[#1E3A8A]">
                  {s.exit_speed_kph.toFixed(1)}
                </td>
                <td className="py-1.5 px-2 text-right text-[#00E676] font-black border-r border-[#1E3A8A]">
                  {s.mean_acceleration_g.toFixed(2)} g
                </td>
                <td className="py-1.5 px-2 text-right text-[#FFB000] font-mono font-bold border-r border-[#1E3A8A]">
                  {s.drag_at_exit_n.toLocaleString()}
                </td>
                <td className="py-1.5 px-2 text-right font-mono font-bold text-[#FFFFFF]">
                  {s.transit_time_s.toFixed(3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-3xs text-[#CBD5E1] font-bold pt-1.5 border-t border-[#1E3A8A]">
        <span>INTEGRATION: FORWARD EULER dt = 50ms | a = (P·η/v - F_drag - F_roll) / m</span>
        <span>AUTODROMO NAZIONALE MONZA (5 SECTORS)</span>
      </div>
    </div>
  );
};
