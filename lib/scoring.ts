import { Progress } from '@/types';
import { badges } from '@/data/badges';
import { allExercises } from '@/data/exercises';
import { getSectionStars } from './progress';

export function calcXP(usedHint: boolean, correct: boolean): number {
  if (!correct) return 0;
  return usedHint ? 5 : 10;
}

/**
 * Returns array of newly unlocked badge IDs.
 */
export function checkBadgeUnlocks(oldProgress: Progress, newProgress: Progress): string[] {
  const newBadges: string[] = [];

  for (const badge of badges) {
    if (newProgress.unlockedBadges.includes(badge.id)) continue;
    if (badge.unlockCondition(newProgress)) {
      newBadges.push(badge.id);
    }
  }

  return newBadges;
}

export function applyBadgeUnlocks(progress: Progress): { progress: Progress; newBadges: string[] } {
  const newBadges = checkBadgeUnlocks(progress, progress);
  if (newBadges.length === 0) return { progress, newBadges: [] };

  const updated: Progress = {
    ...progress,
    unlockedBadges: [...progress.unlockedBadges, ...newBadges],
    sections: { ...progress.sections },
  };

  // Update star counts for all sections
  const slugs = ['rappel', '5.1', '5.2', '5.3', '5.4', '5.5', 'synthese'];
  for (const slug of slugs) {
    const sec = updated.sections[slug];
    if (sec) {
      const total = allExercises.filter((e) => e.section === slug).length;
      const stars = getSectionStars(sec, total);
      updated.sections[slug] = { ...sec, stars };
    }
  }

  return { progress: updated, newBadges };
}

export function getStreakMessage(streak: number): string {
  if (streak >= 10) return `🔥 Série de ${streak} ! Incroyable !`;
  if (streak >= 5) return `⚡ Série de ${streak} ! Continue comme ça !`;
  if (streak >= 3) return `✨ ${streak} bonnes réponses d'affilée !`;
  return '';
}
