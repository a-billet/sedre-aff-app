/**
 * lib/scoring/types.ts
 *
 * Types du moteur de calcul, découplés du schéma UI.
 * Ces types correspondent à la grille chargée depuis Supabase
 * (tables grille_versions + grille_ponderations + criteres).
 */

// ============================================================
// GRILLE DE NOTATION (input du moteur)
// ============================================================

/** Score associé à une option qualitative d'un critère */
export interface OptionScore {
  valeur: string;
  score: number; // 0–100
  label?: string;
}

/** Seuil quantitatif : une tranche de valeur → un score */
export interface SeuilQuantitatif {
  min: number;
  max: number;
  score: number; // 0–100
}

/** Configuration d'un critère dans une version de grille */
export interface CritereConfig {
  id: string;
  categorie: string;
  libelle: string;
  ordre: number;
  typeSaisie: "qualitatif" | "quantitatif";
  poids: number; // 0–100, poids relatif au sein de sa phase
  /** Options qualitatives avec leur score (pour type_saisie=qualitatif) */
  options?: OptionScore[];
  /** Seuils quantitatifs (pour type_saisie=quantitatif) */
  seuilsQuantitatif?: SeuilQuantitatif[];
}

/** Configuration complète d'une version de grille, prête pour le moteur */
export interface GrilleVersionConfig {
  id: string;
  statut: "brouillon" | "active" | "archivee";
  publishedAt: string | null;
  /** Critères organisés par phase (categorie). Clé = nom de catégorie */
  criteres: CritereConfig[];
  /** Poids des catégories dans le score global (clé = categorie) */
  poidsCategories: Record<string, number>;
  /** Seuils de recommandation */
  seuils: {
    go: number; // score >= seuils.go → GO
    goReserve: number; // score >= seuils.goReserve → GO avec réserves
    // score < goReserve → NO GO
  };
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
  grilleVersionId: string;
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
