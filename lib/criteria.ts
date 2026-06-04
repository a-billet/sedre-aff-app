// Critères pour l'étude de faisabilité
// Ce fichier contient les définitions des critères pour les analyses Phase 1 et Phase 2

// Les critères sont maintenant intégrés directement dans les composants Phase1Form et Phase2Form
// Ce fichier est conservé pour référence et peut être utilisé pour une future extension

export const criteriaConfig = {
  phase1: {
    pluZones: ['UA', 'UB', 'UC', 'AU', 'A', 'N'],
    servitudes: ['patrimoine', 'inondation', 'bruit', 'pollution'],
    accessibilityLevels: ['excellent', 'bon', 'moyen', 'faible'],
    stationementLevels: ['facile', 'moyen', 'difficile'],
  },
  phase2: {
    programmeTypes: ['collectif', 'individuel', 'mixte'],
    marketDemand: ['forte', 'moyenne', 'faible'],
    marketTrend: ['hausse', 'stable', 'baisse'],
    stockLevels: ['faible', 'moyen', 'eleve'],
  },
};
