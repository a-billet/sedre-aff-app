import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from '@react-pdf/renderer';
import { getScoreLabel, pluZoneLabels } from './config';
import {
  criteresAccessibilite,
  criteresAssainissementEP,
  criteresAssainissementEU,
  criteresContestationLocale,
  criteresEauPotable,
  criteresEnvironnement,
  criteresMarche,
  criteresReseauxSecs,
  servitudePenalties,
} from './scoring';
import { FeasibilityStudy, calculateGrade } from './types';

// ============================================================
// FONTS
// ============================================================
Font.register({
  family: 'Roboto',
  fonts: [
    { src: '/fonts/Roboto-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/Roboto-Bold.ttf', fontWeight: 'bold' },
  ],
});

// ============================================================
// COULEURS
// ============================================================
const COLORS = {
  primary: '#2e4b85',
  border: '#dcdcdc',
  stripe: '#f7f7f7',
  headerRow: '#2d5a46',
  muted: '#808080',
  grade: {
    A: '#22c55e',
    B: '#84cc16',
    C: '#eab308',
    D: '#f97316',
    E: '#ef4444',
  } as Record<string, string>,
};

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 9,
    color: '#000',
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  // -- Cover header --
  headerBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoBox: {
    width: 34,
    height: 34,
    backgroundColor: '#fff',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logo: { width: 30, height: 30, borderRadius: 3 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  headerSubtitle: { color: '#fff', fontSize: 9, marginTop: 2 },

  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 11, marginBottom: 6 },
  text: { fontSize: 9, marginBottom: 4, lineHeight: 1.4 },

  twoColRow: { flexDirection: 'row', gap: 12 },
  col: { flexGrow: 1, flexBasis: 0 },
  colHeader: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    paddingBottom: 3,
  },
  kvRow: { flexDirection: 'row', marginBottom: 3 },
  kvLabel: { width: '42%', fontSize: 8.5, fontWeight: 'bold' },
  kvValue: { width: '58%', fontSize: 8.5 },

  scoreBox: {
    marginTop: 14,
    marginBottom: 14,
    borderRadius: 4,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLabel: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  scoreValue: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  gradeValue: { color: '#fff', fontSize: 15, fontWeight: 'bold' },

  footer: {
    position: 'absolute',
    bottom: 15,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: COLORS.muted,
  },

  // -- Generic table --
  table: { borderWidth: 0.5, borderColor: COLORS.border, marginBottom: 10 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  tableRowStriped: { backgroundColor: COLORS.stripe },
  tableHeaderRow: { backgroundColor: COLORS.headerRow },
  tableCell: { fontSize: 8.5, padding: 4 },
  tableCellBold: { fontWeight: 'bold' },
  tableHeaderCell: { color: '#fff', fontWeight: 'bold', fontSize: 8.5, padding: 4 },
  tableCellRight: { textAlign: 'right' },
});

// ============================================================
// HELPERS
// ============================================================
const formatNumber = (value: number) => {
  const safeValue = Number.isFinite(value) ? value : 0;
  const [integerPart, decimalPart] = safeValue.toString().split('.');
  const normalizedInteger = integerPart.replace(/^-/, '');
  const sign = integerPart.startsWith('-') ? '-' : '';
  const groups: string[] = [];
  for (let index = normalizedInteger.length; index > 0; index -= 3) {
    groups.unshift(normalizedInteger.slice(Math.max(0, index - 3), index));
  }
  const formattedInteger = `${sign}${groups.join(' ') || '0'}`;
  return decimalPart !== undefined ? `${formattedInteger},${decimalPart}` : formattedInteger;
};
const formatSurface = (value: number) => `${formatNumber(value)} m²`;
const formatCurrency = (value: number) => `${formatNumber(value)} €`;
const formatLabelValue = (
  value: string | null | undefined,
  labels?: Record<string, { label: string; score: number }>,
) => {
  if (!value) return 'Non renseigné';
  if (labels?.[value]) return labels[value].label;
  return value;
};
const formatBooleanValue = (value?: boolean) => (value ? 'Oui' : 'Non');

