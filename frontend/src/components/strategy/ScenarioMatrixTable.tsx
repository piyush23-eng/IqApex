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
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-4 font-mono text-2xs text-[#FFFFFF] flex items-center justify-center space-x-2 h-44 shadow-md">
        <Grid className="w-4 h-4 animate-spin text-[#FFFFFF]" />
        <span className="font-bold uppercase">[ COMPUTING ENVIRONMENTAL & INTERVENTION SCENARIO MATRIX (3x3)... ]</span>
      </div>
    );
  }

  if (!matrixData || matrixData.scenarios.length === 0) {
    return (
      <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-4 font-mono text-2xs text-[#94A3B8] flex items-center justify-center h-44 shadow-md">
        <span>[ NO SCENARIO MATRIX DATA AVAILABLE ]</span>
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
    <div className="window-retro bg-[#0A132E] border border-[#1E3A8A] p-3 font-mono text-2xs space-y-2 shadow-md">
      {/* Titanium Header */}
      <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-2 bg-[#070E22] p-2 -mx-3 -mt-3 mb-2">
        <div className="flex items-center space-x-2">
          <Grid className="w-3.5 h-3.5 text-[#FFFFFF]" />
          <span className="font-bold text-[#FFFFFF] uppercase tracking-wider text-xs">
            [ SCENARIO RESILIENCE MATRIX (WEATHER × INTERVENTION) ]
          </span>
        </div>
        <span className="text-3xs text-[#FFFFFF] bg-[#070E22] border border-[#1E3A8A] px-1.5 py-0.5 font-bold">
          BASELINE [GREEN / DRY]: {formatRaceTime(matrixData.baseline_race_time_s)}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-[#1E3A8A] bg-[#070E22] text-center">
          <thead>
            <tr className="border-b border-[#1E3A8A] text-3xs text-[#FFFFFF] bg-[#0A0D15] font-bold">
              <th className="py-2 px-3 text-left border-r border-[#1E3A8A] uppercase">[ INTERVENTION \ WEATHER ]</th>
              {weatherScenarios.map((w) => (
                <th key={w} className="py-2 px-3 border-r border-[#1E3A8A] last:border-r-0">
                  <div className="flex items-center justify-center space-x-1">
                    <CloudSun className="w-3 h-3 text-[#FFFFFF]" />
                    <span>[ {w} ]</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black text-3xs">
            {scScenarios.map((sc) => (
              <tr key={sc} className="hover:bg-[#0E1A3D] transition-colors">
                <td className="py-2 px-3 text-left font-bold text-[#FFFFFF] flex items-center space-x-1.5 border-r border-[#1E3A8A]">
                  <ShieldAlert className="w-3 h-3 text-[#FFFFFF]" />
                  <span>{sc === 'GREEN' ? 'GREEN FLAG' : sc}</span>
                </td>
                {weatherScenarios.map((w) => {
                  const cell = getCell(sc, w);
                  if (!cell) return <td key={w} className="py-2 px-3 border-r border-[#1E3A8A] last:border-r-0">—</td>;
                  const delta = cell.delta_from_baseline_s;
                  const isBase = sc === 'GREEN' && w === 'DRY';

                  return (
                    <td key={w} className={`py-2 px-3 border-r border-[#1E3A8A] last:border-r-0 ${isBase ? 'bg-[#0062FF]/20' : ''}`}>
                      <div className="font-bold text-[#FFFFFF]">
                        {formatRaceTime(cell.modelled_race_time_s)}
                      </div>
                      <div className={`text-4xs font-mono font-bold ${isBase ? 'text-[#00E676]' : delta > 0 ? 'text-[#FFB000]' : delta < 0 ? 'text-[#00E676]' : 'text-[#94A3B8]'}`}>
                        {isBase ? '[ BASELINE ]' : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}s`}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-4xs text-[#CBD5E1] font-bold border-t border-[#1E3A8A] pt-1.5 text-right">
        Quantifies strategy robustness across weather temperature shifts and safety car neutralization timing.
      </div>
    </div>
  );
};
