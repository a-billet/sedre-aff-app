"use client";

import { FeasibilityStudy, GeneralAnalysisDefaults } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import type { Database, Json, StatutAnalyse } from "@/lib/supabase/types";
import {
  initialPhase1,
  initialPhase2,
  initialPhase3,
  initialPhase4,
  initialProjectInfo,
} from "@/lib/config";

const CURRENT_STUDY_KEY = "current_study";
const GENERAL_CRITERION_KEY = "mise_en_etat_sols";

type AnalyseRow = Database["public"]["Tables"]["analyses"]["Row"];
type FoncierRow = Database["public"]["Tables"]["fonciers"]["Row"];
type GeneralCriterionRow =
  Database["public"]["Tables"]["analysis_default_criteria"]["Row"];

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

function toDbStatus(status: FeasibilityStudy["status"]): StatutAnalyse {
  if (status === "completed") return "finalisee";
  if (status === "in_progress") return "en_cours";
  return "brouillon";
}

function fromDbStatus(status: StatutAnalyse): FeasibilityStudy["status"] {
  if (status === "finalisee") return "completed";
  if (status === "en_cours") return "in_progress";
  return "draft";
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function toGeneralDefaults(
  rows: GeneralCriterionRow[],
): GeneralAnalysisDefaults {
  return rows.reduce<GeneralAnalysisDefaults>((acc, row) => {
    acc[row.key] = row.value ?? null;
    if (row.key === GENERAL_CRITERION_KEY) {
      acc.miseEnEtatSols = row.value ?? null;
    }
    return acc;
  }, {});
}

function toStudyFromRows(
  analyse: AnalyseRow,
  foncier: FoncierRow | null,
): FeasibilityStudy {
  const rawPreBilan =
    analyse.pre_bilan && typeof analyse.pre_bilan === "object"
      ? (analyse.pre_bilan as Partial<FeasibilityStudy>)
      : {};

  const fallbackStudy: FeasibilityStudy = {
    id: analyse.id,
    projectInfo: {
      ...initialProjectInfo,
      projectName: foncier?.nom ?? "",
      address: foncier?.adresse ?? "",
      city: foncier?.ville ?? "",
      department: foncier?.departement ?? "",
      cadastralRef: foncier?.ref_cadastrale ?? "",
      landArea: foncier?.surface_m2 ?? 0,
      acquisitionPrice: foncier?.prix_acquisition ?? 0,
      dateCreated: foncier?.created_at ?? analyse.created_at,
    },
    phase1: initialPhase1,
    phase2: initialPhase2,
    phase3: initialPhase3,
    phase4: initialPhase4,
    currentPhase: 1,
    lastModified: analyse.updated_at,
    status: fromDbStatus(analyse.statut),
  };

  return normalizeStudy({
    ...fallbackStudy,
    ...rawPreBilan,
    id: analyse.id,
    projectInfo: {
      ...fallbackStudy.projectInfo,
      ...rawPreBilan.projectInfo,
    },
    lastModified: analyse.updated_at,
    status: fromDbStatus(analyse.statut),
  });
}

export async function getStudies(): Promise<FeasibilityStudy[]> {
  if (typeof window === "undefined") return [];

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: analyses, error: analysesError } = await supabase
    .from("analyses")
    .select("*")
    .eq("cree_par", user.id)
    .order("updated_at", { ascending: false });

  if (analysesError || !analyses) {
    console.error("Erreur de chargement des analyses:", analysesError?.message);
    return [];
  }

  const foncierIds = analyses.map((a) => a.foncier_id);
  if (foncierIds.length === 0) return [];

  const { data: fonciers, error: fonciersError } = await supabase
    .from("fonciers")
    .select("*")
    .in("id", foncierIds);

  if (fonciersError) {
    console.error("Erreur de chargement des fonciers:", fonciersError.message);
  }

  const foncierMap = new Map((fonciers ?? []).map((f) => [f.id, f]));

  return analyses.map((analyse) =>
    toStudyFromRows(analyse, foncierMap.get(analyse.foncier_id) ?? null),
  );
}

