'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { FeasibilityStudy, calculateGrade, getGradeColor } from '@/lib/types';
import { ArrowRight, Clock3, FilePlus2, FolderOpenDot, MapPin, Trash2 } from 'lucide-react';
import Image from 'next/image';

interface StudyListProps {
  studies: FeasibilityStudy[];
  onSelect: (study: FeasibilityStudy) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

export function StudyList({ studies, onSelect, onCreate, onDelete }: StudyListProps) {
  const statusLabels: Record<FeasibilityStudy['status'], string> = {
    draft: 'Brouillon',
    in_progress: 'En cours',
    completed: 'Terminé',
  };

  const statusColors: Record<FeasibilityStudy['status'], string> = {
    draft: 'border-white/60 bg-white/75 text-muted-foreground',
    in_progress: 'border-amber-200 bg-amber-50 text-amber-800',
    completed: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  };

  const draftCount = studies.filter((study) => study.status === 'draft').length;
  const inProgressCount = studies.filter((study) => study.status === 'in_progress').length;
  const completedCount = studies.filter((study) => study.status === 'completed').length;
  const totalSurface = studies.reduce((sum, study) => sum + (study.projectInfo.landArea || 0), 0);
  const latestStudy = [...studies].sort(
    (left, right) => new Date(right.lastModified).getTime() - new Date(left.lastModified).getTime()
  )[0];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(46,75,133,0.56),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_26%),linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(248,250,252,0.98))]">
      <div className="absolute inset-x-0 top-0 h-80 bg-[linear-gradient(135deg,rgba(15,23,42,0.05),transparent_60%)]" />
      <div className="absolute left-1/2 top-28 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="flex flex-col gap-4 rounded-[28px] border border-white/60 bg-white/80 p-4 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur xl:flex-row xl:items-center xl:justify-between xl:p-5">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
              <Image src="/logo.jpg" alt="Logo SEDRE" width={50} height={50} priority />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.32em] text-primary/80">SEDRE</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Études de faisabilité foncière
              </h1>
            </div>
          </div>

          <Button
            onClick={onCreate}
            size="lg"
            className="h-11 rounded-xl px-4 text-sm shadow-[0_18px_45px_-24px_rgba(34,197,94,0.8)] hover:cursor-pointer hover:shadow-[0_24px_70px_-24px_rgba(34,197,94,0.9)]"
          >
            <FilePlus2 className="size-4" />
            Nouvelle étude
          </Button>
        </header>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary/75">Vos études</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Reprenez un dossier là où vous l&apos;avez laissé
              </h2>
            </div>
            <div className="rounded-full border border-border/70 bg-white/70 px-4 py-2 text-sm text-muted-foreground backdrop-blur">
              {studies.length} étude{studies.length > 1 ? 's' : ''}
            </div>
          </div>

          {studies.length === 0 ? (
            <Card className="rounded-[30px] border border-dashed border-border/70 bg-white/75 py-0 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.35)]">
              <CardContent className="flex min-h-[360px] flex-col items-center justify-center px-6 py-16 text-center">
                <div className="flex size-20 items-center justify-center rounded-3xl bg-primary/10 ring-1 ring-primary/15">
                  <FolderOpenDot className="size-10 text-primary" />
                </div>
                <h3 className="mt-6 text-2xl font-semibold text-foreground">Aucune étude créée</h3>
                <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">
                  Créez votre première étude pour lancer une analyse multicritère, estimer la faisabilité foncière et suivre l&apos;avancement des différentes phases.
                </p>
                <Button onClick={onCreate} size="lg" className="mt-8 h-11 rounded-xl px-4">
                  <FilePlus2 className="size-4" />
                  Nouvelle étude
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              {studies.map((study) => {
                const grade = calculateGrade(study.phase4.scoresPonderes.global || 0);
                const hasScore = study.phase4.scoresPonderes.global > 0;

                return (
                  <Card
                    key={study.id}
                    className="rounded-[30px] border border-white/60 bg-white/80 py-0 shadow-[0_20px_70px_-45px_rgba(15,23,42,0.45)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_24px_90px_-44px_rgba(15,23,42,0.5)]"
                  >
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex h-full flex-col gap-6">
                        <div className="flex items-start justify-between gap-4">
                          <button
                            type="button"
                            className="group flex flex-1 flex-col items-start text-left"
                            onClick={() => onSelect(study)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10">
                                <FolderOpenDot className="size-5" />
                              </div>
                              <div>
                                <CardTitle className="text-xl font-semibold tracking-tight transition-colors group-hover:text-primary">
                                  {study.projectInfo.projectName || 'Étude sans nom'}
                                </CardTitle>
                                <CardDescription className="mt-1 flex items-center gap-2 text-sm">
                                  <MapPin className="size-4" />
                                  {study.projectInfo.address && study.projectInfo.city
                                    ? `${study.projectInfo.address}, ${study.projectInfo.city}`
                                    : 'Adresse non renseignée'}
                                </CardDescription>
                              </div>
                            </div>
                          </button>

                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={`rounded-full border px-3 py-1 ${statusColors[study.status]}`}>
                              {statusLabels[study.status]}
                            </Badge>
                            {hasScore && (
                              <div className={`flex size-11 items-center justify-center rounded-2xl text-base font-semibold text-white shadow-lg shadow-black/10 ${getGradeColor(grade)}`}>
                                {grade}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="rounded-2xl border border-border/60 bg-background/75 p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Surface</p>
                            <p className="mt-2 text-lg font-semibold text-foreground">
                              {study.projectInfo.landArea > 0
                                ? `${study.projectInfo.landArea.toLocaleString('fr-FR')} m²`
                                : 'Non définie'}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-border/60 bg-background/75 p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Foncier</p>
                            <p className="mt-2 text-lg font-semibold text-foreground">
                              {study.projectInfo.acquisitionPrice > 0
                                ? `${study.projectInfo.acquisitionPrice.toLocaleString('fr-FR')} €`
                                : 'Non défini'}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-border/60 bg-background/75 p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Progression</p>
                            <p className="mt-2 text-lg font-semibold text-foreground">Phase {study.currentPhase}/4</p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock3 className="size-4" />
                            Modifié le {new Date(study.lastModified).toLocaleDateString('fr-FR')}
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              className="rounded-xl px-3 text-muted-foreground hover:text-foreground hover:cursor-pointer"
                              onClick={() => onSelect(study)}
                            >
                              Ouvrir
                              <ArrowRight className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-xl text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Supprimer cette étude ?')) {
                                  onDelete(study.id);
                                }
                              }}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
