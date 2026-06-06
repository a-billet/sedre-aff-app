'use client';

import { useEffect, useCallback } from 'react';
import { Phase3Data } from '@/lib/types';
import { getScoreColor, getScoreLabel, defaultWeights } from '@/lib/config';
import {
  calculateAutresTotal,
  calculateEtudesTotal,
  calculateFraisFinanciersTotal,
  calculateIndicateurs,
  calculateFinancialScore,
  calculateTravauxTotal,
} from '@/lib/calculations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScoreDisplay } from '@/components/score-display';

interface Phase3FormProps {
  data: Phase3Data;
  onUpdate: (data: Phase3Data) => void;
  housingCapacity: number;
}

export function Phase3Form({ data, onUpdate, housingCapacity }: Phase3FormProps) {
  const recettesLogement = data.typeOperation === 'dap'
    ? data.recettes.cessionsChargesFoncieres
    : data.recettes.autresCessions;

  // Recalculate totals when data changes
  const recalculate = useCallback(() => {
    const totalTravaux = calculateTravauxTotal(data.depenses.travaux, data.typeOperation);
    const totalEtudes = calculateEtudesTotal(data.depenses.etudes);
    const totalFraisFinanciers = calculateFraisFinanciersTotal(
      data.depenses.fraisFinanciers,
      totalTravaux,
      totalEtudes,
    );
    const totalAutres = calculateAutresTotal(data.depenses.autres);
    const budgetTotal = totalTravaux + totalEtudes + totalFraisFinanciers + totalAutres;
    const caTotal =
      (data.typeOperation === 'dap' ? data.recettes.cessionsChargesFoncieres : 0) +
      data.recettes.autresCessions +
      data.recettes.participations +
      data.recettes.autresSubventions;

    const indicateurs = calculateIndicateurs(budgetTotal, { ...data.recettes, caTotal }, data.typeOperation);
    const financialScore = calculateFinancialScore(indicateurs);

    if (
      data.depenses.travaux.totalTravaux !== totalTravaux ||
      data.depenses.etudes.totalEtudes !== totalEtudes ||
      data.depenses.fraisFinanciers.totalFraisFinanciers !== totalFraisFinanciers ||
      data.depenses.autres.totalAutres !== totalAutres ||
      data.budgetTotal !== budgetTotal ||
      data.recettes.caTotal !== caTotal ||
      data.financialScore !== financialScore ||
      JSON.stringify(data.indicateurs) !== JSON.stringify(indicateurs)
    ) {
      onUpdate({
        ...data,
        depenses: {
          travaux: { ...data.depenses.travaux, totalTravaux },
          etudes: { ...data.depenses.etudes, totalEtudes },
          fraisFinanciers: { ...data.depenses.fraisFinanciers, totalFraisFinanciers },
          autres: { ...data.depenses.autres, totalAutres },
        },
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

  useEffect(() => {
    if (housingCapacity > 0 && data.recettes.capaciteNombreLogements === 0) {
      onUpdate({
        ...data,
        recettes: { ...data.recettes, capaciteNombreLogements: housingCapacity },
      });
    }
  }, [housingCapacity, data, onUpdate]);

  const updateTravaux = (key: keyof Phase3Data['depenses']['travaux'], value: number) => {
    onUpdate({
      ...data,
      depenses: {
        ...data.depenses,
        travaux: { ...data.depenses.travaux, [key]: value },
      },
    });
  };

  const updateEtudes = (key: keyof Phase3Data['depenses']['etudes'], value: number) => {
    onUpdate({
      ...data,
      depenses: {
        ...data.depenses,
        etudes: { ...data.depenses.etudes, [key]: value },
      },
    });
  };

  const updateFraisFinanciers = (key: keyof Phase3Data['depenses']['fraisFinanciers'], value: number) => {
    onUpdate({
      ...data,
      depenses: {
        ...data.depenses,
        fraisFinanciers: { ...data.depenses.fraisFinanciers, [key]: value },
      },
    });
  };

  const updateAutres = (key: keyof Phase3Data['depenses']['autres'], value: number) => {
    onUpdate({
      ...data,
      depenses: {
        ...data.depenses,
        autres: { ...data.depenses.autres, [key]: value },
      },
    });
  };

  const updateRecettes = (key: keyof Phase3Data['recettes'], value: number) => {
    onUpdate({
      ...data,
      recettes: { ...data.recettes, [key]: value },
    });
  };

  const updateTypeOperation = (typeOperation: Phase3Data['typeOperation']) => {
    onUpdate({
      ...data,
      typeOperation,
      recettes: {
        ...data.recettes,
        cessionsChargesFoncieres: typeOperation === 'ddd' ? 0 : data.recettes.cessionsChargesFoncieres,
      },
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

      <Card>
        <CardHeader>
          <CardTitle>Type de bilan financier</CardTitle>
          <CardDescription>Choisir le montage correspondant au projet pour adapter les postes travaux</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => updateTypeOperation('dap')}
              className={`rounded-xl border p-4 text-left transition-colors ${data.typeOperation === 'dap' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'}`}
            >
              <div className="text-sm font-semibold text-foreground">Opération d&apos;aménagement</div>
              <div className="mt-1 text-sm text-muted-foreground">Droit à construire, DAP</div>
            </button>
            <button
              type="button"
              onClick={() => updateTypeOperation('ddd')}
              className={`rounded-xl border p-4 text-left transition-colors ${data.typeOperation === 'ddd' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'}`}
            >
              <div className="text-sm font-semibold text-foreground">Promotion ou logement social</div>
              <div className="mt-1 text-sm text-muted-foreground">Opération DDD</div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title="Budget total"
          value={formatCurrency(data.budgetTotal)}
          detail={data.recettes.capaciteNombreLogements > 0 ? `${formatCurrency(data.indicateurs.prixRevientM2)}/logement` : undefined}
        />
        <SummaryCard
          title="Recettes estimées"
          value={formatCurrency(data.recettes.caTotal)}
          detail={data.recettes.capaciteNombreLogements > 0 ? `${formatCurrency(data.recettes.caTotal / data.recettes.capaciteNombreLogements)}/logement` : undefined}
        />
        <SummaryCard
          title="Marge promotion"
          value={formatCurrency(data.indicateurs.margePromotion)}
          detail={`${data.indicateurs.margePromotionPct.toFixed(1)}%`}
          positive={data.indicateurs.margePromotion > 0}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Dépenses</div>
                <div className="mt-1 text-sm text-muted-foreground">Vision consolidée des coûts du projet</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Total dépenses</div>
                <div className="text-2xl font-bold text-foreground">{formatCurrency(data.budgetTotal)}</div>
              </div>
            </div>
          </div>

          {/* Acquisition */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Travaux</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(data.depenses.travaux.totalTravaux)}</span>
              </CardTitle>
              <CardDescription>
                {data.typeOperation === 'dap'
                  ? 'Postes opérationnels d\'aménagement et de réalisation'
                  : 'Postes travaux pour une opération de promotion ou de logement social'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="miseEnEtatSols">Mise en état des sols (€)</Label>
                  <Input
                    id="miseEnEtatSols"
                    type="number"
                    value={data.depenses.travaux.miseEnEtatSols || ''}
                    onChange={(e) => updateTravaux('miseEnEtatSols', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  {data.typeOperation === 'dap' ? (
                    <>
                      <Label htmlFor="voiriePlaces">Voirie / places (€)</Label>
                      <Input
                        id="voiriePlaces"
                        type="number"
                        value={data.depenses.travaux.voiriePlaces || ''}
                        onChange={(e) => updateTravaux('voiriePlaces', parseFloat(e.target.value) || 0)}
                      />
                    </>
                  ) : (
                    <>
                      <Label htmlFor="coutTravaux">Coût travaux (€)</Label>
                      <Input
                        id="coutTravaux"
                        type="number"
                        value={data.depenses.travaux.coutTravaux || ''}
                        onChange={(e) => updateTravaux('coutTravaux', parseFloat(e.target.value) || 0)}
                      />
                    </>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reseaux">Réseaux (€)</Label>
                  <Input
                    id="reseaux"
                    type="number"
                    value={data.depenses.travaux.reseaux || ''}
                    onChange={(e) => updateTravaux('reseaux', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  {data.typeOperation === 'dap' ? (
                    <>
                      <Label htmlFor="paysage">Paysage (€)</Label>
                      <Input
                        id="paysage"
                        type="number"
                        value={data.depenses.travaux.paysage || ''}
                        onChange={(e) => updateTravaux('paysage', parseFloat(e.target.value) || 0)}
                      />
                    </>
                  ) : (
                    <>
                      <Label htmlFor="amenagementExtPaysage">Aménagement ext / paysage (€)</Label>
                      <Input
                        id="amenagementExtPaysage"
                        type="number"
                        value={data.depenses.travaux.amenagementExtPaysage || ''}
                        onChange={(e) => updateTravaux('amenagementExtPaysage', parseFloat(e.target.value) || 0)}
                      />
                    </>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ouvragesExceptionnels">Ouvrages exceptionnels (€)</Label>
                  <Input
                    id="ouvragesExceptionnels"
                    type="number"
                    value={data.depenses.travaux.ouvragesExceptionnels || ''}
                    onChange={(e) => updateTravaux('ouvragesExceptionnels', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Construction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Études</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(data.depenses.etudes.totalEtudes)}</span>
              </CardTitle>
              <CardDescription>Maîtrise d&apos;oeuvre et études préalables</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="moe">MOE (€)</Label>
                  <Input
                    id="moe"
                    type="number"
                    value={data.depenses.etudes.moe || ''}
                    onChange={(e) => updateEtudes('moe', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="autresEtudes">Autres études (préalables...) (€)</Label>
                  <Input
                    id="autresEtudes"
                    type="number"
                    value={data.depenses.etudes.autresEtudes || ''}
                    onChange={(e) => updateEtudes('autresEtudes', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Frais annexes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Frais financiers</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(data.depenses.fraisFinanciers.totalFraisFinanciers)}</span>
              </CardTitle>
              <CardDescription>Coût estimatif du financement et frais associés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tauxEmprunt">Taux d&apos;emprunt (%)</Label>
                  <Input
                    id="tauxEmprunt"
                    type="number"
                    value={data.depenses.fraisFinanciers.tauxEmprunt || ''}
                    onChange={(e) => updateFraisFinanciers('tauxEmprunt', parseFloat(e.target.value) || 0)}
                    placeholder="Ex: 4.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="autresFraisFinanciers">Autres frais (€)</Label>
                  <Input
                    id="autresFraisFinanciers"
                    type="number"
                    value={data.depenses.fraisFinanciers.autresFrais || ''}
                    onChange={(e) => updateFraisFinanciers('autresFrais', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Autres</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(data.depenses.autres.totalAutres)}</span>
              </CardTitle>
              <CardDescription>Frais complémentaires et provisions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fraisDivers">Frais divers (€)</Label>
                  <Input
                    id="fraisDivers"
                    type="number"
                    value={data.depenses.autres.fraisDivers || ''}
                    onChange={(e) => updateAutres('fraisDivers', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imprevus">Imprévus (€)</Label>
                  <Input
                    id="imprevus"
                    type="number"
                    value={data.depenses.autres.imprevus || ''}
                    onChange={(e) => updateAutres('imprevus', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-emerald-700">Recettes</div>
                <div className="mt-1 text-sm text-emerald-700/80">Lecture directe du produit prévisionnel</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-emerald-700/80">Total recettes</div>
                <div className="text-2xl font-bold text-emerald-700">{formatCurrency(data.recettes.caTotal)}</div>
              </div>
            </div>
          </div>

          {/* Recettes */}
          <Card className="border-emerald-200/80">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recettes prévisionnelles</span>
                <span className="text-lg font-bold text-emerald-600">{formatCurrency(data.recettes.caTotal)}</span>
              </CardTitle>
              <CardDescription>
                {data.typeOperation === 'dap'
                  ? 'Cessions, participations et autres produits'
                  : 'Logement, participations et autres produits'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.typeOperation === 'dap' ? (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                    <div className="space-y-2">
                      <Label htmlFor="cessionsChargesFoncieres">Cessions (charges foncières) (€)</Label>
                      <Input
                        id="cessionsChargesFoncieres"
                        type="number"
                        value={data.recettes.cessionsChargesFoncieres || ''}
                        onChange={(e) => updateRecettes('cessionsChargesFoncieres', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="capaciteNombreLogements">Capacité en nombre de logements</Label>
                      <Input
                        id="capaciteNombreLogements"
                        type="number"
                        value={data.recettes.capaciteNombreLogements || ''}
                        onChange={(e) => updateRecettes('capaciteNombreLogements', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="autresCessions">Autres cessions (€)</Label>
                      <Input
                        id="autresCessions"
                        type="number"
                        value={data.recettes.autresCessions || ''}
                        onChange={(e) => updateRecettes('autresCessions', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="participations">Participations (€)</Label>
                      <Input
                        id="participations"
                        type="number"
                        value={data.recettes.participations || ''}
                        onChange={(e) => updateRecettes('participations', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="autresSubventions">Autres (subventions) (€)</Label>
                      <Input
                        id="autresSubventions"
                        type="number"
                        value={data.recettes.autresSubventions || ''}
                        onChange={(e) => updateRecettes('autresSubventions', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/40 p-4">
                      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Logement</div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="capaciteNombreLogements">Capacité en nombre de logements</Label>
                          <Input
                            id="capaciteNombreLogements"
                            type="number"
                            value={data.recettes.capaciteNombreLogements || ''}
                            onChange={(e) => updateRecettes('capaciteNombreLogements', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="autresCessions">Autres cessions (€)</Label>
                          <Input
                            id="autresCessions"
                            type="number"
                            value={data.recettes.autresCessions || ''}
                            onChange={(e) => updateRecettes('autresCessions', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                      <div className="space-y-2">
                        <Label htmlFor="participations">Participations (€)</Label>
                        <Input
                          id="participations"
                          type="number"
                          value={data.recettes.participations || ''}
                          onChange={(e) => updateRecettes('participations', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="autresSubventions">Autres (subventions) (€)</Label>
                        <Input
                          id="autresSubventions"
                          type="number"
                          value={data.recettes.autresSubventions || ''}
                          onChange={(e) => updateRecettes('autresSubventions', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label>Total recettes</Label>
                  <div className="h-9 flex items-center px-3 bg-emerald-50 rounded-md text-sm font-medium text-emerald-700">
                    {formatCurrency(data.recettes.caTotal)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200/80 bg-emerald-50/40">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Solde prévisionnel</span>
                <span className={`text-lg font-bold ${data.indicateurs.margePromotion >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {formatCurrency(data.indicateurs.margePromotion)}
                </span>
              </CardTitle>
              <CardDescription>Écart entre les recettes et les dépenses consolidées</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-lg border border-border/60 bg-background/70 p-3">
                  <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Dépenses</div>
                  <div className="mt-1 text-lg font-semibold text-foreground">{formatCurrency(data.budgetTotal)}</div>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-background/70 p-3">
                  <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Recettes</div>
                  <div className="mt-1 text-lg font-semibold text-emerald-700">{formatCurrency(data.recettes.caTotal)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
              label="Coût moyen/logement"
              value={`${formatCurrency(data.indicateurs.prixRevientM2)}/logement`}
            />
            <IndicatorCard
              label="Ratio foncier"
              value={`${data.indicateurs.ratioFoncier.toFixed(1)}%`}
              threshold={data.typeOperation === 'dap' ? defaultWeights.phase3.ratioFoncierMax : undefined}
              currentPercent={data.typeOperation === 'dap' ? data.indicateurs.ratioFoncier : undefined}
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
