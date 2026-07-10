/**
 * lib/scoring/adapter.ts
 *
 * Convertit les lignes Supabase (grille_versions + grille_ponderations + criteres)
 * en GrilleVersionConfig consommable par le moteur de calcul.
 */

import type { Database, Json } from "@/lib/supabase/types";
import type {
  GrilleVersionConfig,
  CritereConfig,
  OptionScore,
  SeuilQuantitatif,
} from "./types";

type GrilleVersionRow = Database["public"]["Tables"]["grille_versions"]["Row"];
type GrillePonderationRow =
  Database["public"]["Tables"]["grille_ponderations"]["Row"];
type CritereRow = Database["public"]["Tables"]["criteres"]["Row"];

/** Seuils stockés en JSONB dans grille_ponderations.seuils */
interface SeuilsJsonQual {
  type: "qualitatif";
  options: { valeur: string; score: number; label?: string }[];
}
interface SeuilsJsonQuant {
  type: "quantitatif";
  seuils: { min: number; max: number; score: number }[];
}
type SeuilsJson = SeuilsJsonQual | SeuilsJsonQuant;

/** Poids des catégories stockés dans grille_versions ou fournis séparément */
export interface PoidsCategoriesJson {
  [categorie: string]: number;
}

/** Seuils de recommandation, stockables dans grille_versions.description (ou colonne dédiée) */
export interface SeuilsRecommandationJson {
  go: number;
  goReserve: number;
}

const DEFAULT_SEUILS: SeuilsRecommandationJson = { go: 70, goReserve: 50 };

/**
 * Construit un GrilleVersionConfig à partir des données brutes Supabase.
 *
 * @param grilleVersion   Ligne grille_versions
 * @param ponderations    Lignes grille_ponderations (toutes pour cette version)
 * @param criteres        Lignes criteres correspondantes
 * @param poidsCategories Poids des catégories dans le score global (ex: { phase1: 25, phase2: 35, phase3: 40 })
 * @param seuilsReco      Seuils de recommandation (optionnel, défaut: 70/50)
 */
export function buildGrilleVersionConfig(
  grilleVersion: GrilleVersionRow,
  ponderations: GrillePonderationRow[],
  criteres: CritereRow[],
  poidsCategories: PoidsCategoriesJson,
  seuilsReco: SeuilsRecommandationJson = DEFAULT_SEUILS,
): GrilleVersionConfig {
  const critereMap = new Map(criteres.map((c) => [c.id, c]));

  const critereConfigs: CritereConfig[] = ponderations
    .map((pond): CritereConfig | null => {
      const critere = critereMap.get(pond.critere_id);
      if (!critere) return null;

      const seuilsRaw = pond.seuils as SeuilsJson | null;

      let options: OptionScore[] | undefined;
      let seuilsQuantitatif: SeuilQuantitatif[] | undefined;

      if (seuilsRaw?.type === "qualitatif") {
        options = seuilsRaw.options;
      } else if (seuilsRaw?.type === "quantitatif") {
        seuilsQuantitatif = seuilsRaw.seuils;
      }

      return {
        id: critere.id,
        categorie: critere.categorie,
        libelle: critere.libelle,
        ordre: critere.ordre,
        typeSaisie: critere.type_saisie,
        poids: Number(pond.poids),
        options,
        seuilsQuantitatif,
      };
    })
    .filter((c): c is CritereConfig => c !== null)
    .sort((a, b) => a.ordre - b.ordre);

  return {
    id: grilleVersion.id,
    statut: grilleVersion.statut,
    publishedAt: grilleVersion.published_at,
    criteres: critereConfigs,
    poidsCategories,
    seuils: seuilsReco,
  };
}

/** Helpers pour construire les seuils JSONB à stocker en DB */
export function buildSeuilsQualJson(
  options: { valeur: string; score: number; label?: string }[],
): Json {
  return { type: "qualitatif", options } as unknown as Json;
}

export function buildSeuilsQuantJson(
  seuils: { min: number; max: number; score: number }[],
): Json {
  return { type: "quantitatif", seuils } as unknown as Json;
}
