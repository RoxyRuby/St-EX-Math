'use client';

import Link from 'next/link';
import { Section } from '@/types';

interface SectionCardProps {
  section: Section;
  totalExercises: number;
  completedExercises: number;
  stars: 0 | 1 | 2 | 3;
}

export default function SectionCard({
  section,
  totalExercises,
  completedExercises,
  stars,
}: SectionCardProps) {
  const pct = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;

  return (
    <Link href={`/section/${section.slug}`} className="block group">
      <div
        className={`${section.color} rounded-2xl p-5 border-2 border-transparent hover:border-current ${section.accentColor} transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="text-3xl">{section.icon}</div>
          <div className="flex gap-0.5">
            {[1, 2, 3].map((s) => (
              <span key={s} className={`text-lg ${stars >= s ? 'opacity-100' : 'opacity-20'}`}>
                ⭐
              </span>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="mb-1">
          <span className={`text-xs font-bold uppercase tracking-wider ${section.accentColor}`}>
            {section.title}
          </span>
          <h3 className="font-semibold text-gray-800 text-sm leading-tight mt-0.5">
            {section.subtitle}
          </h3>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{completedExercises}/{totalExercises} exercices</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-current rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
