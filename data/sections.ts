import { Section } from '@/types';

export const sections: Section[] = [
  {
    slug: 'rappel-tr',
    title: 'Rappel',
    subtitle: 'Fractions, décimaux et pourcentages',
    icon: '🔁',
    color: 'bg-slate-100',
    accentColor: 'text-slate-600',
    conceptSummary:
      'Révision rapide des fractions irréductibles (PGCD), des conversions entre fractions, nombres décimaux et pourcentages, et du calcul du pourcentage d\'un nombre.',
  },
  {
    slug: 'rapports',
    title: 'Rapports',
    subtitle: 'Écrire, simplifier et comparer des rapports',
    icon: '⚖️',
    color: 'bg-indigo-100',
    accentColor: 'text-indigo-600',
    conceptSummary:
      'Un rapport compare deux grandeurs de même nature. On l\'écrit sous forme de fraction (a/b) ou avec deux points (a:b). On simplifie un rapport comme une fraction (en divisant par le PGCD). Pour comparer deux rapports, on utilise un dénominateur commun ou on les convertit en décimaux.',
  },
  {
    slug: 'taux',
    title: 'Taux',
    subtitle: 'Taux unitaire et comparaison de taux',
    icon: '📊',
    color: 'bg-purple-100',
    accentColor: 'text-purple-600',
    conceptSummary:
      'Un taux compare deux grandeurs de natures différentes (ex. 12 km/h, 3 $/kg). Le taux unitaire ramène la comparaison à une seule unité (ex. prix par 1 kg). Pour comparer des taux, on calcule le taux unitaire de chacun puis on compare.',
  },
  {
    slug: 'proportions',
    title: 'Proportions',
    subtitle: 'Produit croisé et valeur manquante',
    icon: '🔗',
    color: 'bg-pink-100',
    accentColor: 'text-pink-600',
    conceptSummary:
      'Une proportion est l\'égalité de deux rapports ou taux : a/b = c/d. Le produit croisé dit que a × d = b × c. On l\'utilise pour trouver une valeur manquante x. Une situation est proportionnelle quand le rapport entre deux variables reste toujours le même (tableau de valeurs, graphique passant par l\'origine).',
  },
  {
    slug: 'pourcentages-tr',
    title: 'Pourcentages',
    subtitle: 'Calculs de pourcentage et conversions',
    icon: '%',
    color: 'bg-yellow-100',
    accentColor: 'text-yellow-600',
    conceptSummary:
      'Un pourcentage est une fraction dont le dénominateur est 100. Conversions : % vers décimal (÷ 100), décimal vers % (× 100), % vers fraction (/100), fraction vers %. Calculer x % d\'un nombre : multiplier par le décimal équivalent. Trouver le 100 % : diviser la valeur connue par son pourcentage puis multiplier par 100.',
  },
  {
    slug: 'rabais-taxes',
    title: 'Rabais et taxes',
    subtitle: 'Prix final, prix initial et rabais inconnu',
    icon: '🛒',
    color: 'bg-orange-100',
    accentColor: 'text-orange-600',
    conceptSummary:
      'Rabais : soustraire le % du prix initial (prix × (1 − rabais%)). Taxes : ajouter le % au prix (prix × (1 + taxes%)). Rabais puis taxes : appliquer les deux étapes dans l\'ordre. Trouver le prix initial : diviser le prix final par le facteur multiplicatif. Trouver le % de rabais : (rabais en $) ÷ (prix initial) × 100.',
  },
  {
    slug: 'synthese-tr',
    title: 'Synthèse',
    subtitle: 'Révision complète du chapitre',
    icon: '🏆',
    color: 'bg-amber-100',
    accentColor: 'text-amber-600',
    conceptSummary:
      'Révision complète : rapports, taux unitaire, proportions (produit croisé), pourcentages, rabais et taxes. Problèmes à plusieurs étapes combinant plusieurs concepts du chapitre.',
  },
];

export const getSectionBySlug = (slug: string): Section | undefined =>
  sections.find((s) => s.slug === slug);
