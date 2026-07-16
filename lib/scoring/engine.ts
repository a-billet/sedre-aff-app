/**
 * lib/scoring/engine.ts
 *
 * Moteur de calcul pur — AUCUNE dépendance React / Next.js / Supabase.
 * Toutes les fonctions sont pures et testables de manière autonome.
 *
 * Principe fondamental :
 * Le score calculé dépend uniquement des réponses ET des critères
 * passés explicitement en paramètre. Les critères ne sont jamais
 * lus depuis un contexte global ou un import statique.
 */

import type {
  SeuilsRecommandation,
  ReponsesMap,
  ScoreResult,
  ScoreCategorie,
  ScoreCritere,
  PreBilanHypotheses,
  PreBilanResult,
  ModePreBilan,
  CritereConfig,
  ValeurReponse,
} from "./types";

// ============================================================
// SCORING
// ============================================================

/**
 * Calcule le score d'une option qualitative pour un critère donné.
 * Retourne 0 si la valeur n'est pas reconnue.
 */
function scoreOptionQualitative(
  critere: CritereConfig,
  valeur: ValeurReponse,
): number {
  if (!critere.options || valeur === null || valeur === undefined) return 0;
  const option = critere.options.find((o) => o.valeur === String(valeur));
  return option?.score ?? 0;
}

/**
 * Calcule le score d'une valeur quantitative selon les seuils du critère.
 * Retourne 0 si hors de tous les seuils.
 */
function scoreQuantitatif(
  critere: CritereConfig,
  valeur: ValeurReponse,
): number {
  if (
    !critere.seuilsQuantitatif ||
    valeur === null ||
    valeur === undefined ||
    typeof valeur !== "number"
  )
    return 0;

  const seuil = critere.seuilsQuantitatif.find(
    (s) => valeur >= s.min && valeur <= s.max,
  );
  return seuil?.score ?? 0;
}

/**
 * Calcule le score d'un critère pour une valeur de réponse donnée.
 */
function calculerScoreCritere(
  critere: CritereConfig,
  valeur: ValeurReponse,
): number {
  if (critere.typeSaisie === "qualitatif") {
    return scoreOptionQualitative(critere, valeur);
  }
  return scoreQuantitatif(critere, valeur);
}

/**
 * Calcule la moyenne pondérée d'une liste de scores.
 * Ignore les critères sans réponse (score = 0 et poids nul dans la moyenne).
 */
function moyennePonderee(
  items: Array<{ score: number; poids: number }>,
): number {
  const populated = items.filter((i) => i.score > 0);
  if (populated.length === 0) return 0;

  const totalPoids = populated.reduce((s, i) => s + i.poids, 0);
  if (totalPoids === 0) return 0;

  const somme = populated.reduce((s, i) => s + i.score * i.poids, 0);
  return Math.round(somme / totalPoids);
}

/**
 * Détermine la recommandation à partir du score global et des seuils de la grille.
 */
function recommandationFromScore(
  score: number,
  seuils: SeuilsRecommandation,
): ScoreResult["recommandation"] {
  if (score >= seuils.go) return "go";
  if (score >= seuils.goReserve) return "go_reserve";
  return "no_go";
}

const DEFAULT_SEUILS: SeuilsRecommandation = { go: 70, goReserve: 50 };

/**
 * Calcule le score global d'une analyse à partir des réponses et des critères
 * chargés depuis la base de données.
 *
 * Le poids de chaque catégorie dans le score global est calculé comme la
 * somme des poids de ses critères (pas de hiérarchie séparée).
 *
 * @param reponses     Map critere_id → valeur brute
 * @param criteres     Critères avec poids et seuils (depuis table criteres)
 * @param seuilsReco   Seuils de recommandation (optionnel, défaut 70/50)
 * @returns            Résultat complet du scoring
 */
export function calculerScore(
  reponses: ReponsesMap,
  criteres: CritereConfig[],
  seuilsReco: SeuilsRecommandation = DEFAULT_SEUILS,
): ScoreResult {
  // Regrouper les critères par catégorie
  const categoriesMap = new Map<string, CritereConfig[]>();
  for (const critere of criteres) {
    const liste = categoriesMap.get(critere.categorie) ?? [];
    liste.push(critere);
    categoriesMap.set(critere.categorie, liste);
  }

  const categories: ScoreCategorie[] = [];
  let scoreGlobalNumerateur = 0;
  let scoreGlobalDenominateur = 0;

  for (const [categorie, critereList] of categoriesMap.entries()) {
    // Poids total de la catégorie = somme des poids de ses critères
    const totalPoidsCat = critereList.reduce((s, c) => s + c.poids, 0);

    const critereResults: ScoreCritere[] = critereList.map((critere) => {
      const valeur = reponses[critere.id] ?? null;
      const scoreObtenu = calculerScoreCritere(critere, valeur);
      return {
        critereId: critere.id,
        libelle: critere.libelle,
        scoreObtenu,
        poids: critere.poids,
        valeur,
      };
    });

    const scoreAggrege = moyennePonderee(
      critereResults.map((c) => ({ score: c.scoreObtenu, poids: c.poids })),
    );

    const scoreContribution = Math.round((scoreAggrege * totalPoidsCat) / 100);

    categories.push({
      categorie,
      scoreAggrege,
      poids: totalPoidsCat,
      scoreContribution,
      criteres: critereResults,
    });

    scoreGlobalNumerateur += scoreAggrege * totalPoidsCat;
    scoreGlobalDenominateur += totalPoidsCat;
  }

  const scoreGlobal =
    scoreGlobalDenominateur > 0
      ? Math.round(scoreGlobalNumerateur / scoreGlobalDenominateur)
      : 0;

  return {
    scoreGlobal,
    recommandation: recommandationFromScore(scoreGlobal, seuilsReco),
    categories,
    calculatedAt: new Date().toISOString(),
  };
}

