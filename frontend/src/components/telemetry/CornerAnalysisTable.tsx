import React, { useState } from 'react';
import { CornerMetric } from '../../types/domain';
import { ArrowUpDown, ArrowUp, ArrowDown, MapPin } from 'lucide-react';

interface CornerAnalysisTableProps {
  corners: CornerMetric[];
  selectedCornerId: string | null;
  onSelectCorner: (corner: CornerMetric) => void;
}

type SortField =
  | 'turn_number'
  | 'corner_time_delta'
  | 'exit_speed_delta'
  | 'min_speed_delta'
  | 'entry_speed_delta'
  | 'cumulative_time_delta_exit';

export const CornerAnalysisTable: React.FC<CornerAnalysisTableProps> = ({
  corners,
  selectedCornerId,
  onSelectCorner,
}) => {
  const [sortField, setSortField] = useState<SortField>('turn_number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleHeaderClick = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'turn_number' ? 'asc' : 'desc');
    }
  };

  const sortedCorners = [...corners].sort((a, b) => {
    let diff = 0;
    if (sortField === 'turn_number') {
      diff = a.turn_number - b.turn_number;
    } else if (sortField === 'corner_time_delta') {
      diff = Math.abs(a.corner_time_delta) - Math.abs(b.corner_time_delta);
    } else if (sortField === 'exit_speed_delta') {
      diff = Math.abs(a.exit_speed_delta) - Math.abs(b.exit_speed_delta);
    } else if (sortField === 'min_speed_delta') {
      diff = Math.abs(a.min_speed_delta) - Math.abs(b.min_speed_delta);
    } else if (sortField === 'entry_speed_delta') {
      diff = Math.abs(a.entry_speed_delta) - Math.abs(b.entry_speed_delta);
    } else if (sortField === 'cumulative_time_delta_exit') {
      diff = Math.abs(a.cumulative_time_delta_exit) - Math.abs(b.cumulative_time_delta_exit);
    }
    return sortOrder === 'desc' ? -diff : diff;
  });

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-2.5 h-2.5 opacity-40 ml-1 inline-block" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-2.5 h-2.5 text-[#FFFFFF] ml-1 inline-block" />
    ) : (
      <ArrowDown className="w-2.5 h-2.5 text-[#FFFFFF] ml-1 inline-block" />
    );
  };

  return (
    <div className="window-retro font-mono text-2xs select-none overflow-hidden my-3">
      {/* Table Header Strip */}
      <div className="window-header-retro flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MapPin className="w-3.5 h-3.5 text-[#FFFFFF]" />
          <span className="font-bold text-[#FFFFFF] uppercase text-2xs tracking-wider">
            [ CORNER KINEMATIC ANALYSIS & PERFORMANCE DIVERGENCE ]
          </span>
          <span className="text-gray-400">|</span>
          <span className="text-3xs text-[#CBD5E1]">
            Click any row to focus synchronized telemetry and cursor on apex
          </span>
        </div>

        <div className="flex items-center space-x-2 text-3xs">
          <span className="text-[#93C5FD]">Sorted by:</span>
          <span className="bg-[#0062FF] text-[#FFFFFF] px-1.5 py-0.5 border border-[#00F0FF] font-black uppercase shadow-matrix-glow">{sortField.replace(/_/g, ' ')}</span>
        </div>
      </div>

      {/* Engineering Data Table */}
      <div className="overflow-x-auto max-h-72 bg-[#070E22]">
        <table className="w-full text-left text-2xs border-collapse">
          <thead className="bg-[#070E22] sticky top-0 z-10 text-3xs text-[#FFFFFF] uppercase border-b border-[#1E3A8A] font-bold">
            <tr>
              <th
                className="py-1.5 px-2.5 cursor-pointer hover:bg-[#070E22]"
                onClick={() => handleHeaderClick('turn_number')}
              >
                Corner {renderSortIcon('turn_number')}
              </th>
              <th className="py-1.5 px-2 text-right">Distance Span</th>
              <th
                className="py-1.5 px-2 text-right cursor-pointer hover:bg-[#070E22]"
                onClick={() => handleHeaderClick('entry_speed_delta')}
              >
                Entry Speed [km/h] {renderSortIcon('entry_speed_delta')}
              </th>
              <th
                className="py-1.5 px-2 text-right cursor-pointer hover:bg-[#070E22]"
                onClick={() => handleHeaderClick('min_speed_delta')}
              >
                Min Speed [km/h] {renderSortIcon('min_speed_delta')}
              </th>
              <th className="py-1.5 px-2 text-right">Apex Loc</th>
              <th
                className="py-1.5 px-2 text-right cursor-pointer hover:bg-[#070E22]"
                onClick={() => handleHeaderClick('exit_speed_delta')}
              >
                Exit Speed [km/h] {renderSortIcon('exit_speed_delta')}
              </th>
              <th className="py-1.5 px-2 text-right">Braking Pt</th>
              <th className="py-1.5 px-2 text-right">Throttle Pickup</th>
              <th
                className="py-1.5 px-2 text-right cursor-pointer hover:bg-[#070E22]"
                onClick={() => handleHeaderClick('corner_time_delta')}
              >
                Corner Time [s] {renderSortIcon('corner_time_delta')}
              </th>
              <th
                className="py-1.5 px-2.5 text-right cursor-pointer hover:bg-[#070E22]"
                onClick={() => handleHeaderClick('cumulative_time_delta_exit')}
              >
                Exit Δt [s] {renderSortIcon('cumulative_time_delta_exit')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E0E0E0] text-[#FFFFFF]">
            {sortedCorners.map((c) => {
              const isSelected = selectedCornerId === c.corner_id;
              const timeColor =
                c.corner_time_delta < 0
                  ? 'text-[#00E676] font-bold'
                  : c.corner_time_delta > 0
                  ? 'text-[#FF3366] font-bold'
                  : 'text-[#94A3B8]';

              const exitSpeedColor =
                c.exit_speed_delta > 0
                  ? 'text-[#00E676] font-bold'
                  : c.exit_speed_delta < 0
                  ? 'text-[#FF3366] font-bold'
                  : 'text-[#94A3B8]';

              const minSpeedColor =
                c.min_speed_delta > 0
                  ? 'text-[#00E676] font-bold'
                  : c.min_speed_delta < 0
                  ? 'text-[#FF3366] font-bold'
                  : 'text-[#94A3B8]';

              return (
                <tr
                  key={c.corner_id}
                  onClick={() => onSelectCorner(c)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#0062FF]/20 text-[#FFFFFF] border-l-4 border-[#00F0FF] shadow-matrix-glow font-semibold'
                      : 'hover:bg-[#0062FF]/10'
                  }`}
                >
                  {/* Corner ID and Name */}
                  <td className="py-1.5 px-2.5 whitespace-nowrap">
                    <span className="font-bold text-[#FFFFFF] mr-1.5 bg-[#0E1A3D] text-[#00F0FF] px-1 py-0.5 border border-[#1E3A8A]">{c.corner_id}</span>
                    <span className="text-[#FFFFFF] font-semibold">{c.corner_name}</span>
                  </td>

                  {/* Distance Span */}
                  <td className="py-1.5 px-2 text-right text-[#94A3B8] whitespace-nowrap">
                    {Math.round(c.entry_distance)}m → {Math.round(c.exit_distance)}m
                  </td>

                  {/* Entry Speed */}
                  <td className="py-1.5 px-2 text-right whitespace-nowrap">
                    <span className="text-[#94A3B8] mr-1">{c.ref_entry_speed.toFixed(0)}</span>
                    <span className="text-[#FFFFFF] font-medium mr-1">{c.comp_entry_speed.toFixed(0)}</span>
                    <span
                      className={`text-3xs font-bold ${
                        c.entry_speed_delta > 0
                          ? 'text-[#00E676]'
                          : c.entry_speed_delta < 0
                          ? 'text-[#FF3366]'
                          : 'text-[#94A3B8]'
                      }`}
                    >
                      ({c.entry_speed_delta > 0 ? '+' : ''}{c.entry_speed_delta.toFixed(1)})
                    </span>
                  </td>

                  {/* Min Speed */}
                  <td className="py-1.5 px-2 text-right whitespace-nowrap">
                    <span className="text-[#94A3B8] mr-1">{c.ref_min_speed.toFixed(0)}</span>
                    <span className="text-[#FFFFFF] font-medium mr-1">{c.comp_min_speed.toFixed(0)}</span>
                    <span className={`text-3xs font-bold ${minSpeedColor}`}>
                      ({c.min_speed_delta > 0 ? '+' : ''}{c.min_speed_delta.toFixed(1)})
                    </span>
                  </td>

                  {/* Apex Location */}
                  <td className="py-1.5 px-2 text-right text-[#FFFFFF] font-medium whitespace-nowrap">
                    {Math.round(c.comp_apex_distance)}m
                    {c.comp_apex_distance !== c.ref_apex_distance && (
                      <span className="text-3xs text-[#94A3B8] ml-1">
                        ({c.comp_apex_distance > c.ref_apex_distance ? '+' : ''}
                        {(c.comp_apex_distance - c.ref_apex_distance).toFixed(0)}m)
                      </span>
                    )}
                  </td>

                  {/* Exit Speed */}
                  <td className="py-1.5 px-2 text-right whitespace-nowrap">
                    <span className="text-[#94A3B8] mr-1">{c.ref_exit_speed.toFixed(0)}</span>
                    <span className="text-[#FFFFFF] font-medium mr-1">{c.comp_exit_speed.toFixed(0)}</span>
                    <span className={`text-3xs font-bold ${exitSpeedColor}`}>
                      ({c.exit_speed_delta > 0 ? '+' : ''}{c.exit_speed_delta.toFixed(1)})
                    </span>
                  </td>

                  {/* Braking Point */}
                  <td className="py-1.5 px-2 text-right text-[#FFFFFF] font-medium whitespace-nowrap">
                    {c.comp_braking_point ? `${Math.round(c.comp_braking_point)}m` : '---'}
                    {c.braking_point_delta !== null && (
                      <span className="text-3xs text-[#94A3B8] ml-1">
                        ({c.braking_point_delta > 0 ? '+' : ''}{c.braking_point_delta}m)
                      </span>
                    )}
                  </td>

                  {/* Throttle Pickup */}
                  <td className="py-1.5 px-2 text-right text-[#FFFFFF] font-medium whitespace-nowrap">
                    {c.comp_throttle_pickup ? `${Math.round(c.comp_throttle_pickup)}m` : '---'}
                    {c.throttle_pickup_delta !== null && (
                      <span className="text-3xs text-[#94A3B8] ml-1">
                        ({c.throttle_pickup_delta > 0 ? '+' : ''}{c.throttle_pickup_delta}m)
                      </span>
                    )}
                  </td>

                  {/* Corner Time & Delta */}
                  <td className="py-1.5 px-2 text-right whitespace-nowrap">
                    <span className="text-[#94A3B8] mr-1">{c.ref_corner_time.toFixed(3)}s</span>
                    <span className={`font-bold ${timeColor}`}>
                      {c.corner_time_delta > 0 ? '+' : ''}{c.corner_time_delta.toFixed(3)}s
                    </span>
                  </td>

                  {/* Cumulative Delta at Exit */}
                  <td className="py-1.5 px-2.5 text-right whitespace-nowrap">
                    <span
                      className={`font-bold ${
                        c.cumulative_time_delta_exit < 0
                          ? 'text-[#00E676]'
                          : 'text-[#FF3366]'
                      }`}
                    >
                      {c.cumulative_time_delta_exit > 0 ? '+' : ''}{c.cumulative_time_delta_exit.toFixed(3)}s
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
