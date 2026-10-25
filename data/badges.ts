import { Badge, Progress } from '@/types';

export const badges: Badge[] = [
  // ── Général ─────────────────────────────────────────────────────────────
  {
    id: 'first-correct',
    name: 'Première réussite !',
    description: 'Répondre correctement à ton premier exercice.',
    icon: '🌟',
    unlockCondition: (p: Progress) => p.totalXP >= 10,
  },
  {
    id: 'streak-5',
    name: 'En feu !',
    description: '5 bonnes réponses de suite.',
    icon: '🔥',
    unlockCondition: (p: Progress) => p.maxStreak >= 5,
  },
  {
    id: 'streak-10',
    name: 'Inarrêtable !',
    description: '10 bonnes réponses de suite.',
    icon: '⚡',
    unlockCondition: (p: Progress) => p.maxStreak >= 10,
  },

  // ── Sections ─────────────────────────────────────────────────────────────
  {
    id: 'complete-rappel-tr',
    name: 'Bien révisé(e) !',
    description: 'Compléter la section Rappel.',
    icon: '🔁',
    unlockCondition: (p: Progress) =>
      (p.sections['rappel-tr']?.stars ?? 0) >= 1,
  },
  {
    id: 'complete-rapports',
    name: 'Maître des rapports',
    description: 'Obtenir au moins une étoile dans la section Rapports.',
    icon: '⚖️',
    unlockCondition: (p: Progress) =>
      (p.sections['rapports']?.stars ?? 0) >= 1,
  },
  {
    id: 'complete-taux',
    name: 'Expert en taux',
    description: 'Obtenir au moins une étoile dans la section Taux.',
    icon: '📊',
    unlockCondition: (p: Progress) =>
      (p.sections['taux']?.stars ?? 0) >= 1,
  },
  {
    id: 'complete-proportions',
    name: 'As des proportions',
    description: 'Obtenir au moins une étoile dans la section Proportions.',
    icon: '🔗',
    unlockCondition: (p: Progress) =>
      (p.sections['proportions']?.stars ?? 0) >= 1,
  },
  {
    id: 'complete-pourcentages-tr',
    name: 'Champion des %',
    description: 'Obtenir au moins une étoile dans la section Pourcentages.',
    icon: '%',
    unlockCondition: (p: Progress) =>
      (p.sections['pourcentages-tr']?.stars ?? 0) >= 1,
  },
  {
    id: 'complete-rabais-taxes',
    name: 'Génie du commerce',
    description: 'Obtenir au moins une étoile dans la section Rabais et taxes.',
    icon: '🛒',
    unlockCondition: (p: Progress) =>
      (p.sections['rabais-taxes']?.stars ?? 0) >= 1,
  },
  {
    id: 'complete-synthese-tr',
    name: 'Synthèse réussie !',
    description: 'Compléter la synthèse du chapitre.',
    icon: '🏅',
    unlockCondition: (p: Progress) =>
      (p.sections['synthese-tr']?.stars ?? 0) >= 1,
  },
  {
    id: 'champion-tr',
    name: 'Étoile de St-Ex !',
    description: 'Obtenir au moins une étoile dans toutes les sections.',
    icon: '🏆',
    unlockCondition: (p: Progress) =>
      ['rappel-tr', 'rapports', 'taux', 'proportions', 'pourcentages-tr', 'rabais-taxes', 'synthese-tr'].every(
        (s) => (p.sections[s]?.stars ?? 0) >= 1
      ),
  },
];
