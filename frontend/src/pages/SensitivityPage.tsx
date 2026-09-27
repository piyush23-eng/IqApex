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
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-workstation-background p-3 space-y-3 font-mono text-2xs select-none">
      {/* Header */}
      <div className="bg-workstation-panel border border-workstation-border rounded p-3 space-y-2">
        <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-2">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-workstation-accentCyan" />
            <span className="font-bold text-workstation-textBright tracking-wider uppercase text-xs">
              PERFORMANCE PARAMETER SENSITIVITY MATRIX (∂Δt / ∂X)
            </span>
            <span className="text-workstation-border">|</span>
            <span className="text-workstation-textMuted">CIRCUIT: AUTODROMO NAZIONALE MONZA</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold rounded text-3xs flex items-center space-x-1">
              <AlertCircle className="w-3 h-3" />
              <span>SYNTHETIC DEMONSTRATION DATASET</span>
            </span>
            <button
              onClick={fetchSensitivity}
              disabled={isLoading}
              className="px-2 py-0.5 bg-workstation-surface hover:bg-workstation-borderSubtle border border-workstation-border rounded text-3xs flex items-center space-x-1"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center">
              <Search className="w-3 h-3 text-workstation-textMuted absolute left-2 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter corner (e.g. T9, Ascari)..."
                value={searchCorner}
                onChange={(e) => setSearchCorner(e.target.value)}
                className="bg-workstation-surface border border-workstation-border text-workstation-textPrimary pl-7 pr-2 py-1 rounded text-2xs focus:outline-none focus:border-workstation-accentCyan w-56"
              />
            </div>

            <div className="flex items-center space-x-1">
              <Filter className="w-3 h-3 text-workstation-textMuted" />
              <span className="text-3xs text-workstation-textMuted uppercase mr-1">PARAMETER:</span>
              {['all', 'corner_minimum_speed', 'corner_exit_speed', 'corner_entry_speed'].map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedParamFilter(p)}
                  className={`px-2 py-0.5 rounded text-3xs font-semibold transition-colors ${
                    selectedParamFilter === p
                      ? 'bg-workstation-accentCyan text-workstation-background'
                      : 'bg-workstation-surface border border-workstation-border text-workstation-textMuted hover:text-workstation-textBright'
                  }`}
                >
                  {p === 'all' ? 'All Parameters' : p.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="text-3xs text-workstation-textMuted">
            Showing <strong className="text-workstation-textBright">{filteredItems.length}</strong> sensitivity models
          </div>
        </div>
      </div>

      {/* Main Sensitivity Matrix Table */}
      <div className="bg-workstation-panel border border-workstation-border rounded p-3 overflow-x-auto space-y-2">
        <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-1">
          <span className="font-bold text-workstation-textBright uppercase text-3xs">
            LOCAL DERIVATIVES & UNCERTAINTIES
          </span>
          <span className="text-4xs text-workstation-textMuted">
            Negative sensitivity (green) = higher parameter value reduces transit time (faster)
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-workstation-textMuted">
            Calculating local sensitivity matrix across all 11 Monza corners...
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-workstation-border text-3xs text-workstation-textMuted uppercase bg-workstation-surface/40">
                <th className="py-2 px-2">CORNER</th>
                <th className="py-2 px-2">PARAMETER</th>
                <th className="py-2 px-2 text-right">BASELINE</th>
                <th className="py-2 px-2 text-right">OBSERVED RANGE</th>
                <th className="py-2 px-2 text-right">LOCAL SENSITIVITY (∂Δt / ∂X)</th>
                <th className="py-2 px-2 text-right">95% UNCERTAINTY</th>
                <th className="py-2 px-2 text-center">SAMPLES</th>
                <th className="py-2 px-2">MODEL QUALITY</th>
                <th className="py-2 px-2 text-right">OPTIMIZATION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-workstation-borderSubtle">
              {filteredItems.map((item: SensitivityMatrixItem, idx) => {
                const isBeneficial = item.local_sensitivity < 0;
                const color = isBeneficial
                  ? 'text-workstation-telemetryGreen font-bold'
                  : 'text-workstation-telemetryAmber font-bold';

                return (
                  <tr key={`${item.corner_id}-${item.parameter_name}-${idx}`} className="hover:bg-workstation-surface/60 transition-colors">
                    <td className="py-1.5 px-2">
                      <span className="font-bold text-workstation-textBright">{item.corner_id}</span>{' '}
                      <span className="text-workstation-textMuted text-3xs">({item.corner_name})</span>
                    </td>

                    <td className="py-1.5 px-2 text-workstation-textPrimary">
                      {item.parameter_name.replace(/_/g, ' ')}
                    </td>

                    <td className="py-1.5 px-2 text-right font-mono">
                      {item.baseline_value.toFixed(1)} {item.unit}
                    </td>

                    <td className="py-1.5 px-2 text-right font-mono text-workstation-textMuted">
                      [{item.observed_range[0].toFixed(1)}, {item.observed_range[1].toFixed(1)}]
                    </td>

                    <td className={`py-1.5 px-2 text-right font-mono ${color}`}>
                      {item.local_sensitivity > 0 ? '+' : ''}
                      {item.local_sensitivity.toFixed(4)} s/{item.unit}
                    </td>

                    <td className="py-1.5 px-2 text-right font-mono text-workstation-textMuted">
                      ±{item.uncertainty_95.toFixed(4)} s
                    </td>

                    <td className="py-1.5 px-2 text-center font-mono text-workstation-textBright">
                      N={item.sample_count}
                    </td>

                    <td className="py-1.5 px-2">
                      <span className="px-1.5 py-0.2 bg-workstation-surface border border-workstation-borderSubtle text-workstation-telemetryGreen rounded text-4xs font-semibold">
                        {item.model_quality}
                      </span>
                    </td>

                    <td className="py-1.5 px-2 text-right">
                      {onNavigateToOptimization && (
                        <button
                          onClick={() => onNavigateToOptimization(item.corner_id, item.parameter_name)}
                          className="px-2 py-0.5 bg-workstation-surface hover:bg-workstation-borderSubtle border border-workstation-border hover:border-workstation-accentCyan text-workstation-textBright rounded flex items-center space-x-1 ml-auto text-3xs transition-colors"
                        >
                          <span>Analyze</span>
                          <ArrowRight className="w-2.5 h-2.5 text-workstation-accentCyan" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Provenance note */}
      <footer className="bg-workstation-panel border border-workstation-border rounded p-2.5 text-3xs text-workstation-textMuted flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-3.5 h-3.5 text-workstation-telemetryGreen" />
          <span>Stage 5 Sensitivity Engine — Grouped Cross-Validation on Stint Runs</span>
        </div>
        <span>TRAINING DATA: Synthetic demonstration dataset</span>
      </footer>
    </div>
  );
};
