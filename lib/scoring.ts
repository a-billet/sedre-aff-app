/**
 * scoring.ts — Source de vérité pour tous les critères d'évaluation.
 *
 * Ce fichier regroupe en un seul endroit :
 *  - les pondérations par défaut (defaultWeights)
 *  - chaque option de critère avec son LABEL affiché ET son SCORE associé
 *
 * Modifier ce fichier suffit pour ajuster les scores et poids sans
 * toucher à la logique de calcul (calculations.ts).
 */

import type { WeightConfig } from "./types";

// ============================================================
// PONDÉRATIONS PAR DÉFAUT
// ============================================================

export const defaultWeights: WeightConfig = {
  phase1: {
    pluZone: 35,
    servitudes: 25,
    accessibilite: 20,
    environnement: 20,
  },
  phase2: {
    assainissement: 30,
    reseaux: 25,
    potentiel: 20,
    marche: 25,
  },
  phase3: {
    margeMin: 15, // % minimum de marge promotion
    roiMin: 10, // % minimum de ROI
    ratioFoncierMax: 25, // % maximum du ratio foncier / CA
  },
  global: {
    phase1: 25,
    phase2: 35,
    phase3: 40,
  },
};

// ============================================================
// PHASE 1 – ANALYSE INITIALE
// ============================================================

/** Zones PLU : label affiché et score de faisabilité (0–100) */
export const pluZones: Record<string, { label: string; score: number }> = {
  UA: { label: "UA - Zone urbaine dense", score: 100 },
  UB: { label: "UB - Zone urbaine", score: 90 },
  UC: { label: "UC - Zone urbaine périphérique", score: 80 },
  AU: { label: "AU - Zone à urbaniser", score: 70 },
  A: { label: "A - Zone agricole", score: 20 },
  N: { label: "N - Zone naturelle", score: 10 },
};

/** Servitudes : label affiché et malus soustrait au score (base 100) */
export const servitudePenalties: Record<
  string,
  { label: string; malus: number }
> = {
  patrimoine: { label: "Patrimoine historique", malus: 20 },
  inondation: { label: "Zone inondable (PPRI)", malus: 30 },
  bruit: { label: "Zone de bruit", malus: 15 },
  pollution: { label: "Pollution / contamination", malus: 25 },
  autres: { label: "Autres contraintes", malus: 10 },
};

/** Accessibilité : label et score par niveau */
export const criteresAccessibilite: Record<
  string,
  Record<string, { label: string; score: number }>
> = {
  transportEnCommun: {
    excellent: { label: "Excellent (métro / tram / bus fréquent)", score: 100 },
    bon: { label: "Bon (bus régulier)", score: 75 },
    moyen: { label: "Moyen (bus peu fréquent)", score: 50 },
    faible: { label: "Faible (aucun transport en commun)", score: 25 },
  },
  axesRoutiers: {
    excellent: { label: "Excellent (autoroute / voie rapide)", score: 100 },
    bon: { label: "Bon (route départementale)", score: 75 },
    moyen: { label: "Moyen (route communale)", score: 50 },
    faible: { label: "Faible (chemin étroit / accès difficile)", score: 25 },
  },
  stationnement: {
    facile: { label: "Facile (parking public à proximité)", score: 100 },
    moyen: { label: "Moyen (stationnement limité)", score: 60 },
    difficile: { label: "Difficile (aucun stationnement proche)", score: 30 },
  },
};

/** Environnement immédiat : label et score apporté par aménité (additif, base 0) */
export const criteresEnvironnement: Record<
  string,
  { label: string; score: number }
> = {
  commerces: { label: "Commerces de proximité", score: 25 },
  ecoles: { label: "Écoles", score: 25 },
  sante: { label: "Équipements de santé", score: 25 },
  espaceVerts: { label: "Espaces verts", score: 25 },
};

/** Malus appliqué si des nuisances sont renseignées */
export const nuisancesMalus = 20;

// ============================================================
// PHASE 2 – ANALYSE DÉTAILLÉE
// ============================================================

/** Assainissement eaux usées */
export const criteresAssainissementEU: Record<
  string,
  { label: string; score: number }
> = {
  reseau_suffisant: { label: "Réseau EU suffisant à proximité", score: 100 },
  reseau_proximite: {
    label: "Réseau EU en proximité (extension nécessaire)",
    score: 70,
  },
  station_relevage: { label: "Station de relevage nécessaire", score: 35 },
};

/** Assainissement eaux pluviales */
export const criteresAssainissementEP: Record<
  string,
  { label: string; score: number }
> = {
  infiltration: { label: "Infiltration sur site possible", score: 100 },
  reseau_suffisant: { label: "Réseau EP suffisant", score: 85 },
  reseau_proximite: { label: "Réseau EP à étendre", score: 60 },
};

/** Réseaux secs (électricité, télécom) */
export const criteresReseauxSecs: Record<
  string,
  { label: string; score: number }
> = {
  reseau_suffisant: { label: "Réseau souterrain suffisant", score: 100 },
  reseau_proximite: { label: "Réseau à étendre", score: 70 },
  lignes_aeriennes: {
    label: "Lignes aériennes (enfouissement requis)",
    score: 35,
  },
};

/** Eau potable */
export const criteresEauPotable: Record<
  string,
  { label: string; score: number }
> = {
  reseau_suffisant: { label: "Réseau AEP suffisant", score: 100 },
  reseau_proximite: { label: "Réseau AEP à étendre", score: 70 },
};

/** Risque de contestation locale */
export const criteresContestationLocale: Record<
  string,
  { label: string; score: number }
> = {
  faible: { label: "Faible risque de contestation", score: 100 },
  moyen: { label: "Risque modéré", score: 55 },
  fort: { label: "Fort risque de contestation", score: 15 },
};

/** Critères de marché local */
export const criteresMarche: Record<
  string,
  Record<string, { label: string; score: number }>
> = {
  demandeTension: {
    forte: { label: "Forte tension locative / de vente", score: 100 },
    moyenne: { label: "Tension modérée", score: 60 },
    faible: { label: "Faible tension", score: 25 },
  },
  dynamiqueDemographique: {
    croissance: { label: "Croissance démographique", score: 100 },
    stable: { label: "Population stable", score: 65 },
    baisse: { label: "Décroissance démographique", score: 25 },
  },
  concurrence: {
    faible: { label: "Faible concurrence", score: 100 },
    moderee: { label: "Concurrence modérée", score: 65 },
    forte: { label: "Forte concurrence", score: 25 },
  },
  creationEmplois: {
    forte: { label: "Forte création d'emplois", score: 100 },
    moderee: { label: "Création modérée", score: 65 },
    faible: { label: "Faible création", score: 30 },
  },
  revenusMenages: {
    eleves: { label: "Revenus élevés", score: 100 },
    intermediaires: { label: "Revenus intermédiaires", score: 65 },
    faibles: { label: "Revenus faibles", score: 30 },
  },
  absenceDemandeOffresVacantes: {
    faible: { label: "Peu d'offres vacantes", score: 100 },
    moyenne: { label: "Offres vacantes modérées", score: 55 },
    forte: { label: "Nombreuses offres vacantes", score: 15 },
  },
};
