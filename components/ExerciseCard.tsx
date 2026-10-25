'use client';

import Link from 'next/link';
import { Exercise, ExerciseResult } from '@/types';

interface ExerciseCardProps {
  exercise: Exercise;
  result?: ExerciseResult;
}

const difficultyLabel: Record<number, string> = {
  1: 'Facile',
  2: 'Moyen',
  3: 'Difficile',
};

const difficultyColor: Record<number, string> = {
  1: 'bg-emerald-100 text-emerald-700',
  2: 'bg-amber-100 text-amber-700',
  3: 'bg-red-100 text-red-700',
};

export default function ExerciseCard({ exercise, result }: ExerciseCardProps) {
  const isDone = result?.correct;

  return (
    <Link href={`/exercise/${exercise.id}`} className="block group">
      <div
        className={`rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
          isDone
            ? 'border-emerald-200 bg-emerald-50'
            : 'border-gray-200 bg-white hover:border-violet-300'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
              isDone ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {isDone ? '✓' : exercise.number}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 text-sm truncate">{exercise.title}</p>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{exercise.question}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${difficultyColor[exercise.difficulty]}`}
            >
              {difficultyLabel[exercise.difficulty]}
            </span>
            <span className="text-xs text-violet-600 font-medium">{exercise.xp} XP</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
