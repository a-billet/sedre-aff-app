import type {
  FeasibilityStudy,
  Phase1Data,
  Phase2Data,
  Phase3Data,
  Phase4Data,
  ProjectInfo,
} from "./types";
import { pluZones, criteresAccessibilite } from "./scoring";

// Re-export defaultWeights so existing imports keep working
export { defaultWeights } from "./scoring";

// ============================================================
// DÉRIVÉS — rétrocompatibilité
// Ces exports sont calculés à partir de scoring.ts.
// Dans les nouveaux fichiers, préférez importer directement
// depuis scoring.ts pour accéder au label et au score ensemble.
// ============================================================

/** Score seul par zone PLU */
export const pluZoneScores: Record<string, number> = Object.fromEntries(
  Object.entries(pluZones).map(([key, { score }]) => [key, score]),
);

/** Label seul par zone PLU */
export const pluZoneLabels: Record<string, string> = Object.fromEntries(
  Object.entries(pluZones).map(([key, { label }]) => [key, label]),
);

/** Scores d'accessibilité plats (dérivés de criteresAccessibilite) */
export const accessibilityScores = {
  transportEnCommun: Object.fromEntries(
    Object.entries(criteresAccessibilite.transportEnCommun).map(
      ([k, { score }]) => [k, score],
    ),
  ) as Record<string, number>,
  axesRoutiers: Object.fromEntries(
    Object.entries(criteresAccessibilite.axesRoutiers).map(([k, { score }]) => [
      k,
      score,
    ]),
  ) as Record<string, number>,
  stationnement: Object.fromEntries(
    Object.entries(criteresAccessibilite.stationnement).map(
      ([k, { score }]) => [k, score],
    ),
  ) as Record<string, number>,
};

// ============================================================
// SEUILS & RECOMMANDATIONS
// ============================================================

export const recommendationThresholds = {
  go: 70, // Score >= 70 → GO
  go_reserve: 50, // Score >= 50 → GO avec réserves
  // Score < 50  → NO GO
};

export const recommendationLabels: Record<string, string> = {
  go: "GO",
  go_reserve: "GO avec réserves",
  no_go: "NO GO",
};

export const recommendationColors = {
  go: "#22c55e",
  go_reserve: "#eab308",
  no_go: "#ef4444",
};

export function getRecommendation(
  score: number,
): "go" | "go_reserve" | "no_go" {
  if (score >= recommendationThresholds.go) return "go";
  if (score >= recommendationThresholds.go_reserve) return "go_reserve";
  return "no_go";
}

// ============================================================
// COULEURS & LABELS DE SCORE
// ============================================================

export const scoreColors = {
  excellent: "#22c55e", // vert
  good: "#84cc16", // vert clair
  average: "#eab308", // jaune
  poor: "#f97316", // orange
  bad: "#ef4444", // rouge
};

export function getScoreColor(score: number): string {
  if (score >= 80) return scoreColors.excellent;
  if (score >= 65) return scoreColors.good;
  if (score >= 50) return scoreColors.average;
  if (score >= 35) return scoreColors.poor;
  return scoreColors.bad;
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Bon";
  if (score >= 50) return "Moyen";
  if (score >= 35) return "Faible";
  return "Insuffisant";
}

// ============================================================
// VALEURS INITIALES
// ============================================================

export const initialProjectInfo: ProjectInfo = {
  projectName: "",
  address: "",
  city: "",
  department: "",
  cadastralRef: "",
  landArea: 0,
  acquisitionPrice: 0,
  dateCreated: new Date().toISOString(),
};

export const initialPhase1: Phase1Data = {
  pluZone: "",
  pluZoneScore: 0,
  servitudes: {
    patrimoine: false,
    inondation: false,
    bruit: false,
    pollution: false,
    autres: "",
  },
  servitudesScore: 100,
  accessibilite: {
    transportEnCommun: "",
    axesRoutiers: "",
    stationnement: "",
  },
  accessibiliteScore: 0,
  environnement: {
    commerces: false,
    ecoles: false,
    sante: false,
    espaceVerts: false,
    nuisances: "",
  },
  environnementScore: 0,
  globalScore: 0,
  comments: "",
};

export const initialPhase2: Phase2Data = {
  assainissementEU: {
    raccordement: "",
  },
  assainissementEP: {
    raccordement: "",
  },
  electricite: {
    desserte: "",
  },
  telecom: {
    desserte: "",
  },
  eauPotable: {
    desserte: "",
  },
  assainissementScore: 0,
  reseauxScore: 0,
  potentiel: {
    operationDemonstratrice: false,
    accordCommune: false,
    risqueContestationLocale: "",
  },
  potentielScore: 0,
  marche: {
    demandeTension: "",
    dynamiqueDemographique: "",
    concurrence: "",
    creationEmplois: "",
    revenusMenages: "",
    absenceDemandeOffresVacantes: "",
  },
  marcheScore: 0,
  globalScore: 0,
  comments: "",
};

export const initialPhase3: Phase3Data = {
  typeOperation: "dap",
  depenses: {
    travaux: {
      miseEnEtatSols: 0,
      voiriePlaces: 0,
      coutTravaux: 0,
      reseaux: 0,
      paysage: 0,
      amenagementExtPaysage: 0,
      ouvragesExceptionnels: 0,
      totalTravaux: 0,
    },
    etudes: {
      moe: 0,
      autresEtudes: 0,
      totalEtudes: 0,
    },
    fraisFinanciers: {
      tauxEmprunt: 0,
      autresFrais: 0,
      totalFraisFinanciers: 0,
    },
    autres: {
      fraisDivers: 0,
      imprevus: 0,
      totalAutres: 0,
    },
  },
  budgetTotal: 0,
  recettes: {
    cessionsChargesFoncieres: 0,
    capaciteNombreLogements: 0,
    autresCessions: 0,
    participations: 0,
    autresSubventions: 0,
    caTotal: 0,
  },
  indicateurs: {
    margePromotion: 0,
    margePromotionPct: 0,
    rentabiliteInvestissement: 0,
    prixRevientM2: 0,
    ratioFoncier: 0,
  },
  financialScore: 0,
  comments: "",
};

export const initialPhase4: Phase4Data = {
  scoresPonderes: {
    phase1: 0,
    phase2: 0,
    phase3: 0,
    global: 0,
  },
  swot: {
    forces: [],
    faiblesses: [],
    opportunites: [],
    menaces: [],
  },
  recommandation: "",
  justification: "",
  conditionsSuspensives: [],
  prochainEtapes: [],
  syntheseFinanciere: {
    investissementTotal: 0,
    recettesEstimees: 0,
    margeNette: 0,
    roi: 0,
  },
};

export function createEmptyStudy(): FeasibilityStudy {
  return {
    id: crypto.randomUUID(),
    projectInfo: { ...initialProjectInfo },
    phase1: { ...initialPhase1 },
    phase2: { ...initialPhase2 },
    phase3: { ...initialPhase3 },
    phase4: { ...initialPhase4 },
    currentPhase: 1,
    lastModified: new Date().toISOString(),
    status: "draft",
  };
}
