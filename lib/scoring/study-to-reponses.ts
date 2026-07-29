/**
 * lib/scoring/study-to-reponses.ts
 *
 * Convertit un FeasibilityStudy en ReponsesMap pour le moteur de calcul.
 * Le pont entre les champs typés de l'étude et les UUIDs des critères DB
 * s'appuie sur le champ `key` de chaque critère (convention définie dans
 * la migration 20240102000000_scoring_tables.sql).
 *
 * Convention des clés :
 *  Phase 1 : plu_zone · servitude_patrimoine · servitude_inondation ·
 *            servitude_bruit · servitude_pollution · servitude_autres ·
 *            accessibilite_transport · accessibilite_axes ·
 *            accessibilite_stationnement · environnement · environnement_nuisances
 *  Phase 2 : assainissement_eu · assainissement_ep · electricite · telecom ·
 *            eau_potable · operation_demonstratrice · accord_commune ·
 *            contestation_locale · marche_demande_tension · marche_demographique ·
 *            marche_concurrence · marche_emplois · marche_revenus · marche_offres_vacantes
 *  Phase 3 : seuil_marge_promotion · seuil_roi · seuil_ratio_foncier
 */

import type { FeasibilityStudy } from "@/lib/types";
import type { CritereConfig, ReponsesMap } from "./types";

/** Retourne l'UUID du critère identifié par key, ou undefined s'il n'existe pas. */
function findId(criteres: CritereConfig[], key: string): string | undefined {
  return criteres.find((c) => c.key === key)?.id;
}

/**
 * Construit la ReponsesMap à partir des données d'une étude et des critères DB.
 * Les critères dont la clé n'est pas dans la liste sont ignorés silencieusement.
 */
export function buildReponsesMap(
  study: FeasibilityStudy,
  criteres: CritereConfig[],
): ReponsesMap {
  const reponses: ReponsesMap = {};

  function set(key: string, value: ReponsesMap[string]): void {
    const id = findId(criteres, key);
    if (id !== undefined) reponses[id] = value;
  }

  const { phase1, phase2, phase3 } = study;

  // ============================================================
  // PHASE 1
  // ============================================================

  // Zonage PLU — select (clé option = code zone ex. 'UA')
  set("plu_zone", phase1.pluZone || null);

  // Servitudes — checkbox (checked = contrainte présente = malus)
  set("servitude_patrimoine", phase1.servitudes.patrimoine);
  set("servitude_inondation", phase1.servitudes.inondation);
  set("servitude_bruit", phase1.servitudes.bruit);
  set("servitude_pollution", phase1.servitudes.pollution);
  // "autres" est un champ texte : présence de contenu = contrainte
  set("servitude_autres", phase1.servitudes.autres.trim() !== "");

  // Accessibilité — select
  set(
    "accessibilite_transport",
    phase1.accessibilite.transportEnCommun || null,
  );
  set("accessibilite_axes", phase1.accessibilite.axesRoutiers || null);
  set(
    "accessibilite_stationnement",
    phase1.accessibilite.stationnement || null,
  );

  // Environnement — additif (liste des clés cochées sérialisée en JSON)
  const envCochees: string[] = [];
  if (phase1.environnement.commerces) envCochees.push("commerces");
  if (phase1.environnement.ecoles) envCochees.push("ecoles");
  if (phase1.environnement.sante) envCochees.push("sante");
  if (phase1.environnement.espaceVerts) envCochees.push("espaceVerts");
  set("environnement", JSON.stringify(envCochees));

  // Nuisances — checkbox (texte non vide = présence de nuisance = malus)
  set("environnement_nuisances", phase1.environnement.nuisances.trim() !== "");

  // ============================================================
  // PHASE 2
  // ============================================================

  set("assainissement_eu", phase2.assainissementEU.raccordement || null);
  set("assainissement_ep", phase2.assainissementEP.raccordement || null);
  set("electricite", phase2.electricite.desserte || null);
  set("telecom", phase2.telecom.desserte || null);
  set("eau_potable", phase2.eauPotable.desserte || null);

  // Booléens mappés en clés 'true' / 'false' (type select dans la DB)
  set(
    "operation_demonstratrice",
    String(phase2.potentiel.operationDemonstratrice),
  );
  set("accord_commune", String(phase2.potentiel.accordCommune));

  set("contestation_locale", phase2.potentiel.risqueContestationLocale || null);

  set("marche_demande_tension", phase2.marche.demandeTension || null);
  set("marche_demographique", phase2.marche.dynamiqueDemographique || null);
  set("marche_concurrence", phase2.marche.concurrence || null);
  set("marche_emplois", phase2.marche.creationEmplois || null);
  set("marche_revenus", phase2.marche.revenusMenages || null);
  set(
    "marche_offres_vacantes",
    phase2.marche.absenceDemandeOffresVacantes || null,
  );

  // ============================================================
  // PHASE 3 — indicateurs financiers calculés (seuils quantitatifs)
  // ============================================================

  set("seuil_marge_promotion", phase3.indicateurs.margePromotionPct);
  set("seuil_roi", phase3.indicateurs.rentabiliteInvestissement);
  set("seuil_ratio_foncier", phase3.indicateurs.ratioFoncier);

  return reponses;
}
