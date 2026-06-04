import { Criterion, FinancialItem } from './types';

// Phase 1 Criteria - Pre-evaluation
export const phase1Criteria: Criterion[] = [
  // CARACTERISTIQUES DU SITE - PLU / Réglementation
  {
    id: 'zone_plu',
    category: 'Caractéristiques du site',
    subcategory: 'PLU / Réglementation',
    label: 'Zone PLU',
    type: 'select',
    weight: 1.5,
    options: [
      { value: 'u', label: 'Zone U (Urbanisée)', score: 5 },
      { value: 'au', label: 'Zone AU (À Urbaniser)', score: 3 },
      { value: 'a', label: 'Zone A (Agricole)', score: -3 },
      { value: 'n', label: 'Zone N (Naturelle)', score: -5 },
    ],
  },
  {
    id: 'zone_oap',
    category: 'Caractéristiques du site',
    subcategory: 'PLU / Réglementation',
    label: 'Zone OAP (Orientations d\'Aménagement et de Programmation)',
    type: 'boolean',
    weight: 1.2,
    options: [
      { value: 'true', label: 'Oui', score: 4 },
      { value: 'false', label: 'Non', score: 0 },
    ],
  },
  {
    id: 'perimetre_npnru',
    category: 'Caractéristiques du site',
    subcategory: 'PLU / Réglementation',
    label: 'Périmètre NPNRU (Nouveau Programme National de Renouvellement Urbain)',
    type: 'boolean',
    weight: 1.3,
    options: [
      { value: 'true', label: 'Oui', score: 3 },
      { value: 'false', label: 'Non', score: 0 },
    ],
  },
  {
    id: 'perimetre_abf',
    category: 'Caractéristiques du site',
    subcategory: 'PLU / Réglementation',
    label: 'Périmètre ABF (Architectes des Bâtiments de France)',
    type: 'boolean',
    weight: 1.0,
    options: [
      { value: 'true', label: 'Oui', score: -2 },
      { value: 'false', label: 'Non', score: 1 },
    ],
  },
  {
    id: 'droit_preemption',
    category: 'Caractéristiques du site',
    subcategory: 'PLU / Réglementation',
    label: 'Droit de Préemption',
    type: 'select',
    weight: 1.0,
    options: [
      { value: 'aucun', label: 'Aucun', score: 2 },
      { value: 'dpu_simple', label: 'DPU Simple', score: 0 },
      { value: 'dpu_renforce', label: 'DPU Renforcé', score: -2 },
      { value: 'zad', label: 'ZAD', score: -3 },
    ],
  },
  
  // PARCELLE
  {
    id: 'vue_degagee',
    category: 'Caractéristiques du site',
    subcategory: 'Parcelle',
    label: 'Vue dégagée',
    type: 'boolean',
    weight: 0.8,
    options: [
      { value: 'true', label: 'Oui', score: 3 },
      { value: 'false', label: 'Non', score: -1 },
    ],
  },
  {
    id: 'occupation',
    category: 'Caractéristiques du site',
    subcategory: 'Parcelle',
    label: 'Occupation actuelle',
    type: 'select',
    weight: 1.2,
    options: [
      { value: 'libre', label: 'Terrain libre', score: 5 },
      { value: 'friche', label: 'Friche industrielle/urbaine', score: 2 },
      { value: 'bati_demolir', label: 'Bâti à démolir', score: 0 },
      { value: 'occupe', label: 'Occupé (locataires/activités)', score: -3 },
      { value: 'pollution', label: 'Site pollué', score: -5 },
    ],
  },
  {
    id: 'topographie',
    category: 'Caractéristiques du site',
    subcategory: 'Parcelle',
    label: 'Topographie',
    type: 'select',
    weight: 1.0,
    options: [
      { value: 'plat', label: 'Terrain plat', score: 4 },
      { value: 'leger_pente', label: 'Légère pente (<10%)', score: 2 },
      { value: 'moyenne_pente', label: 'Pente moyenne (10-20%)', score: 0 },
      { value: 'forte_pente', label: 'Forte pente (>20%)', score: -3 },
    ],
  },
  {
    id: 'impermeabilisation',
    category: 'Caractéristiques du site',
    subcategory: 'Parcelle',
    label: 'Taux d\'imperméabilisation actuel',
    type: 'select',
    weight: 0.8,
    options: [
      { value: 'faible', label: 'Faible (<25%)', score: 3 },
      { value: 'moyen', label: 'Moyen (25-50%)', score: 1 },
      { value: 'eleve', label: 'Élevé (50-75%)', score: -1 },
      { value: 'tres_eleve', label: 'Très élevé (>75%)', score: -2 },
    ],
  },
  {
    id: 'vegetalisation',
    category: 'Caractéristiques du site',
    subcategory: 'Parcelle',
    label: 'Végétalisation existante',
    type: 'select',
    weight: 0.7,
    options: [
      { value: 'aucune', label: 'Aucune végétation notable', score: 2 },
      { value: 'espaces_verts', label: 'Espaces verts entretenus', score: 1 },
      { value: 'arbres_isoles', label: 'Arbres isolés', score: 0 },
      { value: 'boisement', label: 'Boisement important', score: -2 },
      { value: 'zone_humide', label: 'Zone humide', score: -4 },
    ],
  },
];

