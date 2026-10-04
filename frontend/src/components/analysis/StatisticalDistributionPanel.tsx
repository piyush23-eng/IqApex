import React from 'react';
import { RepeatedLapsStatisticsResponse } from '../../types/decomposition';
import { Sigma, ShieldAlert, CheckCircle, HelpCircle, Layers } from 'lucide-react';

interface StatisticalDistributionPanelProps {
  stats: RepeatedLapsStatisticsResponse | null;
  selectedMetric: string;
  onSelectMetric: (metric: string) => void;
  isLoading?: boolean;
}

export const StatisticalDistributionPanel: React.FC<StatisticalDistributionPanelProps> = ({
  stats,
  selectedMetric,
  onSelectMetric,
  isLoading = false,
}) => {
  const metrics = [
    { id: 'lap_time', label: 'Lap Time' },
    { id: 'sector_1', label: 'Sector 1' },
    { id: 'sector_2', label: 'Sector 2' },
    { id: 'sector_3', label: 'Sector 3' },
  ];

  if (isLoading) {
    return (
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-4 text-center font-mono text-xs text-[#FFFFFF] shadow-md">
        Calculating stint statistical distributions...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-4 text-center font-mono text-xs text-[#94A3B8] shadow-md">
        No statistical data available for current session.
      </div>
    );
  }

  const { descriptive, outliers } = stats;

  return (
    <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-0 shadow-md font-mono text-2xs w-full flex-shrink-0">
      {/* Header & Metric Selector */}
      <div className="window-header-retro bg-[#070E22] border-b border-[#1E3A8A] px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[#FFFFFF] font-extrabold">
        <div className="flex items-center space-x-2">
          <Sigma className="w-3.5 h-3.5 text-[#FFFFFF] stroke-[2.5]" />
          <span className="font-extrabold text-[#FFFFFF] tracking-wider uppercase text-2xs">
            [ STATISTICAL DISTRIBUTION & REPEATABILITY (N={descriptive.sample_count}) ]
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <span className="text-3xs text-[#FFFFFF] font-bold uppercase mr-1">METRIC:</span>
          {metrics.map((m) => (
            <button
              key={m.id}
              onClick={() => onSelectMetric(m.id)}
              className={`text-3xs font-extrabold transition-colors ${
                selectedMetric === m.id
                  ? 'tab-retro-active'
                  : 'tab-retro-inactive'
              }`}
            >
              [ {m.label} ]
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Grid of Key Descriptive Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          <div className="bg-[#070E22] border border-[#1E3A8A] p-2 shadow">
            <div className="text-3xs text-[#94A3B8] font-bold">MEAN (μ)</div>
            <div className="text-sm font-black text-[#FFFFFF] mt-0.5">
              {descriptive.mean.toFixed(3)}s
            </div>
          </div>

          <div className="bg-[#070E22] border border-[#1E3A8A] p-2 shadow">
            <div className="text-3xs text-[#94A3B8] font-bold">MEDIAN (Q₂)</div>
            <div className="text-sm font-black text-[#FFFFFF] mt-0.5">
              {descriptive.median.toFixed(3)}s
            </div>
          </div>

          <div className="bg-[#070E22] border border-[#1E3A8A] p-2 shadow">
            <div className="text-3xs text-[#94A3B8] font-bold">STD DEV (σ)</div>
            <div className="text-sm font-black text-[#FFFFFF] mt-0.5">
              ±{descriptive.std_dev.toFixed(3)}s
            </div>
          </div>

          <div className="bg-[#070E22] border border-[#1E3A8A] p-2 shadow">
            <div className="text-3xs text-[#94A3B8] font-bold">VARIANCE (σ²)</div>
            <div className="text-sm font-black text-[#FFFFFF] mt-0.5">
              {descriptive.variance.toFixed(4)}s²
            </div>
          </div>

          <div className="bg-[#070E22] border border-[#1E3A8A] p-2 shadow">
            <div className="text-3xs text-[#94A3B8] font-bold">P10 PERCENTILE</div>
            <div className="text-sm font-black text-[#00E676] mt-0.5">
              {descriptive.p10.toFixed(3)}s
            </div>
          </div>

          <div className="bg-[#070E22] border border-[#1E3A8A] p-2 shadow">
            <div className="text-3xs text-[#94A3B8] font-bold">P90 PERCENTILE</div>
            <div className="text-sm font-black text-[#FFB000] mt-0.5">
              {descriptive.p90.toFixed(3)}s
            </div>
          </div>
        </div>

        {/* Confidence Interval vs Prediction Interval Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {/* 95% Confidence Interval */}
          <div className="bg-[#070E22] border border-[#1E3A8A] p-2.5 space-y-1 shadow">
            <div className="flex items-center justify-between text-3xs uppercase border-b border-[#1E3A8A] pb-1">
              <span className="text-[#FFFFFF] font-extrabold flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5 text-[#FFFFFF]" />
                <span>95% CONFIDENCE INTERVAL (MEAN PACE)</span>
              </span>
              <span className="text-4xs text-[#94A3B8] font-bold">Student t (n={descriptive.sample_count})</span>
            </div>
            <div className="text-xs font-black text-[#FFFFFF]">
              [{descriptive.ci_95_lower.toFixed(3)}s – {descriptive.ci_95_upper.toFixed(3)}s]
            </div>
            <div className="text-3xs text-[#CBD5E1] leading-relaxed">
              Quantifies estimation uncertainty of the <em>true expected pace</em> under current conditions (SE = ±{(descriptive.std_dev / Math.sqrt(Math.max(1, descriptive.sample_count))).toFixed(3)}s).
            </div>
          </div>

          {/* Prediction Interval */}
          <div className="bg-[#070E22] border border-[#1E3A8A] p-2.5 space-y-1 shadow">
            <div className="flex items-center justify-between text-3xs uppercase border-b border-[#1E3A8A] pb-1">
              <span className="text-[#FFFFFF] font-extrabold flex items-center space-x-1">
                <HelpCircle className="w-3.5 h-3.5 text-[#FFFFFF]" />
                <span>PREDICTION INTERVAL (NEXT SINGLE LAP)</span>
              </span>
              <span className="text-4xs text-[#94A3B8] font-bold">1-Lap Horizon</span>
            </div>
            <div className="text-xs font-black text-[#FFB000]">
              [{descriptive.prediction_interval_lower.toFixed(3)}s – {descriptive.prediction_interval_upper.toFixed(3)}s]
            </div>
            <div className="text-3xs text-[#CBD5E1] leading-relaxed">
              Anticipated range for a single individual subsequent lap. Accounts for both mean estimation error and intrinsic lap-to-lap variance.
            </div>
          </div>
        </div>

        {/* Transparent Outlier Audit Report */}
        <div className="bg-[#070E22] border border-[#1E3A8A] p-2.5 space-y-1.5 shadow">
          <div className="flex flex-wrap items-center justify-between text-3xs border-b border-[#1E3A8A] pb-1 gap-2">
            <span className="font-extrabold text-[#FFFFFF] uppercase flex items-center space-x-1">
              <ShieldAlert className="w-3.5 h-3.5 text-[#FFFFFF]" />
              <span>TRANSPARENT OUTLIER AUDIT ({outliers.method.toUpperCase()})</span>
            </span>
            <div className="flex items-center space-x-3 text-[#94A3B8] font-bold">
              <span>Total Evaluated: <strong className="text-[#FFFFFF] font-black">{outliers.total_samples}</strong></span>
              <span>Included: <strong className="text-[#00E676] font-black">{outliers.included_count}</strong></span>
              <span>
                Excluded:{' '}
                <strong className={outliers.excluded_count > 0 ? 'text-[#FFB000] font-black' : 'text-[#00E676] font-black'}>
                  {outliers.excluded_count}
                </strong>
              </span>
            </div>
          </div>

          {outliers.threshold_lower !== null && outliers.threshold_upper !== null && (
            <div className="text-3xs text-[#94A3B8] font-bold flex items-center justify-between pt-1">
              <span>
                Acceptance Window: [{outliers.threshold_lower.toFixed(3)}s – {outliers.threshold_upper.toFixed(3)}s]
              </span>
              <span className="bg-[#161D2B] px-1 py-0.2 border border-[#1E3A8A]">Rule: Q1 - 1.5×IQR / Q3 + 1.5×IQR</span>
            </div>
          )}

          {outliers.excluded_observations.length > 0 ? (
            <div className="border-t border-[#1E3A8A]/20 pt-1.5 space-y-1">
              <div className="text-3xs text-[#FFB000] font-black">
                Excluded Observations (Tracked for Audit Integrity):
              </div>
              <div className="grid grid-cols-1 gap-1">
                {outliers.excluded_observations.map((obs) => (
                  <div
                    key={obs.id}
                    className="bg-[#FFB000]/15 border border-[#1E3A8A] px-2 py-1 flex items-center justify-between text-3xs font-bold"
                  >
                    <span className="font-black text-[#FFFFFF]">{obs.id}</span>
                    <span className="text-[#FFB000] font-mono font-black">{obs.value.toFixed(3)}s</span>
                    <span className="text-[#94A3B8]">{obs.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="border-t border-[#1E3A8A]/20 pt-1 text-3xs text-[#FFFFFF] font-extrabold flex items-center space-x-1">
              <CheckCircle className="w-3.5 h-3.5 text-[#00E676]" />
              <span className="bg-[#00F0FF]/40 px-1 border border-[#1E3A8A]">All stint laps within normal distribution bounds. Zero outliers excluded.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
