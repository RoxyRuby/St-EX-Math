'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import TutorChat from '@/components/TutorChat';

function TutorPageInner() {
  const params = useSearchParams();
  const section = params.get('section') ?? '';

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ←
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
            M
          </div>
          <div>
            <h1 className="font-bold text-gray-800">Mathis</h1>
            <p className="text-xs text-emerald-500 font-medium">● En ligne</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 max-w-36 text-right hidden sm:block">
          Ton tuteur de maths IA — il guide sans donner la réponse
        </p>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col">
        <TutorChat initialSection={section} />
      </div>
    </div>
  );
}

export default function TutorPage() {
  return (
    <Suspense>
      <TutorPageInner />
    </Suspense>
  );
}
