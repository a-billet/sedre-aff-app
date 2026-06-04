'use client';

import { useEffect } from 'react';
import { Phase2Data } from '@/lib/types';
import { getScoreColor, getScoreLabel } from '@/lib/config';
import {
  calculateUrbanismeScore,
  calculatePotentielScore,
  calculateMarcheScore,
  calculateConcurrenceScore,
  calculatePhase2GlobalScore,
} from '@/lib/calculations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScoreDisplay } from '@/components/score-display';

interface Phase2FormProps {
  data: Phase2Data;
  onUpdate: (data: Phase2Data) => void;
  landArea: number;
}

export function Phase2Form({ data, onUpdate, landArea }: Phase2FormProps) {
  // Recalculate scores when data changes
  useEffect(() => {
    const urbanismeScore = calculateUrbanismeScore(data.urbanisme);
    const potentielScore = calculatePotentielScore(data.potentiel, landArea);
    const marcheScore = calculateMarcheScore(data.marche);
    const concurrenceScore = calculateConcurrenceScore(data.concurrence);

    const updatedData = {
      ...data,
      urbanismeScore,
      potentielScore,
      marcheScore,
      concurrenceScore,
    };

    const globalScore = calculatePhase2GlobalScore(updatedData);

    if (
      data.urbanismeScore !== urbanismeScore ||
      data.potentielScore !== potentielScore ||
      data.marcheScore !== marcheScore ||
      data.concurrenceScore !== concurrenceScore ||
      data.globalScore !== globalScore
    ) {
      onUpdate({
        ...updatedData,
        globalScore,
      });
    }
  }, [data, onUpdate, landArea]);

  const updateUrbanisme = (key: string, value: number) => {
    if (key.includes('.')) {
      const [parent, child] = key.split('.');
      if (parent === 'reculs') {
        onUpdate({
          ...data,
          urbanisme: {
            ...data.urbanisme,
            reculs: { ...data.urbanisme.reculs, [child]: value },
          },
        });
      }
    } else {
      onUpdate({
        ...data,
        urbanisme: { ...data.urbanisme, [key]: value },
      });
    }
  };

  const updatePotentiel = (key: keyof Phase2Data['potentiel'], value: string | number) => {
    onUpdate({
      ...data,
      potentiel: { ...data.potentiel, [key]: value },
    });
  };

  const updateMarche = (key: keyof Phase2Data['marche'], value: string | number) => {
    onUpdate({
      ...data,
      marche: { ...data.marche, [key]: value },
    });
  };

  const updateConcurrence = (key: keyof Phase2Data['concurrence'], value: string | number) => {
    onUpdate({
      ...data,
      concurrence: { ...data.concurrence, [key]: value },
    });
  };

  return (
    <div className="space-y-6">
      {/* Global Score Card */}
      <ScoreDisplay
        title="Score Phase 2 - Analyse détaillée"
        score={data.globalScore}
        details={[
          { label: 'Règles urbanisme', score: data.urbanismeScore, weight: 30 },
          { label: 'Potentiel constructible', score: data.potentielScore, weight: 30 },
          { label: 'Analyse marché', score: data.marcheScore, weight: 25 },
          { label: 'Concurrence', score: data.concurrenceScore, weight: 15 },
        ]}
      />

      {/* Règles d'urbanisme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Règles d&apos;urbanisme</span>
            <span className="text-sm font-normal" style={{ color: getScoreColor(data.urbanismeScore) }}>
              {data.urbanismeScore}/100 - {getScoreLabel(data.urbanismeScore)}
            </span>
          </CardTitle>
          <CardDescription>Paramètres réglementaires du PLU</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="empriseSol">Emprise au sol max (%)</Label>
              <Input
                id="empriseSol"
                type="number"
                value={data.urbanisme.empriseSol || ''}
                onChange={(e) => updateUrbanisme('empriseSol', parseFloat(e.target.value) || 0)}
                placeholder="Ex: 60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hauteurMax">Hauteur maximale (m)</Label>
              <Input
                id="hauteurMax"
                type="number"
                value={data.urbanisme.hauteurMax || ''}
                onChange={(e) => updateUrbanisme('hauteurMax', parseFloat(e.target.value) || 0)}
                placeholder="Ex: 12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="espacesVerts">Espaces verts min (%)</Label>
              <Input
                id="espacesVerts"
                type="number"
                value={data.urbanisme.espacesVerts || ''}
                onChange={(e) => updateUrbanisme('espacesVerts', parseFloat(e.target.value) || 0)}
                placeholder="Ex: 20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reculFacade">Recul façade (m)</Label>
              <Input
                id="reculFacade"
                type="number"
                value={data.urbanisme.reculs.facade || ''}
                onChange={(e) => updateUrbanisme('reculs.facade', parseFloat(e.target.value) || 0)}
                placeholder="Ex: 5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reculLateral">Recul latéral (m)</Label>
              <Input
                id="reculLateral"
                type="number"
                value={data.urbanisme.reculs.lateral || ''}
                onChange={(e) => updateUrbanisme('reculs.lateral', parseFloat(e.target.value) || 0)}
                placeholder="Ex: 3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reculFond">Recul fond (m)</Label>
              <Input
                id="reculFond"
                type="number"
                value={data.urbanisme.reculs.fond || ''}
                onChange={(e) => updateUrbanisme('reculs.fond', parseFloat(e.target.value) || 0)}
                placeholder="Ex: 6"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Potentiel constructible */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Potentiel constructible</span>
            <span className="text-sm font-normal" style={{ color: getScoreColor(data.potentielScore) }}>
              {data.potentielScore}/100 - {getScoreLabel(data.potentielScore)}
            </span>
          </CardTitle>
          <CardDescription>Estimation du programme réalisable</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="surfacePlancher">Surface plancher (m²)</Label>
              <Input
                id="surfacePlancher"
                type="number"
                value={data.potentiel.surfacePlancher || ''}
                onChange={(e) => updatePotentiel('surfacePlancher', parseFloat(e.target.value) || 0)}
                placeholder="Ex: 3000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombreLogements">Nombre de logements</Label>
              <Input
                id="nombreLogements"
                type="number"
                value={data.potentiel.nombreLogements || ''}
                onChange={(e) => updatePotentiel('nombreLogements', parseInt(e.target.value) || 0)}
                placeholder="Ex: 30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="typeProgramme">Type de programme</Label>
              <Select
                value={data.potentiel.typeProgramme}
                onValueChange={(value) => updatePotentiel('typeProgramme', value)}
              >
                <SelectTrigger id="typeProgramme">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="collectif">Collectif</SelectItem>
                  <SelectItem value="individuel">Individuel groupé</SelectItem>
                  <SelectItem value="mixte">Mixte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="parkings">Nombre de parkings</Label>
              <Input
                id="parkings"
                type="number"
                value={data.potentiel.parkings || ''}
                onChange={(e) => updatePotentiel('parkings', parseInt(e.target.value) || 0)}
                placeholder="Ex: 45"
              />
            </div>
          </div>
          {landArea > 0 && data.potentiel.surfacePlancher > 0 && (
            <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
              <strong>Densité:</strong> {(data.potentiel.surfacePlancher / landArea).toFixed(2)} (SDP/terrain)
              {data.potentiel.nombreLogements > 0 && (
                <span className="ml-4">
                  <strong>Surface moy./logement:</strong> {Math.round(data.potentiel.surfacePlancher / data.potentiel.nombreLogements)} m²
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analyse de marché */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Analyse de marché</span>
            <span className="text-sm font-normal" style={{ color: getScoreColor(data.marcheScore) }}>
              {data.marcheScore}/100 - {getScoreLabel(data.marcheScore)}
            </span>
          </CardTitle>
          <CardDescription>État du marché immobilier local</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="prixM2Neuf">Prix m² neuf (€)</Label>
              <Input
                id="prixM2Neuf"
                type="number"
                value={data.marche.prixM2Neuf || ''}
                onChange={(e) => updateMarche('prixM2Neuf', parseFloat(e.target.value) || 0)}
                placeholder="Ex: 4500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prixM2Ancien">Prix m² ancien (€)</Label>
              <Input
                id="prixM2Ancien"
                type="number"
                value={data.marche.prixM2Ancien || ''}
                onChange={(e) => updateMarche('prixM2Ancien', parseFloat(e.target.value) || 0)}
                placeholder="Ex: 3500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delaiVente">Délai de vente moyen (mois)</Label>
              <Input
                id="delaiVente"
                type="number"
                value={data.marche.delaiVente || ''}
                onChange={(e) => updateMarche('delaiVente', parseInt(e.target.value) || 0)}
                placeholder="Ex: 8"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demandeLoc">Demande locative</Label>
              <Select
                value={data.marche.demandeLoc}
                onValueChange={(value) => updateMarche('demandeLoc', value)}
              >
                <SelectTrigger id="demandeLoc">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="forte">Forte</SelectItem>
                  <SelectItem value="moyenne">Moyenne</SelectItem>
                  <SelectItem value="faible">Faible</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tendance">Tendance du marché</Label>
              <Select
                value={data.marche.tendance}
                onValueChange={(value) => updateMarche('tendance', value)}
              >
                <SelectTrigger id="tendance">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hausse">En hausse</SelectItem>
                  <SelectItem value="stable">Stable</SelectItem>
                  <SelectItem value="baisse">En baisse</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {data.marche.prixM2Neuf > 0 && data.marche.prixM2Ancien > 0 && (
            <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
              <strong>Écart neuf/ancien:</strong> {Math.round(((data.marche.prixM2Neuf - data.marche.prixM2Ancien) / data.marche.prixM2Ancien) * 100)}%
            </div>
          )}
        </CardContent>
      </Card>

      {/* Concurrence */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Concurrence</span>
            <span className="text-sm font-normal" style={{ color: getScoreColor(data.concurrenceScore) }}>
              {data.concurrenceScore}/100 - {getScoreLabel(data.concurrenceScore)}
            </span>
          </CardTitle>
          <CardDescription>Programmes concurrents à proximité</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="programmesProches">Programmes proches</Label>
              <Input
                id="programmesProches"
                type="number"
                value={data.concurrence.programmesProches || ''}
                onChange={(e) => updateConcurrence('programmesProches', parseInt(e.target.value) || 0)}
                placeholder="Ex: 3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockDisponible">Stock disponible</Label>
              <Select
                value={data.concurrence.stockDisponible}
                onValueChange={(value) => updateConcurrence('stockDisponible', value)}
              >
                <SelectTrigger id="stockDisponible">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="faible">Faible</SelectItem>
                  <SelectItem value="moyen">Moyen</SelectItem>
                  <SelectItem value="eleve">Élevé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-3">
              <Label htmlFor="positionnement">Positionnement / différenciation</Label>
              <Input
                id="positionnement"
                value={data.concurrence.positionnement}
                onChange={(e) => updateConcurrence('positionnement', e.target.value)}
                placeholder="Ex: Prestations haut de gamme, terrasses..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle>Commentaires Phase 2</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={data.comments}
            onChange={(e) => onUpdate({ ...data, comments: e.target.value })}
            placeholder="Notes et observations sur l'analyse détaillée..."
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  );
}
