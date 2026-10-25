'use client';

import { use } from 'react';
import Link from 'next/link';
import { getExerciseById } from '@/data/exercises';
import { getSectionBySlug } from '@/data/sections';
import ExerciseRunner from '@/components/ExerciseRunner';

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

export default function ExercisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const exercise = getExerciseById(id);
  const section = exercise ? getSectionBySlug(exercise.section) : undefined;

  if (!exercise || !section) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">Exercice introuvable.</p>
        <Link href="/" className="text-violet-600 hover:underline mt-4 block">
          ← Retour au tableau de bord
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-700 transition-colors">
          Tableau de bord
        </Link>
        <span>›</span>
        <Link
          href={`/section/${section.slug}`}
          className="hover:text-gray-700 transition-colors"
        >
          {section.title} — {section.subtitle}
        </Link>
        <span>›</span>
        <span className="text-gray-700">Exercice {exercise.number}</span>
      </div>

      {/* Exercise header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="text-2xl">{section.icon}</div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-800">{exercise.title}</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${difficultyColor[exercise.difficulty]}`}
          >
            {difficultyLabel[exercise.difficulty]}
          </span>
          <span className="text-sm font-bold text-violet-600">{exercise.xp} XP</span>
        </div>
      </div>

      {/* Core exercise runner */}
      <ExerciseRunner exercise={exercise} sectionSlug={section.slug} />
    </div>
  );
}
