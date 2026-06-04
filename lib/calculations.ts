import type { Phase1Data, Phase2Data, Phase3Data, Phase4Data, FeasibilityStudy } from './types';
import { 
  defaultWeights, 
  pluZoneScores, 
  accessibilityScores, 
  marketScores,
  getRecommendation 
} from './config';

// === Calculs Phase 1 ===

export function calculateServitudesScore(servitudes: Phase1Data['servitudes']): number {
  let score = 100;
  if (servitudes.patrimoine) score -= 20;
  if (servitudes.inondation) score -= 30;
  if (servitudes.bruit) score -= 15;
  if (servitudes.pollution) score -= 25;
  if (servitudes.autres && servitudes.autres.trim() !== '') score -= 10;
  return Math.max(0, score);
}

export function calculateAccessibiliteScore(accessibilite: Phase1Data['accessibilite']): number {
  const scores: number[] = [];
  
  if (accessibilite.transportEnCommun) {
    scores.push(accessibilityScores.transportEnCommun[accessibilite.transportEnCommun]);
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

export function calculateEnvironnementScore(environnement: Phase1Data['environnement']): number {
  let score = 0;
  const maxScore = 100;
  const itemScore = 25;
  
  if (environnement.commerces) score += itemScore;
  if (environnement.ecoles) score += itemScore;
  if (environnement.sante) score += itemScore;
  if (environnement.espaceVerts) score += itemScore;
  
  // Pénalité pour nuisances
  if (environnement.nuisances && environnement.nuisances.trim() !== '') {
    score = Math.max(0, score - 20);
  }
  
  return Math.min(score, maxScore);
}

export function calculatePhase1GlobalScore(phase1: Phase1Data): number {
  const weights = defaultWeights.phase1;
  const totalWeight = weights.pluZone + weights.servitudes + weights.accessibilite + weights.environnement;
  
  const weightedScore = 
    (phase1.pluZoneScore * weights.pluZone +
     phase1.servitudesScore * weights.servitudes +
     phase1.accessibiliteScore * weights.accessibilite +
     phase1.environnementScore * weights.environnement) / totalWeight;
  
  return Math.round(weightedScore);
}

// === Calculs Phase 2 ===

export function calculateUrbanismeScore(urbanisme: Phase2Data['urbanisme']): number {
  // Score basé sur les possibilités d'urbanisme
  let score = 50; // Base
  
  // Bonus pour emprise au sol élevée
  if (urbanisme.empriseSol >= 60) score += 20;
  else if (urbanisme.empriseSol >= 40) score += 10;
  
  // Bonus pour hauteur élevée
  if (urbanisme.hauteurMax >= 15) score += 20;
  else if (urbanisme.hauteurMax >= 9) score += 10;
  
  // Pénalité pour grands reculs
  const avgRecul = (urbanisme.reculs.facade + urbanisme.reculs.lateral + urbanisme.reculs.fond) / 3;
  if (avgRecul > 6) score -= 10;
  
  // Pénalité pour trop d'espaces verts obligatoires
  if (urbanisme.espacesVerts > 40) score -= 10;
  
  return Math.min(100, Math.max(0, score));
}

export function calculatePotentielScore(potentiel: Phase2Data['potentiel'], landArea: number): number {
  if (landArea === 0 || potentiel.surfacePlancher === 0) return 0;
  
  // Ratio de densité
  const densityRatio = potentiel.surfacePlancher / landArea;
  let score = 50;
  
  if (densityRatio >= 2) score += 30;
  else if (densityRatio >= 1.5) score += 20;
  else if (densityRatio >= 1) score += 10;
  else if (densityRatio < 0.5) score -= 20;
  
  // Bonus si parking suffisant
  if (potentiel.nombreLogements > 0) {
    const parkingRatio = potentiel.parkings / potentiel.nombreLogements;
    if (parkingRatio >= 1.5) score += 15;
    else if (parkingRatio >= 1) score += 10;
    else score -= 10;
  }
  
  return Math.min(100, Math.max(0, score));
}

export function calculateMarcheScore(marche: Phase2Data['marche']): number {
  const scores: number[] = [];
  
  if (marche.demandeLoc) {
    scores.push(marketScores.demandeLoc[marche.demandeLoc]);
  }
  if (marche.tendance) {
    scores.push(marketScores.tendance[marche.tendance]);
  }
  
  // Score basé sur le délai de vente
  if (marche.delaiVente > 0) {
    if (marche.delaiVente <= 6) scores.push(100);
    else if (marche.delaiVente <= 12) scores.push(70);
    else if (marche.delaiVente <= 18) scores.push(50);
    else scores.push(30);
  }
  
  // Score basé sur l'écart neuf/ancien
  if (marche.prixM2Neuf > 0 && marche.prixM2Ancien > 0) {
    const ecart = ((marche.prixM2Neuf - marche.prixM2Ancien) / marche.prixM2Ancien) * 100;
    if (ecart <= 20) scores.push(90);
    else if (ecart <= 30) scores.push(70);
    else if (ecart <= 40) scores.push(50);
    else scores.push(30);
  }
  
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export function calculateConcurrenceScore(concurrence: Phase2Data['concurrence']): number {
  let score = 70; // Base
  
  // Pénalité pour beaucoup de programmes proches
  if (concurrence.programmesProches > 5) score -= 20;
  else if (concurrence.programmesProches > 2) score -= 10;
  
  // Score basé sur le stock disponible
  if (concurrence.stockDisponible) {
    score += (marketScores.stockDisponible[concurrence.stockDisponible] - 50) / 2;
  }
  
  return Math.min(100, Math.max(0, Math.round(score)));
}

export function calculatePhase2GlobalScore(phase2: Phase2Data): number {
  const weights = defaultWeights.phase2;
  const totalWeight = weights.urbanisme + weights.potentiel + weights.marche + weights.concurrence;
  
  const weightedScore = 
    (phase2.urbanismeScore * weights.urbanisme +
     phase2.potentielScore * weights.potentiel +
     phase2.marcheScore * weights.marche +
     phase2.concurrenceScore * weights.concurrence) / totalWeight;
  
  return Math.round(weightedScore);
}

// === Calculs Phase 3 ===

export function calculateAcquisitionTotal(acquisition: Phase3Data['acquisition']): number {
  return (
    acquisition.prixTerrain +
    acquisition.fraisNotaire +
    acquisition.fraisAgence +
    acquisition.taxeAmenagement +
    acquisition.autresFrais
  );
}

export function calculateConstructionTotal(construction: Phase3Data['construction']): number {
  const coutTravaux = construction.coutM2 * construction.surfaceConstructible;
  const honoraires = coutTravaux * (construction.honorairesMOE / 100);
  const aleas = (coutTravaux + honoraires) * (construction.aleas / 100);
  
  return coutTravaux + honoraires + construction.etudesTechniques + aleas;
}

export function calculateFraisAnnexesTotal(fraisAnnexes: Phase3Data['fraisAnnexes']): number {
  return (
    fraisAnnexes.fraisFinanciers +
    fraisAnnexes.fraisCommerciaux +
    fraisAnnexes.assurances +
    fraisAnnexes.gestionProjet
  );
}

export function calculateIndicateurs(
  budgetTotal: number,
  recettes: Phase3Data['recettes'],
  acquisition: Phase3Data['acquisition']
): Phase3Data['indicateurs'] {
  const caTotal = recettes.prixVenteM2 * recettes.surfaceVendable;
  const margePromotion = caTotal - budgetTotal;
  const margePromotionPct = budgetTotal > 0 ? (margePromotion / budgetTotal) * 100 : 0;
  const rentabiliteInvestissement = budgetTotal > 0 ? (margePromotion / budgetTotal) * 100 : 0;
  const prixRevientM2 = recettes.surfaceVendable > 0 ? budgetTotal / recettes.surfaceVendable : 0;
  const ratioFoncier = budgetTotal > 0 ? (acquisition.prixTerrain / budgetTotal) * 100 : 0;
  
  return {
    margePromotion: Math.round(margePromotion),
    margePromotionPct: Math.round(margePromotionPct * 10) / 10,
    rentabiliteInvestissement: Math.round(rentabiliteInvestissement * 10) / 10,
    prixRevientM2: Math.round(prixRevientM2),
    ratioFoncier: Math.round(ratioFoncier * 10) / 10,
  };
}

export function calculateFinancialScore(indicateurs: Phase3Data['indicateurs']): number {
  const thresholds = defaultWeights.phase3;
  let score = 0;
  
  // Score basé sur la marge promotion (50% du score)
  if (indicateurs.margePromotionPct >= thresholds.margeMin * 1.5) score += 50;
  else if (indicateurs.margePromotionPct >= thresholds.margeMin) score += 35;
  else if (indicateurs.margePromotionPct >= thresholds.margeMin * 0.7) score += 20;
  else score += 5;
  
  // Score basé sur le ROI (30% du score)
  if (indicateurs.rentabiliteInvestissement >= thresholds.roiMin * 1.5) score += 30;
  else if (indicateurs.rentabiliteInvestissement >= thresholds.roiMin) score += 20;
  else if (indicateurs.rentabiliteInvestissement >= thresholds.roiMin * 0.7) score += 10;
  else score += 3;
  
  // Score basé sur le ratio foncier (20% du score)
  if (indicateurs.ratioFoncier <= thresholds.ratioFoncierMax * 0.7) score += 20;
  else if (indicateurs.ratioFoncier <= thresholds.ratioFoncierMax) score += 15;
  else if (indicateurs.ratioFoncier <= thresholds.ratioFoncierMax * 1.3) score += 8;
  else score += 2;
  
  return Math.min(100, score);
}

// === Calculs Phase 4 (Synthèse) ===

export function calculateGlobalScore(study: FeasibilityStudy): Phase4Data['scoresPonderes'] {
  const weights = defaultWeights.global;
  const totalWeight = weights.phase1 + weights.phase2 + weights.phase3;
  
  const phase1Weighted = study.phase1.globalScore * weights.phase1;
  const phase2Weighted = study.phase2.globalScore * weights.phase2;
  const phase3Weighted = study.phase3.financialScore * weights.phase3;
  
  const global = Math.round((phase1Weighted + phase2Weighted + phase3Weighted) / totalWeight);
  
  return {
    phase1: Math.round(phase1Weighted / totalWeight),
    phase2: Math.round(phase2Weighted / totalWeight),
    phase3: Math.round(phase3Weighted / totalWeight),
    global,
  };
}

export function generateAutoSWOT(study: FeasibilityStudy): Phase4Data['swot'] {
  const forces: string[] = [];
  const faiblesses: string[] = [];
  const opportunites: string[] = [];
  const menaces: string[] = [];
  
  // Analyse Phase 1
  if (study.phase1.pluZoneScore >= 80) {
    forces.push('Zonage PLU favorable');
  } else if (study.phase1.pluZoneScore < 50) {
    faiblesses.push('Zonage PLU contraignant');
  }
  
  if (study.phase1.servitudesScore >= 80) {
    forces.push('Peu de servitudes');
  } else if (study.phase1.servitudesScore < 50) {
    faiblesses.push('Servitudes importantes');
  }
  
  if (study.phase1.accessibiliteScore >= 75) {
    forces.push('Bonne accessibilité');
  } else if (study.phase1.accessibiliteScore < 50) {
    faiblesses.push('Accessibilité limitée');
  }
  
  // Analyse Phase 2
  if (study.phase2.marcheScore >= 70) {
    opportunites.push('Marché immobilier dynamique');
  } else if (study.phase2.marcheScore < 50) {
    menaces.push('Marché immobilier atone');
  }
  
  if (study.phase2.concurrenceScore >= 70) {
    opportunites.push('Faible concurrence');
  } else if (study.phase2.concurrenceScore < 50) {
    menaces.push('Forte concurrence');
  }
  
  if (study.phase2.potentielScore >= 70) {
    forces.push('Fort potentiel constructible');
  } else if (study.phase2.potentielScore < 50) {
    faiblesses.push('Potentiel constructible limité');
  }
  
  // Analyse Phase 3
  if (study.phase3.indicateurs.margePromotionPct >= 20) {
    forces.push('Marge promotion confortable');
  } else if (study.phase3.indicateurs.margePromotionPct < 10) {
    faiblesses.push('Marge promotion serrée');
  }
  
  if (study.phase3.indicateurs.ratioFoncier <= 20) {
    forces.push('Ratio foncier maîtrisé');
  } else if (study.phase3.indicateurs.ratioFoncier > 30) {
    menaces.push('Ratio foncier élevé');
  }
  
  return { forces, faiblesses, opportunites, menaces };
}

export function generateRecommendation(study: FeasibilityStudy): {
  recommandation: 'go' | 'go_reserve' | 'no_go';
  justification: string;
} {
  const globalScore = calculateGlobalScore(study).global;
  const recommandation = getRecommendation(globalScore);
  
  let justification = '';
  
  switch (recommandation) {
    case 'go':
      justification = `Le projet présente un score global de ${globalScore}/100, avec des indicateurs favorables sur l'ensemble des phases d'analyse. Les fondamentaux sont solides et le montage financier est viable.`;
      break;
    case 'go_reserve':
      justification = `Le projet obtient un score de ${globalScore}/100. Certains points de vigilance nécessitent une attention particulière. Il est recommandé de lever les réserves identifiées avant de poursuivre.`;
      break;
    case 'no_go':
      justification = `Le projet affiche un score de ${globalScore}/100, insuffisant pour une recommandation positive. Les risques identifiés et/ou la faible rentabilité ne permettent pas de valider ce projet en l'état.`;
      break;
  }
  
  return { recommandation, justification };
}
