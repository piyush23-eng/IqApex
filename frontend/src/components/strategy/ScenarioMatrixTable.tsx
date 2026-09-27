import React from 'react';
import { ScenarioMatrixResponse } from '../../types/strategy';
import { Grid, CloudSun, ShieldAlert } from 'lucide-react';

interface ScenarioMatrixTableProps {
  matrixData: ScenarioMatrixResponse | null;
  isLoading: boolean;
}

export const ScenarioMatrixTable: React.FC<ScenarioMatrixTableProps> = ({
  matrixData,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="bg-workstation-panel border border-workstation-border rounded p-4 font-mono text-2xs animate-pulse text-workstation-textMuted flex items-center justify-center space-x-2 h-44">
        <Grid className="w-4 h-4 animate-spin text-workstation-accentCyan" />
        <span>COMPUTING ENVIRONMENTAL & INTERVENTION SCENARIO MATRIX (3x3)...</span>
      </div>
    );
  }

  if (!matrixData || matrixData.scenarios.length === 0) {
    return (
      <div className="bg-workstation-panel border border-workstation-border rounded p-4 font-mono text-2xs text-workstation-textMuted flex items-center justify-center h-44">
        <span>No scenario matrix data available.</span>
      </div>
    );
  }

  const weatherScenarios = ['DRY', 'COOL', 'HOT'];
  const scScenarios = ['GREEN', 'VSC', 'SC'];

  const getCell = (sc: string, weather: string) => {
    return matrixData.scenarios.find(
      (s) => s.safety_car_scenario === sc && s.weather_scenario === weather
    );
  };

  const formatRaceTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = (s % 60).toFixed(1);
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="bg-workstation-panel border border-workstation-border rounded p-3 font-mono text-2xs space-y-2">
      <div className="flex items-center justify-between border-b border-workstation-borderSubtle pb-1.5">
        <div className="flex items-center space-x-2">
          <Grid className="w-3.5 h-3.5 text-workstation-accentCyan" />
          <span className="font-bold text-workstation-textBright uppercase tracking-wider text-xs">
            SCENARIO RESILIENCE MATRIX (WEATHER × INTERVENTION)
          </span>
        </div>
        <span className="text-3xs text-workstation-textMuted">
          BASELINE [GREEN / DRY]: {formatRaceTime(matrixData.baseline_race_time_s)}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-center">
          <thead>
            <tr className="border-b border-workstation-borderSubtle text-3xs text-workstation-textMuted bg-workstation-surface/50">
              <th className="py-2 px-3 text-left">INTERVENTION \ WEATHER</th>
              {weatherScenarios.map((w) => (
                <th key={w} className="py-2 px-3">
                  <div className="flex items-center justify-center space-x-1">
                    <CloudSun className="w-3 h-3 text-amber-400" />
                    <span>{w}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-workstation-borderSubtle text-3xs">
            {scScenarios.map((sc) => (
              <tr key={sc} className="hover:bg-workstation-surface/40 transition-colors">
                <td className="py-2 px-3 text-left font-bold text-workstation-textBright flex items-center space-x-1.5">
                  <ShieldAlert className="w-3 h-3 text-yellow-400" />
                  <span>{sc === 'GREEN' ? 'GREEN FLAG' : sc}</span>
                </td>
                {weatherScenarios.map((w) => {
                  const cell = getCell(sc, w);
                  if (!cell) return <td key={w} className="py-2 px-3">—</td>;
                  const delta = cell.delta_from_baseline_s;
                  const isBase = sc === 'GREEN' && w === 'DRY';

                  return (
                    <td key={w} className={`py-2 px-3 ${isBase ? 'bg-workstation-accentCyan/5' : ''}`}>
                      <div className="font-bold text-workstation-textBright">
                        {formatRaceTime(cell.modelled_race_time_s)}
                      </div>
                      <div className={`text-4xs font-mono ${delta > 0 ? 'text-amber-400' : delta < 0 ? 'text-emerald-400' : 'text-workstation-textMuted'}`}>
                        {isBase ? 'BASELINE' : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}s`}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-4xs text-workstation-textMuted border-t border-workstation-borderSubtle pt-1 text-right">
        Quantifies strategy robustness across weather temperature shifts and safety car neutralization timing.
      </div>
    </div>
  );
};
