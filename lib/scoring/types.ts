/**
 * lib/scoring/types.ts
 *
 * Types du moteur de calcul, découplés du schéma UI.
 * Ces types correspondent aux critères chargés depuis Supabase
 * (table criteres avec colonnes poids et seuils).
 */

// ============================================================
// GRILLE DE NOTATION (input du moteur)
// ============================================================

/** Type de saisie d'un critère — correspond à scoring_criteria.type */
export type CriteriaType = "select" | "checkbox" | "threshold" | "additive";

/** Score associé à une option qualitative d'un critère (depuis scoring_options) */
export interface OptionScore {
  key: string; // scoring_options.key
  label: string; // scoring_options.label
  score: number; // 0–100
  sort_order?: number;
}

/** Seuil quantitatif : une tranche de valeur → un score (utilisé en interne par le moteur) */
export interface SeuilQuantitatif {
  min: number;
  max: number;
  score: number; // 0–100
}

/** Seuils de recommandation finale */
export interface SeuilsRecommandation {
  go: number; // score >= go → "go"
  goReserve: number; // score >= goReserve → "go_reserve"
  // score < goReserve → "no_go"
}

/** Configuration d'un critère chargé depuis scoring_criteria + scoring_options */
export interface CritereConfig {
  id: string;
  phase: 1 | 2 | 3; // scoring_criteria.phase
  key: string; // scoring_criteria.key (identifiant métier)
  label: string; // scoring_criteria.label
  type: CriteriaType; // scoring_criteria.type
  weight: number; // scoring_criteria.weight (0–100)
  /** Paramètres spécifiques au type :
   *  - threshold → { seuils: SeuilQuantitatif[] }
   *  - checkbox  → { malus: number }
   */
  config?: Record<string, unknown> | null;
  /** Commentaire libre associé au critère */
  commentaire?: string;
  sort_order: number; // scoring_criteria.sort_order
  active: boolean;
  /** Options disponibles (depuis scoring_options) — pour types select / additive */
  options?: OptionScore[];
}

// ============================================================
// RÉPONSES (input du moteur)
// ============================================================

/** Réponse brute à un critère : valeur JSON libre */
export type ValeurReponse = string | number | boolean | null;

/**
 * Map des réponses par critere_id.
 * Utilisée à la fois pour appeler le moteur ET pour stocker dans analyse_reponses.
 */
export type ReponsesMap = Record<string, ValeurReponse>;

// ============================================================
// RÉSULTATS DE SCORING
// ============================================================

/** Score détaillé par critère */
export interface ScoreCritere {
  critereId: string;
  libelle: string;
  scoreObtenu: number; // 0–100
  poids: number;
  valeur: ValeurReponse;
}

/** Score agrégé par catégorie (phase) */
export interface ScoreCategorie {
  categorie: string;
  scoreAggrege: number; // 0–100, moyenne pondérée des critères
  poids: number; // poids de la catégorie dans le global
  scoreContribution: number; // contribution au score global
  criteres: ScoreCritere[];
}

/** Résultat complet du moteur de scoring */
export interface ScoreResult {
  scoreGlobal: number; // 0–100
  recommandation: "go" | "go_reserve" | "no_go";
  categories: ScoreCategorie[];
  /** Timestamp ISO — utile pour horodater le calcul stocké */
  calculatedAt: string;
}

// ============================================================
// PRÉ-BILAN ÉCONOMIQUE
// ============================================================

export type ModePreBilan = "amenagement" | "construction";

/** Hypothèses financières pour le pré-bilan */
export interface PreBilanHypotheses {
  // Dépenses
  travaux: {
    miseEnEtatSols: number;
    voiriePlaces?: number; // mode amenagement
    coutTravaux?: number; // mode construction
    reseaux: number;
    paysage?: number;
    amenagementExtPaysage?: number;
    ouvragesExceptionnels: number;
  };
  etudes: {
    moe: number;
    autresEtudes: number;
  };
  fraisFinanciers: {
    tauxEmprunt: number; // % annuel
    autresFrais: number;
  };
  autres: {
    fraisDivers: number;
    imprevus: number;
  };
  // Recettes
  recettes: {
    cessionsChargesFoncieres?: number; // mode amenagement
    capaciteNombreLogements: number;
    autresCessions: number;
    participations: number;
    autresSubventions: number;
  };
  typeOperation: "dap" | "ddd";
}

/** Résultat du pré-bilan économique */
export interface PreBilanResult {
  mode: ModePreBilan;
  depenses: {
    travaux: number;
    etudes: number;
    fraisFinanciers: number;
    autres: number;
    total: number;
  };
  recettes: {
    cessionsChargesFoncieres: number;
    autresCessions: number;
    participations: number;
    autresSubventions: number;
    total: number;
  };
  indicateurs: {
    margeNette: number;
    margeNettePct: number; // % du budget
    roi: number; // return on investment %
    prixRevientParLogement: number;
    ratioFoncier: number; // % foncier / CA
  };
}
