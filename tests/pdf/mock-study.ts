import type { FeasibilityStudy } from "@/lib/types";

/**
 * Étude fictive avec des données réalistes sur toutes les phases,
 * utilisée uniquement pour prévisualiser le layout du PDF (voir
 * app/tests/pdf-preview/page.tsx). Ne touche à rien d'autre.
 */
export const mockStudy: FeasibilityStudy = {
  id: "mock-study-0001",
  status: "completed",
  currentPhase: 4,
  lastModified: new Date().toISOString(),

  projectInfo: {
    projectName: "Résidence Les Terrasses du Parc",
    address: "14 rue de la Métairie",
    city: "Rennes",
    department: "Ille-et-Vilaine (35)",
    cadastralRef: "AB 0142",
    landArea: 3200,
    acquisitionPrice: 680000,
    dateCreated: new Date().toISOString(),
  },

  phase1: {
    pluZone: "UB",
    pluZoneScore: 70,
    servitudes: {
      patrimoine: false,
      inondation: true,
      bruit: false,
      pollution: false,
      autres: "Ligne électrique haute tension en limite Nord de parcelle",
    },
    servitudesScore: 65,
    accessibilite: {
      transportEnCommun: "bon",
      axesRoutiers: "excellent",
      stationnement: "moyen",
    },
    accessibiliteScore: 78,
    environnement: {
      commerces: true,
      ecoles: true,
      sante: true,
      espaceVerts: false,
      nuisances: "Léger trafic routier en heure de pointe (avenue à 150m)",
    },
    environnementScore: 72,
    globalScore: 71,
    comments:
      "Terrain bien situé en zone urbanisable (UB), à proximité immédiate des transports et des commerces. Point de vigilance sur la zone inondable (aléa faible selon le PPRI) et la servitude liée à la ligne HT.",
  },

  phase2: {
    assainissementEU: { raccordement: "reseau_suffisant" },
    assainissementEP: { raccordement: "reseau_proximite" },
    electricite: { desserte: "reseau_suffisant" },
    telecom: { desserte: "reseau_suffisant" },
    eauPotable: { desserte: "reseau_suffisant" },
    assainissementScore: 75,
    reseauxScore: 90,
    potentiel: {
      operationDemonstratrice: false,
      accordCommune: true,
      risqueContestationLocale: "moyen",
    },
    potentielScore: 68,
    marche: {
      demandeTension: "forte",
      dynamiqueDemographique: "croissance",
      concurrence: "moderee",
      creationEmplois: "forte",
      revenusMenages: "intermediaires",
      absenceDemandeOffresVacantes: "faible",
    },
    marcheScore: 82,
    globalScore: 79,
    comments:
      "Réseaux globalement bien dimensionnés, seul l'assainissement pluvial nécessitera une extension mineure de réseau (~40m). Marché locatif tendu sur le secteur, cohérent avec un programme de logement social.",
  },

  phase3: {
    typeOperation: "dap",
    depenses: {
      travaux: {
        miseEnEtatSols: 45000,
        voiriePlaces: 180000,
        coutTravaux: 3200000,
        reseaux: 220000,
        paysage: 95000,
        amenagementExtPaysage: 60000,
        ouvragesExceptionnels: 0,
        totalTravaux: 3800000,
      },
      etudes: {
        moe: 280000,
        autresEtudes: 65000,
        totalEtudes: 345000,
      },
      fraisFinanciers: {
        tauxEmprunt: 3.2,
        autresFrais: 38000,
        totalFraisFinanciers: 95000,
      },
      autres: {
        fraisDivers: 42000,
        imprevus: 190000,
        totalAutres: 232000,
      },
    },
    budgetTotal: 4472000,
    recettes: {
      cessionsChargesFoncieres: 680000,
      capaciteNombreLogements: 48,
      autresCessions: 0,
      participations: 620000,
      autresSubventions: 3400000,
      caTotal: 4700000,
    },
    indicateurs: {
      margePromotion: 228000,
      margePromotionPct: 5.1,
      rentabiliteInvestissement: 6.8,
      prixRevientM2: 93167,
      ratioFoncier: 15.2,
    },
    financialScore: 64,
    comments:
      "Équilibre financier atteint grâce aux subventions attendues (PLAI/PLUS). Marge nette modeste (5,1%), conforme aux standards du logement social. Le taux d'emprunt retenu (3,2%) reste à confirmer selon les conditions de marché à la date de montage définitif.",
  },

  phase4: {
    scoresPonderes: {
      phase1: 18,
      phase2: 28,
      phase3: 26,
      global: 72,
    },
    swot: {
      forces: [
        "Foncier déjà acquis à un prix cohérent avec le marché local",
        "Accord de principe de la commune obtenu",
        "Desserte réseaux quasi complète, peu de travaux de raccordement",
        "Forte tension locative sur le secteur",
      ],
      faiblesses: [
        "Marge de promotion serrée (5,1%)",
        "Zone inondable en aléa faible à traiter dans la conception",
        "Stationnement limité, risque de sous-dimensionnement",
      ],
      opportunites: [
        "Dynamique démographique en croissance sur la commune",
        "Possibilité d'optimiser le programme en augmentant la part de T3/T4",
      ],
      menaces: [
        "Risque de contestation locale jugé moyen (riverains)",
        "Hausse potentielle du taux d'emprunt d'ici le bouclage financier",
        "Ligne haute tension pouvant contraindre l'implantation des bâtiments",
      ],
    },
    recommandation: "go_reserve",
    justification:
      "Le projet présente un score global de 72/100 (note B), porté par une bonne desserte réseaux et une forte demande locative. La recommandation est un GO avec réserves, conditionné à la sécurisation du risque de contestation locale et à la confirmation du plan de financement (subventions PLAI/PLUS).",
    conditionsSuspensives: [
      "Obtention du permis de construire purgé de tout recours",
      "Confirmation écrite des participations PLAI/PLUS par les financeurs",
      "Étude hydraulique complémentaire sur la zone inondable",
    ],
    prochainEtapes: [
      "Lancer la consultation de maîtrise d'œuvre",
      "Engager la concertation avec les riverains",
      "Déposer la demande de permis de construire",
      "Finaliser le montage financier avec les partenaires institutionnels",
    ],
    syntheseFinanciere: {
      investissementTotal: 4472000,
      recettesEstimees: 4700000,
      margeNette: 228000,
      roi: 6.8,
    },
  },
};
