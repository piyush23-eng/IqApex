import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { SensitivityMatrixItem, SensitivityMatrixResponse } from '../types/optimization';
import { Activity, Search, Filter, ShieldCheck, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';

interface SensitivityPageProps {
  onNavigateToOptimization?: (cornerId: string, paramName: string) => void;
}

export const SensitivityPage: React.FC<SensitivityPageProps> = ({
  onNavigateToOptimization,
}) => {
  const [data, setData] = useState<SensitivityMatrixResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchCorner, setSearchCorner] = useState<string>('');
  const [selectedParamFilter, setSelectedParamFilter] = useState<string>('all');

  const fetchSensitivity = async () => {
    setIsLoading(true);
    try {
      const res = await api.getSensitivityMatrix('demo-session-monza-2026');
      setData(res);
    } catch (err) {
      console.error('Failed to load sensitivity matrix:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSensitivity();
  }, []);

  const filteredItems = useMemo(() => {
    if (!data) return [];
    return data.items.filter((item) => {
      const matchCorner =
        item.corner_id.toLowerCase().includes(searchCorner.toLowerCase()) ||
        item.corner_name.toLowerCase().includes(searchCorner.toLowerCase());
      const matchParam =
        selectedParamFilter === 'all' || item.parameter_name === selectedParamFilter;
      return matchCorner && matchParam;
    });
  }, [data, searchCorner, selectedParamFilter]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#030712] p-4 space-y-4 font-mono text-2xs select-none text-[#FFFFFF]">
      {/* Header */}
      <div className="matrix-hud-card scanline-container bg-[#0A132E] border border-[#1E3A8A] p-3 space-y-2 shadow-md relative">
        <div className="scan-beam" />
        <div className="flex flex-wrap items-center justify-between border-b border-[#1E3A8A] pb-2 gap-2 relative z-10">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-[#00F0FF] rounded-full animate-ping shadow-[0_0_8px_#00F0FF]" />
            <Activity className="w-4 h-4 text-[#0062FF] stroke-[2.5]" />
            <span className="font-black text-[#FFFFFF] tracking-wider uppercase text-xs font-mono">
              [ PERFORMANCE PARAMETER SENSITIVITY MATRIX (∂Δt / ∂X) ]
            </span>
            <span className="text-[#3B82F6] font-bold">|</span>
            <span className="text-[#93C5FD] font-bold">CIRCUIT: AUTODROMO NAZIONALE MONZA</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 bg-[#0062FF] text-[#FFFFFF] border border-[#00F0FF] font-black text-4xs shadow-matrix-glow flex items-center space-x-1">
              <AlertCircle className="w-3 h-3 text-[#00F0FF] stroke-[2.5]" />
              <span>SYNTHETIC CALIBRATION DATASET ✕</span>
            </span>
            <button
              onClick={fetchSensitivity}
              disabled={isLoading}
              className="btn-matrix-blue text-3xs flex items-center space-x-1 shadow"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>[ REFRESH ]</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between pt-1 gap-2 relative z-10">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-[#00F0FF] absolute left-2 pointer-events-none" />
              <input
                type="text"
                placeholder="[ Filter corner: T9, Ascari... ]"
                value={searchCorner}
                onChange={(e) => setSearchCorner(e.target.value)}
                className="bg-[#070E22] border border-[#1E3A8A] text-[#FFFFFF] pl-7 pr-2 py-1 text-2xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0062FF] w-64 shadow-sm"
              />
            </div>

            <div className="flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5 text-[#93C5FD] stroke-[2.5]" />
              <span className="text-3xs text-[#93C5FD] font-extrabold uppercase mr-1">PARAMETER:</span>
              {['all', 'corner_minimum_speed', 'corner_exit_speed', 'corner_entry_speed'].map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedParamFilter(p)}
                  className={`px-2 py-0.5 border text-3xs font-extrabold uppercase transition-all ${
                    selectedParamFilter === p
                      ? 'bg-[#0062FF] text-[#FFFFFF] border-[#00F0FF] shadow-matrix-glow'
                      : 'bg-[#070E22] text-[#93C5FD] border-[#1E3A8A] hover:bg-[#0E1A3D] shadow-sm'
                  }`}
                >
                  [ {p === 'all' ? 'All Parameters' : p.replace(/_/g, ' ')} ]
                </button>
              ))}
            </div>
          </div>

          <div className="text-3xs text-[#94A3B8] font-bold">
            Showing <strong className="text-[#FFFFFF] font-extrabold">{filteredItems.length}</strong> sensitivity models
          </div>
        </div>
      </div>

      {/* Main Sensitivity Matrix Table */}
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-3 overflow-x-auto space-y-2 shadow-md">
        <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-1.5">
          <span className="font-extrabold text-[#FFFFFF] uppercase text-3xs">
            [ LOCAL DERIVATIVES &amp; UNCERTAINTIES ]
          </span>
          <span className="text-4xs text-[#94A3B8] font-bold">
            Negative sensitivity (green) = higher parameter value reduces transit time (faster)
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-[#94A3B8] font-bold">
            Calculating local sensitivity matrix across all 11 Monza corners...
          </div>
        ) : (
          <div className="bg-[#070E22] border border-[#1E3A8A] shadow">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1E3A8A] text-3xs text-[#FFFFFF] font-extrabold uppercase bg-[#070E22]">
                  <th className="py-2 px-2.5">CORNER</th>
                  <th className="py-2 px-2.5">PARAMETER</th>
                  <th className="py-2 px-2.5 text-right">BASELINE</th>
                  <th className="py-2 px-2.5 text-right">OBSERVED RANGE</th>
                  <th className="py-2 px-2.5 text-right">LOCAL SENSITIVITY (∂Δt / ∂X)</th>
                  <th className="py-2 px-2.5 text-right">95% UNCERTAINTY</th>
                  <th className="py-2 px-2.5 text-center">SAMPLES</th>
                  <th className="py-2 px-2.5">MODEL QUALITY</th>
                  <th className="py-2 px-2.5 text-right">OPTIMIZATION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E3A8A]">
                {filteredItems.map((item: SensitivityMatrixItem, idx) => {
                  const isBeneficial = item.local_sensitivity < 0;
                  const color = isBeneficial
                    ? 'text-[#00E676] font-extrabold'
                    : 'text-[#FFB000] font-extrabold';

                  return (
                    <tr key={`${item.corner_id}-${item.parameter_name}-${idx}`} className="hover:bg-[#0062FF]/15 transition-colors">
                      <td className="py-1.5 px-2.5">
                        <span className="font-extrabold text-[#FFFFFF]">{item.corner_id}</span>{' '}
                        <span className="text-[#94A3B8] text-3xs font-semibold">({item.corner_name})</span>
                      </td>

                      <td className="py-1.5 px-2.5 text-[#FFFFFF] font-bold">
                        {item.parameter_name.replace(/_/g, ' ')}
                      </td>

                      <td className="py-1.5 px-2.5 text-right font-mono font-bold text-[#FFFFFF]">
                        {item.baseline_value.toFixed(1)} {item.unit}
                      </td>

                      <td className="py-1.5 px-2.5 text-right font-mono text-[#94A3B8] font-semibold">
                        [{item.observed_range[0].toFixed(1)}, {item.observed_range[1].toFixed(1)}]
                      </td>

                      <td className={`py-1.5 px-2.5 text-right font-mono ${color}`}>
                        {item.local_sensitivity > 0 ? '+' : ''}
                        {item.local_sensitivity.toFixed(4)} s/{item.unit}
                      </td>

                      <td className="py-1.5 px-2.5 text-right font-mono text-[#94A3B8] font-semibold">
                        ±{item.uncertainty_95.toFixed(4)} s
                      </td>

                      <td className="py-1.5 px-2.5 text-center font-mono font-extrabold text-[#FFFFFF]">
                        N={item.sample_count}
                      </td>

                      <td className="py-1.5 px-2.5">
                        <span className="px-1.5 py-0.2 bg-[#0062FF] border border-[#00F0FF] text-[#FFFFFF] text-4xs font-black shadow-matrix-glow">
                          {item.model_quality} ✕
                        </span>
                      </td>

                      <td className="py-1.5 px-2.5 text-right">
                        {onNavigateToOptimization && (
                          <button
                            onClick={() => onNavigateToOptimization(item.corner_id, item.parameter_name)}
                            className="btn-matrix-blue text-3xs py-0.5 px-2 ml-auto shadow-sm"
                          >
                            <span>[ ANALYZE ]</span>
                            <ArrowRight className="w-2.5 h-2.5 ml-1 inline text-[#FFFFFF]" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Provenance note */}
      <footer className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-2.5 text-3xs text-[#FFFFFF] flex items-center justify-between font-bold shadow">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[#00E676] stroke-[2.5]" />
          <span>Stage 5 Sensitivity Engine — Grouped Cross-Validation on Stint Runs</span>
        </div>
        <span className="px-2 py-0.5 bg-[#070E22] border border-[#1E3A8A]">TRAINING DATA: SYNTHETIC DEMO</span>
      </footer>
    </div>
  );
};
