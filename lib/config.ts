import type {
  WeightConfig,
  FeasibilityStudy,
  Phase1Data,
  Phase2Data,
  Phase3Data,
  Phase4Data,
  ProjectInfo,
} from "./types";

// Configuration des pondérations par défaut
export const defaultWeights: WeightConfig = {
  phase1: {
    pluZone: 35,
    servitudes: 25,
    accessibilite: 20,
    environnement: 20,
  },
  phase2: {
    urbanisme: 30,
    potentiel: 30,
    marche: 25,
    concurrence: 15,
  },
  phase3: {
    margeMin: 15, // % minimum de marge promotion
    roiMin: 10, // % minimum de ROI
    ratioFoncierMax: 25, // % maximum du ratio foncier
  },
  global: {
    phase1: 25,
    phase2: 35,
    phase3: 40,
  },
};

// Scores par zone PLU
export const pluZoneScores: Record<string, number> = {
  UA: 100, // Zone urbaine dense
  UB: 90, // Zone urbaine
  UC: 80, // Zone urbaine périphérique
  AU: 70, // Zone à urbaniser
  A: 20, // Zone agricole
  N: 10, // Zone naturelle
};

// Labels pour les zones PLU
export const pluZoneLabels: Record<string, string> = {
  UA: "UA - Zone urbaine dense",
  UB: "UB - Zone urbaine",
  UC: "UC - Zone urbaine périphérique",
  AU: "AU - Zone à urbaniser",
  A: "A - Zone agricole",
  N: "N - Zone naturelle",
};

// Scores par niveau d'accessibilité
export const accessibilityScores = {
  transportEnCommun: {
    excellent: 100,
    bon: 75,
    moyen: 50,
    faible: 25,
  },
  axesRoutiers: {
    excellent: 100,
    bon: 75,
    moyen: 50,
    faible: 25,
  },
  stationnement: {
    facile: 100,
    moyen: 60,
    difficile: 30,
  },
};

// Scores pour l'analyse de marché
export const marketScores = {
  demandeLoc: {
    forte: 100,
    moyenne: 60,
    faible: 30,
  },
  tendance: {
    hausse: 100,
    stable: 70,
    baisse: 30,
  },
  stockDisponible: {
    faible: 100,
    moyen: 60,
    eleve: 30,
  },
};

// Seuils de recommandation
export const recommendationThresholds = {
  go: 70, // Score >= 70 = GO
  go_reserve: 50, // Score >= 50 = GO avec réserves
  // Score < 50 = NO GO
};

// Couleurs pour les scores
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

export function getRecommendation(
  score: number,
): "go" | "go_reserve" | "no_go" {
  if (score >= recommendationThresholds.go) return "go";
  if (score >= recommendationThresholds.go_reserve) return "go_reserve";
  return "no_go";
}

export const recommendationLabels = {
  go: "GO - Projet viable",
  go_reserve: "GO avec réserves",
  no_go: "NO GO - Projet non recommandé",
};

export const recommendationColors = {
  go: "#22c55e",
  go_reserve: "#eab308",
  no_go: "#ef4444",
};

// Valeurs initiales
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
  urbanisme: {
    cos: 0,
    empriseSol: 0,
    hauteurMax: 0,
    reculs: {
      facade: 0,
      lateral: 0,
      fond: 0,
    },
    espacesVerts: 0,
  },
  urbanismeScore: 0,
  potentiel: {
    surfacePlancher: 0,
    nombreLogements: 0,
    typeProgramme: "",
    parkings: 0,
  },
  potentielScore: 0,
  marche: {
    prixM2Neuf: 0,
    prixM2Ancien: 0,
    demandeLoc: "",
    tendance: "",
    delaiVente: 0,
  },
  marcheScore: 0,
  concurrence: {
    programmesProches: 0,
    stockDisponible: "",
    positionnement: "",
  },
  concurrenceScore: 0,
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