type CritereRow = [string, string];

// ============================================================
// GENERIC TABLE COMPONENT
// (remplace autoTable — react-pdf n'a pas de table native,
// on la construit avec des Views flex. Les largeurs en % au lieu
// de mm : plus besoin de calculer contentWidth * 0.3 à la main.)
// ============================================================
function KeyValueTable({
  rows,
  columnWidths = ['35%', '65%'],
  striped = false,
  boldRows = [],
  shadedRows = [],
}: {
  rows: [string, string][];
  columnWidths?: [string, string];
  striped?: boolean;
  boldRows?: number[];
  shadedRows?: number[];
}) {
  return (
    <View style={styles.table}>
      {rows.map((row, i) => {
        const isBold = boldRows.includes(i);
        const isShaded = shadedRows.includes(i) || (striped && i % 2 === 1);
        return (
          <View
            key={i}
            wrap={false}
            style={[styles.tableRow, isShaded ? styles.tableRowStriped : {}]}
          >
            <Text style={[styles.tableCell, { width: columnWidths[0] }, isBold ? styles.tableCellBold : {}]}>
              {row[0]}
            </Text>
            <Text style={[styles.tableCell, { width: columnWidths[1] }, isBold ? styles.tableCellBold : {}]}>
              {row[1]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function CriteriaTable({ rows }: { rows: CritereRow[] }) {
  return (
    <View style={styles.table}>
      <View style={[styles.tableRow, styles.tableHeaderRow]}>
        <Text style={[styles.tableHeaderCell, { width: '32%' }]}>Critère</Text>
        <Text style={[styles.tableHeaderCell, { width: '68%' }]}>Réponse</Text>
      </View>
      {rows.map((row, i) => (
        <View key={i} wrap={false} style={styles.tableRow}>
          <Text style={[styles.tableCell, styles.tableCellBold, { width: '32%' }]}>{row[0]}</Text>
          <Text style={[styles.tableCell, { width: '68%' }]}>{row[1]}</Text>
        </View>
      ))}
    </View>
  );
}

function Footer() {
  return (
    <View style={styles.footer} fixed>
      <Text>Étude générée le {new Date().toLocaleDateString('fr-FR')}</Text>
      <Text>SEDRE - Étude de faisabilité foncière</Text>
    </View>
  );
}

// ============================================================
// PAGE 1 — COUVERTURE
// ============================================================
function CoverPage({ study }: { study: FeasibilityStudy }) {
  const grade = calculateGrade(study.phase4.scoresPonderes.global);
  const gradeColor = COLORS.grade[grade] ?? COLORS.grade.C;

  const projectData: [string, string][] = [
    [
      'Adresse',
      `${study.projectInfo.address || ''}${study.projectInfo.city ? `, ${study.projectInfo.city}` : ''}` ||
      'Non renseigné',
    ],
    ['Département', study.projectInfo.department || 'Non renseigné'],
    ['Référence cadastrale', study.projectInfo.cadastralRef || 'Non renseigné'],
    ['Date du rapport', new Date().toLocaleDateString('fr-FR')],
  ];

  const keyData: [string, string][] = [
    ['Surface terrain', formatSurface(study.projectInfo.landArea)],
    ['Prix acquisition', formatCurrency(study.projectInfo.acquisitionPrice)],
    [
      'Assainissement EU',
      formatLabelValue(study.phase2.assainissementEU.raccordement, criteresAssainissementEU),
    ],
    ['Accord commune', formatBooleanValue(study.phase2.potentiel.accordCommune)],
  ];

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.headerBand} fixed>
        <View style={styles.logoBox}>
          {/* react-pdf charge l'image directement depuis l'URL,
              plus besoin du fetch + FileReader manuel de la v1 */}
          <Image src="/logo.jpg" style={styles.logo} />
        </View>
        <View>
          <Text style={styles.headerTitle}>ÉTUDE DE FAISABILITÉ</Text>
          <Text style={styles.headerSubtitle}>Analyse foncière et immobilière</Text>
        </View>
      </View>

      <View style={{ marginTop: 46 }}>
        <Text style={styles.title}>{study.projectInfo.projectName || 'Projet sans nom'}</Text>

        <View style={styles.twoColRow}>
          <View style={styles.col}>
            <Text style={styles.colHeader}>Projet</Text>
            {projectData.map(([label, value], i) => (
              <View key={i} style={styles.kvRow}>
                <Text style={styles.kvLabel}>{label}</Text>
                <Text style={styles.kvValue}>{value}</Text>
              </View>
            ))}
          </View>
          <View style={styles.col}>
            <Text style={styles.colHeader}>Données clés</Text>
            {keyData.map(([label, value], i) => (
              <View key={i} style={styles.kvRow}>
                <Text style={styles.kvLabel}>{label}</Text>
                <Text style={styles.kvValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.scoreBox, { backgroundColor: gradeColor }]}>
          <View>
            <Text style={styles.scoreLabel}>SCORE GLOBAL</Text>
            <Text style={styles.scoreValue}>{study.phase4.scoresPonderes.global}/100</Text>
          </View>
          <Text style={styles.gradeValue}>Note {grade}</Text>
        </View>

        <Text style={styles.subtitle}>Justification</Text>
        <Text style={styles.text}>{study.phase4.justification}</Text>
      </View>

      <Footer />
    </Page>
  );
}

// ============================================================
// PAGE 2 — SYNTHÈSE DES CRITÈRES
// ============================================================
function CriteriaPage({ study }: { study: FeasibilityStudy }) {
  const phase1Rows: CritereRow[] = [
    ['Zonage PLU', study.phase1.pluZone ? pluZoneLabels[study.phase1.pluZone] : 'Non renseigné'],
    [
      'Servitudes et contraintes',
      (() => {
        const servitudes: string[] = [];
        if (study.phase1.servitudes.patrimoine) servitudes.push(servitudePenalties.patrimoine.label);
        if (study.phase1.servitudes.inondation) servitudes.push(servitudePenalties.inondation.label);
        if (study.phase1.servitudes.bruit) servitudes.push(servitudePenalties.bruit.label);
        if (study.phase1.servitudes.pollution) servitudes.push(servitudePenalties.pollution.label);
        if (study.phase1.servitudes.autres) servitudes.push(study.phase1.servitudes.autres);
        return servitudes.length > 0 ? servitudes.join(', ') : 'Aucune servitude identifiée';
      })(),
    ],
    [
      'Transports en commun',
      formatLabelValue(study.phase1.accessibilite.transportEnCommun, criteresAccessibilite.transportEnCommun),
    ],
    ['Axes routiers', formatLabelValue(study.phase1.accessibilite.axesRoutiers, criteresAccessibilite.axesRoutiers)],
    ['Stationnement', formatLabelValue(study.phase1.accessibilite.stationnement, criteresAccessibilite.stationnement)],
    [
      'Environnement immédiat',
      (() => {
        const amenities: string[] = [];
        if (study.phase1.environnement.commerces) amenities.push(criteresEnvironnement.commerces.label);
        if (study.phase1.environnement.ecoles) amenities.push(criteresEnvironnement.ecoles.label);
        if (study.phase1.environnement.sante) amenities.push(criteresEnvironnement.sante.label);
        if (study.phase1.environnement.espaceVerts) amenities.push(criteresEnvironnement.espaceVerts.label);
        return amenities.length > 0 ? amenities.join(', ') : 'Aucun équipement notable';
      })(),
    ],
    ...(study.phase1.environnement.nuisances
      ? ([['Nuisances', study.phase1.environnement.nuisances]] as CritereRow[])
      : []),
  ];

  const phase2Rows: CritereRow[] = [
    ['Assainissement EU', formatLabelValue(study.phase2.assainissementEU.raccordement, criteresAssainissementEU)],
    ['Assainissement EP', formatLabelValue(study.phase2.assainissementEP.raccordement, criteresAssainissementEP)],
    ['Electricité', formatLabelValue(study.phase2.electricite.desserte, criteresReseauxSecs)],
    ['Telecom', formatLabelValue(study.phase2.telecom.desserte, criteresReseauxSecs)],
    ['Eau potable', formatLabelValue(study.phase2.eauPotable.desserte, criteresEauPotable)],
    ['Opération démonstratrice', formatBooleanValue(study.phase2.potentiel.operationDemonstratrice)],
    ['Accord de la commune', formatBooleanValue(study.phase2.potentiel.accordCommune)],
    [
      'Risque de contestation locale',
      formatLabelValue(study.phase2.potentiel.risqueContestationLocale, criteresContestationLocale),
    ],
    ['Demande / tension', formatLabelValue(study.phase2.marche.demandeTension, criteresMarche.demandeTension)],
    [
      'Dynamique démographique',
      formatLabelValue(study.phase2.marche.dynamiqueDemographique, criteresMarche.dynamiqueDemographique),
    ],
    ['Concurrence', formatLabelValue(study.phase2.marche.concurrence, criteresMarche.concurrence)],
    ["Création d'emplois", formatLabelValue(study.phase2.marche.creationEmplois, criteresMarche.creationEmplois)],
    ['Revenus des ménages', formatLabelValue(study.phase2.marche.revenusMenages, criteresMarche.revenusMenages)],
    [
      'Absence de demande / offres vacantes',
      formatLabelValue(study.phase2.marche.absenceDemandeOffresVacantes, criteresMarche.absenceDemandeOffresVacantes),
    ],
  ];

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>1. Synthèse des critères</Text>

      <Text style={styles.subtitle}>Phase 1 - Analyse initiale</Text>
      <CriteriaTable rows={phase1Rows} />

      <Text style={styles.subtitle}>Phase 2 - Analyse détaillée</Text>
      <CriteriaTable rows={phase2Rows} />

      <Footer />
    </Page>
  );
}

// ============================================================
// PAGE 3 — ANALYSE FINANCIÈRE
// ============================================================
function FinancialPage({ study }: { study: FeasibilityStudy }) {
  const budgetData: [string, string][] = [
    ['DEPENSES', ''],
    ['Travaux', formatCurrency(study.phase3.depenses.travaux.totalTravaux)],
    ['Études', formatCurrency(study.phase3.depenses.etudes.totalEtudes)],
    ['Frais financiers', formatCurrency(study.phase3.depenses.fraisFinanciers.totalFraisFinanciers)],
    ['Autres', formatCurrency(study.phase3.depenses.autres.totalAutres)],
    ['TOTAL DEPENSES', formatCurrency(study.phase3.budgetTotal)],
    ['', ''],
    ['RECETTES', ''],
    ['Cessions (charges foncières)', formatCurrency(study.phase3.recettes.cessionsChargesFoncieres)],
    ['Autres cessions', formatCurrency(study.phase3.recettes.autresCessions)],
    ['Participations', formatCurrency(study.phase3.recettes.participations)],
    ['Autres (subventions)', formatCurrency(study.phase3.recettes.autresSubventions)],
    ['TOTAL RECETTES', formatCurrency(study.phase3.recettes.caTotal)],
    ['', ''],
    ['RESULTAT', ''],
    ['Marge promotion', formatCurrency(study.phase3.indicateurs.margePromotion)],
    ['Marge %', `${study.phase3.indicateurs.margePromotionPct.toFixed(1)}%`],
    ['ROI', `${study.phase3.indicateurs.rentabiliteInvestissement.toFixed(1)}%`],
  ];

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>2. Analyse financière</Text>
      <Text style={styles.text}>
        Score: {study.phase3.financialScore}/100 - {getScoreLabel(study.phase3.financialScore)}
      </Text>

      <KeyValueTable
        rows={budgetData}
        columnWidths={['65%', '35%']}
        striped
        boldRows={[0, 6, 9]}
        shadedRows={[0, 6, 9]}
      />

      <Text style={styles.subtitle}>Indicateurs clés</Text>
      <Text style={styles.text}>
        Coût moyen par logement : {formatCurrency(study.phase3.indicateurs.prixRevientM2)}/logement
      </Text>
      <Text style={styles.text}>Capacité : {study.phase3.recettes.capaciteNombreLogements} logements</Text>
      <Text style={styles.text}>Ratio foncier : {study.phase3.indicateurs.ratioFoncier.toFixed(1)}%</Text>

      <Footer />
    </Page>
  );
}

// ============================================================
// PAGE 4 — SYNTHÈSE ET RECOMMANDATION
// ============================================================
function SynthesisPage({ study }: { study: FeasibilityStudy }) {
  const grade = calculateGrade(study.phase4.scoresPonderes.global);
  const gradeColor = COLORS.grade[grade] ?? COLORS.grade.C;

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>3. Synthèse et recommandation</Text>

      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeaderRow]}>
          <Text style={[styles.tableHeaderCell, { width: '40%' }]}>Phase</Text>
          <Text style={[styles.tableHeaderCell, { width: '20%', textAlign: 'center' }]}>Score</Text>
          <Text style={[styles.tableHeaderCell, { width: '15%', textAlign: 'center' }]}>Poids</Text>
          <Text style={[styles.tableHeaderCell, { width: '25%', textAlign: 'center' }]}>Contribution</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, { width: '40%' }]}>Phase 1 - Analyse initiale</Text>
          <Text style={[styles.tableCell, { width: '20%', textAlign: 'center' }]}>{study.phase1.globalScore}/100</Text>
          <Text style={[styles.tableCell, { width: '15%', textAlign: 'center' }]}>25%</Text>
          <Text style={[styles.tableCell, { width: '25%', textAlign: 'center' }]}>
            {study.phase4.scoresPonderes.phase1} pts
          </Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, { width: '40%' }]}>Phase 2 - Analyse détaillée</Text>
          <Text style={[styles.tableCell, { width: '20%', textAlign: 'center' }]}>{study.phase2.globalScore}/100</Text>
          <Text style={[styles.tableCell, { width: '15%', textAlign: 'center' }]}>35%</Text>
          <Text style={[styles.tableCell, { width: '25%', textAlign: 'center' }]}>
            {study.phase4.scoresPonderes.phase2} pts
          </Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, { width: '40%' }]}>Phase 3 - Analyse financière</Text>
          <Text style={[styles.tableCell, { width: '20%', textAlign: 'center' }]}>
            {study.phase3.financialScore}/100
          </Text>
          <Text style={[styles.tableCell, { width: '15%', textAlign: 'center' }]}>40%</Text>
          <Text style={[styles.tableCell, { width: '25%', textAlign: 'center' }]}>
            {study.phase4.scoresPonderes.phase3} pts
          </Text>
        </View>
        <View style={[styles.tableRow, { backgroundColor: gradeColor }]}>
          <Text style={[styles.tableCell, styles.tableCellBold, { width: '40%', color: '#fff' }]}>SCORE GLOBAL</Text>
          <Text style={[styles.tableCell, styles.tableCellBold, { width: '20%', textAlign: 'center', color: '#fff' }]}>
            {study.phase4.scoresPonderes.global}/100
          </Text>
          <Text style={[styles.tableCell, styles.tableCellBold, { width: '15%', textAlign: 'center', color: '#fff' }]}>
            100%
          </Text>
          <Text style={[styles.tableCell, styles.tableCellBold, { width: '25%', textAlign: 'center', color: '#fff' }]}>
            Note {grade}
          </Text>
        </View>
      </View>

      <Text style={styles.subtitle}>Analyse SWOT</Text>
      <View style={styles.twoColRow}>
        <View style={[styles.col, styles.table]}>
          <Text style={[styles.tableCell, styles.tableCellBold, { backgroundColor: COLORS.stripe }]}>FORCES</Text>
          <View style={{ padding: 4 }}>
            {(study.phase4.swot.forces.length > 0 ? study.phase4.swot.forces : ['-']).map((item, i) => (
              <Text key={i} style={styles.text}>
                • {item}
              </Text>
            ))}
          </View>
        </View>
        <View style={[styles.col, styles.table]}>
          <Text style={[styles.tableCell, styles.tableCellBold, { backgroundColor: COLORS.stripe }]}>
            FAIBLESSES
          </Text>
          <View style={{ padding: 4 }}>
            {(study.phase4.swot.faiblesses.length > 0 ? study.phase4.swot.faiblesses : ['-']).map((item, i) => (
              <Text key={i} style={styles.text}>
                • {item}
              </Text>
            ))}
          </View>
        </View>
      </View>
      <View style={styles.twoColRow}>
        <View style={[styles.col, styles.table]}>
          <Text style={[styles.tableCell, styles.tableCellBold, { backgroundColor: COLORS.stripe }]}>
            OPPORTUNITÉS
          </Text>
          <View style={{ padding: 4 }}>
            {(study.phase4.swot.opportunites.length > 0 ? study.phase4.swot.opportunites : ['-']).map((item, i) => (
              <Text key={i} style={styles.text}>
                • {item}
              </Text>
            ))}
          </View>
        </View>
        <View style={[styles.col, styles.table]}>
          <Text style={[styles.tableCell, styles.tableCellBold, { backgroundColor: COLORS.stripe }]}>MENACES</Text>
          <View style={{ padding: 4 }}>
            {(study.phase4.swot.menaces.length > 0 ? study.phase4.swot.menaces : ['-']).map((item, i) => (
              <Text key={i} style={styles.text}>
                • {item}
              </Text>
            ))}
          </View>
        </View>
      </View>

      {study.phase4.conditionsSuspensives.length > 0 && (
        <View>
          <Text style={styles.subtitle}>Conditions suspensives</Text>
          {study.phase4.conditionsSuspensives.map((item, i) => (
            <Text key={i} style={[styles.text, { paddingLeft: 5 }]}>
              {i + 1}. {item}
            </Text>
          ))}
        </View>
      )}

      {study.phase4.prochainEtapes.length > 0 && (
        <View>
          <Text style={styles.subtitle}>Prochaines étapes</Text>
          {study.phase4.prochainEtapes.map((item, i) => (
            <Text key={i} style={[styles.text, { paddingLeft: 5 }]}>
              {i + 1}. {item}
            </Text>
          ))}
        </View>
      )}

      <Footer />
    </Page>
  );
}

// ============================================================
// DOCUMENT RACINE — c'est ce composant que tu peux mettre
// directement dans un <PDFViewer> pour le preview live pendant
// que tu ajustes le style.
// ============================================================
export function SedreStudyDocument({ study }: { study: FeasibilityStudy }) {
  return (
    <Document>
      <CoverPage study={study} />
      <CriteriaPage study={study} />
      <FinancialPage study={study} />
      <SynthesisPage study={study} />
    </Document>
  );
}

export async function generatePDF(study: FeasibilityStudy): Promise<void> {
  const blob = await pdf(<SedreStudyDocument study={study} />).toBlob();
  const fileName = `SEDRE_${study.projectInfo.projectName || 'Étude'}_${new Date().toISOString().split('T')[0]
    }.pdf`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}