'use client';

import { FeasibilityStudy, calculateGrade, getGradeColor } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface StudyListProps {
  studies: FeasibilityStudy[];
  onSelect: (study: FeasibilityStudy) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

export function StudyList({ studies, onSelect, onCreate, onDelete }: StudyListProps) {
  const statusLabels = {
    draft: 'Brouillon',
    in_progress: 'En cours',
    completed: 'Terminé',
  };

  const statusColors = {
    draft: 'bg-muted text-muted-foreground',
    in_progress: 'bg-amber-100 text-amber-800',
    completed: 'bg-emerald-100 text-emerald-800',
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground">FeasiScore</h1>
        <p className="mt-2 text-muted-foreground">
          Etude de faisabilité foncière et immobilière
        </p>
      </div>

      {/* Create New Study Button */}
      <div className="mb-8 flex justify-center">
        <Button onClick={onCreate} size="lg" className="gap-2">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle étude
        </Button>
      </div>

      {/* Studies List */}
      {studies.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <svg className="mb-4 h-12 w-12 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-muted-foreground">Aucune étude créée</p>
            <p className="mt-1 text-sm text-muted-foreground/70">
              Cliquez sur &quot;Nouvelle étude&quot; pour commencer
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {studies.map((study) => {
            const grade = calculateGrade(study.phase4.scoresPonderes.global || 0);
            const hasScore = study.phase4.scoresPonderes.global > 0;
            
            return (
              <Card
                key={study.id}
                className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
                onClick={() => onSelect(study)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {study.projectInfo.projectName || 'Étude sans nom'}
                      </CardTitle>
                      <CardDescription>
                        {study.projectInfo.address && study.projectInfo.city
                          ? `${study.projectInfo.address}, ${study.projectInfo.city}`
                          : 'Adresse non renseignée'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={statusColors[study.status]}>
                        {statusLabels[study.status]}
                      </Badge>
                      {hasScore && (
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-white font-bold ${getGradeColor(grade)}`}>
                          {grade}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4 text-muted-foreground">
                      {study.projectInfo.landArea > 0 && (
                        <span>{study.projectInfo.landArea.toLocaleString('fr-FR')} m²</span>
                      )}
                      {study.projectInfo.acquisitionPrice > 0 && (
                        <span>{study.projectInfo.acquisitionPrice.toLocaleString('fr-FR')} €</span>
                      )}
                      <span>Phase {study.currentPhase}/4</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {new Date(study.lastModified).toLocaleDateString('fr-FR')}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Supprimer cette étude ?')) {
                            onDelete(study.id);
                          }
                        }}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
