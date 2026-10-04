import React, { useState, useMemo } from 'react';
import { CornerTimeGrowth } from '../../types/decomposition';
import { Table, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';

interface CornerTimeGrowthTableProps {
  corners: CornerTimeGrowth[];
}

type SortField =
  | 'turn_number'
  | 'entry_delta_time'
  | 'apex_delta_time'
  | 'exit_delta_time'
  | 'entry_to_apex_growth'
  | 'apex_to_exit_growth'
  | 'total_corner_delta';

export const CornerTimeGrowthTable: React.FC<CornerTimeGrowthTableProps> = ({ corners }) => {
  const [sortField, setSortField] = useState<SortField>('turn_number');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedCorners = useMemo(() => {
    return [...corners].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const mult = sortDirection === 'asc' ? 1 : -1;
      return (aVal > bVal ? 1 : aVal < bVal ? -1 : 0) * mult;
    });
  }, [corners, sortField, sortDirection]);

  if (!corners || corners.length === 0) {
    return (
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-4 text-center font-mono text-xs text-[#FFFFFF] shadow-md">
        No corner growth data available.
      </div>
    );
  }

  const formatDelta = (val: number) => {
    const sign = val > 0 ? '+' : '';
    const color =
      val < -0.002
        ? 'text-[#00E676] font-bold'
        : val > 0.002
        ? 'text-[#FFB000] font-bold'
        : 'text-[#94A3B8] font-bold';
    return <span className={color}>{sign}{val.toFixed(3)}s</span>;
  };

  const formatGrowth = (val: number) => {
    const sign = val > 0 ? '+' : '';
    const color =
      val < -0.002
        ? 'text-[#00E676] font-black'
        : val > 0.002
        ? 'text-[#FFB000] font-black'
        : 'text-[#94A3B8] font-bold';
    return <span className={color}>{sign}{val.toFixed(3)}s</span>;
  };

  return (
    <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-0 shadow-md font-mono">
      {/* Title Bar */}
      <div className="window-header-retro bg-[#070E22] border-b border-[#1E3A8A] px-3 py-1.5 flex items-center justify-between text-[#FFFFFF] font-extrabold">
        <div className="flex items-center space-x-2">
          <Table className="w-3.5 h-3.5 text-[#FFFFFF] stroke-[2.5]" />
          <span className="font-extrabold text-[#FFFFFF] uppercase tracking-wider text-2xs">
            [ CORNER TIME GROWTH & PHASE DIVERGENCE ANALYSIS ]
          </span>
        </div>
        <div className="text-3xs text-[#94A3B8] font-bold">
          Click column headers to sort by growth phase
        </div>
      </div>

      {/* Table Container */}
      <div className="p-3">
        <div className="overflow-x-auto border border-[#1E3A8A] shadow">
          <table className="w-full text-left border-collapse bg-[#070E22]">
            <thead>
              <tr className="border-b border-[#1E3A8A] text-3xs text-[#FFFFFF] font-extrabold uppercase bg-[#161D2B]">
                <th
                  className="py-1.5 px-2 cursor-pointer hover:bg-[#070E22]"
                  onClick={() => handleSort('turn_number')}
                >
                  <div className="flex items-center space-x-1">
                    <span>CORNER</span>
                    {sortField === 'turn_number' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-40" />
                    )}
                  </div>
                </th>
                <th className="py-1.5 px-2 text-right">SPAN (m)</th>
                <th
                  className="py-1.5 px-2 text-right cursor-pointer hover:bg-[#070E22]"
                  onClick={() => handleSort('entry_delta_time')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>ENTRY Δt</span>
                    {sortField === 'entry_delta_time' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th
                  className="py-1.5 px-2 text-right cursor-pointer hover:bg-[#070E22]"
                  onClick={() => handleSort('apex_delta_time')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>APEX Δt</span>
                    {sortField === 'apex_delta_time' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th
                  className="py-1.5 px-2 text-right cursor-pointer hover:bg-[#070E22]"
                  onClick={() => handleSort('exit_delta_time')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>EXIT Δt</span>
                    {sortField === 'exit_delta_time' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th
                  className="py-1.5 px-2 text-right cursor-pointer hover:bg-[#070E22] bg-[#0A132E]"
                  onClick={() => handleSort('entry_to_apex_growth')}
                  title="Entry-to-Apex Divergence = Apex Δt - Entry Δt (Braking & Turn-in)"
                >
                  <div className="flex items-center justify-end space-x-1 text-[#FFFFFF] font-black">
                    <span>ENTRY → APEX</span>
                    {sortField === 'entry_to_apex_growth' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th
                  className="py-1.5 px-2 text-right cursor-pointer hover:bg-[#070E22] bg-[#0A132E]"
                  onClick={() => handleSort('apex_to_exit_growth')}
                  title="Apex-to-Exit Divergence = Exit Δt - Apex Δt (Traction & Exit Drive)"
                >
                  <div className="flex items-center justify-end space-x-1 text-[#FFFFFF] font-black">
                    <span>APEX → EXIT</span>
                    {sortField === 'apex_to_exit_growth' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th
                  className="py-1.5 px-2 text-right cursor-pointer hover:bg-[#070E22]"
                  onClick={() => handleSort('total_corner_delta')}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>TOTAL CORNER Δ</span>
                    {sortField === 'total_corner_delta' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/20 text-3xs">
              {sortedCorners.map((c) => {
                return (
                  <tr
                    key={c.corner_id}
                    className="hover:bg-[#0A132E] transition-colors"
                  >
                    <td className="py-1.5 px-2">
                      <div className="font-extrabold text-[#FFFFFF]">
                        <span className="bg-[#0E1A3D] text-[#00F0FF] px-1 py-0.2 border border-[#1E3A8A] mr-1">{c.corner_id}</span>{' '}
                        <span className="font-normal text-[#94A3B8] text-3xs">
                          ({c.corner_name.split('(')[0].trim()})
                        </span>
                      </div>
                    </td>
                    <td className="py-1.5 px-2 text-right text-[#94A3B8] text-3xs font-bold">
                      {Math.round(c.entry_distance)}m–{Math.round(c.exit_distance)}m
                    </td>
                    <td className="py-1.5 px-2 text-right">{formatDelta(c.entry_delta_time)}</td>
                    <td className="py-1.5 px-2 text-right">{formatDelta(c.apex_delta_time)}</td>
                    <td className="py-1.5 px-2 text-right">{formatDelta(c.exit_delta_time)}</td>
                    <td className="py-1.5 px-2 text-right bg-[#070E22]">
                      {formatGrowth(c.entry_to_apex_growth)}
                    </td>
                    <td className="py-1.5 px-2 text-right bg-[#070E22]">
                      {formatGrowth(c.apex_to_exit_growth)}
                    </td>
                    <td className="py-1.5 px-2 text-right font-black">
                      {formatDelta(c.total_corner_delta)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
