// Types for the land feasibility study application

export type CriterionType = 'select' | 'multiselect' | 'boolean' | 'number';

export interface CriterionOption {
  value: string;
  label: string;
  score: number; // -5 to +5
}

export interface Criterion {
  id: string;
  category: string;
  subcategory?: string;
  label: string;
  type: CriterionType;
  options?: CriterionOption[];
  weight: number; // coefficient de pondération
  conditionalOn?: { criterionId: string; value: string | boolean }; // for conditional display
}

export interface CriterionResponse {
  criterionId: string;
  value: string | string[] | boolean | number;
  score: number;
  comment?: string;
}

export interface PhaseResult {
  phase: 1 | 2;
  totalScore: number;
  maxPossibleScore: number;
  minPossibleScore: number;
  normalizedScore: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'E';
  responses: CriterionResponse[];
}

export interface FinancialItem {
  id: string;
  label: string;
  category: string;
  defaultRatio?: number;
  value: number;
  unit: string;
}

export interface FinancialBilan {
  operationType: 'amenagement' | 'immobilier';
  droitAConstruire?: number; // m² for amenagement
  DAP?: number; // € for amenagement
  surfaceHabitable?: number; // m² for immobilier
  DDD?: number; // € for immobilier
  depenses: FinancialItem[];
  recettes: FinancialItem[];
  totalDepenses: number;
  totalRecettes: number;
  resultatNet: number;
  resultatParM2: number;
}

export interface StudyData {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  currentStep: number;
  phase1?: PhaseResult;
  phase2?: PhaseResult;
  globalScore?: number;
  globalGrade?: 'A' | 'B' | 'C' | 'D' | 'E';
  financialBilan?: FinancialBilan;
}

export function calculateGrade(normalizedScore: number): 'A' | 'B' | 'C' | 'D' | 'E' {
  if (normalizedScore >= 80) return 'A';
  if (normalizedScore >= 60) return 'B';
  if (normalizedScore >= 40) return 'C';
  if (normalizedScore >= 20) return 'D';
  return 'E';
}

export function getGradeColor(grade: 'A' | 'B' | 'C' | 'D' | 'E'): string {
  const colors = {
    A: 'bg-[oklch(var(--score-a))]',
    B: 'bg-[oklch(var(--score-b))]',
    C: 'bg-[oklch(var(--score-c))]',
    D: 'bg-[oklch(var(--score-d))]',
    E: 'bg-[oklch(var(--score-e))]',
  };
  return colors[grade];
}
