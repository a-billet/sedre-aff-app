'use client';

import { StudyData } from './types';

const STORAGE_KEY = 'feasibility_studies';

export function getStudies(): StudyData[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function getStudy(id: string): StudyData | undefined {
  const studies = getStudies();
  return studies.find(s => s.id === id);
}

export function saveStudy(study: StudyData): void {
  const studies = getStudies();
  const index = studies.findIndex(s => s.id === study.id);
  study.updatedAt = new Date().toISOString();
  
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

export function createNewStudy(name: string): StudyData {
  const now = new Date().toISOString();
  return {
    id: `study_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name,
    createdAt: now,
    updatedAt: now,
    currentStep: 0,
  };
}
