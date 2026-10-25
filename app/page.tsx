'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { sections } from '@/data/sections';
import { exercisesBySection, allExercises } from '@/data/exercises';
import { loadProgress, getLevelInfo, getSectionStars } from '@/lib/progress';
import { Progress, SectionProgress } from '@/types';
import SectionCard from '@/components/SectionCard';
import { badges as allBadges } from '@/data/badges';

export default function HomePage() {
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    setProgress(loadProgress());
    const handleUpdate = () => setProgress(loadProgress());
    window.addEventListener('progress-updated', handleUpdate);
    return () => window.removeEventListener('progress-updated', handleUpdate);
  }, []);

  const totalExercises = allExercises.length;
  const completedTotal = progress
    ? Object.values(progress.sections).reduce(
        (acc, sec) => acc + sec.completedExercises.length,
        0
      )
    : 0;

  const levelInfo = progress
    ? getLevelInfo(progress.totalXP)
    : { level: 1, title: 'Apprenti(e)', nextXP: 50 };
  const totalPct = Math.round((completedTotal / totalExercises) * 100);

  const earnedBadges = progress
    ? allBadges.filter((b) => progress.unlockedBadges.includes(b.id))
    : [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-7 text-white mb-8 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">St-Ex Sec 2 Math</h1>
            <p className="text-indigo-200 text-base mb-4">
              Taux, rapports, proportions et pourcentages
            </p>
            {progress && (
              <div className="flex items-center gap-6 flex-wrap">
                <div className="text-center">
                  <p className="text-3xl font-bold">{progress.totalXP}</p>
                  <p className="text-indigo-200 text-xs">XP total</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{levelInfo.title}</p>
                  <p className="text-indigo-200 text-xs">Niveau {levelInfo.level}</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{progress.maxStreak}</p>
                  <p className="text-indigo-200 text-xs">Meilleure série 🔥</p>
                </div>
              </div>
            )}
          </div>
          <div className="text-6xl shrink-0">📐</div>
        </div>

        {/* Overall progress */}
        <div className="mt-5">
          <div className="flex justify-between text-sm text-indigo-200 mb-1.5">
            <span>Progression globale</span>
            <span>
              {completedTotal}/{totalExercises} exercices ({totalPct}%)
            </span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-700"
              style={{ width: `${totalPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link
          href="/tutor"
          className="flex items-center gap-2 bg-white border-2 border-indigo-200 hover:border-indigo-400 text-indigo-700 font-semibold rounded-2xl px-5 py-3 transition-all hover:shadow-sm"
        >
          <span className="text-xl">💬</span>
          <span>Parler à Roxy, mon tuteur IA</span>
        </Link>
        <Link
          href="/log"
          className="flex items-center gap-2 bg-white border-2 border-gray-200 hover:border-gray-400 text-gray-600 font-semibold rounded-2xl px-5 py-3 transition-all hover:shadow-sm"
        >
          <span className="text-xl">📊</span>
          <span>Journal des réponses</span>
        </Link>
      </div>

      {/* Sections */}
      <div className="mb-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-1 bg-indigo-500 rounded-full" />
          <h2 className="text-xl font-bold text-gray-800">Sections</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {sections.map((section) => {
            const exercises = exercisesBySection(section.slug);
            const sectionProg: SectionProgress | undefined =
              progress?.sections[section.slug];
            const stars = getSectionStars(sectionProg, exercises.length);
            const completed = sectionProg?.completedExercises.length ?? 0;

            return (
              <SectionCard
                key={section.slug}
                section={section}
                totalExercises={exercises.length}
                completedExercises={completed}
                stars={stars}
              />
            );
          })}
        </div>
      </div>

      {/* Badges */}
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Badges ({earnedBadges.length}/{allBadges.length})
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-12">
        {allBadges.map((badge) => {
          const earned = earnedBadges.some((b) => b.id === badge.id);
          return (
            <div
              key={badge.id}
              title={badge.description}
              className={`rounded-xl p-3 text-center border-2 transition-all ${
                earned
                  ? 'border-indigo-200 bg-indigo-50'
                  : 'border-gray-100 bg-gray-50 opacity-40 grayscale'
              }`}
            >
              <div className="text-3xl mb-1">{badge.icon}</div>
              <p className="text-xs font-bold text-gray-800 leading-tight">
                {badge.name}
              </p>
              {earned && (
                <p className="text-xs text-indigo-500 mt-0.5">Obtenu !</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Reset */}
      {progress && progress.totalXP > 0 && (
        <div className="text-center">
          <button
            onClick={() => {
              if (confirm('Es-tu sûre de vouloir réinitialiser toute ta progression ?')) {
                localStorage.removeItem('stex-sec2-progress');
                setProgress(loadProgress());
              }
            }}
            className="text-xs text-gray-400 hover:text-red-400 transition-colors"
          >
            Réinitialiser la progression
          </button>
        </div>
      )}
    </div>
  );
}
