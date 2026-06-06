// Types pour l'étude de faisabilité immobilière

export interface ProjectInfo {
  projectName: string;
  address: string;
  city: string;
  department: string;
  cadastralRef: string;
  landArea: number; // m²
  acquisitionPrice: number; // €
  dateCreated: string;
}

// Phase 1: Analyse initiale
export interface Phase1Data {
  // Zonage PLU
  pluZone: "UA" | "UB" | "UC" | "AU" | "A" | "N" | "";
  pluZoneScore: number;

  // Servitudes et contraintes
  servitudes: {
    patrimoine: boolean;
    inondation: boolean;
    bruit: boolean;
    pollution: boolean;
    autres: string;
  };
  servitudesScore: number;

  // Accessibilité
  accessibilite: {
    transportEnCommun: "excellent" | "bon" | "moyen" | "faible" | "";
    axesRoutiers: "excellent" | "bon" | "moyen" | "faible" | "";
    stationnement: "facile" | "moyen" | "difficile" | "";
  };
  accessibiliteScore: number;

  // Environnement immédiat
  environnement: {
    commerces: boolean;
    ecoles: boolean;
    sante: boolean;
    espaceVerts: boolean;
    nuisances: string;
  };
  environnementScore: number;

  // Score global Phase 1
  globalScore: number;
  comments: string;
}

// Phase 2: Analyse détaillée
export interface Phase2Data {
  // Règles d'urbanisme
  urbanisme: {
    cos: number;
    empriseSol: number;
    hauteurMax: number;
    reculs: {
      facade: number;
      lateral: number;
      fond: number;
    };
    espacesVerts: number;
  };
  urbanismeScore: number;

  // Potentiel constructible
  potentiel: {
    surfacePlancher: number;
    nombreLogements: number;
    typeProgramme: "collectif" | "individuel" | "mixte" | "";
    parkings: number;
  };
  potentielScore: number;

  // Analyse de marché
  marche: {
    prixM2Neuf: number;
    prixM2Ancien: number;
    demandeLoc: "forte" | "moyenne" | "faible" | "";
    tendance: "hausse" | "stable" | "baisse" | "";
    delaiVente: number;
  };
  marcheScore: number;

  // Concurrence
  concurrence: {
    programmesProches: number;
    stockDisponible: "eleve" | "moyen" | "faible" | "";
    positionnement: string;
  };
  concurrenceScore: number;

  // Score global Phase 2
  globalScore: number;
  comments: string;
}

// Phase 3: Analyse financière
export interface Phase3Data {
  typeOperation: "dap" | "ddd";

  depenses: {
    travaux: {
      miseEnEtatSols: number;
      voiriePlaces: number;
      coutTravaux: number;
      reseaux: number;
      paysage: number;
      amenagementExtPaysage: number;
      ouvragesExceptionnels: number;
      totalTravaux: number;
    };
    etudes: {
      moe: number;
      autresEtudes: number;
      totalEtudes: number;
    };
    fraisFinanciers: {
      tauxEmprunt: number;
      autresFrais: number;
      totalFraisFinanciers: number;
    };
    autres: {
      fraisDivers: number;
      imprevus: number;
      totalAutres: number;
    };
  };

  budgetTotal: number;

  recettes: {
    cessionsChargesFoncieres: number;
    capaciteNombreLogements: number;
    autresCessions: number;
    participations: number;
    autresSubventions: number;
    caTotal: number;
  };

  indicateurs: {
    margePromotion: number;
    margePromotionPct: number;
    rentabiliteInvestissement: number;
    prixRevientM2: number;
    ratioFoncier: number;
  };

  financialScore: number;
  comments: string;
}

// Phase 4: Synthèse
export interface Phase4Data {
  scoresPonderes: {
    phase1: number;
    phase2: number;
    phase3: number;
    global: number;
  };

  swot: {
    forces: string[];
    faiblesses: string[];
    opportunites: string[];
    menaces: string[];
  };

  recommandation: "go" | "go_reserve" | "no_go" | "";
  justification: string;
  conditionsSuspensives: string[];
  prochainEtapes: string[];

  syntheseFinanciere: {
    investissementTotal: number;
    recettesEstimees: number;
    margeNette: number;
    roi: number;
  };
}

// État global de l'étude
export interface FeasibilityStudy {
  id: string;
  projectInfo: ProjectInfo;
  phase1: Phase1Data;
  phase2: Phase2Data;
  phase3: Phase3Data;
  phase4: Phase4Data;
  currentPhase: 1 | 2 | 3 | 4;
  lastModified: string;
  status: "draft" | "in_progress" | "completed";
}

// Configuration des pondérations
export interface WeightConfig {
  phase1: {
    pluZone: number;
    servitudes: number;
    accessibilite: number;
    environnement: number;
  };
  phase2: {
    urbanisme: number;
    potentiel: number;
    marche: number;
    concurrence: number;
  };
  phase3: {
    margeMin: number;
    roiMin: number;
    ratioFoncierMax: number;
  };
  global: {
    phase1: number;
    phase2: number;
    phase3: number;
  };
}

// Utility functions
export function calculateGrade(
  normalizedScore: number,
): "A" | "B" | "C" | "D" | "E" {
  if (normalizedScore >= 80) return "A";
  if (normalizedScore >= 60) return "B";
  if (normalizedScore >= 40) return "C";
  if (normalizedScore >= 20) return "D";
  return "E";
}

export function getGradeColor(grade: "A" | "B" | "C" | "D" | "E"): string {
  const colors = {
    A: "bg-emerald-500",
    B: "bg-lime-500",
    C: "bg-yellow-500",
    D: "bg-orange-500",
    E: "bg-red-500",
  };
  return colors[grade];
}

export function getGradeTextColor(grade: "A" | "B" | "C" | "D" | "E"): string {
  const colors = {
    A: "text-emerald-600",
    B: "text-lime-600",
    C: "text-yellow-600",
    D: "text-orange-600",
    E: "text-red-600",
  };
  return colors[grade];
}
