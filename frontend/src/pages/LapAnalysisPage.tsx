import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { Lap } from '../types/domain';
import {
  LapDecompositionResult,
  RepeatedLapsStatisticsResponse,
  RegressionResult,
  CorrelationResult,
  SensitivityItem,
  ReferenceMethod,
} from '../types/decomposition';
import { DecompositionSummaryHeader } from '../components/analysis/DecompositionSummaryHeader';
import { PhaseBreakdownCards } from '../components/analysis/PhaseBreakdownCards';
import { WaterfallChart } from '../components/analysis/WaterfallChart';
import { CornerTimeGrowthTable } from '../components/analysis/CornerTimeGrowthTable';
import { StatisticalDistributionPanel } from '../components/analysis/StatisticalDistributionPanel';
import { RegressionSensitivityPanel } from '../components/analysis/RegressionSensitivityPanel';
import { ProvenanceFooter } from '../components/analysis/ProvenanceFooter';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const LapAnalysisPage: React.FC = () => {
  // Laps list
  const [laps, setLaps] = useState<Lap[]>([]);
  const [referenceLapId, setReferenceLapId] = useState<string>('lap-demo-02');
  const [comparisonLapId, setComparisonLapId] = useState<string>('lap-demo-03');
  const [referenceMethod, setReferenceMethod] = useState<ReferenceMethod>('selected_lap');

  // Decomposition state
  const [decomposition, setDecomposition] = useState<LapDecompositionResult | null>(null);
  const [isDecompLoading, setIsDecompLoading] = useState<boolean>(true);
  const [decompError, setDecompError] = useState<string | null>(null);

  // Statistics state
  const [selectedMetric, setSelectedMetric] = useState<string>('lap_time');
  const [stats, setStats] = useState<RepeatedLapsStatisticsResponse | null>(null);
  const [regression, setRegression] = useState<RegressionResult | null>(null);
  const [correlation, setCorrelation] = useState<CorrelationResult | null>(null);
  const [sensitivity, setSensitivity] = useState<SensitivityItem[]>([]);
  const [isStatsLoading, setIsStatsLoading] = useState<boolean>(true);

  // 1. Initial Laps Load
  useEffect(() => {
    let mounted = true;
    api
      .getSession('demo-session-monza-2026')
      .then(async (sess) => {
        if (!mounted) return;
        const lapPromises = sess.runs.map((r) => api.getRun(r.run_id));
        const runDetails = await Promise.all(lapPromises);
        const allLaps = runDetails.flatMap((rd) => rd.laps);
        if (!mounted) return;
        setLaps(allLaps);
        const validLaps = allLaps.filter((l) => l.valid);
        if (validLaps.length >= 2) {
          setReferenceLapId(validLaps[0].lap_id);
          setComparisonLapId(validLaps[1].lap_id);
        } else if (allLaps.length > 0) {
          setReferenceLapId(allLaps[0].lap_id);
          setComparisonLapId(allLaps[allLaps.length - 1].lap_id);
        }
      })
      .catch((err: unknown) => {
        console.error('Failed to load session laps:', err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // 2. Load Decomposition Data
  const fetchDecomposition = useCallback(async () => {
    if (!comparisonLapId) return;
    setIsDecompLoading(true);
    setDecompError(null);
    try {
      const result = await api.getLapDecomposition(
        comparisonLapId,
        referenceLapId,
        referenceMethod,
        'demo-session-monza-2026'
      );
      setDecomposition(result);
    } catch (err: unknown) {
      console.error('Decomposition API error:', err);
      setDecompError(err instanceof Error ? err.message : 'Failed to compute lap decomposition');
    } finally {
      setIsDecompLoading(false);
    }
  }, [comparisonLapId, referenceLapId, referenceMethod]);

  useEffect(() => {
    fetchDecomposition();
  }, [fetchDecomposition]);

  // 3. Load Statistics, Regression, Correlation, Sensitivity Data
  const fetchStatistics = useCallback(async () => {
    setIsStatsLoading(true);
    try {
      const [statsRes, regRes, corrRes, sensRes] = await Promise.all([
        api.getRepeatedLapsStatistics('demo-session-monza-2026', undefined, selectedMetric),
        api.getRegression('demo-session-monza-2026', 'tyre_age', 'lap_time', 'drv-16'),
        api.getCorrelation('demo-session-monza-2026', 'sector_1', 'lap_time'),
        api.getSensitivity(referenceLapId, comparisonLapId),
      ]);
      setStats(statsRes);
      setRegression(regRes);
      setCorrelation(corrRes);
      setSensitivity(sensRes);
    } catch (err: unknown) {
      console.error('Statistics API error:', err);
    } finally {
      setIsStatsLoading(false);
    }
  }, [selectedMetric, referenceLapId, comparisonLapId]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-workstation-background p-3 space-y-3 font-mono text-2xs select-none">
      {/* Top Header & Methodology Controller */}
      <DecompositionSummaryHeader
        decomposition={decomposition}
        availableLaps={laps}
        referenceLapId={referenceLapId}
        comparisonLapId={comparisonLapId}
        referenceMethod={referenceMethod}
        onSelectReferenceMethod={setReferenceMethod}
        onSelectReferenceLap={setReferenceLapId}
        onSelectComparisonLap={setComparisonLapId}
        isLoading={isDecompLoading}
      />

      {decompError && (
        <div className="bg-red-950/40 border border-red-500/50 text-red-300 p-2.5 rounded flex items-center justify-between text-2xs">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>Calculation Error: {decompError}</span>
          </div>
          <button
            onClick={fetchDecomposition}
            className="px-2 py-0.5 bg-red-900/50 hover:bg-red-800/60 border border-red-700/60 rounded flex items-center space-x-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Five Phase Breakdown Cards (Braking, Cornering, Acceleration, Straight, Reconciled Residual) */}
      <PhaseBreakdownCards decomposition={decomposition} />

      {/* Cumulative Lap-Time Waterfall Visualization */}
      <WaterfallChart
        steps={decomposition?.waterfall_steps || []}
        totalDelta={decomposition?.total_lap_delta || 0.0}
      />

      {/* Granular Corner Time Growth & Phase Divergence Table */}
      <CornerTimeGrowthTable corners={decomposition?.corners_growth || []} />

      {/* Repeatability, Descriptive Statistics & Transparent Outlier Audit */}
      <StatisticalDistributionPanel
        stats={stats}
        selectedMetric={selectedMetric}
        onSelectMetric={setSelectedMetric}
        isLoading={isStatsLoading}
      />

      {/* Tyre Degradation OLS Regression, Correlation Matrix & Parameter Sensitivity */}
      <RegressionSensitivityPanel
        regression={regression}
        correlation={correlation}
        sensitivity={sensitivity}
        isLoading={isStatsLoading}
      />

      {/* Provenance Metadata & Mathematical Repeatability Footer */}
      <ProvenanceFooter provenance={decomposition?.provenance || null} />
    </div>
  );
};
