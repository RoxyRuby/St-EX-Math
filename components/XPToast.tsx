'use client';

import { useEffect, useState } from 'react';

interface XPToastProps {
  xp: number;
  visible: boolean;
}

export default function XPToast({ xp, visible }: XPToastProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const t = setTimeout(() => setShow(false), 2000);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (!show) return null;

  return (
    <div className="fixed top-24 right-6 z-50 pointer-events-none">
      <div className="animate-bounce-up bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-xl rounded-2xl px-5 py-3 shadow-lg">
        +{xp} XP ✨
      </div>
    </div>
  );
}
