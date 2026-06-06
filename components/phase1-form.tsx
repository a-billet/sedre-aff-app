'use client';

import { useEffect } from 'react';
import { Phase1Data, ProjectInfo } from '@/lib/types';
import { pluZoneLabels, pluZoneScores, getScoreColor, getScoreLabel } from '@/lib/config';
import {
  calculateServitudesScore,
  calculateAccessibiliteScore,
  calculateEnvironnementScore,
  calculatePhase1GlobalScore,
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

interface Phase1FormProps {
  data: Phase1Data;
  onUpdate: (data: Phase1Data) => void;
  projectInfo: ProjectInfo;
  onUpdateProjectInfo: (projectInfo: ProjectInfo) => void;
}

export function Phase1Form({ data, onUpdate, projectInfo, onUpdateProjectInfo }: Phase1FormProps) {
  // Recalculate scores when data changes
  useEffect(() => {
    const pluZoneScore = data.pluZone ? pluZoneScores[data.pluZone] || 0 : 0;
    const servitudesScore = calculateServitudesScore(data.servitudes);
    const accessibiliteScore = calculateAccessibiliteScore(data.accessibilite);
    const environnementScore = calculateEnvironnementScore(data.environnement);

    const updatedData = {
      ...data,
      pluZoneScore,
      servitudesScore,
      accessibiliteScore,
      environnementScore,
    };

    const globalScore = calculatePhase1GlobalScore(updatedData);

    if (
      data.pluZoneScore !== pluZoneScore ||
      data.servitudesScore !== servitudesScore ||
      data.accessibiliteScore !== accessibiliteScore ||
      data.environnementScore !== environnementScore ||
      data.globalScore !== globalScore
    ) {
      onUpdate({
        ...updatedData,
        globalScore,
      });
    }
  }, [data, onUpdate]);

  const updateServitude = (key: keyof Phase1Data['servitudes'], value: boolean | string) => {
    onUpdate({
      ...data,
      servitudes: { ...data.servitudes, [key]: value },
    });
  };

  const updateAccessibilite = (key: keyof Phase1Data['accessibilite'], value: string | null) => {
    onUpdate({
      ...data,
      accessibilite: { ...data.accessibilite, [key]: value ?? '' },
    });
  };

  const updateEnvironnement = (key: keyof Phase1Data['environnement'], value: boolean | string) => {
    onUpdate({
      ...data,
      environnement: { ...data.environnement, [key]: value },
    });
  };

  const updateProperty = (key: 'landArea' | 'acquisitionPrice', value: number) => {
    onUpdateProjectInfo({
      ...projectInfo,
      [key]: value,
    });
  };

  return (
    <div className="space-y-6">
      {/* Global Score Card */}
      <ScoreDisplay
        title="Score Phase 1 - Analyse initiale"
        score={data.globalScore}
        details={[
          { label: 'Zonage PLU', score: data.pluZoneScore, weight: 35 },
          { label: 'Servitudes', score: data.servitudesScore, weight: 25 },
          { label: 'Accessibilité', score: data.accessibiliteScore, weight: 20 },
          { label: 'Environnement', score: data.environnementScore, weight: 20 },
        ]}
      />

      {/* Propriete */}
      <Card>
        <CardHeader>
          <CardTitle>Propriété</CardTitle>
          <CardDescription>Données foncières utilisées dans les calculs des phases suivantes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="landArea">Surface terrain (m²)</Label>
              <Input
                id="landArea"
                type="number"
                value={projectInfo.landArea || ''}
                onChange={(e) => updateProperty('landArea', parseFloat(e.target.value) || 0)}
                placeholder="Ex: 2500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="acquisitionPrice">Prix acquisition (€)</Label>
              <Input
                id="acquisitionPrice"
                type="number"
                value={projectInfo.acquisitionPrice || ''}
                onChange={(e) => updateProperty('acquisitionPrice', parseFloat(e.target.value) || 0)}
                placeholder="Ex: 500000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PLU Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>PLU et réglementation</span>
            <span className="text-sm font-normal" style={{ color: getScoreColor(data.pluZoneScore) }}>
              {data.pluZoneScore}/100 - {getScoreLabel(data.pluZoneScore)}
            </span>
          </CardTitle>
          <CardDescription>Classification de la zone dans le Plan Local d&apos;Urbanisme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="pluZone">Zone PLU</Label>
            <Select
              value={data.pluZone}
              onValueChange={(value) => onUpdate({ ...data, pluZone: value as Phase1Data['pluZone'] })}
            >
              <SelectTrigger id="pluZone" className="w-full sm:w-md">
                <SelectValue placeholder="Sélectionner une zone" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(pluZoneLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Servitudes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Servitudes et contraintes</span>
            <span className="text-sm font-normal" style={{ color: getScoreColor(data.servitudesScore) }}>
              {data.servitudesScore}/100 - {getScoreLabel(data.servitudesScore)}
            </span>
          </CardTitle>
          <CardDescription>Contraintes réglementaires affectant le terrain</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <CheckboxField
              id="patrimoine"
              label="Protection du patrimoine (ABF)"
              checked={data.servitudes.patrimoine}
              onChange={(checked) => updateServitude('patrimoine', checked)}
              impact="-20 points"
            />
            <CheckboxField
              id="inondation"
              label="Zone inondable (PPRI)"
              checked={data.servitudes.inondation}
              onChange={(checked) => updateServitude('inondation', checked)}
              impact="-30 points"
            />
            <CheckboxField
              id="bruit"
              label="Nuisances sonores (PEB, route)"
              checked={data.servitudes.bruit}
              onChange={(checked) => updateServitude('bruit', checked)}
              impact="-15 points"
            />
            <CheckboxField
              id="pollution"
              label="Pollution des sols"
              checked={data.servitudes.pollution}
              onChange={(checked) => updateServitude('pollution', checked)}
              impact="-25 points"
            />
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="servitudesAutres">Autres servitudes</Label>
              <Input
                id="servitudesAutres"
                value={data.servitudes.autres}
                onChange={(e) => updateServitude('autres', e.target.value)}
                placeholder="Préciser si nécessaire..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accessibilité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Accessibilité</span>
            <span className="text-sm font-normal" style={{ color: getScoreColor(data.accessibiliteScore) }}>
              {data.accessibiliteScore}/100 - {getScoreLabel(data.accessibiliteScore)}
            </span>
          </CardTitle>
          <CardDescription>Desserte et accessibilité du terrain</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="transport">Transports en commun</Label>
              <Select
                value={data.accessibilite.transportEnCommun}
                onValueChange={(value) => updateAccessibilite('transportEnCommun', value)}
              >
                <SelectTrigger id="transport" className="w-full sm:w-md max-w-full">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent (métro, tram)</SelectItem>
                  <SelectItem value="bon">Bon (bus fréquent)</SelectItem>
                  <SelectItem value="moyen">Moyen (bus)</SelectItem>
                  <SelectItem value="faible">Faible (peu desservi)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="axes">Axes routiers</Label>
              <Select
                value={data.accessibilite.axesRoutiers}
                onValueChange={(value) => updateAccessibilite('axesRoutiers', value)}
              >
                <SelectTrigger id="axes" className="w-full sm:w-md max-w-full">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent (autoroute proche)</SelectItem>
                  <SelectItem value="bon">Bon (nationale/départementale)</SelectItem>
                  <SelectItem value="moyen">Moyen (voirie communale)</SelectItem>
                  <SelectItem value="faible">Faible (accès difficile)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stationnement">Stationnement</Label>
              <Select
                value={data.accessibilite.stationnement}
                onValueChange={(value) => updateAccessibilite('stationnement', value)}
              >
                <SelectTrigger id="stationnement" className="w-full sm:w-md max-w-full">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facile">Facile</SelectItem>
                  <SelectItem value="moyen">Moyen</SelectItem>
                  <SelectItem value="difficile">Difficile</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Environnement immédiat */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Environnement immédiat</span>
            <span className="text-sm font-normal" style={{ color: getScoreColor(data.environnementScore) }}>
              {data.environnementScore}/100 - {getScoreLabel(data.environnementScore)}
            </span>
          </CardTitle>
          <CardDescription>Services et équipements à proximité</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <CheckboxField
              id="commerces"
              label="Commerces de proximité"
              checked={data.environnement.commerces}
              onChange={(checked) => updateEnvironnement('commerces', checked)}
              impact="+25 points"
            />
            <CheckboxField
              id="ecoles"
              label="Écoles / établissements scolaires"
              checked={data.environnement.ecoles}
              onChange={(checked) => updateEnvironnement('ecoles', checked)}
              impact="+25 points"
            />
            <CheckboxField
              id="sante"
              label="Services de santé"
              checked={data.environnement.sante}
              onChange={(checked) => updateEnvironnement('sante', checked)}
              impact="+25 points"
            />
            <CheckboxField
              id="espaceVerts"
              label="Espaces verts / parcs"
              checked={data.environnement.espaceVerts}
              onChange={(checked) => updateEnvironnement('espaceVerts', checked)}
              impact="+25 points"
            />
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="nuisances">Nuisances identifiées</Label>
              <Input
                id="nuisances"
                value={data.environnement.nuisances}
                onChange={(e) => updateEnvironnement('nuisances', e.target.value)}
                placeholder="Ex: voie ferrée, usine, etc."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle>Commentaires Phase 1</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={data.comments}
            onChange={(e) => onUpdate({ ...data, comments: e.target.value })}
            placeholder="Notes et observations sur l'analyse initiale..."
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// Checkbox field component
function CheckboxField({
  id,
  label,
  checked,
  onChange,
  impact,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  impact: string;
}) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
      />
      <div className="flex-1">
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-xs text-muted-foreground">{impact}</span>
    </label>
  );
}
