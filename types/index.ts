export type ExerciseType =
  | 'fraction-input'
  | 'numeric'
  | 'percentage'
  | 'multiple-choice'
  | 'comparison'
  | 'text';

export interface SubQuestion {
  label: string;       // "a)", "b)", etc.
  question: string;
  type: ExerciseType;
  answer: string | string[];
  explanation: string;
  options?: string[];
}

export interface Exercise {
  id: string;
  section: string;     // "rappel" | "5.1" | "5.2" | "5.3" | "5.4" | "5.5" | "synthese"
  number: number;
  title: string;
  question: string;
  type: ExerciseType;
  subQuestions?: SubQuestion[];
  options?: string[];
  answer?: string | string[];
  explanation?: string;
  hint: string;
  difficulty: 1 | 2 | 3;
  xp: number;
  conceptTag: string;
}

export interface Section {
  slug: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;        // Tailwind bg color class
  accentColor: string;  // Tailwind text/border color class
  conceptSummary: string; // injected into tutor system prompt
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockCondition: (progress: Progress) => boolean;
}

export interface ExerciseResult {
  exerciseId: string;
  correct: boolean;
  usedHint: boolean;
  xpEarned: number;
  attempts: number;
  completedAt: number;
}

export interface SectionProgress {
  slug: string;
  stars: 0 | 1 | 2 | 3;
  completedExercises: string[];
  results: Record<string, ExerciseResult>;
}

export interface Progress {
  totalXP: number;
  streak: number;
  maxStreak: number;
  lastActivityAt: number;
  unlockedBadges: string[];
  sections: Record<string, SectionProgress>;
  inProgress?: { exerciseId: string; subIdx: number };
}
