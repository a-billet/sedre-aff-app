import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "../public/fonts/Roboto-Bold-normal.js";
import "../public/fonts/Roboto-Regular-normal.js";
import { getScoreLabel, pluZoneLabels } from "./config";
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
} from "./scoring";
import { FeasibilityStudy, calculateGrade } from "./types";

export async function generatePDF(study: FeasibilityStudy): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = 20;
  let pdfFontName = "helvetica";

  const setPdfFont = (style: "normal" | "bold") => {
    doc.setFont(pdfFontName, style);
  };

  // Fonts are registered by side-effect imports generated from the jsPDF font helper.
  // We map them into one family (`Roboto`) so bold styles work in autoTable too.
  try {
    doc.addFont("Roboto-Regular-normal.ttf", "Roboto", "normal");
    doc.addFont("Roboto-Bold-normal.ttf", "Roboto", "bold");
    doc.setFont("Roboto", "normal");
    doc.getTextWidth("Test");
    doc.setFont("Roboto", "bold");
    doc.getTextWidth("Test");
    pdfFontName = "Roboto";
  } catch {
    pdfFontName = "helvetica";
  }

  // Helper functions
  const addTitle = (text: string, size: number = 16) => {
    doc.setFontSize(size);
    setPdfFont("bold");
    doc.text(text, margin, yPos);
    yPos += size * 0.5 + 5;
  };

  const addSubtitle = (text: string) => {
    doc.setFontSize(12);
    setPdfFont("normal");
    doc.text(text, margin, yPos);
    yPos += 8;
  };

  const addText = (text: string, indent: number = 0) => {
    doc.setFontSize(10);
    setPdfFont("normal");
    const lines = doc.splitTextToSize(text, pageWidth - 2 * margin - indent);
    doc.text(lines, margin + indent, yPos);
    yPos += lines.length * 5 + 2;
  };

  const addLine = () => {
    doc.setDrawColor(200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;
  };

  const checkPageBreak = (needed: number = 30) => {
    if (yPos + needed > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      yPos = 20;
    }
  };

  const formatNumber = (value: number) => {
    const safeValue = Number.isFinite(value) ? value : 0;
    const [integerPart, decimalPart] = safeValue.toString().split(".");
    const normalizedInteger = integerPart.replace(/^-/, "");
    const sign = integerPart.startsWith("-") ? "-" : "";
    const groups: string[] = [];

    for (let index = normalizedInteger.length; index > 0; index -= 3) {
      groups.unshift(normalizedInteger.slice(Math.max(0, index - 3), index));
    }

    const formattedInteger = `${sign}${groups.join(" ") || "0"}`;
    return decimalPart !== undefined
      ? `${formattedInteger},${decimalPart}`
      : formattedInteger;
  };

  const formatSurface = (value: number) => `${formatNumber(value)} m²`;

  const formatCurrency = (value: number) => `${formatNumber(value)} €`;

  const formatLabelValue = (
    value: string | null | undefined,
    labels?: Record<string, { label: string; score: number }>,
  ) => {
    if (!value) return "Non renseigné";
    if (labels?.[value]) return labels[value].label;
    return value;
  };

  const formatBooleanValue = (value?: boolean) => (value ? "Oui" : "Non");

  const loadImageDataUrl = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;

      const blob = await response.blob();
      return await new Promise<string | null>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(typeof reader.result === "string" ? reader.result : null);
        };
        reader.onerror = () => reject(new Error("Impossible de lire l'image"));
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  // === PAGE 1: Cover ===
  doc.setFillColor(46, 75, 133); // #2e4b85
  doc.rect(0, 0, pageWidth, 40, "F");

  const logoDataUrl = await loadImageDataUrl("/logo.jpg");
  if (logoDataUrl) {
    const logoSize = 20;
    const logoX = margin;
    const logoY = 8;

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(
      logoX - 1.5,
      logoY - 1.5,
      logoSize + 3,
      logoSize + 3,
      2.5,
      2.5,
      "F",
    );
    doc.addImage(logoDataUrl, "JPEG", logoX, logoY, logoSize, logoSize);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  setPdfFont("normal");
  const headerTextX = margin + 28;
  doc.text("ÉTUDE DE FAISABILITÉ", headerTextX, 18);
  doc.setFontSize(12);
  doc.text("Analyse foncière et immobilière", headerTextX, 28);

  doc.setTextColor(0, 0, 0);
  yPos = 56;

  addTitle(study.projectInfo.projectName || "Projet sans nom", 16);
  yPos -= 2;

  const projectData = [
    [
      "Adresse",
      `${study.projectInfo.address || ""}${study.projectInfo.city ? `, ${study.projectInfo.city}` : ""}` ||
        "Non renseigné",
    ],
    ["Département", study.projectInfo.department || "Non renseigné"],
    ["Référence cadastrale", study.projectInfo.cadastralRef || "Non renseigné"],
    ["Date du rapport", new Date().toLocaleDateString("fr-FR")],
  ];

  const keyData = [
    ["Surface terrain", formatSurface(study.projectInfo.landArea)],
    ["Prix acquisition", formatCurrency(study.projectInfo.acquisitionPrice)],
    [
      "Assainissement EU",
      formatLabelValue(
        study.phase2.assainissementEU.raccordement,
        criteresAssainissementEU,
      ),
    ],
    [
      "Accord commune",
      formatBooleanValue(study.phase2.potentiel.accordCommune),
    ],
  ];

  const sectionTitleY = yPos + 2;
  const columnGap = 6;
  const columnWidth = (contentWidth - columnGap) / 2;
  const projectColumnX = margin;
  const keyColumnX = margin + columnWidth + columnGap;

  doc.setFontSize(10);
  setPdfFont("bold");
  doc.text("Projet", projectColumnX, sectionTitleY);
  doc.text("Données clés", keyColumnX, sectionTitleY);

  doc.setDrawColor(220);
  doc.setLineWidth(0.2);
  const sectionSeparatorY = sectionTitleY + 1.8;
  doc.line(margin, sectionSeparatorY, pageWidth - margin, sectionSeparatorY);

  const tableStartY = sectionSeparatorY + 2.8;

  autoTable(doc, {
    startY: tableStartY,
    head: [],
    body: projectData,
    margin: { left: projectColumnX, right: margin + columnWidth + columnGap },
    tableWidth: columnWidth,
    theme: "plain",
    styles: {
      font: pdfFontName,
      fontSize: 8.8,
      fontStyle: "normal",
      cellPadding: { top: 1.4, right: 0, bottom: 1.4, left: 0 },
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: columnWidth * 0.42 },
      1: { cellWidth: columnWidth * 0.58 },
    },
  });

  const leftTableFinalY = (doc as jsPDF & { lastAutoTable: { finalY: number } })
    .lastAutoTable.finalY;

  autoTable(doc, {
    startY: tableStartY,
    head: [],
    body: keyData,
    margin: { left: keyColumnX, right: margin },
    tableWidth: columnWidth,
    theme: "plain",
    styles: {
      font: pdfFontName,
      fontSize: 8.8,
      fontStyle: "normal",
      cellPadding: { top: 1.4, right: 0, bottom: 1.4, left: 0 },
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: columnWidth * 0.46 },
      1: { cellWidth: columnWidth * 0.54 },
    },
  });

  const rightTableFinalY = (
    doc as jsPDF & { lastAutoTable: { finalY: number } }
  ).lastAutoTable.finalY;
  yPos = Math.max(leftTableFinalY, rightTableFinalY) + 6;

  // Global score box
  const grade = calculateGrade(study.phase4.scoresPonderes.global);
  const gradeColors: Record<string, [number, number, number]> = {
    A: [34, 197, 94],
    B: [132, 204, 22],
    C: [234, 179, 8],
    D: [249, 115, 22],
    E: [239, 68, 68],
  };

  doc.setFillColor(...gradeColors[grade]);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 30, 3, 3, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  setPdfFont("bold");
  doc.text("SCORE GLOBAL", margin + 8, yPos + 10);
  doc.setFontSize(22);
  doc.text(`${study.phase4.scoresPonderes.global}/100`, margin + 8, yPos + 24);

  doc.setFontSize(16);
  doc.text(`Note ${grade}`, pageWidth - margin - 34, yPos + 10);

  doc.setTextColor(0, 0, 0);
  yPos += 43;

  addSubtitle("Justification");
  addText(study.phase4.justification);

  // Date
  yPos = doc.internal.pageSize.getHeight() - 30;
  doc.setFontSize(9);
  doc.setTextColor(128);
  doc.text(
    `Étude générée le ${new Date().toLocaleDateString("fr-FR")}`,
    margin,
    yPos,
  );
  doc.text("SEDRE - Étude de faisabilité foncière", pageWidth - margin, yPos, {
    align: "right",
  });

  // === PAGE 2: Synthèse des critères (toutes étapes, sans scores) ===
  doc.addPage();
  yPos = 20;
  doc.setTextColor(0, 0, 0);

  addTitle("1. Synthèse des critères", 16);
  yPos += 3;

  type CritereRow = [string, string];

  const phase1Rows: CritereRow[] = [
    // --- Phase 1 : Analyse initiale ---
    [
      "Zonage PLU",
      study.phase1.pluZone
        ? pluZoneLabels[study.phase1.pluZone]
        : "Non renseigné",
    ],
    [
      "Servitudes et contraintes",
      (() => {
        const servitudes = [];
        if (study.phase1.servitudes.patrimoine)
          servitudes.push(servitudePenalties.patrimoine.label);
        if (study.phase1.servitudes.inondation)
          servitudes.push(servitudePenalties.inondation.label);
        if (study.phase1.servitudes.bruit)
          servitudes.push(servitudePenalties.bruit.label);
        if (study.phase1.servitudes.pollution)
          servitudes.push(servitudePenalties.pollution.label);
        if (study.phase1.servitudes.autres)
          servitudes.push(study.phase1.servitudes.autres);
        return servitudes.length > 0
          ? servitudes.join(", ")
          : "Aucune servitude identifiee";
      })(),
    ],
    [
      "Transports en commun",
      formatLabelValue(
        study.phase1.accessibilite.transportEnCommun,
        criteresAccessibilite.transportEnCommun,
      ),
    ],
    [
      "Axes routiers",
      formatLabelValue(
        study.phase1.accessibilite.axesRoutiers,
        criteresAccessibilite.axesRoutiers,
      ),
    ],
    [
      "Stationnement",
      formatLabelValue(
        study.phase1.accessibilite.stationnement,
        criteresAccessibilite.stationnement,
      ),
    ],
    [
      "Environnement immédiat",
      (() => {
        const amenities = [];
        if (study.phase1.environnement.commerces)
          amenities.push(criteresEnvironnement.commerces.label);
        if (study.phase1.environnement.ecoles)
          amenities.push(criteresEnvironnement.ecoles.label);
        if (study.phase1.environnement.sante)
          amenities.push(criteresEnvironnement.sante.label);
        if (study.phase1.environnement.espaceVerts)
          amenities.push(criteresEnvironnement.espaceVerts.label);
        return amenities.length > 0
          ? amenities.join(", ")
          : "Aucun equipement notable";
      })(),
    ],
    ...(study.phase1.environnement.nuisances
      ? ([["Nuisances", study.phase1.environnement.nuisances]] as CritereRow[])
      : []),
  ];

  const phase2Rows: CritereRow[] = [
    [
      "Assainissement EU",
      formatLabelValue(
        study.phase2.assainissementEU.raccordement,
        criteresAssainissementEU,
      ),
    ],
    [
      "Assainissement EP",
      formatLabelValue(
        study.phase2.assainissementEP.raccordement,
        criteresAssainissementEP,
      ),
    ],
    [
      "Electricité",
      formatLabelValue(study.phase2.electricite.desserte, criteresReseauxSecs),
    ],
    [
      "Telecom",
      formatLabelValue(study.phase2.telecom.desserte, criteresReseauxSecs),
    ],
    [
      "Eau potable",
      formatLabelValue(study.phase2.eauPotable.desserte, criteresEauPotable),
    ],
    [
      "Opération démonstratrice",
      formatBooleanValue(study.phase2.potentiel.operationDemonstratrice),
    ],
    [
      "Accord de la commune",
      formatBooleanValue(study.phase2.potentiel.accordCommune),
    ],
    [
      "Risque de contestation locale",
      formatLabelValue(
        study.phase2.potentiel.risqueContestationLocale,
        criteresContestationLocale,
      ),
    ],
    [
      "Demande / tension",
      formatLabelValue(
        study.phase2.marche.demandeTension,
        criteresMarche.demandeTension,
      ),
    ],
    [
      "Dynamique démographique",
      formatLabelValue(
        study.phase2.marche.dynamiqueDemographique,
        criteresMarche.dynamiqueDemographique,
      ),
    ],
    [
      "Concurrence",
      formatLabelValue(
        study.phase2.marche.concurrence,
        criteresMarche.concurrence,
      ),
    ],
    [
      "Création d'emplois",
      formatLabelValue(
        study.phase2.marche.creationEmplois,
        criteresMarche.creationEmplois,
      ),
    ],
    [
      "Revenus des ménages",
      formatLabelValue(
        study.phase2.marche.revenusMenages,
        criteresMarche.revenusMenages,
      ),
    ],
    [
      "Absence de demande / offres vacantes",
      formatLabelValue(
        study.phase2.marche.absenceDemandeOffresVacantes,
        criteresMarche.absenceDemandeOffresVacantes,
      ),
    ],
  ];

  const phase3Rows: CritereRow[] = [
    [
      "Type d'opération",
      study.phase3.typeOperation === "dap"
        ? "Diffus / Amenagement de parcelles (DAP)"
        : study.phase3.typeOperation === "ddd"
          ? "Division de droits a construire (DDD)"
          : "Non renseigné",
    ],
    [
      "Capacité en logements",
      `${study.phase3.recettes.capaciteNombreLogements} logements`,
    ],
  ];

  addSubtitle("Phase 1 - Analyse initiale");

  autoTable(doc, {
    startY: yPos,
    head: [["Critère", "Réponse"]],
    body: phase1Rows,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    theme: "grid",
    styles: { font: pdfFontName, fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [45, 90, 70], textColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.3, fontStyle: "bold" },
      1: { cellWidth: contentWidth * 0.7 },
    },
  });

  yPos =
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 15;

  addSubtitle("Phase 2 - Analyse détaillée");

  autoTable(doc, {
    startY: yPos,
    head: [["Critère", "Réponse"]],
    body: phase2Rows,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    theme: "grid",
    styles: { font: pdfFontName, fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [45, 90, 70], textColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.35, fontStyle: "bold" },
      1: { cellWidth: contentWidth * 0.65 },
    },
  });

  doc.addPage();
  yPos = 20;
  doc.setTextColor(0, 0, 0);

  addTitle("2. Analyse financière", 16);
  addText(
    `Score: ${study.phase3.financialScore}/100 - ${getScoreLabel(study.phase3.financialScore)}`,
  );

  // Budget table
  const budgetData = [
    ["DEPENSES", ""],
    ["Travaux", formatCurrency(study.phase3.depenses.travaux.totalTravaux)],
    ["Études", formatCurrency(study.phase3.depenses.etudes.totalEtudes)],
    [
      "Frais financiers",
      formatCurrency(
        study.phase3.depenses.fraisFinanciers.totalFraisFinanciers,
      ),
    ],
    ["Autres", formatCurrency(study.phase3.depenses.autres.totalAutres)],
    ["TOTAL DEPENSES", formatCurrency(study.phase3.budgetTotal)],
    ["", ""],
    ["RECETTES", ""],
    [
      "Cessions (charges foncières)",
      formatCurrency(study.phase3.recettes.cessionsChargesFoncieres),
    ],
    ["Autres cessions", formatCurrency(study.phase3.recettes.autresCessions)],
    ["Participations", formatCurrency(study.phase3.recettes.participations)],
    [
      "Autres (subventions)",
      formatCurrency(study.phase3.recettes.autresSubventions),
    ],
    ["TOTAL RECETTES", formatCurrency(study.phase3.recettes.caTotal)],
    ["", ""],
    ["RESULTAT", ""],
    [
      "Marge promotion",
      formatCurrency(study.phase3.indicateurs.margePromotion),
    ],
    ["Marge %", `${study.phase3.indicateurs.margePromotionPct.toFixed(1)}%`],
    [
      "ROI",
      `${study.phase3.indicateurs.rentabiliteInvestissement.toFixed(1)}%`,
    ],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: budgetData,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    theme: "striped",
    styles: { font: pdfFontName, fontSize: 10, fontStyle: "normal" },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.65 },
      1: { cellWidth: contentWidth * 0.35, halign: "right" },
    },
    didParseCell: (data) => {
      if (
        data.row.index === 0 ||
        data.row.index === 6 ||
        data.row.index === 9
      ) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [240, 240, 240];
      }
      if (data.row.index === 4) {
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  yPos =
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 15;

  // Indicators
  checkPageBreak(50);
  addSubtitle("Indicateurs clés");
  addText(
    `Coût moyen par logement : ${formatCurrency(study.phase3.indicateurs.prixRevientM2)}/logement`,
  );
  addText(
    `Capacité : ${study.phase3.recettes.capaciteNombreLogements} logements`,
  );
  addText(
    `Ratio foncier : ${study.phase3.indicateurs.ratioFoncier.toFixed(1)}%`,
  );

  // === PAGE 6: Synthesis ===
  doc.addPage();
  yPos = 20;

  addTitle("3. Synthèse et recommandation", 16);
  yPos += 5;

  // Score summary
  const scoreData = [
    ["Phase", "Score", "Poids", "Contribution"],
    [
      "Phase 1 - Analyse initiale",
      `${study.phase1.globalScore}/100`,
      "25%",
      `${study.phase4.scoresPonderes.phase1} pts`,
    ],
    [
      "Phase 2 - Analyse detaillée",
      `${study.phase2.globalScore}/100`,
      "35%",
      `${study.phase4.scoresPonderes.phase2} pts`,
    ],
    [
      "Phase 3 - Analyse financière",
      `${study.phase3.financialScore}/100`,
      "40%",
      `${study.phase4.scoresPonderes.phase3} pts`,
    ],
    [
      "SCORE GLOBAL",
      `${study.phase4.scoresPonderes.global}/100`,
      "100%",
      `Note ${grade}`,
    ],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [scoreData[0]],
    body: scoreData.slice(1),
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    theme: "grid",
    styles: { font: pdfFontName, fontSize: 10, halign: "center" },
    headStyles: { fillColor: [45, 90, 70] },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.4 },
      1: { cellWidth: contentWidth * 0.2 },
      2: { cellWidth: contentWidth * 0.15 },
      3: { cellWidth: contentWidth * 0.25 },
    },
    didParseCell: (data) => {
      if (data.row.index === 3) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = gradeColors[grade];
        data.cell.styles.textColor = [255, 255, 255];
      }
    },
  });

  yPos =
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 15;

  // SWOT
  checkPageBreak(60);
  addSubtitle("Analyse SWOT");
  yPos += 5;

  const swotData = [
    ["FORCES", "FAIBLESSES"],
    [
      study.phase4.swot.forces.join("\n") || "-",
      study.phase4.swot.faiblesses.join("\n") || "-",
    ],
    ["OPPORTUNITÉS", "MENACES"],
    [
      study.phase4.swot.opportunites.join("\n") || "-",
      study.phase4.swot.menaces.join("\n") || "-",
    ],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: swotData,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    theme: "grid",
    styles: { font: pdfFontName, fontSize: 9, cellPadding: 5 },
    columnStyles: {
      0: { cellWidth: contentWidth / 2 },
      1: { cellWidth: contentWidth / 2 },
    },
    didParseCell: (data) => {
      if (data.row.index === 0 || data.row.index === 2) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [240, 240, 240];
      }
    },
  });

  yPos =
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 15;

  // Conditions et étapes
  checkPageBreak(40);
  if (study.phase4.conditionsSuspensives.length > 0) {
    addSubtitle("Conditions suspensives");
    study.phase4.conditionsSuspensives.forEach((item, i) => {
      addText(`${i + 1}. ${item}`, 5);
    });
    yPos += 5;
  }

  checkPageBreak(40);
  if (study.phase4.prochainEtapes.length > 0) {
    addSubtitle("Prochaines etapes");
    study.phase4.prochainEtapes.forEach((item, i) => {
      addText(`${i + 1}. ${item}`, 5);
    });
  }

  // Save PDF
  const fileName = `SEDRE_${study.projectInfo.projectName || "Étude"}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}
