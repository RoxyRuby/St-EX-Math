'use client';

import { useState, useEffect } from 'react';

interface FractionInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function FractionInput({ value, onChange, disabled }: FractionInputProps) {
  const [num, setNum] = useState('');
  const [den, setDen] = useState('');

  // Parse external value
  useEffect(() => {
    if (!value) {
      setNum('');
      setDen('');
      return;
    }
    const match = value.match(/^(-?\d+)\/(\d+)$/);
    if (match) {
      setNum(match[1]);
      setDen(match[2]);
    }
  }, [value]);

  const handleNum = (v: string) => {
    setNum(v);
    if (den) onChange(`${v}/${den}`);
    else onChange(v);
  };

  const handleDen = (v: string) => {
    setDen(v);
    if (num) onChange(`${num}/${v}`);
  };

  return (
    <div className="inline-flex flex-col items-center gap-0.5">
      <input
        type="text"
        inputMode="numeric"
        value={num}
        onChange={(e) => handleNum(e.target.value)}
        disabled={disabled}
        placeholder="?"
        className="w-16 text-center text-lg font-bold border-2 border-violet-300 rounded-lg py-1 focus:outline-none focus:border-violet-500 disabled:opacity-50 bg-white"
      />
      <div className="w-16 h-0.5 bg-gray-800 rounded" />
      <input
        type="text"
        inputMode="numeric"
        value={den}
        onChange={(e) => handleDen(e.target.value)}
        disabled={disabled}
        placeholder="?"
        className="w-16 text-center text-lg font-bold border-2 border-violet-300 rounded-lg py-1 focus:outline-none focus:border-violet-500 disabled:opacity-50 bg-white"
      />
    </div>
  );
}
