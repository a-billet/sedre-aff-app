'use client';

import { cn } from '@/lib/utils';
import { getScoreColor, getScoreLabel } from '@/lib/config';

interface PhaseNavigationProps {
  currentPhase: 1 | 2 | 3 | 4;
  onChangePhase: (phase: 1 | 2 | 3 | 4) => void;
  phase1Score: number;
  phase2Score: number;
  phase3Score: number;
  phase4Score: number;
}

const phases = [
  { id: 1 as const, name: 'Analyse initiale', description: 'PLU, servitudes, accessibilité' },
  { id: 2 as const, name: 'Analyse détaillée', description: 'Urbanisme, marché, concurrence' },
  { id: 3 as const, name: 'Analyse financière', description: 'Budget, recettes, rentabilité' },
  { id: 4 as const, name: 'Synthèse', description: 'Recommandation finale' },
];

export function PhaseNavigation({
  currentPhase,
  onChangePhase,
  phase1Score,
  phase2Score,
  phase3Score,
  phase4Score,
}: PhaseNavigationProps) {
  const getPhaseScore = (phaseId: 1 | 2 | 3 | 4) => {
    switch (phaseId) {
      case 1: return phase1Score;
      case 2: return phase2Score;
      case 3: return phase3Score;
      case 4: return phase4Score;
    }
  };

  return (
    <nav className="border-b border-border">
      <div className="flex overflow-x-auto">
        {phases.map((phase, index) => {
          const isActive = phase.id === currentPhase;
          const score = getPhaseScore(phase.id);
          const hasScore = score > 0;

          return (
            <button
              key={phase.id}
              onClick={() => onChangePhase(phase.id)}
              className={cn(
                'flex flex-1 min-w-[140px] flex-col items-center gap-1 border-b-2 px-4 py-3 text-center transition-colors',
                isActive
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-transparent text-muted-foreground hover:border-border hover:bg-muted/50 hover:cursor-pointer'
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}>
                  {index + 1}
                </span>
                <span className="font-medium text-sm">{phase.name}</span>
              </div>
              <span className="text-xs text-muted-foreground hidden sm:block">
                {phase.description}
              </span>
              {hasScore && (
                <div className="flex items-center gap-1 mt-1">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: getScoreColor(score) }}
                  />
                  <span className="text-xs font-medium" style={{ color: getScoreColor(score) }}>
                    {score}/100 - {getScoreLabel(score)}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
