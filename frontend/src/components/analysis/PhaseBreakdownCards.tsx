import React from 'react';
import { LapDecompositionResult } from '../../types/decomposition';
import { Disc, RotateCcw, Zap, MoveRight, HelpCircle, CheckCircle2 } from 'lucide-react';

interface PhaseBreakdownCardsProps {
  decomposition: LapDecompositionResult | null;
}

export const PhaseBreakdownCards: React.FC<PhaseBreakdownCardsProps> = ({ decomposition }) => {
  if (!decomposition) {
    return (
      <div className="bg-workstation-panel border border-workstation-border rounded p-4 text-center font-mono text-xs text-workstation-textMuted">
        Awaiting decomposition calculation...
      </div>
    );
  }

  const {
    total_lap_delta,
    braking_delta,
    cornering_delta,
    acceleration_delta,
    straight_delta,
    residual,
  } = decomposition;

  // Total delta magnitude for percentage calculations
  const totalMag = Math.abs(total_lap_delta) > 1e-4 ? Math.abs(total_lap_delta) : 1.0;

  const cards = [
    {
      id: 'braking',
      label: 'BRAKING PHASE',
      icon: Disc,
      delta: braking_delta,
      percentage: (braking_delta / totalMag) * 100,
      criterion: 'ax < -2.0 m/s², Brake > 10 bar',
      description: 'Threshold braking to initial trail-brake entry.',
    },
    {
      id: 'cornering',
      label: 'CORNERING PHASE',
      icon: RotateCcw,
      delta: cornering_delta,
      percentage: (cornering_delta / totalMag) * 100,
      criterion: '|ay| > 1.5 m/s², Lateral grip limit',
      description: 'Turn-in, apex minimum speed and lateral commitment.',
    },
    {
      id: 'acceleration',
      label: 'ACCELERATION PHASE',
      icon: Zap,
      delta: acceleration_delta,
      percentage: (acceleration_delta / totalMag) * 100,
      criterion: 'ax > 0.5 m/s², Throttle > 50%',
      description: 'Traction application from corner apex to track out.',
    },
    {
      id: 'straight',
      label: 'STRAIGHT PHASE',
      icon: MoveRight,
      delta: straight_delta,
      percentage: (straight_delta / totalMag) * 100,
      criterion: '|ay| < 1.0 m/s², v ≥ 250 km/h',
      description: 'Top speed, aerodynamic drag, and high-speed energy delivery.',
    },
    {
      id: 'residual',
      label: 'RECONCILED RESIDUAL',
      icon: HelpCircle,
      delta: residual,
      percentage: (residual / totalMag) * 100,
      criterion: 'Exact: ΔTotal - Σ(Phases)',
      description: 'Micro-transitions & spatial discretisation. Strictly unhidden.',
      isResidual: true,
    },
  ];

  return (
    <div className="space-y-1.5 font-mono">
      <div className="flex items-center justify-between text-3xs text-workstation-textMuted uppercase px-1">
        <span className="font-semibold text-workstation-textBright tracking-wider">
          MEASURED PERFORMANCE PHASE CONTRIBUTIONS
        </span>
        <span className="text-workstation-accentCyan flex items-center space-x-1">
          <CheckCircle2 className="w-3 h-3 text-workstation-telemetryGreen" />
          <span>ZERO-HIDDEN RESIDUAL RECONCILIATION</span>
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2.5">
        {cards.map((card) => {
          const Icon = card.icon;
          const isNegative = card.delta < -0.0005;
          const isPositive = card.delta > 0.0005;
          const deltaSign = card.delta > 0 ? '+' : '';
          const deltaColor = isNegative
            ? 'text-workstation-telemetryGreen'
            : isPositive
            ? 'text-workstation-telemetryAmber'
            : 'text-workstation-textMuted';

          return (
            <div
              key={card.id}
              className={`bg-workstation-panel border rounded p-2.5 flex flex-col justify-between transition-colors ${
                card.isResidual
                  ? 'border-dashed border-workstation-border hover:border-workstation-accentCyan/50'
                  : 'border-workstation-border hover:border-workstation-borderHighlight'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-3xs text-workstation-textMuted mb-1">
                  <span className="font-bold tracking-wider flex items-center space-x-1">
                    <Icon className="w-3 h-3 text-workstation-accentCyan" />
                    <span>{card.label}</span>
                  </span>
                  {card.isResidual && (
                    <span className="px-1 py-0.2 bg-workstation-surface border border-workstation-borderSubtle text-workstation-accentCyan rounded text-4xs">
                      UNFORCED
                    </span>
                  )}
                </div>

                <div className="flex items-baseline space-x-1.5 my-1">
                  <span className={`text-base font-bold tracking-tight ${deltaColor}`}>
                    {deltaSign}{card.delta.toFixed(3)}s
                  </span>
                  <span className="text-3xs text-workstation-textMuted">
                    ({card.percentage >= 0 ? '+' : ''}{card.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>

              <div className="border-t border-workstation-borderSubtle pt-1.5 mt-1 space-y-0.5 text-3xs">
                <div className="text-workstation-accentCyan/80 font-mono truncate" title={card.criterion}>
                  {card.criterion}
                </div>
                <div className="text-workstation-textMuted text-4xs leading-tight">
                  {card.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
