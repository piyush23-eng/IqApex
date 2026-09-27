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
      <div className="bg-workstation-panel border border-workstation-border rounded p-4 text-center font-mono text-xs text-workstation-textMuted">
        Calculating stint statistical distributions...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-workstation-panel border border-workstation-border rounded p-4 text-center font-mono text-xs text-workstation-textMuted">
        No statistical data available for current session.
      </div>
    );
  }

  const { descriptive, outliers } = stats;

  return (
    <div className="bg-workstation-panel border border-workstation-border rounded p-3 font-mono text-2xs space-y-2.5">
      {/* Header & Metric Selector */}
      <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-2">
        <div className="flex items-center space-x-2">
          <Sigma className="w-3.5 h-3.5 text-workstation-accentCyan" />
          <span className="font-bold text-workstation-textBright tracking-wider uppercase">
            STATISTICAL DISTRIBUTION & REPEATABILITY (N={descriptive.sample_count})
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <span className="text-3xs text-workstation-textMuted uppercase mr-1">METRIC:</span>
          {metrics.map((m) => (
            <button
              key={m.id}
              onClick={() => onSelectMetric(m.id)}
              className={`px-2 py-0.5 rounded text-3xs font-semibold transition-colors ${
                selectedMetric === m.id
                  ? 'bg-workstation-accentCyan text-workstation-background'
                  : 'bg-workstation-surface border border-workstation-border text-workstation-textMuted hover:text-workstation-textBright'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Key Descriptive Statistics */}
      <div className="grid grid-cols-6 gap-2">
        <div className="bg-workstation-surface/60 border border-workstation-borderSubtle p-2 rounded">
          <div className="text-3xs text-workstation-textMuted">MEAN (μ)</div>
          <div className="text-sm font-bold text-workstation-textBright mt-0.5">
            {descriptive.mean.toFixed(3)}s
          </div>
        </div>

        <div className="bg-workstation-surface/60 border border-workstation-borderSubtle p-2 rounded">
          <div className="text-3xs text-workstation-textMuted">MEDIAN (Q₂)</div>
          <div className="text-sm font-bold text-workstation-textBright mt-0.5">
            {descriptive.median.toFixed(3)}s
          </div>
        </div>

        <div className="bg-workstation-surface/60 border border-workstation-borderSubtle p-2 rounded">
          <div className="text-3xs text-workstation-textMuted">STD DEV (σ)</div>
          <div className="text-sm font-bold text-workstation-textBright mt-0.5">
            ±{descriptive.std_dev.toFixed(3)}s
          </div>
        </div>

        <div className="bg-workstation-surface/60 border border-workstation-borderSubtle p-2 rounded">
          <div className="text-3xs text-workstation-textMuted">VARIANCE (σ²)</div>
          <div className="text-sm font-bold text-workstation-textBright mt-0.5">
            {descriptive.variance.toFixed(4)}s²
          </div>
        </div>

        <div className="bg-workstation-surface/60 border border-workstation-borderSubtle p-2 rounded">
          <div className="text-3xs text-workstation-textMuted">P10 PERCENTILE</div>
          <div className="text-sm font-bold text-workstation-telemetryGreen mt-0.5">
            {descriptive.p10.toFixed(3)}s
          </div>
        </div>

        <div className="bg-workstation-surface/60 border border-workstation-borderSubtle p-2 rounded">
          <div className="text-3xs text-workstation-textMuted">P90 PERCENTILE</div>
          <div className="text-sm font-bold text-workstation-telemetryAmber mt-0.5">
            {descriptive.p90.toFixed(3)}s
          </div>
        </div>
      </div>

      {/* Confidence Interval vs Prediction Interval Comparison */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* 95% Confidence Interval */}
        <div className="bg-workstation-surface/80 border-l-2 border-workstation-accentCyan p-2.5 rounded-r space-y-1">
          <div className="flex items-center justify-between text-3xs text-workstation-textMuted uppercase">
            <span className="text-workstation-accentCyan font-bold flex items-center space-x-1">
              <Layers className="w-3 h-3" />
              <span>95% CONFIDENCE INTERVAL (MEAN PACE)</span>
            </span>
            <span className="text-4xs text-workstation-textMuted">Student t (n={descriptive.sample_count})</span>
          </div>
          <div className="text-xs font-bold text-workstation-textBright">
            [{descriptive.ci_95_lower.toFixed(3)}s – {descriptive.ci_95_upper.toFixed(3)}s]
          </div>
          <div className="text-3xs text-workstation-textMuted leading-relaxed">
            Quantifies estimation uncertainty of the <em>true expected pace</em> under current conditions (SE = ±{(descriptive.std_dev / Math.sqrt(Math.max(1, descriptive.sample_count))).toFixed(3)}s).
          </div>
        </div>

        {/* Prediction Interval */}
        <div className="bg-workstation-surface/80 border-l-2 border-workstation-telemetryAmber p-2.5 rounded-r space-y-1">
          <div className="flex items-center justify-between text-3xs text-workstation-textMuted uppercase">
            <span className="text-workstation-telemetryAmber font-bold flex items-center space-x-1">
              <HelpCircle className="w-3 h-3" />
              <span>PREDICTION INTERVAL (NEXT SINGLE LAP)</span>
            </span>
            <span className="text-4xs text-workstation-textMuted">1-Lap Horizon</span>
          </div>
          <div className="text-xs font-bold text-workstation-textBright">
            [{descriptive.prediction_interval_lower.toFixed(3)}s – {descriptive.prediction_interval_upper.toFixed(3)}s]
          </div>
          <div className="text-3xs text-workstation-textMuted leading-relaxed">
            Anticipated range for a single individual subsequent lap. Accounts for both mean estimation error and intrinsic lap-to-lap variance.
          </div>
        </div>
      </div>

      {/* Transparent Outlier Audit Report */}
      <div className="bg-workstation-surface/40 border border-workstation-borderSubtle p-2.5 rounded space-y-1.5">
        <div className="flex items-center justify-between text-3xs">
          <span className="font-bold text-workstation-textBright uppercase flex items-center space-x-1">
            <ShieldAlert className="w-3 h-3 text-workstation-accentCyan" />
            <span>TRANSPARENT OUTLIER AUDIT ({outliers.method.toUpperCase()})</span>
          </span>
          <div className="flex items-center space-x-3 text-workstation-textMuted">
            <span>Total Evaluated: <strong className="text-workstation-textBright">{outliers.total_samples}</strong></span>
            <span>Included: <strong className="text-workstation-telemetryGreen">{outliers.included_count}</strong></span>
            <span>
              Excluded:{' '}
              <strong className={outliers.excluded_count > 0 ? 'text-workstation-telemetryAmber' : 'text-workstation-telemetryGreen'}>
                {outliers.excluded_count}
              </strong>
            </span>
          </div>
        </div>

        {outliers.threshold_lower !== null && outliers.threshold_upper !== null && (
          <div className="text-3xs text-workstation-textMuted flex items-center justify-between border-t border-workstation-borderSubtle pt-1">
            <span>
              Acceptance Window: [{outliers.threshold_lower.toFixed(3)}s – {outliers.threshold_upper.toFixed(3)}s]
            </span>
            <span>Rule: Q1 - 1.5×IQR / Q3 + 1.5×IQR</span>
          </div>
        )}

        {outliers.excluded_observations.length > 0 ? (
          <div className="border-t border-workstation-borderSubtle pt-1.5 space-y-1">
            <div className="text-3xs text-workstation-telemetryAmber font-semibold">
              Excluded Observations (Tracked for Audit Integrity):
            </div>
            <div className="grid grid-cols-1 gap-1">
              {outliers.excluded_observations.map((obs) => (
                <div
                  key={obs.id}
                  className="bg-workstation-panel/80 border border-amber-500/20 px-2 py-1 rounded flex items-center justify-between text-3xs"
                >
                  <span className="font-bold text-workstation-textBright">{obs.id}</span>
                  <span className="text-workstation-telemetryAmber font-mono">{obs.value.toFixed(3)}s</span>
                  <span className="text-workstation-textMuted">{obs.reason}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="border-t border-workstation-borderSubtle pt-1 text-3xs text-workstation-telemetryGreen flex items-center space-x-1">
            <CheckCircle className="w-3 h-3" />
            <span>All stint laps within normal distribution bounds. Zero outliers excluded.</span>
          </div>
        )}
      </div>
    </div>
  );
};
