'use client';

import { Badge } from '@/types';
import { badges as allBadges } from '@/data/badges';

interface BadgeModalProps {
  badgeIds: string[];
  onClose: () => void;
}

export default function BadgeModal({ badgeIds, onClose }: BadgeModalProps) {
  if (badgeIds.length === 0) return null;

  const earned = badgeIds
    .map((id) => allBadges.find((b) => b.id === id))
    .filter((b): b is Badge => !!b);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
        <div className="text-5xl mb-4">🏅</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {earned.length === 1 ? 'Nouveau badge !' : `${earned.length} nouveaux badges !`}
        </h2>
        <div className="flex flex-col gap-3 my-5">
          {earned.map((badge) => (
            <div
              key={badge.id}
              className="flex items-center gap-3 bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-xl p-3"
            >
              <span className="text-3xl">{badge.icon}</span>
              <div className="text-left">
                <div className="font-bold text-gray-800">{badge.name}</div>
                <div className="text-sm text-gray-500">{badge.description}</div>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold py-3 rounded-2xl hover:opacity-90 transition-opacity"
        >
          Super ! 🎉
        </button>
      </div>
    </div>
  );
}
