'use client';

import { PhaseNavigation } from '@/components/phase-navigation';
import { Phase1Form } from '@/components/phase1-form';
import { Phase2Form } from '@/components/phase2-form';
import { Phase3Form } from '@/components/phase3-form';
import { Phase4Synthesis } from '@/components/phase4-synthesis';
import { ProjectInfoForm } from '@/components/project-info-form';
import { StudyList } from '@/components/study-list';
import { createEmptyStudy } from '@/lib/config';
import { calculerScore } from '@/lib/scoring/engine';
import { buildReponsesMap } from '@/lib/scoring/study-to-reponses';
import type { CritereConfig, ScoreResult } from '@/lib/scoring/types';
import { deleteStudy, getCurrentStudyId, getStudies, getStudy, saveStudy, setCurrentStudyId } from '@/lib/storage';
import { createClient } from '@/lib/supabase/client';
import { loadCriteres } from '@/lib/supabase/load-criteres';
import { FeasibilityStudy, Phase1Data, Phase2Data, Phase3Data, Phase4Data, ProjectInfo } from '@/lib/types';
import { useCallback, useEffect, useMemo, useState } from 'react';

export default function Page() {
  const [studies, setStudies] = useState<FeasibilityStudy[]>([]);
  const [currentStudy, setCurrentStudy] = useState<FeasibilityStudy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const [criteres, setCriteres] = useState<CritereConfig[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserEmail(user.email);
      const { data: profile } = await supabase
        .from('users')
        .select('is_super_admin')
        .eq('id', user.id)
        .single();
      if (profile?.is_super_admin) setIsAdmin(true);
    });
  }, []);

  useEffect(() => {
    loadCriteres().then(setCriteres);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

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

  const scoringInputsKey = useMemo(() => {
    if (!currentStudy) return '';
    const { phase1, phase2, phase3 } = currentStudy;
    return JSON.stringify({
      p1: {
        pluZone: phase1.pluZone,
        servitudes: phase1.servitudes,
        accessibilite: phase1.accessibilite,
        environnement: phase1.environnement,
      },
      p2Fields: {
        assainissementEU: phase2.assainissementEU,
        assainissementEP: phase2.assainissementEP,
        electricite: phase2.electricite,
        telecom: phase2.telecom,
        eauPotable: phase2.eauPotable,
        potentiel: phase2.potentiel,
        marche: phase2.marche,
      },
      p3Indicateurs: phase3.indicateurs,
    });
  }, [currentStudy]);

  useEffect(() => {
    if (!currentStudy || criteres.length === 0) return;

    const reponses = buildReponsesMap(currentStudy, criteres);
    const result: ScoreResult = calculerScore(reponses, criteres);

    const catScore = (phase: 1 | 2 | 3): number =>
      result.categories.find((c) => c.categorie === String(phase))?.scoreAggrege ?? 0;

    const catContrib = (phase: 1 | 2 | 3): number =>
      result.categories.find((c) => c.categorie === String(phase))?.scoreContribution ?? 0;

    const p1Global = catScore(1);
    const p2Global = catScore(2);
    const p3Score = catScore(3);
    const scoresPonderes: FeasibilityStudy['phase4']['scoresPonderes'] = {
      phase1: catContrib(1),
      phase2: catContrib(2),
      phase3: catContrib(3),
      global: result.scoreGlobal,
    };

    if (
      p1Global === currentStudy.phase1.globalScore &&
      p2Global === currentStudy.phase2.globalScore &&
      p3Score === currentStudy.phase3.financialScore &&
      scoresPonderes.global === currentStudy.phase4.scoresPonderes.global
    ) {
      return;
    }

    updateCurrentStudy({
      ...currentStudy,
      phase1: { ...currentStudy.phase1, globalScore: p1Global },
      phase2: { ...currentStudy.phase2, globalScore: p2Global },
      phase3: { ...currentStudy.phase3, financialScore: p3Score },
      phase4: { ...currentStudy.phase4, scoresPonderes },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoringInputsKey, criteres, updateCurrentStudy]);

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
          userEmail={userEmail}
          onLogout={handleLogout}
          isAdmin={isAdmin}
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
