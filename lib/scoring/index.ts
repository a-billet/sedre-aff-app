/**
 * lib/scoring/index.ts — point d'entrée public du moteur de calcul
 */
export { calculerScore, calculerPreBilan } from "./engine";
export type {
  SeuilsRecommandation,
  CritereConfig,
  CriteriaType,
  OptionScore,
  SeuilQuantitatif,
  ReponsesMap,
  ScoreResult,
  ScoreCategorie,
  ScoreCritere,
  PreBilanHypotheses,
  PreBilanResult,
  ModePreBilan,
} from "./types";
