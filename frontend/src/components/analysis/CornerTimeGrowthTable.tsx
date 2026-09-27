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
      <div className="bg-workstation-panel border border-workstation-border rounded p-4 text-center font-mono text-xs text-workstation-textMuted">
        No corner growth data available.
      </div>
    );
  }

  const formatDelta = (val: number) => {
    const sign = val > 0 ? '+' : '';
    const color =
      val < -0.002
        ? 'text-workstation-telemetryGreen'
        : val > 0.002
        ? 'text-workstation-telemetryAmber'
        : 'text-workstation-textMuted';
    return <span className={color}>{sign}{val.toFixed(3)}s</span>;
  };

  const formatGrowth = (val: number) => {
    const sign = val > 0 ? '+' : '';
    const color =
      val < -0.002
        ? 'text-workstation-telemetryGreen font-bold'
        : val > 0.002
        ? 'text-workstation-telemetryAmber font-bold'
        : 'text-workstation-textMuted';
    return <span className={color}>{sign}{val.toFixed(3)}s</span>;
  };

  return (
    <div className="bg-workstation-panel border border-workstation-border rounded p-3 font-mono text-2xs space-y-2">
      {/* Title Bar */}
      <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-1.5">
        <div className="flex items-center space-x-2">
          <Table className="w-3.5 h-3.5 text-workstation-accentCyan" />
          <span className="font-bold text-workstation-textBright tracking-wider uppercase">
            CORNER TIME GROWTH & PHASE DIVERGENCE ANALYSIS
          </span>
        </div>
        <div className="text-3xs text-workstation-textMuted">
          Click column headers to sort by growth phase
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-workstation-border text-3xs text-workstation-textMuted uppercase bg-workstation-surface/40">
              <th
                className="py-1.5 px-2 cursor-pointer hover:text-workstation-textBright"
                onClick={() => handleSort('turn_number')}
              >
                <div className="flex items-center space-x-1">
                  <span>CORNER</span>
                  {sortField === 'turn_number' ? (
                    sortDirection === 'asc' ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />
                  ) : (
                    <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />
                  )}
                </div>
              </th>
              <th className="py-1.5 px-2 text-right">SPAN (m)</th>
              <th
                className="py-1.5 px-2 text-right cursor-pointer hover:text-workstation-textBright"
                onClick={() => handleSort('entry_delta_time')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>ENTRY Δt</span>
                  {sortField === 'entry_delta_time' && (sortDirection === 'asc' ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />)}
                </div>
              </th>
              <th
                className="py-1.5 px-2 text-right cursor-pointer hover:text-workstation-textBright"
                onClick={() => handleSort('apex_delta_time')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>APEX Δt</span>
                  {sortField === 'apex_delta_time' && (sortDirection === 'asc' ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />)}
                </div>
              </th>
              <th
                className="py-1.5 px-2 text-right cursor-pointer hover:text-workstation-textBright"
                onClick={() => handleSort('exit_delta_time')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>EXIT Δt</span>
                  {sortField === 'exit_delta_time' && (sortDirection === 'asc' ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />)}
                </div>
              </th>
              <th
                className="py-1.5 px-2 text-right cursor-pointer hover:text-workstation-accentCyan bg-workstation-surface/60"
                onClick={() => handleSort('entry_to_apex_growth')}
                title="Entry-to-Apex Divergence = Apex Δt - Entry Δt (Braking & Turn-in)"
              >
                <div className="flex items-center justify-end space-x-1 text-workstation-accentCyan">
                  <span>ENTRY → APEX</span>
                  {sortField === 'entry_to_apex_growth' && (sortDirection === 'asc' ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />)}
                </div>
              </th>
              <th
                className="py-1.5 px-2 text-right cursor-pointer hover:text-workstation-accentCyan bg-workstation-surface/60"
                onClick={() => handleSort('apex_to_exit_growth')}
                title="Apex-to-Exit Divergence = Exit Δt - Apex Δt (Traction & Exit Drive)"
              >
                <div className="flex items-center justify-end space-x-1 text-workstation-accentCyan">
                  <span>APEX → EXIT</span>
                  {sortField === 'apex_to_exit_growth' && (sortDirection === 'asc' ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />)}
                </div>
              </th>
              <th
                className="py-1.5 px-2 text-right cursor-pointer hover:text-workstation-textBright"
                onClick={() => handleSort('total_corner_delta')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>TOTAL CORNER Δ</span>
                  {sortField === 'total_corner_delta' && (sortDirection === 'asc' ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />)}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-workstation-borderSubtle">
            {sortedCorners.map((c) => {
              return (
                <tr
                  key={c.corner_id}
                  className="hover:bg-workstation-surface/60 transition-colors"
                >
                  <td className="py-1.5 px-2">
                    <div className="font-bold text-workstation-textBright">
                      {c.corner_id}{' '}
                      <span className="font-normal text-workstation-textMuted text-3xs">
                        ({c.corner_name.split('(')[0].trim()})
                      </span>
                    </div>
                  </td>
                  <td className="py-1.5 px-2 text-right text-workstation-textMuted text-3xs">
                    {Math.round(c.entry_distance)}m–{Math.round(c.exit_distance)}m
                  </td>
                  <td className="py-1.5 px-2 text-right">{formatDelta(c.entry_delta_time)}</td>
                  <td className="py-1.5 px-2 text-right">{formatDelta(c.apex_delta_time)}</td>
                  <td className="py-1.5 px-2 text-right">{formatDelta(c.exit_delta_time)}</td>
                  <td className="py-1.5 px-2 text-right bg-workstation-surface/40">
                    {formatGrowth(c.entry_to_apex_growth)}
                  </td>
                  <td className="py-1.5 px-2 text-right bg-workstation-surface/40">
                    {formatGrowth(c.apex_to_exit_growth)}
                  </td>
                  <td className="py-1.5 px-2 text-right font-bold">
                    {formatDelta(c.total_corner_delta)}
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
