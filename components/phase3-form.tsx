'use client';

import { useEffect, useCallback } from 'react';
import { Phase3Data } from '@/lib/types';
import { getScoreColor, getScoreLabel, defaultWeights } from '@/lib/config';
import {
  calculateAcquisitionTotal,
  calculateConstructionTotal,
  calculateFraisAnnexesTotal,
  calculateIndicateurs,
  calculateFinancialScore,
} from '@/lib/calculations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScoreDisplay } from '@/components/score-display';

interface Phase3FormProps {
  data: Phase3Data;
  onUpdate: (data: Phase3Data) => void;
  acquisitionPrice: number;
  surfacePlancher: number;
}

export function Phase3Form({ data, onUpdate, acquisitionPrice, surfacePlancher }: Phase3FormProps) {
  // Initialize terrain price from project info if not set
  useEffect(() => {
    if (acquisitionPrice > 0 && data.acquisition.prixTerrain === 0) {
      onUpdate({
        ...data,
        acquisition: { ...data.acquisition, prixTerrain: acquisitionPrice },
      });
    }
  }, [acquisitionPrice, data, onUpdate]);

  // Recalculate totals when data changes
  const recalculate = useCallback(() => {
    // Calculate totals
    const totalAcquisition = calculateAcquisitionTotal(data.acquisition);
    const coutTravaux = data.construction.coutM2 * data.construction.surfaceConstructible;
    const totalConstruction = calculateConstructionTotal(data.construction);
    const totalAnnexes = calculateFraisAnnexesTotal(data.fraisAnnexes);
    const budgetTotal = totalAcquisition + totalConstruction + totalAnnexes;
    const caTotal = data.recettes.prixVenteM2 * data.recettes.surfaceVendable;

    // Calculate indicators
    const indicateurs = calculateIndicateurs(budgetTotal, { ...data.recettes, caTotal }, data.acquisition);
    const financialScore = calculateFinancialScore(indicateurs);

    // Check if update is needed
    if (
      data.acquisition.totalAcquisition !== totalAcquisition ||
      data.construction.coutTravaux !== coutTravaux ||
      data.construction.totalConstruction !== totalConstruction ||
      data.fraisAnnexes.totalAnnexes !== totalAnnexes ||
      data.budgetTotal !== budgetTotal ||
      data.recettes.caTotal !== caTotal ||
      data.financialScore !== financialScore ||
      JSON.stringify(data.indicateurs) !== JSON.stringify(indicateurs)
    ) {
      onUpdate({
        ...data,
        acquisition: { ...data.acquisition, totalAcquisition },
        construction: { ...data.construction, coutTravaux, totalConstruction },
        fraisAnnexes: { ...data.fraisAnnexes, totalAnnexes },
        budgetTotal,
        recettes: { ...data.recettes, caTotal },
        indicateurs,
        financialScore,
      });
    }
  }, [data, onUpdate]);

  useEffect(() => {
    recalculate();
  }, [recalculate]);

  // Initialize surface from Phase 2 if available
  useEffect(() => {
    if (surfacePlancher > 0 && data.construction.surfaceConstructible === 0) {
      onUpdate({
        ...data,
        construction: { ...data.construction, surfaceConstructible: surfacePlancher },
        recettes: { ...data.recettes, surfaceVendable: Math.round(surfacePlancher * 0.85) },
      });
    }
  }, [surfacePlancher, data, onUpdate]);

  const updateAcquisition = (key: keyof Phase3Data['acquisition'], value: number) => {
    onUpdate({
      ...data,
      acquisition: { ...data.acquisition, [key]: value },
    });
  };

  const updateConstruction = (key: keyof Phase3Data['construction'], value: number) => {
    onUpdate({
      ...data,
      construction: { ...data.construction, [key]: value },
    });
  };

  const updateFraisAnnexes = (key: keyof Phase3Data['fraisAnnexes'], value: number) => {
    onUpdate({
      ...data,
      fraisAnnexes: { ...data.fraisAnnexes, [key]: value },
    });
  };

  const updateRecettes = (key: keyof Phase3Data['recettes'], value: number) => {
    onUpdate({
      ...data,
      recettes: { ...data.recettes, [key]: value },
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Score Display */}
      <ScoreDisplay
        title="Score Phase 3 - Analyse financière"
        score={data.financialScore}
        details={[
          { label: `Marge promotion (min ${defaultWeights.phase3.margeMin}%)`, score: data.indicateurs.margePromotionPct >= defaultWeights.phase3.margeMin ? 100 : Math.round((data.indicateurs.margePromotionPct / defaultWeights.phase3.margeMin) * 100), weight: 50 },
          { label: `ROI (min ${defaultWeights.phase3.roiMin}%)`, score: data.indicateurs.rentabiliteInvestissement >= defaultWeights.phase3.roiMin ? 100 : Math.round((data.indicateurs.rentabiliteInvestissement / defaultWeights.phase3.roiMin) * 100), weight: 30 },
          { label: `Ratio foncier (max ${defaultWeights.phase3.ratioFoncierMax}%)`, score: data.indicateurs.ratioFoncier <= defaultWeights.phase3.ratioFoncierMax ? 100 : Math.max(0, 100 - Math.round((data.indicateurs.ratioFoncier - defaultWeights.phase3.ratioFoncierMax) * 5)), weight: 20 },
        ]}
      />

      {/* Financial Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title="Budget total"
          value={formatCurrency(data.budgetTotal)}
          detail={data.recettes.surfaceVendable > 0 ? `${formatCurrency(data.indicateurs.prixRevientM2)}/m²` : undefined}
        />
        <SummaryCard
          title="Recettes estimées"
          value={formatCurrency(data.recettes.caTotal)}
          detail={data.recettes.surfaceVendable > 0 ? `${formatCurrency(data.recettes.prixVenteM2)}/m²` : undefined}
        />
        <SummaryCard
          title="Marge promotion"
          value={formatCurrency(data.indicateurs.margePromotion)}
          detail={`${data.indicateurs.margePromotionPct.toFixed(1)}%`}
          positive={data.indicateurs.margePromotion > 0}
        />
      </div>

      {/* Acquisition */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Coûts d&apos;acquisition</span>
            <span className="text-lg font-bold text-primary">{formatCurrency(data.acquisition.totalAcquisition)}</span>
          </CardTitle>
          <CardDescription>Frais liés à l&apos;acquisition du terrain</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="prixTerrain">Prix du terrain (€)</Label>
              <Input
                id="prixTerrain"
                type="number"
                value={data.acquisition.prixTerrain || ''}
                onChange={(e) => updateAcquisition('prixTerrain', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fraisNotaire">Frais de notaire (€)</Label>
              <Input
                id="fraisNotaire"
                type="number"
                value={data.acquisition.fraisNotaire || ''}
                onChange={(e) => updateAcquisition('fraisNotaire', parseFloat(e.target.value) || 0)}
                placeholder={`Suggestion: ${formatCurrency(data.acquisition.prixTerrain * 0.075)}`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fraisAgence">Frais d&apos;agence (€)</Label>
              <Input
                id="fraisAgence"
                type="number"
                value={data.acquisition.fraisAgence || ''}
                onChange={(e) => updateAcquisition('fraisAgence', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxeAmenagement">Taxe d&apos;aménagement (€)</Label>
              <Input
                id="taxeAmenagement"
                type="number"
                value={data.acquisition.taxeAmenagement || ''}
                onChange={(e) => updateAcquisition('taxeAmenagement', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="autresFrais">Autres frais (€)</Label>
              <Input
                id="autresFrais"
                type="number"
                value={data.acquisition.autresFrais || ''}
                onChange={(e) => updateAcquisition('autresFrais', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Construction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Coûts de construction</span>
            <span className="text-lg font-bold text-primary">{formatCurrency(data.construction.totalConstruction)}</span>
          </CardTitle>
          <CardDescription>Budget travaux et honoraires</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="surfaceConstructible">Surface constructible (m²)</Label>
              <Input
                id="surfaceConstructible"
                type="number"
                value={data.construction.surfaceConstructible || ''}
                onChange={(e) => updateConstruction('surfaceConstructible', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coutM2">Coût construction (€/m²)</Label>
              <Input
                id="coutM2"
                type="number"
                value={data.construction.coutM2 || ''}
                onChange={(e) => updateConstruction('coutM2', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Coût travaux brut</Label>
              <div className="h-9 flex items-center px-3 bg-muted rounded-md text-sm font-medium">
                {formatCurrency(data.construction.coutTravaux)}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="honorairesMOE">Honoraires MOE (%)</Label>
              <Input
                id="honorairesMOE"
                type="number"
                value={data.construction.honorairesMOE || ''}
                onChange={(e) => updateConstruction('honorairesMOE', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="etudesTechniques">Études techniques (€)</Label>
              <Input
                id="etudesTechniques"
                type="number"
                value={data.construction.etudesTechniques || ''}
                onChange={(e) => updateConstruction('etudesTechniques', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aleas">Aléas (%)</Label>
              <Input
                id="aleas"
                type="number"
                value={data.construction.aleas || ''}
                onChange={(e) => updateConstruction('aleas', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Frais annexes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Frais annexes</span>
            <span className="text-lg font-bold text-primary">{formatCurrency(data.fraisAnnexes.totalAnnexes)}</span>
          </CardTitle>
          <CardDescription>Frais financiers, commerciaux et de gestion</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="fraisFinanciers">Frais financiers (€)</Label>
              <Input
                id="fraisFinanciers"
                type="number"
                value={data.fraisAnnexes.fraisFinanciers || ''}
                onChange={(e) => updateFraisAnnexes('fraisFinanciers', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fraisCommerciaux">Frais commerciaux (€)</Label>
              <Input
                id="fraisCommerciaux"
                type="number"
                value={data.fraisAnnexes.fraisCommerciaux || ''}
                onChange={(e) => updateFraisAnnexes('fraisCommerciaux', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assurances">Assurances (€)</Label>
              <Input
                id="assurances"
                type="number"
                value={data.fraisAnnexes.assurances || ''}
                onChange={(e) => updateFraisAnnexes('assurances', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gestionProjet">Gestion de projet (€)</Label>
              <Input
                id="gestionProjet"
                type="number"
                value={data.fraisAnnexes.gestionProjet || ''}
                onChange={(e) => updateFraisAnnexes('gestionProjet', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recettes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recettes prévisionnelles</span>
            <span className="text-lg font-bold text-emerald-600">{formatCurrency(data.recettes.caTotal)}</span>
          </CardTitle>
          <CardDescription>Estimation des ventes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="surfaceVendable">Surface vendable (m²)</Label>
              <Input
                id="surfaceVendable"
                type="number"
                value={data.recettes.surfaceVendable || ''}
                onChange={(e) => updateRecettes('surfaceVendable', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prixVenteM2">Prix de vente (€/m²)</Label>
              <Input
                id="prixVenteM2"
                type="number"
                value={data.recettes.prixVenteM2 || ''}
                onChange={(e) => updateRecettes('prixVenteM2', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>CA Total</Label>
              <div className="h-9 flex items-center px-3 bg-emerald-50 rounded-md text-sm font-medium text-emerald-700">
                {formatCurrency(data.recettes.caTotal)}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tauxPreCommercialisation">Pré-commercialisation (%)</Label>
              <Input
                id="tauxPreCommercialisation"
                type="number"
                value={data.recettes.tauxPreCommercialisation || ''}
                onChange={(e) => updateRecettes('tauxPreCommercialisation', parseFloat(e.target.value) || 0)}
                placeholder="Ex: 30"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Indicateurs */}
      <Card>
        <CardHeader>
          <CardTitle>Indicateurs financiers</CardTitle>
          <CardDescription>Synthèse de la rentabilité du projet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <IndicatorCard
              label="Marge promotion"
              value={formatCurrency(data.indicateurs.margePromotion)}
              subValue={`${data.indicateurs.margePromotionPct.toFixed(1)}%`}
              threshold={defaultWeights.phase3.margeMin}
              currentPercent={data.indicateurs.margePromotionPct}
              higherIsBetter
            />
            <IndicatorCard
              label="ROI"
              value={`${data.indicateurs.rentabiliteInvestissement.toFixed(1)}%`}
              threshold={defaultWeights.phase3.roiMin}
              currentPercent={data.indicateurs.rentabiliteInvestissement}
              higherIsBetter
            />
            <IndicatorCard
              label="Prix de revient"
              value={`${formatCurrency(data.indicateurs.prixRevientM2)}/m²`}
            />
            <IndicatorCard
              label="Ratio foncier"
              value={`${data.indicateurs.ratioFoncier.toFixed(1)}%`}
              threshold={defaultWeights.phase3.ratioFoncierMax}
              currentPercent={data.indicateurs.ratioFoncier}
              higherIsBetter={false}
            />
            <IndicatorCard
              label="Score financier"
              value={`${data.financialScore}/100`}
              subValue={getScoreLabel(data.financialScore)}
              color={getScoreColor(data.financialScore)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle>Commentaires Phase 3</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={data.comments}
            onChange={(e) => onUpdate({ ...data, comments: e.target.value })}
            placeholder="Notes et observations sur l'analyse financière..."
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ title, value, detail, positive }: { title: string; value: string; detail?: string; positive?: boolean }) {
  return (
    <Card className="bg-muted/30">
      <CardContent className="p-4">
        <div className="text-sm text-muted-foreground">{title}</div>
        <div className={`text-2xl font-bold ${positive === true ? 'text-emerald-600' : positive === false ? 'text-red-600' : 'text-foreground'}`}>
          {value}
        </div>
        {detail && <div className="text-sm text-muted-foreground">{detail}</div>}
      </CardContent>
    </Card>
  );
}

function IndicatorCard({
  label,
  value,
  subValue,
  threshold,
  currentPercent,
  higherIsBetter,
  color,
}: {
  label: string;
  value: string;
  subValue?: string;
  threshold?: number;
  currentPercent?: number;
  higherIsBetter?: boolean;
  color?: string;
}) {
  let status: 'good' | 'warning' | 'bad' | 'neutral' = 'neutral';
  
  if (threshold !== undefined && currentPercent !== undefined) {
    if (higherIsBetter) {
      if (currentPercent >= threshold) status = 'good';
      else if (currentPercent >= threshold * 0.7) status = 'warning';
      else status = 'bad';
    } else {
      if (currentPercent <= threshold) status = 'good';
      else if (currentPercent <= threshold * 1.3) status = 'warning';
      else status = 'bad';
    }
  }

  const statusColors = {
    good: 'border-emerald-500 bg-emerald-50',
    warning: 'border-amber-500 bg-amber-50',
    bad: 'border-red-500 bg-red-50',
    neutral: 'border-border bg-background',
  };

  const textColors = {
    good: 'text-emerald-700',
    warning: 'text-amber-700',
    bad: 'text-red-700',
    neutral: 'text-foreground',
  };

  return (
    <div className={`rounded-lg border-2 p-3 ${statusColors[status]}`}>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={`text-lg font-bold ${color ? '' : textColors[status]}`} style={color ? { color } : undefined}>
        {value}
      </div>
      {subValue && <div className="text-xs text-muted-foreground">{subValue}</div>}
      {threshold !== undefined && (
        <div className="text-xs text-muted-foreground mt-1">
          Seuil: {higherIsBetter ? '≥' : '≤'} {threshold}%
        </div>
      )}
    </div>
  );
}