export async function getGeneralAnalysisDefaults(): Promise<GeneralAnalysisDefaults> {
  if (typeof window === "undefined") return { miseEnEtatSols: null };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("analysis_default_criteria")
    .select("*")
    .eq("active", true)
    .order("sort_order");

  if (error || !data) {
    console.error(
      "Erreur de chargement des critères généraux:",
      error?.message,
    );
    return { miseEnEtatSols: null };
  }

  return toGeneralDefaults(data);
}

export async function saveGeneralAnalysisDefaultCriterion(
  value: number | null,
): Promise<void> {
  if (typeof window === "undefined") return;

  const supabase = createClient();
  const { error } = await supabase.from("analysis_default_criteria").upsert(
    {
      key: GENERAL_CRITERION_KEY,
      label: "Mise en état des sols",
      value: toNumberOrNull(value),
      sort_order: 1,
      active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) {
    throw new Error(`Échec de sauvegarde du critère général: ${error.message}`);
  }
}

export async function getStudy(
  id: string,
): Promise<FeasibilityStudy | undefined> {
  if (typeof window === "undefined") return undefined;

  const supabase = createClient();
  const { data: analyse, error: analyseError } = await supabase
    .from("analyses")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (analyseError || !analyse) {
    if (analyseError) {
      console.error("Erreur de chargement de l'analyse:", analyseError.message);
    }
    return undefined;
  }

  const { data: foncier, error: foncierError } = await supabase
    .from("fonciers")
    .select("*")
    .eq("id", analyse.foncier_id)
    .maybeSingle();

  if (foncierError) {
    console.error("Erreur de chargement du foncier:", foncierError.message);
  }

  return toStudyFromRows(analyse, foncier ?? null);
}

export async function saveStudy(study: FeasibilityStudy): Promise<void> {
  if (typeof window === "undefined") return;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utilisateur non authentifié");
  }

  const now = new Date().toISOString();
  const normalizedStudy = normalizeStudy({
    ...study,
    lastModified: now,
  });

  const { error: foncierError } = await supabase.from("fonciers").upsert({
    id: normalizedStudy.id,
    nom: normalizedStudy.projectInfo.projectName || "Étude sans nom",
    adresse: normalizedStudy.projectInfo.address || null,
    ville: normalizedStudy.projectInfo.city || null,
    departement: normalizedStudy.projectInfo.department || null,
    ref_cadastrale: normalizedStudy.projectInfo.cadastralRef || null,
    surface_m2: normalizedStudy.projectInfo.landArea || null,
    prix_acquisition: normalizedStudy.projectInfo.acquisitionPrice || null,
    created_by: user.id,
    updated_at: now,
  });

  if (foncierError) {
    throw new Error(`Échec de sauvegarde du foncier: ${foncierError.message}`);
  }

  const scoresCalcules = {
    phase1: normalizedStudy.phase1.globalScore,
    phase2: normalizedStudy.phase2.globalScore,
    phase3: normalizedStudy.phase3.financialScore,
    global: normalizedStudy.phase4.scoresPonderes.global,
  };

  const { error: analyseError } = await supabase.from("analyses").upsert({
    id: normalizedStudy.id,
    foncier_id: normalizedStudy.id,
    statut: toDbStatus(normalizedStudy.status),
    scores_calcules: scoresCalcules,
    pre_bilan: normalizedStudy as unknown as Json,
    cree_par: user.id,
    modifie_par: user.id,
    updated_at: now,
  });

  if (analyseError) {
    throw new Error(
      `Échec de sauvegarde de l'analyse: ${analyseError.message}`,
    );
  }
}

export async function deleteStudy(id: string): Promise<void> {
  if (typeof window === "undefined") return;

  const supabase = createClient();
  const { error: analyseError } = await supabase
    .from("analyses")
    .delete()
    .eq("id", id);

  if (analyseError) {
    throw new Error(
      `Échec de suppression de l'analyse: ${analyseError.message}`,
    );
  }

  const { error: foncierError } = await supabase
    .from("fonciers")
    .delete()
    .eq("id", id);

  if (foncierError) {
    throw new Error(`Échec de suppression du foncier: ${foncierError.message}`);
  }
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