// ============================================================
// PRÉ-BILAN ÉCONOMIQUE
// ============================================================

/**
 * Calcule le total des dépenses travaux selon le mode d'opération.
 */
function calculerTotalTravaux(
  travaux: PreBilanHypotheses["travaux"],
  mode: ModePreBilan,
): number {
  if (mode === "amenagement") {
    return (
      (travaux.miseEnEtatSols ?? 0) +
      (travaux.voiriePlaces ?? 0) +
      (travaux.reseaux ?? 0) +
      (travaux.paysage ?? 0) +
      (travaux.ouvragesExceptionnels ?? 0)
    );
  }
  // construction
  return (
    (travaux.miseEnEtatSols ?? 0) +
    (travaux.coutTravaux ?? 0) +
    (travaux.reseaux ?? 0) +
    (travaux.amenagementExtPaysage ?? 0) +
    (travaux.ouvragesExceptionnels ?? 0)
  );
}

/**
 * Calcule le pré-bilan économique d'une opération foncière.
 * Fonction pure : aucun effet de bord, résultat déterministe.
 *
 * @param hypotheses  Données financières saisies par l'utilisateur
 * @param mode        'amenagement' (DAP) ou 'construction' (DDD)
 */
export function calculerPreBilan(
  hypotheses: PreBilanHypotheses,
  mode: ModePreBilan,
): PreBilanResult {
  const totalTravaux = calculerTotalTravaux(hypotheses.travaux, mode);
  const totalEtudes = hypotheses.etudes.moe + hypotheses.etudes.autresEtudes;

  const assietteEmprunt = totalTravaux + totalEtudes;
  const coutEmprunt =
    assietteEmprunt * (hypotheses.fraisFinanciers.tauxEmprunt / 100);
  const totalFraisFinanciers =
    coutEmprunt + hypotheses.fraisFinanciers.autresFrais;

  const totalAutres =
    hypotheses.autres.fraisDivers + hypotheses.autres.imprevus;

  const budgetTotal =
    totalTravaux + totalEtudes + totalFraisFinanciers + totalAutres;

  const cessionsChargesFoncieres =
    hypotheses.typeOperation === "dap"
      ? (hypotheses.recettes.cessionsChargesFoncieres ?? 0)
      : 0;

  const totalRecettes =
    cessionsChargesFoncieres +
    hypotheses.recettes.autresCessions +
    hypotheses.recettes.participations +
    hypotheses.recettes.autresSubventions;

  const margeNette = totalRecettes - budgetTotal;
  const margeNettePct = budgetTotal > 0 ? (margeNette / budgetTotal) * 100 : 0;
  const roi = budgetTotal > 0 ? (margeNette / budgetTotal) * 100 : 0;

  const prixRevientParLogement =
    hypotheses.recettes.capaciteNombreLogements > 0
      ? budgetTotal / hypotheses.recettes.capaciteNombreLogements
      : 0;

  const ratioFoncier =
    hypotheses.typeOperation === "dap" && totalRecettes > 0
      ? (cessionsChargesFoncieres / totalRecettes) * 100
      : 0;

  return {
    mode,
    depenses: {
      travaux: Math.round(totalTravaux),
      etudes: Math.round(totalEtudes),
      fraisFinanciers: Math.round(totalFraisFinanciers),
      autres: Math.round(totalAutres),
      total: Math.round(budgetTotal),
    },
    recettes: {
      cessionsChargesFoncieres: Math.round(cessionsChargesFoncieres),
      autresCessions: Math.round(hypotheses.recettes.autresCessions),
      participations: Math.round(hypotheses.recettes.participations),
      autresSubventions: Math.round(hypotheses.recettes.autresSubventions),
      total: Math.round(totalRecettes),
    },
    indicateurs: {
      margeNette: Math.round(margeNette),
      margeNettePct: Math.round(margeNettePct * 10) / 10,
      roi: Math.round(roi * 10) / 10,
      prixRevientParLogement: Math.round(prixRevientParLogement),
      ratioFoncier: Math.round(ratioFoncier * 10) / 10,
    },
  };
}