// Phase 2 Criteria - Analyse approfondie
export const phase2Criteria: Criterion[] = [
  // ETAT DES RESEAUX EXISTANTS
  {
    id: 'elec_reseau',
    category: 'État des réseaux existants',
    subcategory: 'Électricité',
    label: 'Situation électrique',
    type: 'select',
    weight: 1.3,
    options: [
      { value: 'transfo_suffisant', label: 'Poste Transfo + réseau suffisant', score: 5 },
      { value: 'transfo_proximite', label: 'Poste Transfo + réseau à proximité', score: 3 },
      { value: 'extension_necessaire', label: 'Extension réseau nécessaire', score: 0 },
      { value: 'nouveau_poste', label: 'Nouveau poste nécessaire', score: -3 },
    ],
  },
  {
    id: 'eau_potable',
    category: 'État des réseaux existants',
    subcategory: 'Eau Potable',
    label: 'Réseau eau potable',
    type: 'select',
    weight: 1.3,
    options: [
      { value: 'suffisant', label: 'Réseau suffisant', score: 5 },
      { value: 'proximite', label: 'Réseau à proximité', score: 3 },
      { value: 'extension', label: 'Extension nécessaire', score: 0 },
      { value: 'creation', label: 'Création réseau nécessaire', score: -4 },
    ],
  },
  {
    id: 'assainissement',
    category: 'État des réseaux existants',
    subcategory: 'Assainissement EU',
    label: 'Assainissement eaux usées',
    type: 'select',
    weight: 1.4,
    options: [
      { value: 'raccordement_possible', label: 'Possibilité de raccordement au réseau', score: 5 },
      { value: 'collecteur_suffisant', label: 'Collecteur + réseau suffisant', score: 4 },
      { value: 'extension', label: 'Extension nécessaire', score: 1 },
      { value: 'autonome', label: 'Assainissement autonome obligatoire', score: -3 },
    ],
  },
  
  // PROJET
  {
    id: 'produit_vente',
    category: 'Projet',
    subcategory: 'Constructibilité',
    label: 'Produit de vente envisagé',
    type: 'select',
    weight: 1.2,
    options: [
      { value: 'collectif', label: 'Logements collectifs', score: 4 },
      { value: 'intermediaire', label: 'Logements intermédiaires', score: 3 },
      { value: 'individuel_groupe', label: 'Maisons individuelles groupées', score: 2 },
      { value: 'individuel_diffus', label: 'Maisons individuelles diffuses', score: 1 },
      { value: 'mixte', label: 'Programme mixte (logements + activités)', score: 3 },
      { value: 'activites', label: 'Activités/Commerces uniquement', score: 2 },
    ],
  },
  {
    id: 'demande_tension',
    category: 'Projet',
    subcategory: 'Attentes et état du marché',
    label: 'Demande / Tension du marché',
    type: 'select',
    weight: 1.5,
    options: [
      { value: 'tres_forte', label: 'Très forte (zone tendue)', score: 5 },
      { value: 'forte', label: 'Forte', score: 4 },
      { value: 'moderee', label: 'Modérée', score: 2 },
      { value: 'faible', label: 'Faible', score: -1 },
      { value: 'tres_faible', label: 'Très faible (zone détendue)', score: -4 },
    ],
  },
  {
    id: 'dynamique_demo',
    category: 'Projet',
    subcategory: 'Attentes et état du marché',
    label: 'Dynamique démographique',
    type: 'select',
    weight: 1.2,
    options: [
      { value: 'forte_croissance', label: 'Forte croissance', score: 5 },
      { value: 'croissance', label: 'Croissance modérée', score: 3 },
      { value: 'stable', label: 'Stable', score: 1 },
      { value: 'declin', label: 'Déclin démographique', score: -3 },
    ],
  },
  {
    id: 'revenus_menages',
    category: 'Projet',
    subcategory: 'Attentes et état du marché',
    label: 'Revenus des ménages',
    type: 'select',
    weight: 1.0,
    options: [
      { value: 'eleves', label: 'Élevés', score: 4 },
      { value: 'moyens_superieurs', label: 'Moyens supérieurs', score: 3 },
      { value: 'moyens', label: 'Moyens', score: 1 },
      { value: 'modestes', label: 'Modestes', score: -1 },
    ],
  },
  {
    id: 'operation_demonstratrice',
    category: 'Projet',
    subcategory: 'Potentiel',
    label: 'Opération démonstratrices (innovation, exemplarité)',
    type: 'boolean',
    weight: 0.9,
    options: [
      { value: 'true', label: 'Oui', score: 3 },
      { value: 'false', label: 'Non', score: 0 },
    ],
  },
  {
    id: 'accord_commune',
    category: 'Projet',
    subcategory: 'Potentiel',
    label: 'Accord de la commune',
    type: 'select',
    weight: 1.6,
    options: [
      { value: 'favorable', label: 'Favorable et engagé', score: 5 },
      { value: 'positif', label: 'Positif mais en attente', score: 3 },
      { value: 'neutre', label: 'Neutre / En discussion', score: 0 },
      { value: 'reticent', label: 'Réticent', score: -3 },
      { value: 'oppose', label: 'Opposé', score: -5 },
    ],
  },
];

