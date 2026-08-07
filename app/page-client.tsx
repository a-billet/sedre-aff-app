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
import { deleteStudy, getCurrentStudyId, getGeneralAnalysisDefaults, getStudies, saveStudy, setCurrentStudyId } from '@/lib/storage';
import { FeasibilityStudy, GeneralAnalysisDefaults, Phase1Data, Phase2Data, Phase3Data, Phase4Data, ProjectInfo } from '@/lib/types';
import { useCallback, useEffect, useMemo, useState } from 'react';

type PageClientProps = {
    criteres: CritereConfig[];
};

export default function PageClient({ criteres }: PageClientProps) {
    const [studies, setStudies] = useState<FeasibilityStudy[]>([]);
    const [currentStudy, setCurrentStudy] = useState<FeasibilityStudy | null>(null);
    const [generalDefaults, setGeneralDefaults] = useState<GeneralAnalysisDefaults>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const loadStudies = async () => {
            try {
                const [loadedStudies, defaults] = await Promise.all([
                    getStudies(),
                    getGeneralAnalysisDefaults(),
                ]);
                if (!isMounted) return;

                setStudies(loadedStudies);
                setGeneralDefaults(defaults);

                const currentId = getCurrentStudyId();
                if (currentId) {
                    const study = loadedStudies.find((s) => s.id === currentId);
                    if (study) {
                        setCurrentStudy(study);
                    }
                }
            } catch (error) {
                console.error('Erreur de chargement des études:', error);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        void loadStudies();

        return () => {
            isMounted = false;
        };
    }, []);

    const updateCurrentStudy = useCallback((study: FeasibilityStudy) => {
        setCurrentStudy(study);
        void saveStudy(study).catch((error) => {
            console.error('Erreur de sauvegarde de l\'étude:', error);
        });
        setStudies((prev) => {
            const index = prev.findIndex((s) => s.id === study.id);
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
        const newStudy = createEmptyStudy({
            miseEnEtatSols: generalDefaults.miseEnEtatSols,
        });
        setCurrentStudy(newStudy);
        setCurrentStudyId(newStudy.id);
        void saveStudy(newStudy).catch((error) => {
            console.error('Erreur de sauvegarde de la nouvelle étude:', error);
        });
        setStudies((prev) => [...prev, newStudy]);
    };

    const handleSelectStudy = (study: FeasibilityStudy) => {
        setCurrentStudy(study);
        setCurrentStudyId(study.id);
    };

    const handleDeleteStudy = (id: string) => {
        void deleteStudy(id).catch((error) => {
            console.error('Erreur de suppression de l\'étude:', error);
        });
        setStudies((prev) => prev.filter((s) => s.id !== id));
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

    const handleUpdateStatus = (status: FeasibilityStudy['status']) => {
        if (!currentStudy) return;
        updateCurrentStudy({ ...currentStudy, status });
    };

    const handleUpdatePhase1 = (phase1: Phase1Data) => {
        if (!currentStudy) return;
        updateCurrentStudy({ ...currentStudy, phase1 });
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
        updateCurrentStudy({ ...currentStudy, phase4 });
    };

    const handleChangePhase = (phase: 1 | 2 | 3 | 4) => {
        if (!currentStudy) return;
        updateCurrentStudy({ ...currentStudy, currentPhase: phase });
    };

    if (isLoading) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <div className="text-muted-foreground">Chargement...</div>
            </main>
        );
    }

    if (!currentStudy) {
        return (
            <main className="min-h-screen">
                <StudyList
                    studies={studies}
                    onSelect={handleSelectStudy}
                    onCreate={handleCreateStudy}
                    onDelete={handleDeleteStudy}
                />
            </main>
        );
    }

    return (
        <main className="min-h-screen">
            <div className="mx-auto max-w-6xl px-4 py-6">
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

                <ProjectInfoForm
                    projectInfo={currentStudy.projectInfo}
                    status={currentStudy.status}
                    onUpdate={handleUpdateProjectInfo}
                    onStatusChange={handleUpdateStatus}
                />

                <PhaseNavigation
                    currentPhase={currentStudy.currentPhase}
                    onChangePhase={handleChangePhase}
                    phase1Score={currentStudy.phase1.globalScore}
                    phase2Score={currentStudy.phase2.globalScore}
                    phase3Score={currentStudy.phase3.financialScore}
                    phase4Score={currentStudy.phase4.scoresPonderes.global}
                />

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
                            generalDefaults={generalDefaults}
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
