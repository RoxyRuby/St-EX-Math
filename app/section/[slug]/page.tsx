'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { use } from 'react';
import { getSectionBySlug } from '@/data/sections';
import { exercisesBySection } from '@/data/exercises';
import { loadProgress } from '@/lib/progress';
import { Progress, ExerciseResult } from '@/types';
import ExerciseCard from '@/components/ExerciseCard';

type Filter = 'all' | 'todo' | 'done';

export default function SectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const section = getSectionBySlug(slug);
  const exercises = exercisesBySection(slug);

  const [progress, setProgress] = useState<Progress | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    setProgress(loadProgress());
    const h = () => setProgress(loadProgress());
    window.addEventListener('progress-updated', h);
    return () => window.removeEventListener('progress-updated', h);
  }, []);

  if (!section) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">Section introuvable.</p>
        <Link href="/" className="text-violet-600 hover:underline mt-4 block">
          ← Retour au tableau de bord
        </Link>
      </div>
    );
  }

  const sectionResults = progress?.sections[slug]?.results ?? {};
  const completedIds = progress?.sections[slug]?.completedExercises ?? [];

  const filtered = exercises.filter((ex) => {
    if (filter === 'done') return completedIds.includes(ex.id);
    if (filter === 'todo') return !completedIds.includes(ex.id);
    return true;
  });

  const pct = exercises.length > 0 ? Math.round((completedIds.length / exercises.length) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        ← Tableau de bord
      </Link>

      {/* Header */}
      <div className={`${section.color} rounded-3xl p-6 mb-6`}>
        <div className="flex items-start justify-between">
          <div>
            <span className={`text-xs font-bold uppercase tracking-wider ${section.accentColor}`}>
              {section.title}
            </span>
            <h1 className="text-2xl font-bold text-gray-800 mt-1">{section.subtitle}</h1>
            <p className="text-gray-500 text-sm mt-2 leading-relaxed">{section.conceptSummary}</p>
          </div>
          <div className="text-4xl shrink-0 ml-3">{section.icon}</div>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>
              {completedIds.length}/{exercises.length} exercices complétés
            </span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 bg-white/60 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${section.accentColor.replace('text-', 'bg-')}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Concept link to tutor */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-2">
          {(['all', 'todo', 'done'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-sm px-3 py-1.5 rounded-full font-medium transition-colors ${
                filter === f
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'Tous' : f === 'todo' ? 'À faire' : 'Complétés'}
            </button>
          ))}
        </div>
        <Link
          href={`/tutor?section=${slug}`}
          className="text-sm text-violet-600 hover:text-violet-800 font-medium transition-colors"
        >
          💬 Demander à Mathis
        </Link>
      </div>

      {/* Exercise list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-8">
            {filter === 'done'
              ? 'Aucun exercice complété dans cette section encore.'
              : 'Tous les exercices sont complétés !'}
          </p>
        ) : (
          filtered.map((ex) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              result={sectionResults[ex.id] as ExerciseResult | undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}
