'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadProgress } from '@/lib/progress';
import { sections } from '@/data/sections';
import { Progress, ExerciseResult } from '@/types';

interface LogEntry {
  sectionSlug: string;
  sectionLabel: string;
  exerciseId: string;
  result: ExerciseResult;
}

export default function LogPage() {
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  if (!progress) return null;

  // Flatten all results into a sorted list (most recent first)
  const entries: LogEntry[] = [];
  for (const slug of Object.keys(progress.sections)) {
    const sec = sections.find((s) => s.slug === slug);
    const label = sec ? `${sec.title} — ${sec.subtitle}` : slug;
    const sectionResults = progress.sections[slug].results;
    for (const [exerciseId, result] of Object.entries(sectionResults)) {
      entries.push({ sectionSlug: slug, sectionLabel: label, exerciseId, result });
    }
  }
  entries.sort((a, b) => b.result.completedAt - a.result.completedAt);

  const total = entries.length;
  const correct = entries.filter((e) => e.result.correct).length;
  const totalXP = entries.reduce((sum, e) => sum + e.result.xpEarned, 0);
  const hintsUsed = entries.filter((e) => e.result.usedHint).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ←
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">📊 Journal des réponses</h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-gray-800">{total}</p>
          <p className="text-xs text-gray-500 mt-0.5">Réponses</p>
        </div>
        <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-emerald-700">{correct}</p>
          <p className="text-xs text-emerald-600 mt-0.5">Correctes</p>
        </div>
        <div className="bg-red-50 rounded-2xl border border-red-200 p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-red-600">{total - correct}</p>
          <p className="text-xs text-red-500 mt-0.5">Incorrectes</p>
        </div>
        <div className="bg-violet-50 rounded-2xl border border-violet-200 p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-violet-700">+{totalXP}</p>
          <p className="text-xs text-violet-500 mt-0.5">XP gagnés</p>
        </div>
      </div>

      {total === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">📭</p>
          <p className="font-medium">Aucune réponse enregistrée pour l&apos;instant.</p>
          <p className="text-sm mt-1">Les réponses apparaîtront ici au fur et à mesure des exercices.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-3">
            {total} réponse{total !== 1 ? 's' : ''} · {hintsUsed} indice{hintsUsed !== 1 ? 's' : ''} utilisé{hintsUsed !== 1 ? 's' : ''} · affiché{total !== 1 ? 'es' : 'e'} de la plus récente à la plus ancienne
          </p>

          {/* Table — scrollable on mobile */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">Section</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">Exercice</th>
                  <th className="text-center px-4 py-3 text-gray-600 font-semibold">Résultat</th>
                  <th className="text-center px-4 py-3 text-gray-600 font-semibold">Essais</th>
                  <th className="text-center px-4 py-3 text-gray-600 font-semibold">Indice</th>
                  <th className="text-center px-4 py-3 text-gray-600 font-semibold">XP</th>
                  <th className="text-right px-4 py-3 text-gray-600 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => (
                  <tr
                    key={entry.exerciseId + i}
                    className={`border-b border-gray-100 last:border-0 ${
                      i % 2 === 0 ? '' : 'bg-gray-50/40'
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {entry.sectionLabel}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs whitespace-nowrap">
                      {entry.exerciseId}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {entry.result.correct ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">
                          ✓ Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                          ✗ Incorrect
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {entry.result.attempts}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {entry.result.usedHint ? (
                        <span title="Indice utilisé">💡</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-violet-600">
                      +{entry.result.xpEarned}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 text-xs whitespace-nowrap">
                      {new Date(entry.result.completedAt).toLocaleString('fr-CA', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Footer note */}
      <p className="text-xs text-gray-400 text-center mt-6">
        Les données sont sauvegardées localement sur cet appareil.
      </p>
    </div>
  );
}