// Default financial items for Amenagement operations
export const defaultDepensesAmenagement: FinancialItem[] = [
  { id: 'dep_foncier', label: 'Acquisition foncière', category: 'Foncier', defaultRatio: 30, value: 0, unit: '€' },
  { id: 'dep_frais_acq', label: 'Frais d\'acquisition', category: 'Foncier', defaultRatio: 7, value: 0, unit: '%' },
  { id: 'dep_etudes', label: 'Études et maîtrise d\'œuvre', category: 'Études', defaultRatio: 8, value: 0, unit: '%' },
  { id: 'dep_mise_etat', label: 'Mise en état des sols', category: 'Travaux', defaultRatio: 15, value: 0, unit: '€/m²' },
  { id: 'dep_reseaux', label: 'Réseaux (VRD)', category: 'Travaux', defaultRatio: 45, value: 0, unit: '€/m²' },
  { id: 'dep_voirie', label: 'Voirie', category: 'Travaux', defaultRatio: 35, value: 0, unit: '€/m²' },
  { id: 'dep_paysage', label: 'Espaces verts / Paysage', category: 'Travaux', defaultRatio: 12, value: 0, unit: '€/m²' },
  { id: 'dep_divers', label: 'Divers et imprévus', category: 'Autres', defaultRatio: 5, value: 0, unit: '%' },
  { id: 'dep_commercialisation', label: 'Frais de commercialisation', category: 'Autres', defaultRatio: 3, value: 0, unit: '%' },
];

export const defaultRecettesAmenagement: FinancialItem[] = [
  { id: 'rec_vente_terrain', label: 'Vente de terrains', category: 'Ventes', value: 0, unit: '€' },
  { id: 'rec_participations', label: 'Participations (subventions)', category: 'Aides', value: 0, unit: '€' },
  { id: 'rec_taxes', label: 'Récupération de taxes', category: 'Taxes', value: 0, unit: '€' },
];

// Default financial items for Immobilier operations
export const defaultDepensesImmobilier: FinancialItem[] = [
  { id: 'dep_foncier', label: 'Charge foncière', category: 'Foncier', defaultRatio: 25, value: 0, unit: '€' },
  { id: 'dep_construction', label: 'Coût de construction', category: 'Construction', defaultRatio: 1400, value: 0, unit: '€/m² SHAB' },
  { id: 'dep_honoraires', label: 'Honoraires techniques', category: 'Études', defaultRatio: 10, value: 0, unit: '%' },
  { id: 'dep_assurances', label: 'Assurances', category: 'Autres', defaultRatio: 2, value: 0, unit: '%' },
  { id: 'dep_frais_financiers', label: 'Frais financiers', category: 'Autres', defaultRatio: 4, value: 0, unit: '%' },
  { id: 'dep_commercialisation', label: 'Frais de commercialisation', category: 'Autres', defaultRatio: 4, value: 0, unit: '%' },
  { id: 'dep_gestion', label: 'Frais de gestion', category: 'Autres', defaultRatio: 3, value: 0, unit: '%' },
  { id: 'dep_aleas', label: 'Aléas et imprévus', category: 'Autres', defaultRatio: 5, value: 0, unit: '%' },
];

export const defaultRecettesImmobilier: FinancialItem[] = [
  { id: 'rec_vente_logements', label: 'Vente logements libres', category: 'Ventes', value: 0, unit: '€' },
  { id: 'rec_vente_sociaux', label: 'Vente logements sociaux', category: 'Ventes', value: 0, unit: '€' },
  { id: 'rec_vente_commerces', label: 'Vente commerces/activités', category: 'Ventes', value: 0, unit: '€' },
  { id: 'rec_subventions', label: 'Subventions', category: 'Aides', value: 0, unit: '€' },
];
