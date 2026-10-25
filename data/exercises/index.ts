import { Exercise } from '@/types';
import { rappelTrExercises } from './rappel-tr';
import { rapportsExercises } from './rapports';
import { tauxExercises } from './taux';
import { proportionsExercises } from './proportions';
import { pourcentagesTrExercises } from './pourcentages-tr';
import { rabaisTaxesExercises } from './rabais-taxes';
import { syntheseTrExercises } from './synthese-tr';

export const allExercises: Exercise[] = [
  ...rappelTrExercises,
  ...rapportsExercises,
  ...tauxExercises,
  ...proportionsExercises,
  ...pourcentagesTrExercises,
  ...rabaisTaxesExercises,
  ...syntheseTrExercises,
];

export const exercisesBySection = (slug: string): Exercise[] =>
  allExercises.filter((e) => e.section === slug);

export const getExerciseById = (id: string): Exercise | undefined =>
  allExercises.find((e) => e.id === id);
