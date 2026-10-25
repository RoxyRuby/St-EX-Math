'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { loadProgress, getLevelInfo } from '@/lib/progress';

export default function NavBar() {
  const [xp, setXP] = useState(0);
  const [levelInfo, setLevelInfo] = useState({ level: 1, title: 'Apprenti(e)', nextXP: 50 });
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const p = loadProgress();
    setXP(p.totalXP);
    setLevelInfo(getLevelInfo(p.totalXP));
    setStreak(p.streak);

    const handleStorage = () => {
      const updated = loadProgress();
      setXP(updated.totalXP);
      setLevelInfo(getLevelInfo(updated.totalXP));
      setStreak(updated.streak);
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('progress-updated', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('progress-updated', handleStorage);
    };
  }, []);

  const progressPct = Math.min(
    100,
    Math.round(((xp - (levelInfo.level === 1 ? 0 : [0, 50, 150, 350, 700][levelInfo.level - 2])) /
      (levelInfo.nextXP - (levelInfo.level === 1 ? 0 : [0, 50, 150, 350, 700][levelInfo.level - 2]))) * 100)
  );

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-violet-700 text-lg shrink-0">
          <span className="text-2xl">🧮</span>
          <span className="hidden sm:inline">Panorama 5</span>
        </Link>

        {/* XP + Level */}
        <div className="flex items-center gap-3 flex-1 max-w-xs">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span className="font-semibold text-violet-700">{levelInfo.title}</span>
              <span>{xp} XP</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Streak + Nav links */}
        <div className="flex items-center gap-3 shrink-0">
          {streak >= 3 && (
            <div className="flex items-center gap-1 bg-orange-50 border border-orange-200 rounded-full px-3 py-1 text-sm font-semibold text-orange-600">
              <span>🔥</span>
              <span>{streak}</span>
            </div>
          )}
          <Link
            href="/tutor"
            className="flex items-center gap-1.5 bg-violet-100 hover:bg-violet-200 text-violet-700 rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
          >
            <span>💬</span>
            <span className="hidden sm:inline">Mathis</span>
          </Link>
          <Link
            href="/grader"
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
          >
            <span>📝</span>
            <span className="hidden sm:inline">Grader</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
