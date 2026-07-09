import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getScoreLabel, pluZoneLabels } from "./config";
import { FeasibilityStudy, calculateGrade } from "./types";

export async function generatePDF(study: FeasibilityStudy): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  // Helper functions
  const addTitle = (text: string, size: number = 16) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", "bold");
    doc.text(text, margin, yPos);
    yPos += size * 0.5 + 5;
  };

  const addSubtitle = (text: string) => {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(text, margin, yPos);
    yPos += 8;
  };

  const addText = (text: string, indent: number = 0) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // === PAGE 1: Cover ===
  doc.setFillColor(45, 90, 70); // Primary green
  doc.rect(0, 0, pageWidth, 60, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("ETUDE DE FAISABILITE", pageWidth / 2, 30, { align: "center" });
  doc.setFontSize(14);
  doc.text("Analyse fonciere et immobiliere", pageWidth / 2, 42, {
    align: "center",
  });

  doc.setTextColor(0, 0, 0);
  yPos = 80;

  // Project info
  addTitle(study.projectInfo.projectName || "Projet sans nom", 18);
  yPos += 5;

  if (study.projectInfo.address || study.projectInfo.city) {
    addText(`${study.projectInfo.address}, ${study.projectInfo.city}`);
  }
  if (study.projectInfo.department) {
    addText(`Departement: ${study.projectInfo.department}`);
  }
  if (study.projectInfo.cadastralRef) {
    addText(`Reference cadastrale: ${study.projectInfo.cadastralRef}`);
  }

  yPos += 10;
  addLine();
  yPos += 5;

  // Key metrics
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("DONNEES CLES", margin, yPos);
  yPos += 8;

  const keyData = [
    [
      "Surface terrain",
      `${study.projectInfo.landArea.toLocaleString("fr-FR")} m²`,
    ],
    ["Prix acquisition", formatCurrency(study.projectInfo.acquisitionPrice)],
    [
      "Assainissement EU",
      study.phase2.assainissementEU.raccordement || "Non renseigne",
    ],
    ["Accord commune", study.phase2.potentiel.accordCommune ? "Oui" : "Non"],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: keyData,
    margin: { left: margin },
    theme: "plain",
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 60 },
      1: { cellWidth: 60 },
    },
  });

  yPos =
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 15;

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
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 40, 3, 3, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("SCORE GLOBAL", margin + 10, yPos + 15);
  doc.setFontSize(28);
  doc.text(`${study.phase4.scoresPonderes.global}/100`, margin + 10, yPos + 32);

  doc.setFontSize(20);
  doc.text(`Note ${grade}`, pageWidth - margin - 40, yPos + 25);

  doc.setTextColor(0, 0, 0);
  yPos += 50;

  addText(study.phase4.justification);

  // Date
  yPos = doc.internal.pageSize.getHeight() - 30;
  doc.setFontSize(9);
  doc.setTextColor(128);
  doc.text(
    `Etude generee le ${new Date().toLocaleDateString("fr-FR")}`,
    margin,
    yPos,
  );
  doc.text("SEDRE - Etude de faisabilite fonciere", pageWidth - margin, yPos, {
    align: "right",
  });

  // === PAGE 2: Phase 1 Analysis ===
  doc.addPage();
  yPos = 20;
  doc.setTextColor(0, 0, 0);

  addTitle("PHASE 1 - Analyse initiale", 16);
  addText(
    `Score: ${study.phase1.globalScore}/100 - ${getScoreLabel(study.phase1.globalScore)}`,
  );
  yPos += 5;

  // PLU Zone
  addSubtitle("Zonage PLU");
  addText(
    `Zone: ${study.phase1.pluZone ? pluZoneLabels[study.phase1.pluZone] : "Non renseigne"}`,
  );
  addText(`Score: ${study.phase1.pluZoneScore}/100`);
  yPos += 5;

  // Servitudes
  addSubtitle("Servitudes et contraintes");
  const servitudes = [];
  if (study.phase1.servitudes.patrimoine)
    servitudes.push("Protection du patrimoine (ABF)");
  if (study.phase1.servitudes.inondation)
    servitudes.push("Zone inondable (PPRI)");
  if (study.phase1.servitudes.bruit) servitudes.push("Nuisances sonores");
  if (study.phase1.servitudes.pollution) servitudes.push("Pollution des sols");
  if (study.phase1.servitudes.autres)
    servitudes.push(study.phase1.servitudes.autres);

  addText(
    servitudes.length > 0
      ? servitudes.join(", ")
      : "Aucune servitude identifiee",
  );
  addText(`Score: ${study.phase1.servitudesScore}/100`);
  yPos += 5;

  // Accessibilité
  addSubtitle("Accessibilite");
  addText(
    `Transports en commun: ${study.phase1.accessibilite.transportEnCommun || "Non renseigne"}`,
  );
  addText(
    `Axes routiers: ${study.phase1.accessibilite.axesRoutiers || "Non renseigne"}`,
  );
  addText(
    `Stationnement: ${study.phase1.accessibilite.stationnement || "Non renseigne"}`,
  );
  addText(`Score: ${study.phase1.accessibiliteScore}/100`);
  yPos += 5;

  // Environnement
  addSubtitle("Environnement immediat");
  const amenities = [];
  if (study.phase1.environnement.commerces) amenities.push("Commerces");
  if (study.phase1.environnement.ecoles) amenities.push("Ecoles");
  if (study.phase1.environnement.sante) amenities.push("Services de sante");
  if (study.phase1.environnement.espaceVerts) amenities.push("Espaces verts");

  addText(
    amenities.length > 0 ? amenities.join(", ") : "Aucun equipement notable",
  );
  if (study.phase1.environnement.nuisances) {
    addText(`Nuisances: ${study.phase1.environnement.nuisances}`);
  }
  addText(`Score: ${study.phase1.environnementScore}/100`);

  if (study.phase1.comments) {
    yPos += 5;
    addSubtitle("Commentaires");
    addText(study.phase1.comments);
  }

  // === PAGE 3: Phase 2 Analysis ===
  doc.addPage();
  yPos = 20;

  addTitle("PHASE 2 - Analyse detaillee", 16);
  addText(
    `Score: ${study.phase2.globalScore}/100 - ${getScoreLabel(study.phase2.globalScore)}`,
  );
  yPos += 5;

  // Assainissement
  addSubtitle("Assainissement");
  addText(
    `EU: ${study.phase2.assainissementEU.raccordement || "Non renseigne"}`,
  );
  addText(
    `EP: ${study.phase2.assainissementEP.raccordement || "Non renseigne"}`,
  );
  addText(`Score: ${study.phase2.assainissementScore}/100`);
  yPos += 5;

  // Reseaux
  addSubtitle("Reseaux");
  addText(
    `Electricite: ${study.phase2.electricite.desserte || "Non renseigne"}`,
  );
  addText(`Telecom: ${study.phase2.telecom.desserte || "Non renseigne"}`);
  addText(
    `Eau potable: ${study.phase2.eauPotable.desserte || "Non renseigne"}`,
  );
  addText(`Score: ${study.phase2.reseauxScore}/100`);
  yPos += 5;

  // Potentiel
  addSubtitle("Potentiel");
  addText(
    `Operation demonstratrice: ${study.phase2.potentiel.operationDemonstratrice ? "Oui" : "Non"}`,
  );
  addText(
    `Accord de la commune: ${study.phase2.potentiel.accordCommune ? "Oui" : "Non"}`,
  );
  addText(
    `Risque de contestation locale: ${study.phase2.potentiel.risqueContestationLocale || "Non renseigne"}`,
  );
  addText(`Score: ${study.phase2.potentielScore}/100`);
  yPos += 5;

  // Marché
  addSubtitle("Attentes et etat du marche");
  addText(
    `Demande / tension: ${study.phase2.marche.demandeTension || "Non renseigne"}`,
  );
  addText(
    `Dynamique demographique: ${study.phase2.marche.dynamiqueDemographique || "Non renseignee"}`,
  );
  addText(
    `Concurrence: ${study.phase2.marche.concurrence || "Non renseignee"}`,
  );
  addText(
    `Creation d'emplois: ${study.phase2.marche.creationEmplois || "Non renseignee"}`,
  );
  addText(
    `Revenus des menages: ${study.phase2.marche.revenusMenages || "Non renseignes"}`,
  );
  addText(
    `Absence de demande / offres vacantes: ${study.phase2.marche.absenceDemandeOffresVacantes || "Non renseignee"}`,
  );
  addText(`Score: ${study.phase2.marcheScore}/100`);

  // === PAGE 4: Phase 3 Financial ===
  doc.addPage();
  yPos = 20;

  addTitle("PHASE 3 - Analyse financiere", 16);
  addText(
    `Score: ${study.phase3.financialScore}/100 - ${getScoreLabel(study.phase3.financialScore)}`,
  );
  yPos += 10;

  // Budget table
  const budgetData = [
    ["DEPENSES", ""],
    ["Travaux", formatCurrency(study.phase3.depenses.travaux.totalTravaux)],
    ["Etudes", formatCurrency(study.phase3.depenses.etudes.totalEtudes)],
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
      "Cessions (charges foncieres)",
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
    margin: { left: margin },
    theme: "striped",
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 50, halign: "right" },
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
  addSubtitle("Indicateurs cles");
  addText(
    `Cout moyen par logement: ${formatCurrency(study.phase3.indicateurs.prixRevientM2)}/logement`,
  );
  addText(
    `Capacite: ${study.phase3.recettes.capaciteNombreLogements} logements`,
  );
  addText(
    `Ratio foncier: ${study.phase3.indicateurs.ratioFoncier.toFixed(1)}%`,
  );

  // === PAGE 5: Synthesis ===
  doc.addPage();
  yPos = 20;

  addTitle("SYNTHESE ET RECOMMANDATION", 16);
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
      "Phase 2 - Analyse detaillee",
      `${study.phase2.globalScore}/100`,
      "35%",
      `${study.phase4.scoresPonderes.phase2} pts`,
    ],
    [
      "Phase 3 - Analyse financiere",
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
    margin: { left: margin },
    theme: "grid",
    styles: { fontSize: 10, halign: "center" },
    headStyles: { fillColor: [45, 90, 70] },
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
    ["OPPORTUNITES", "MENACES"],
    [
      study.phase4.swot.opportunites.join("\n") || "-",
      study.phase4.swot.menaces.join("\n") || "-",
    ],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: swotData,
    margin: { left: margin },
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 5 },
    columnStyles: {
      0: { cellWidth: (pageWidth - 2 * margin) / 2 },
      1: { cellWidth: (pageWidth - 2 * margin) / 2 },
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
  const fileName = `SEDRE${study.projectInfo.projectName || "Etude"}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}
