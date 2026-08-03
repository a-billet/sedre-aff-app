'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { generateAutoSWOT, generateRecommendation } from '@/lib/calculations';
import { defaultWeights, getScoreColor, getScoreLabel } from '@/lib/config';
import { FeasibilityStudy, Phase4Data, calculateGrade, getGradeColor } from '@/lib/types';
import {
  AlertTriangle,
  FileDown,
  Shield,
  Target,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { useEffect } from 'react';

interface Phase4SynthesisProps {
  study: FeasibilityStudy;
  onUpdate: (data: Phase4Data) => void;
}

export function Phase4Synthesis({ study, onUpdate }: Phase4SynthesisProps) {
  const { phase4 } = study;

  // Génère le SWOT et la recommandation — les scores viennent de study.phase4.scoresPonderes
  // calculés par le moteur DB dans page.tsx.
  useEffect(() => {
    const swot = generateAutoSWOT(study);
    const { recommandation, justification } = generateRecommendation(study);

    const needsUpdate =
      phase4.recommandation !== recommandation ||
      (phase4.swot.forces.length === 0 && swot.forces.length > 0);

    if (needsUpdate) {
      onUpdate({
        ...phase4,
        swot: phase4.swot.forces.length === 0 ? swot : phase4.swot,
        recommandation,
        justification: phase4.justification || justification,
        syntheseFinanciere: {
          investissementTotal: study.phase3.budgetTotal,
          recettesEstimees: study.phase3.recettes.caTotal,
          margeNette: study.phase3.indicateurs.margePromotion,
          roi: study.phase3.indicateurs.rentabiliteInvestissement,
        },
      });
    }
  }, [study, phase4, onUpdate]);

  const updateSWOT = (category: keyof Phase4Data['swot'], value: string) => {
    const items = value.split('\n').filter(item => item.trim() !== '');
    onUpdate({
      ...phase4,
      swot: { ...phase4.swot, [category]: items },
    });
  };

  const updateConditions = (value: string) => {
    const items = value.split('\n').filter(item => item.trim() !== '');
    onUpdate({
      ...phase4,
      conditionsSuspensives: items,
    });
  };

  const updateProchainEtapes = (value: string) => {
    const items = value.split('\n').filter(item => item.trim() !== '');
    onUpdate({
      ...phase4,
      prochainEtapes: items,
    });
  };

  const globalGrade = calculateGrade(phase4.scoresPonderes.global);
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Global Score */}
      <Card className="border-2" style={{ borderColor: getScoreColor(phase4.scoresPonderes.global) }}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <span className="text-xl">Score Global de Faisabilité</span>
            <Button
              onClick={async () => {
                const { generatePDF } = await import('@/lib/pdf-generator');
                generatePDF(study);
              }}
              variant="outline"
              className="gap-2"
            >
              <FileDown className="w-4 h-4" />
              Exporter PDF
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div className={`flex h-24 w-24 items-center justify-center rounded-2xl text-white text-4xl font-bold ${getGradeColor(globalGrade)}`}>
              {globalGrade}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold" style={{ color: getScoreColor(phase4.scoresPonderes.global) }}>
                  {phase4.scoresPonderes.global}
                </span>
                <span className="text-2xl text-muted-foreground">/100</span>
              </div>
              <div className="text-lg text-muted-foreground mt-1">
                {getScoreLabel(phase4.scoresPonderes.global)}
              </div>
              <Progress
                value={phase4.scoresPonderes.global}
                className="h-3 mt-3"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scores par phase */}
      <div className="grid gap-4 md:grid-cols-3">
        <ScorePhaseCard
          title="Phase 1"
          subtitle="Analyse initiale"
          score={study.phase1.globalScore}
          weight={defaultWeights.global.phase1}
          weightedScore={phase4.scoresPonderes.phase1}
        />
        <ScorePhaseCard
          title="Phase 2"
          subtitle="Analyse detaillée"
          score={study.phase2.globalScore}
          weight={defaultWeights.global.phase2}
          weightedScore={phase4.scoresPonderes.phase2}
        />
        <ScorePhaseCard
          title="Phase 3"
          subtitle="Analyse financière"
          score={study.phase3.financialScore}
          weight={defaultWeights.global.phase3}
          weightedScore={phase4.scoresPonderes.phase3}
        />
      </div>

      {/* Synthese financiere */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Synthèse Financière
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FinancialMetric
              label="Investissement total"
              value={formatCurrency(phase4.syntheseFinanciere.investissementTotal)}
            />
            <FinancialMetric
              label="Recettes estimées"
              value={formatCurrency(phase4.syntheseFinanciere.recettesEstimees)}
              positive
            />
            <FinancialMetric
              label="Marge nette"
              value={formatCurrency(phase4.syntheseFinanciere.margeNette)}
              positive={phase4.syntheseFinanciere.margeNette > 0}
            />
            <FinancialMetric
              label="ROI"
              value={`${phase4.syntheseFinanciere.roi.toFixed(1)}%`}
              positive={phase4.syntheseFinanciere.roi >= 10}
            />
          </div>
        </CardContent>
      </Card>

      {/* SWOT */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Analyse SWOT
          </CardTitle>
          <CardDescription>Forces, Faiblesses, Opportunites, Menaces</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-emerald-700">
                <TrendingUp className="w-4 h-4" />
                Forces
              </Label>
              <Textarea
                value={phase4.swot.forces.join('\n')}
                onChange={(e) => updateSWOT('forces', e.target.value)}
                placeholder="Une force par ligne..."
                rows={4}
                className="border-emerald-200 focus:border-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-red-700">
                <TrendingDown className="w-4 h-4" />
                Faiblesses
              </Label>
              <Textarea
                value={phase4.swot.faiblesses.join('\n')}
                onChange={(e) => updateSWOT('faiblesses', e.target.value)}
                placeholder="Une faiblesse par ligne..."
                rows={4}
                className="border-red-200 focus:border-red-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-blue-700">
                <TrendingUp className="w-4 h-4" />
                Opportunites
              </Label>
              <Textarea
                value={phase4.swot.opportunites.join('\n')}
                onChange={(e) => updateSWOT('opportunites', e.target.value)}
                placeholder="Une opportunite par ligne..."
                rows={4}
                className="border-blue-200 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="w-4 h-4" />
                Menaces
              </Label>
              <Textarea
                value={phase4.swot.menaces.join('\n')}
                onChange={(e) => updateSWOT('menaces', e.target.value)}
                placeholder="Une menace par ligne..."
                rows={4}
                className="border-amber-200 focus:border-amber-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Justification et recommandations */}
      <Card>
        <CardHeader>
          <CardTitle>Justification de la recommandation</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={phase4.justification}
            onChange={(e) => onUpdate({ ...phase4, justification: e.target.value })}
            placeholder="Expliquez les raisons de la recommandation..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Conditions suspensives */}
      <Card>
        <CardHeader>
          <CardTitle>Conditions suspensives</CardTitle>
          <CardDescription>Conditions à lever avant de poursuivre le projet</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={phase4.conditionsSuspensives.join('\n')}
            onChange={(e) => updateConditions(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Prochaines etapes */}
      <Card>
        <CardHeader>
          <CardTitle>Prochaines étapes</CardTitle>
          <CardDescription>Actions a mener suite a cette etude</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={phase4.prochainEtapes.join('\n')}
            onChange={(e) => updateProchainEtapes(e.target.value)}
            placeholder="Une etape par ligne..."
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function ScorePhaseCard({ title, subtitle, score, weight, weightedScore }: {
  title: string;
  subtitle: string;
  score: number;
  weight: number;
  weightedScore: number;
}) {
  const grade = calculateGrade(score);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="font-semibold">{title}</div>
            <div className="text-sm text-muted-foreground">{subtitle}</div>
          </div>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold ${getGradeColor(grade)}`}>
            {grade}
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold" style={{ color: getScoreColor(score) }}>
            {score}
          </span>
          <span className="text-muted-foreground">/100</span>
        </div>
        <Progress value={score} className="h-2 mt-2" />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>Poids: {weight}%</span>
          <span>Contribution: {weightedScore} pts</span>
        </div>
      </CardContent>
    </Card>
  );
}

function FinancialMetric({ label, value, positive }: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="text-center p-4 bg-muted/50 rounded-lg">
      <div className="text-sm text-muted-foreground mb-1">{label}</div>
      <div className={`text-xl font-bold ${positive === true ? 'text-emerald-600' : positive === false ? 'text-red-600' : 'text-foreground'}`}>
        {value}
      </div>
    </div>
  );
}
