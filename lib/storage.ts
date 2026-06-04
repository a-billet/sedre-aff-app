'use client';

import { FeasibilityStudy } from '@/lib/types';

const STORAGE_KEY = 'feasibility_studies';
const CURRENT_STUDY_KEY = 'current_study';

export function getStudies(): FeasibilityStudy[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function getStudy(id: string): FeasibilityStudy | undefined {
  const studies = getStudies();
  return studies.find(s => s.id === id);
}

export function saveStudy(study: FeasibilityStudy): void {
  const studies = getStudies();
  const index = studies.findIndex(s => s.id === study.id);
  study.lastModified = new Date().toISOString();
  
  if (index >= 0) {
    studies[index] = study;
  } else {
    studies.push(study);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(studies));
}

export function deleteStudy(id: string): void {
  const studies = getStudies().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(studies));
}

export function setCurrentStudyId(id: string | null): void {
  if (typeof window === 'undefined') return;
  if (id) {
    localStorage.setItem(CURRENT_STUDY_KEY, id);
  } else {
    localStorage.removeItem(CURRENT_STUDY_KEY);
  }
}

export function getCurrentStudyId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CURRENT_STUDY_KEY);
}
