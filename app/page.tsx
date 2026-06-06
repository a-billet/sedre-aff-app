'use client';

import { useState, useEffect, useCallback } from 'react';
import { FeasibilityStudy, Phase1Data, Phase2Data, Phase3Data, Phase4Data, ProjectInfo } from '@/lib/types';
import { createEmptyStudy } from '@/lib/config';
import { getStudies, saveStudy, deleteStudy, setCurrentStudyId, getCurrentStudyId, getStudy } from '@/lib/storage';
import { StudyList } from '@/components/study-list';
import { ProjectInfoForm } from '@/components/project-info-form';
import { PhaseNavigation } from '@/components/phase-navigation';
import { Phase1Form } from '@/components/phase1-form';
import { Phase2Form } from '@/components/phase2-form';
import { Phase3Form } from '@/components/phase3-form';
import { Phase4Synthesis } from '@/components/phase4-synthesis';

export default function Page() {
  const [studies, setStudies] = useState<FeasibilityStudy[]>([]);
  const [currentStudy, setCurrentStudy] = useState<FeasibilityStudy | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load studies and current study from localStorage
  useEffect(() => {
    const loadedStudies = getStudies();
    setStudies(loadedStudies);

    const currentId = getCurrentStudyId();
    if (currentId) {
      const study = getStudy(currentId);
      if (study) {
        setCurrentStudy(study);
      }
    }
    setIsLoading(false);
  }, []);

  // Save current study whenever it changes
  const updateCurrentStudy = useCallback((study: FeasibilityStudy) => {
    setCurrentStudy(study);
    saveStudy(study);
    setStudies(prev => {
      const index = prev.findIndex(s => s.id === study.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = study;
        return updated;
      }
      return [...prev, study];
    });
  }, []);

  const handleCreateStudy = () => {
    const newStudy = createEmptyStudy();
    setCurrentStudy(newStudy);
    setCurrentStudyId(newStudy.id);
    saveStudy(newStudy);
    setStudies(prev => [...prev, newStudy]);
  };

  const handleSelectStudy = (study: FeasibilityStudy) => {
    setCurrentStudy(study);
    setCurrentStudyId(study.id);
  };

  const handleDeleteStudy = (id: string) => {
    deleteStudy(id);
    setStudies(prev => prev.filter(s => s.id !== id));
    if (currentStudy?.id === id) {
      setCurrentStudy(null);
      setCurrentStudyId(null);
    }
  };

  const handleBackToList = () => {
    setCurrentStudy(null);
    setCurrentStudyId(null);
  };

  const handleUpdateProjectInfo = (projectInfo: ProjectInfo) => {
    if (!currentStudy) return;
    updateCurrentStudy({ ...currentStudy, projectInfo });
  };

  const handleUpdatePhase1 = (phase1: Phase1Data) => {
    if (!currentStudy) return;
    updateCurrentStudy({ ...currentStudy, phase1, status: 'in_progress' });
  };

  const handleUpdatePhase2 = (phase2: Phase2Data) => {
    if (!currentStudy) return;
    updateCurrentStudy({ ...currentStudy, phase2 });
  };

  const handleUpdatePhase3 = (phase3: Phase3Data) => {
    if (!currentStudy) return;
    updateCurrentStudy({ ...currentStudy, phase3 });
  };

  const handleUpdatePhase4 = (phase4: Phase4Data) => {
    if (!currentStudy) return;
    updateCurrentStudy({ ...currentStudy, phase4, status: 'completed' });
  };

  const handleChangePhase = (phase: 1 | 2 | 3 | 4) => {
    if (!currentStudy) return;
    updateCurrentStudy({ ...currentStudy, currentPhase: phase });
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Chargement...</div>
      </main>
    );
  }

  // Show study list if no current study
  if (!currentStudy) {
    return (
      <main className="min-h-screen bg-background">
        <StudyList
          studies={studies}
          onSelect={handleSelectStudy}
          onCreate={handleCreateStudy}
          onDelete={handleDeleteStudy}
        />
      </main>
    );
  }

  // Show current study
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToList}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors hover:cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Retour aux études
            </button>
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            {currentStudy.projectInfo.projectName || 'Nouvelle étude'}
          </h1>
          <div className="text-sm text-muted-foreground">
            Modifié le {new Date(currentStudy.lastModified).toLocaleDateString('fr-FR')}
          </div>
        </header>

        {/* Project Info */}
        <ProjectInfoForm
          projectInfo={currentStudy.projectInfo}
          onUpdate={handleUpdateProjectInfo}
        />

        {/* Phase Navigation */}
        <PhaseNavigation
          currentPhase={currentStudy.currentPhase}
          onChangePhase={handleChangePhase}
          phase1Score={currentStudy.phase1.globalScore}
          phase2Score={currentStudy.phase2.globalScore}
          phase3Score={currentStudy.phase3.financialScore}
          phase4Score={currentStudy.phase4.scoresPonderes.global}
        />

        {/* Phase Content */}
        <div className="mt-6">
          {currentStudy.currentPhase === 1 && (
            <Phase1Form
              data={currentStudy.phase1}
              onUpdate={handleUpdatePhase1}
              projectInfo={currentStudy.projectInfo}
              onUpdateProjectInfo={handleUpdateProjectInfo}
            />
          )}
          {currentStudy.currentPhase === 2 && (
            <Phase2Form
              data={currentStudy.phase2}
              onUpdate={handleUpdatePhase2}
            />
          )}
          {currentStudy.currentPhase === 3 && (
            <Phase3Form
              data={currentStudy.phase3}
              onUpdate={handleUpdatePhase3}
              housingCapacity={0}
            />
          )}
          {currentStudy.currentPhase === 4 && (
            <Phase4Synthesis
              study={currentStudy}
              onUpdate={handleUpdatePhase4}
            />
          )}
        </div>
      </div>
    </main>
  );
}
