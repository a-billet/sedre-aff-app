'use client';

import { useEffect } from 'react';
import { Phase2Data } from '@/lib/types';
import { getScoreColor, getScoreLabel } from '@/lib/config';
import {
  calculateAssainissementScore,
  calculateMarcheScore,
  calculatePhase2GlobalScore,
  calculatePotentielScore,
  calculateReseauxScore,
} from '@/lib/calculations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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
}

export function Phase2Form({ data, onUpdate }: Phase2FormProps) {
  useEffect(() => {
    const assainissementScore = calculateAssainissementScore({
      assainissementEU: data.assainissementEU,
      assainissementEP: data.assainissementEP,
    });
    const reseauxScore = calculateReseauxScore({
      electricite: data.electricite,
      telecom: data.telecom,
      eauPotable: data.eauPotable,
    });
    const marcheScore = calculateMarcheScore(data.marche);
    const potentielScore = calculatePotentielScore(data.potentiel);

    const updatedData = {
      ...data,
      assainissementScore,
      reseauxScore,
      marcheScore,
      potentielScore,
    };

    const globalScore = calculatePhase2GlobalScore(updatedData);

    if (
      data.assainissementScore !== assainissementScore ||
      data.reseauxScore !== reseauxScore ||
      data.marcheScore !== marcheScore ||
      data.potentielScore !== potentielScore ||
      data.globalScore !== globalScore
    ) {
      onUpdate({
        ...updatedData,
        globalScore,
      });
    }
  }, [data, onUpdate]);

  const updateAssainissementEU = (
    value: Phase2Data['assainissementEU']['raccordement'] | null,
  ) => {
    onUpdate({
      ...data,
      assainissementEU: {
        ...data.assainissementEU,
        raccordement: value ?? '',
      },
    });
  };

  const updateAssainissementEP = (
    value: Phase2Data['assainissementEP']['raccordement'] | null,
  ) => {
    onUpdate({
      ...data,
      assainissementEP: {
        ...data.assainissementEP,
        raccordement: value ?? '',
      },
    });
  };

  const updateReseau = (
    key: 'electricite' | 'telecom',
    value: Phase2Data['electricite']['desserte'] | null,
  ) => {
    onUpdate({
      ...data,
      [key]: {
        ...data[key],
        desserte: value ?? '',
      },
    });
  };

  const updateEauPotable = (
    value: Phase2Data['eauPotable']['desserte'] | null,
  ) => {
    onUpdate({
      ...data,
      eauPotable: {
        ...data.eauPotable,
        desserte: value ?? '',
      },
    });
  };

  const updateMarche = (
    key: keyof Phase2Data['marche'],
    value: Phase2Data['marche'][keyof Phase2Data['marche']] | null,
  ) => {
    onUpdate({
      ...data,
      marche: { ...data.marche, [key]: value ?? '' },
    });
  };

  const updatePotentiel = (
    key: keyof Phase2Data['potentiel'],
    value: boolean | Phase2Data['potentiel'][keyof Phase2Data['potentiel']] | null,
  ) => {
    onUpdate({
      ...data,
      potentiel: { ...data.potentiel, [key]: value ?? '' },
    });
  };

  return (
    <div className="space-y-6">
      <ScoreDisplay
        title="Score Phase 2 - Analyse détaillée"
        score={data.globalScore}
        details={[
          { label: 'Assainissement', score: data.assainissementScore, weight: 30 },
          { label: 'Réseaux', score: data.reseauxScore, weight: 25 },
          { label: 'Marché', score: data.marcheScore, weight: 25 },
          { label: 'Potentiel', score: data.potentielScore, weight: 20 },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Viabilisation et réseaux</CardTitle>
          <CardDescription>Lecture consolidée des conditions de raccordement et de desserte du site</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-foreground">Assainissement</div>
                <div className="text-sm text-muted-foreground">Possibilités de raccordement EU et EP</div>
              </div>
              <div className="text-sm font-normal" style={{ color: getScoreColor(data.assainissementScore) }}>
                {data.assainissementScore}/100 - {getScoreLabel(data.assainissementScore)}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                id="assainissementEU"
                label="Assainissement EU"
                value={data.assainissementEU.raccordement}
                onValueChange={(value) => updateAssainissementEU(value as Phase2Data['assainissementEU']['raccordement'])}
                options={[
                  { value: 'reseau_suffisant', label: 'Collecteur + réseau suffisant' },
                  { value: 'reseau_proximite', label: 'Collecteur + réseau à proximité' },
                  { value: 'station_relevage', label: 'Nécessité de station de relevage' },
                ]}
              />
              <SelectField
                id="assainissementEP"
                label="Assainissement EP"
                value={data.assainissementEP.raccordement}
                onValueChange={(value) => updateAssainissementEP(value as Phase2Data['assainissementEP']['raccordement'])}
                options={[
                  { value: 'infiltration', label: 'Sols garantissant l\'infiltration / GIEP' },
                  { value: 'reseau_suffisant', label: 'Collecteur + réseau suffisant' },
                  { value: 'reseau_proximite', label: 'Collecteur + réseau à proximité' },
                ]}
              />
            </div>
          </section>

          <div className="h-px bg-border/70" />

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-foreground">Réseaux</div>
                <div className="text-sm text-muted-foreground">Électricité, telecom et eau potable</div>
              </div>
              <div className="text-sm font-normal" style={{ color: getScoreColor(data.reseauxScore) }}>
                {data.reseauxScore}/100 - {getScoreLabel(data.reseauxScore)}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
              <SelectField
                id="electricite"
                label="Electricité"
                value={data.electricite.desserte}
                onValueChange={(value) => updateReseau('electricite', value as Phase2Data['electricite']['desserte'])}
                options={[
                  { value: 'reseau_suffisant', label: 'Poste Transfo + réseau suffisant' },
                  { value: 'reseau_proximite', label: 'Poste Transfo + réseau à proximité' },
                  { value: 'lignes_aeriennes', label: 'Lignes aériennes' },
                ]}
              />
              <SelectField
                id="telecom"
                label="Telecom"
                value={data.telecom.desserte}
                onValueChange={(value) => updateReseau('telecom', value as Phase2Data['telecom']['desserte'])}
                options={[
                  { value: 'reseau_suffisant', label: 'Réseau suffisant' },
                  { value: 'reseau_proximite', label: 'Réseau à proximité' },
                  { value: 'lignes_aeriennes', label: 'Lignes aériennes' },
                ]}
              />
              <SelectField
                id="eauPotable"
                label="Eau potable"
                value={data.eauPotable.desserte}
                onValueChange={(value) => updateEauPotable(value as Phase2Data['eauPotable']['desserte'])}
                options={[
                  { value: 'reseau_suffisant', label: 'Réseau suffisant' },
                  { value: 'reseau_proximite', label: 'Réseau à proximité' },
                ]}
              />
            </div>
          </section>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Attentes et état du marché</span>
            <span className="text-sm font-normal" style={{ color: getScoreColor(data.marcheScore) }}>
              {data.marcheScore}/100 - {getScoreLabel(data.marcheScore)}
            </span>
          </CardTitle>
          <CardDescription>Appréciation qualitative de la profondeur et de la solidité du marché</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            <SelectField
              id="demandeTension"
              label="Demande, tension"
              value={data.marche.demandeTension}
              onValueChange={(value) => updateMarche('demandeTension', value as Phase2Data['marche']['demandeTension'])}
              options={[
                { value: 'forte', label: 'Forte' },
                { value: 'moyenne', label: 'Moyenne' },
                { value: 'faible', label: 'Faible' },
              ]}
            />
            <SelectField
              id="dynamiqueDemographique"
              label="Dynamique démographique"
              value={data.marche.dynamiqueDemographique}
              onValueChange={(value) => updateMarche('dynamiqueDemographique', value as Phase2Data['marche']['dynamiqueDemographique'])}
              options={[
                { value: 'croissance', label: 'Croissance' },
                { value: 'stable', label: 'Stable' },
                { value: 'baisse', label: 'Baisse' },
              ]}
            />
            <SelectField
              id="concurrence"
              label="Concurrence"
              value={data.marche.concurrence}
              onValueChange={(value) => updateMarche('concurrence', value as Phase2Data['marche']['concurrence'])}
              options={[
                { value: 'faible', label: 'Faible' },
                { value: 'moderee', label: 'Modérée' },
                { value: 'forte', label: 'Forte' },
              ]}
            />
            <SelectField
              id="creationEmplois"
              label="Création d'emplois"
              value={data.marche.creationEmplois}
              onValueChange={(value) => updateMarche('creationEmplois', value as Phase2Data['marche']['creationEmplois'])}
              options={[
                { value: 'forte', label: 'Forte' },
                { value: 'moderee', label: 'Modérée' },
                { value: 'faible', label: 'Faible' },
              ]}
            />
            <SelectField
              id="revenusMenages"
              label="Revenus des ménages"
              value={data.marche.revenusMenages}
              onValueChange={(value) => updateMarche('revenusMenages', value as Phase2Data['marche']['revenusMenages'])}
              options={[
                { value: 'eleves', label: 'Élevés' },
                { value: 'intermediaires', label: 'Intermédiaires' },
                { value: 'faibles', label: 'Faibles' },
              ]}
            />
            <SelectField
              id="absenceDemandeOffresVacantes"
              label="Absence de demande, offres vacantes"
              value={data.marche.absenceDemandeOffresVacantes}
              onValueChange={(value) => updateMarche('absenceDemandeOffresVacantes', value as Phase2Data['marche']['absenceDemandeOffresVacantes'])}
              options={[
                { value: 'faible', label: 'Faible' },
                { value: 'moyenne', label: 'Moyenne' },
                { value: 'forte', label: 'Forte' },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Potentiel</span>
            <span className="text-sm font-normal" style={{ color: getScoreColor(data.potentielScore) }}>
              {data.potentielScore}/100 - {getScoreLabel(data.potentielScore)}
            </span>
          </CardTitle>
          <CardDescription>Lecture politique et opérationnelle du projet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            <CheckboxField
              id="operationDemonstratrice"
              label="Opération démonstratrice"
              checked={data.potentiel.operationDemonstratrice}
              onChange={(checked) => updatePotentiel('operationDemonstratrice', checked)}
              impact="Exemplarité"
            />
            <CheckboxField
              id="accordCommune"
              label="Accord de la commune"
              checked={data.potentiel.accordCommune}
              onChange={(checked) => updatePotentiel('accordCommune', checked)}
              impact="Acceptabilité"
            />
            <SelectField
              id="risqueContestationLocale"
              label="Risque de contestation locale"
              value={data.potentiel.risqueContestationLocale}
              onValueChange={(value) => updatePotentiel('risqueContestationLocale', value as Phase2Data['potentiel']['risqueContestationLocale'])}
              options={[
                { value: 'faible', label: 'Faible' },
                { value: 'moyen', label: 'Moyen' },
                { value: 'fort', label: 'Fort' },
              ]}
            />
          </div>
        </CardContent>
      </Card>

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

function SelectField({
  id,
  label,
  value,
  onValueChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string | null) => void;
  options: Array<{ value: string; label: string }>;
}) {
  const selectedOptionLabel = options.find((option) => option.value === value)?.label;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id} className="w-full sm:w-md max-w-full">
          <SelectValue placeholder="Sélectionner">
            {selectedOptionLabel}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

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
      className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
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
