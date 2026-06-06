"use client";

import { FeasibilityStudy } from "@/lib/types";
import {
  initialPhase1,
  initialPhase2,
  initialPhase3,
  initialPhase4,
  initialProjectInfo,
} from "@/lib/config";

const STORAGE_KEY = "feasibility_studies";
const CURRENT_STUDY_KEY = "current_study";

function normalizeStudy(study: FeasibilityStudy): FeasibilityStudy {
  return {
    ...study,
    projectInfo: {
      ...initialProjectInfo,
      ...study.projectInfo,
    },
    phase1: {
      ...initialPhase1,
      ...study.phase1,
      servitudes: {
        ...initialPhase1.servitudes,
        ...study.phase1?.servitudes,
      },
      accessibilite: {
        ...initialPhase1.accessibilite,
        ...study.phase1?.accessibilite,
      },
      environnement: {
        ...initialPhase1.environnement,
        ...study.phase1?.environnement,
      },
    },
    phase2: {
      ...initialPhase2,
      ...study.phase2,
      assainissementEU: {
        ...initialPhase2.assainissementEU,
        ...study.phase2?.assainissementEU,
      },
      assainissementEP: {
        ...initialPhase2.assainissementEP,
        ...study.phase2?.assainissementEP,
      },
      electricite: {
        ...initialPhase2.electricite,
        ...study.phase2?.electricite,
      },
      telecom: {
        ...initialPhase2.telecom,
        ...study.phase2?.telecom,
      },
      eauPotable: {
        ...initialPhase2.eauPotable,
        ...study.phase2?.eauPotable,
      },
      potentiel: {
        ...initialPhase2.potentiel,
        ...study.phase2?.potentiel,
      },
      marche: {
        ...initialPhase2.marche,
        ...study.phase2?.marche,
      },
    },
    phase3: {
      ...initialPhase3,
      ...study.phase3,
      typeOperation: study.phase3?.typeOperation ?? initialPhase3.typeOperation,
      depenses: {
        ...initialPhase3.depenses,
        ...study.phase3?.depenses,
        travaux: {
          ...initialPhase3.depenses.travaux,
          ...study.phase3?.depenses?.travaux,
        },
        etudes: {
          ...initialPhase3.depenses.etudes,
          ...study.phase3?.depenses?.etudes,
        },
        fraisFinanciers: {
          ...initialPhase3.depenses.fraisFinanciers,
          ...study.phase3?.depenses?.fraisFinanciers,
        },
        autres: {
          ...initialPhase3.depenses.autres,
          ...study.phase3?.depenses?.autres,
        },
      },
      recettes: {
        ...initialPhase3.recettes,
        ...study.phase3?.recettes,
      },
      indicateurs: {
        ...initialPhase3.indicateurs,
        ...study.phase3?.indicateurs,
      },
    },
    phase4: {
      ...initialPhase4,
      ...study.phase4,
      scoresPonderes: {
        ...initialPhase4.scoresPonderes,
        ...study.phase4?.scoresPonderes,
      },
      swot: {
        ...initialPhase4.swot,
        ...study.phase4?.swot,
      },
      syntheseFinanciere: {
        ...initialPhase4.syntheseFinanciere,
        ...study.phase4?.syntheseFinanciere,
      },
    },
  };
}

export function getStudies(): FeasibilityStudy[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  const studies = stored ? (JSON.parse(stored) as FeasibilityStudy[]) : [];
  return studies.map(normalizeStudy);
}

export function getStudy(id: string): FeasibilityStudy | undefined {
  const studies = getStudies();
  return studies.find((s) => s.id === id);
}

export function saveStudy(study: FeasibilityStudy): void {
  const studies = getStudies();
  const normalizedStudy = normalizeStudy(study);
  const index = studies.findIndex((s) => s.id === normalizedStudy.id);
  normalizedStudy.lastModified = new Date().toISOString();

  if (index >= 0) {
    studies[index] = normalizedStudy;
  } else {
    studies.push(normalizedStudy);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(studies));
}

export function deleteStudy(id: string): void {
  const studies = getStudies().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(studies));
}

export function setCurrentStudyId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id) {
    localStorage.setItem(CURRENT_STUDY_KEY, id);
  } else {
    localStorage.removeItem(CURRENT_STUDY_KEY);
  }
}

export function getCurrentStudyId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CURRENT_STUDY_KEY);
}
