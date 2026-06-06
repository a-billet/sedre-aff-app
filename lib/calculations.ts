import type {
  Phase1Data,
  Phase2Data,
  Phase3Data,
  Phase4Data,
  FeasibilityStudy,
} from "./types";
import {
  defaultWeights,
  pluZoneScores,
  accessibilityScores,
  getRecommendation,
} from "./config";

// === Calculs Phase 1 ===

export function calculateServitudesScore(
  servitudes: Phase1Data["servitudes"],
): number {
  let score = 100;
  if (servitudes.patrimoine) score -= 20;
  if (servitudes.inondation) score -= 30;
  if (servitudes.bruit) score -= 15;
  if (servitudes.pollution) score -= 25;
  if (servitudes.autres && servitudes.autres.trim() !== "") score -= 10;
  return Math.max(0, score);
}

export function calculateAccessibiliteScore(
  accessibilite: Phase1Data["accessibilite"],
): number {
  const scores: number[] = [];

  if (accessibilite.transportEnCommun) {
    scores.push(
      accessibilityScores.transportEnCommun[accessibilite.transportEnCommun],
    );
  }
  if (accessibilite.axesRoutiers) {
    scores.push(accessibilityScores.axesRoutiers[accessibilite.axesRoutiers]);
  }
  if (accessibilite.stationnement) {
    scores.push(accessibilityScores.stationnement[accessibilite.stationnement]);
  }

  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export function calculateEnvironnementScore(
  environnement: Phase1Data["environnement"],
): number {
  let score = 0;
  const maxScore = 100;
  const itemScore = 25;

  if (environnement.commerces) score += itemScore;
  if (environnement.ecoles) score += itemScore;
  if (environnement.sante) score += itemScore;
  if (environnement.espaceVerts) score += itemScore;

  // Pénalité pour nuisances
  if (environnement.nuisances && environnement.nuisances.trim() !== "") {
    score = Math.max(0, score - 20);
  }

  return Math.min(score, maxScore);
}

export function calculatePhase1GlobalScore(phase1: Phase1Data): number {
  const weights = defaultWeights.phase1;
  const totalWeight =
    weights.pluZone +
    weights.servitudes +
    weights.accessibilite +
    weights.environnement;

  const weightedScore =
    (phase1.pluZoneScore * weights.pluZone +
      phase1.servitudesScore * weights.servitudes +
      phase1.accessibiliteScore * weights.accessibilite +
      phase1.environnementScore * weights.environnement) /
    totalWeight;

  return Math.round(weightedScore);
}

// === Calculs Phase 2 ===

const phase2OptionScores = {
  assainissementEU: {
    reseau_suffisant: 100,
    reseau_proximite: 70,
    station_relevage: 35,
    "": 0,
  },
  assainissementEP: {
    infiltration: 100,
    reseau_suffisant: 85,
    reseau_proximite: 60,
    "": 0,
  },
  reseaux: {
    reseau_suffisant: 100,
    reseau_proximite: 70,
    lignes_aeriennes: 35,
    "": 0,
  },
  eauPotable: {
    reseau_suffisant: 100,
    reseau_proximite: 70,
    "": 0,
  },
  demandeTension: {
    forte: 100,
    moyenne: 60,
    faible: 25,
    "": 0,
  },
  dynamiqueDemographique: {
    croissance: 100,
    stable: 65,
    baisse: 25,
    "": 0,
  },
  concurrence: {
    faible: 100,
    moderee: 65,
    forte: 25,
    "": 0,
  },
  creationEmplois: {
    forte: 100,
    moderee: 65,
    faible: 30,
    "": 0,
  },
  revenusMenages: {
    eleves: 100,
    intermediaires: 65,
    faibles: 30,
    "": 0,
  },
  absenceDemandeOffresVacantes: {
    faible: 100,
    moyenne: 55,
    forte: 15,
    "": 0,
  },
  contestation: {
    faible: 100,
    moyen: 55,
    fort: 15,
    "": 0,
  },
} as const;

function calculateWeightedAverage(
  entries: Array<{ score: number; weight: number }>,
): number {
  const populatedEntries = entries.filter((entry) => entry.score > 0);

  if (populatedEntries.length === 0) {
    return 0;
  }

  const totalWeight = populatedEntries.reduce(
    (sum, entry) => sum + entry.weight,
    0,
  );
  const weightedScore = populatedEntries.reduce(
    (sum, entry) => sum + entry.score * entry.weight,
    0,
  );

  return Math.round(weightedScore / totalWeight);
}

export function calculateAssainissementScore(
  phase2: Pick<Phase2Data, "assainissementEU" | "assainissementEP">,
): number {
  return calculateWeightedAverage([
    {
      score:
        phase2OptionScores.assainissementEU[
          phase2.assainissementEU.raccordement
        ],
      weight: 55,
    },
    {
      score:
        phase2OptionScores.assainissementEP[
          phase2.assainissementEP.raccordement
        ],
      weight: 45,
    },
  ]);
}

export function calculateReseauxScore(
  phase2: Pick<Phase2Data, "electricite" | "telecom" | "eauPotable">,
): number {
  return calculateWeightedAverage([
    {
      score: phase2OptionScores.reseaux[phase2.electricite.desserte],
      weight: 40,
    },
    {
      score: phase2OptionScores.reseaux[phase2.telecom.desserte],
      weight: 25,
    },
    {
      score: phase2OptionScores.eauPotable[phase2.eauPotable.desserte],
      weight: 35,
    },
  ]);
}

export function calculateMarcheScore(marche: Phase2Data["marche"]): number {
  return calculateWeightedAverage([
    {
      score: phase2OptionScores.demandeTension[marche.demandeTension],
      weight: 25,
    },
    {
      score:
        phase2OptionScores.dynamiqueDemographique[
          marche.dynamiqueDemographique
        ],
      weight: 15,
    },
    {
      score: phase2OptionScores.concurrence[marche.concurrence],
      weight: 20,
    },
    {
      score: phase2OptionScores.creationEmplois[marche.creationEmplois],
      weight: 15,
    },
    {
      score: phase2OptionScores.revenusMenages[marche.revenusMenages],
      weight: 10,
    },
    {
      score:
        phase2OptionScores.absenceDemandeOffresVacantes[
          marche.absenceDemandeOffresVacantes
        ],
      weight: 15,
    },
  ]);
}

export function calculatePotentielScore(
  potentiel: Phase2Data["potentiel"],
): number {
  return calculateWeightedAverage([
    {
      score: potentiel.operationDemonstratrice ? 100 : 35,
      weight: 30,
    },
    {
      score: potentiel.accordCommune ? 100 : 20,
      weight: 40,
    },
    {
      score:
        phase2OptionScores.contestation[potentiel.risqueContestationLocale],
      weight: 30,
    },
  ]);
}

export function calculatePhase2GlobalScore(phase2: Phase2Data): number {
  const weights = defaultWeights.phase2;
  const totalWeight =
    weights.assainissement +
    weights.reseaux +
    weights.potentiel +
    weights.marche;

  const weightedScore =
    (phase2.assainissementScore * weights.assainissement +
      phase2.reseauxScore * weights.reseaux +
      phase2.potentielScore * weights.potentiel +
      phase2.marcheScore * weights.marche) /
    totalWeight;

  return Math.round(weightedScore);
}

// === Calculs Phase 3 ===

export function calculateTravauxTotal(
  travaux: Phase3Data["depenses"]["travaux"],
  typeOperation: Phase3Data["typeOperation"],
): number {
  if (typeOperation === "ddd") {
    return (
      travaux.miseEnEtatSols +
      travaux.coutTravaux +
      travaux.reseaux +
      travaux.amenagementExtPaysage +
      travaux.ouvragesExceptionnels
    );
  }

  return (
    travaux.miseEnEtatSols +
    travaux.voiriePlaces +
    travaux.reseaux +
    travaux.paysage +
    travaux.ouvragesExceptionnels
  );
}

export function calculateEtudesTotal(
  etudes: Phase3Data["depenses"]["etudes"],
): number {
  return etudes.moe + etudes.autresEtudes;
}

export function calculateFraisFinanciersTotal(
  fraisFinanciers: Phase3Data["depenses"]["fraisFinanciers"],
  travauxTotal: number,
  etudesTotal: number,
): number {
  const assietteEmprunt = travauxTotal + etudesTotal;
  const coutEmprunt = assietteEmprunt * (fraisFinanciers.tauxEmprunt / 100);

  return coutEmprunt + fraisFinanciers.autresFrais;
}

export function calculateAutresTotal(
  autres: Phase3Data["depenses"]["autres"],
): number {
  return autres.fraisDivers + autres.imprevus;
}

export function calculateIndicateurs(
  budgetTotal: number,
  recettes: Phase3Data["recettes"],
  typeOperation: Phase3Data["typeOperation"],
): Phase3Data["indicateurs"] {
  const caTotal =
    (typeOperation === "dap" ? recettes.cessionsChargesFoncieres : 0) +
    recettes.autresCessions +
    recettes.participations +
    recettes.autresSubventions;
  const margePromotion = caTotal - budgetTotal;
  const margePromotionPct =
    budgetTotal > 0 ? (margePromotion / budgetTotal) * 100 : 0;
  const rentabiliteInvestissement =
    budgetTotal > 0 ? (margePromotion / budgetTotal) * 100 : 0;
  const prixRevientM2 =
    recettes.capaciteNombreLogements > 0
      ? budgetTotal / recettes.capaciteNombreLogements
      : 0;
  const ratioFoncier =
    typeOperation === "dap" && caTotal > 0
      ? (recettes.cessionsChargesFoncieres / caTotal) * 100
      : 0;

  return {
    margePromotion: Math.round(margePromotion),
    margePromotionPct: Math.round(margePromotionPct * 10) / 10,
    rentabiliteInvestissement: Math.round(rentabiliteInvestissement * 10) / 10,
    prixRevientM2: Math.round(prixRevientM2),
    ratioFoncier: Math.round(ratioFoncier * 10) / 10,
  };
}

export function calculateFinancialScore(
  indicateurs: Phase3Data["indicateurs"],
): number {
  const thresholds = defaultWeights.phase3;
  let score = 0;

  // Score basé sur la marge promotion (50% du score)
  if (indicateurs.margePromotionPct >= thresholds.margeMin * 1.5) score += 50;
  else if (indicateurs.margePromotionPct >= thresholds.margeMin) score += 35;
  else if (indicateurs.margePromotionPct >= thresholds.margeMin * 0.7)
    score += 20;
  else score += 5;

  // Score basé sur le ROI (30% du score)
  if (indicateurs.rentabiliteInvestissement >= thresholds.roiMin * 1.5)
    score += 30;
  else if (indicateurs.rentabiliteInvestissement >= thresholds.roiMin)
    score += 20;
  else if (indicateurs.rentabiliteInvestissement >= thresholds.roiMin * 0.7)
    score += 10;
  else score += 3;

  // Score basé sur le ratio foncier (20% du score)
  if (indicateurs.ratioFoncier <= thresholds.ratioFoncierMax * 0.7) score += 20;
  else if (indicateurs.ratioFoncier <= thresholds.ratioFoncierMax) score += 15;
  else if (indicateurs.ratioFoncier <= thresholds.ratioFoncierMax * 1.3)
    score += 8;
  else score += 2;

  return Math.min(100, score);
}

// === Calculs Phase 4 (Synthèse) ===

export function calculateGlobalScore(
  study: FeasibilityStudy,
): Phase4Data["scoresPonderes"] {
  const weights = defaultWeights.global;
  const totalWeight = weights.phase1 + weights.phase2 + weights.phase3;

  const phase1Weighted = study.phase1.globalScore * weights.phase1;
  const phase2Weighted = study.phase2.globalScore * weights.phase2;
  const phase3Weighted = study.phase3.financialScore * weights.phase3;

  const global = Math.round(
    (phase1Weighted + phase2Weighted + phase3Weighted) / totalWeight,
  );

  return {
    phase1: Math.round(phase1Weighted / totalWeight),
    phase2: Math.round(phase2Weighted / totalWeight),
    phase3: Math.round(phase3Weighted / totalWeight),
    global,
  };
}

export function generateAutoSWOT(study: FeasibilityStudy): Phase4Data["swot"] {
  const forces: string[] = [];
  const faiblesses: string[] = [];
  const opportunites: string[] = [];
  const menaces: string[] = [];

  // Analyse Phase 1
  if (study.phase1.pluZoneScore >= 80) {
    forces.push("Zonage PLU favorable");
  } else if (study.phase1.pluZoneScore < 50) {
    faiblesses.push("Zonage PLU contraignant");
  }

  if (study.phase1.servitudesScore >= 80) {
    forces.push("Peu de servitudes");
  } else if (study.phase1.servitudesScore < 50) {
    faiblesses.push("Servitudes importantes");
  }

  if (study.phase1.accessibiliteScore >= 75) {
    forces.push("Bonne accessibilité");
  } else if (study.phase1.accessibiliteScore < 50) {
    faiblesses.push("Accessibilité limitée");
  }

  // Analyse Phase 2
  if (study.phase2.marcheScore >= 70) {
    opportunites.push("Marche local porteur");
  } else if (study.phase2.marcheScore < 50) {
    menaces.push("Marche local peu favorable");
  }

  if (study.phase2.assainissementScore >= 70) {
    forces.push("Conditions d'assainissement favorables");
  } else if (study.phase2.assainissementScore < 50) {
    menaces.push("Contraintes d'assainissement importantes");
  }

  if (study.phase2.reseauxScore >= 70) {
    forces.push("Raccordements reseaux favorables");
  } else if (study.phase2.reseauxScore < 50) {
    faiblesses.push("Raccordements reseaux a renforcer");
  }

  if (study.phase2.potentielScore >= 70) {
    forces.push("Bon alignement local du potentiel de projet");
  } else if (study.phase2.potentielScore < 50) {
    faiblesses.push("Portage local du projet incertain");
  }

  // Analyse Phase 3
  if (study.phase3.indicateurs.margePromotionPct >= 20) {
    forces.push("Marge promotion confortable");
  } else if (study.phase3.indicateurs.margePromotionPct < 10) {
    faiblesses.push("Marge promotion serrée");
  }

  if (study.phase3.indicateurs.ratioFoncier <= 20) {
    forces.push("Ratio foncier maîtrisé");
  } else if (study.phase3.indicateurs.ratioFoncier > 30) {
    menaces.push("Ratio foncier élevé");
  }

  return { forces, faiblesses, opportunites, menaces };
}

export function generateRecommendation(study: FeasibilityStudy): {
  recommandation: "go" | "go_reserve" | "no_go";
  justification: string;
} {
  const globalScore = calculateGlobalScore(study).global;
  const recommandation = getRecommendation(globalScore);

  let justification = "";

  switch (recommandation) {
    case "go":
      justification = `Le projet présente un score global de ${globalScore}/100, avec des indicateurs favorables sur l'ensemble des phases d'analyse. Les fondamentaux sont solides et le montage financier est viable.`;
      break;
    case "go_reserve":
      justification = `Le projet obtient un score de ${globalScore}/100. Certains points de vigilance nécessitent une attention particulière. Il est recommandé de lever les réserves identifiées avant de poursuivre.`;
      break;
    case "no_go":
      justification = `Le projet affiche un score de ${globalScore}/100, insuffisant pour une recommandation positive. Les risques identifiés et/ou la faible rentabilité ne permettent pas de valider ce projet en l'état.`;
      break;
  }

  return { recommandation, justification };
}
