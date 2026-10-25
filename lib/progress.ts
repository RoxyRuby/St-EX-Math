'use client';

import { Progress, ExerciseResult, SectionProgress } from '@/types';

const STORAGE_KEY = 'stex-sec2-progress';

export function getDefaultProgress(): Progress {
  return {
    totalXP: 0,
    streak: 0,
    maxStreak: 0,
    lastActivityAt: Date.now(),
    unlockedBadges: [],
    sections: {},
  };
}

export function loadProgress(): Progress {
  if (typeof window === 'undefined') return getDefaultProgress();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultProgress();
    return JSON.parse(raw) as Progress;
  } catch {
    return getDefaultProgress();
  }
}

export function saveProgress(progress: Progress): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // storage full or unavailable
  }
}

export function recordResult(
  progress: Progress,
  sectionSlug: string,
  result: ExerciseResult
): Progress {
  const section: SectionProgress = progress.sections[sectionSlug] ?? {
    slug: sectionSlug,
    stars: 0,
    completedExercises: [],
    results: {},
  };

  const updatedResults = { ...section.results, [result.exerciseId]: result };
  const completedIds = Object.keys(updatedResults).filter(
    (id) => updatedResults[id].correct
  );

  const updatedSection: SectionProgress = {
    ...section,
    results: updatedResults,
    completedExercises: completedIds,
  };

  const newStreak = result.correct ? progress.streak + 1 : 0;

  return {
    ...progress,
    totalXP: progress.totalXP + result.xpEarned,
    streak: newStreak,
    maxStreak: Math.max(progress.maxStreak, newStreak),
    lastActivityAt: Date.now(),
    sections: {
      ...progress.sections,
      [sectionSlug]: updatedSection,
    },
  };
}

export function getSectionStars(
  section: SectionProgress | undefined,
  totalExercises: number
): 0 | 1 | 2 | 3 {
  if (!section || totalExercises === 0) return 0;
  const pct = section.completedExercises.length / totalExercises;
  if (pct >= 0.9) return 3;
  if (pct >= 0.7) return 2;
  if (pct >= 0.5) return 1;
  return 0;
}

export function getLevelInfo(totalXP: number): { level: number; title: string; nextXP: number } {
  const levels = [
    { min: 0, title: 'Apprenti(e)' },
    { min: 50, title: 'Élève' },
    { min: 150, title: 'Étudiant(e)' },
    { min: 350, title: 'Expert(e)' },
    { min: 700, title: 'Génie des maths !' },
  ];

  let current = levels[0];
  let nextMin = levels[1].min;

  for (let i = levels.length - 1; i >= 0; i--) {
    if (totalXP >= levels[i].min) {
      current = levels[i];
      nextMin = levels[i + 1]?.min ?? current.min + 500;
      break;
    }
  }

  return {
    level: levels.indexOf(current) + 1,
    title: current.title,
    nextXP: nextMin,
  };
}

export function resetProgress(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

// ── Mid-exercise resume helpers ──────────────────────────────────────────────

const IN_PROGRESS_KEY = 'stex-sec2-inprogress';

export function saveInProgress(exerciseId: string, subIdx: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(IN_PROGRESS_KEY, JSON.stringify({ exerciseId, subIdx }));
  } catch {
    // storage full or unavailable
  }
}

export function loadInProgress(): { exerciseId: string; subIdx: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(IN_PROGRESS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { exerciseId: string; subIdx: number };
  } catch {
    return null;
  }
}

export function clearInProgress(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(IN_PROGRESS_KEY);
}
