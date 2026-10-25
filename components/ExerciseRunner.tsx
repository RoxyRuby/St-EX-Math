'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Exercise, SubQuestion } from '@/types';
import { checkAnswer } from '@/lib/fraction';
import { calcXP } from '@/lib/scoring';
import { loadProgress, saveProgress, recordResult, getLevelInfo, saveInProgress, loadInProgress, clearInProgress } from '@/lib/progress';
import { applyBadgeUnlocks } from '@/lib/scoring';
import FractionInput from './FractionInput';
import AnswerFeedback from './AnswerFeedback';
import XPToast from './XPToast';
import BadgeModal from './BadgeModal';

interface ExerciseRunnerProps {
  exercise: Exercise;
  sectionSlug: string;
}

type PhaseState = 'question' | 'feedback';

export default function ExerciseRunner({ exercise, sectionSlug }: ExerciseRunnerProps) {
  // If exercise has subQuestions, track current sub-question index
  const subQs = exercise.subQuestions ?? [];
  const isSingleQ = subQs.length === 0;

  const [subIdx, setSubIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [phase, setPhase] = useState<PhaseState>('question');
  const [correct, setCorrect] = useState(false);
  const [usedHint, setUsedHint] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [xpToast, setXpToast] = useState(false);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [allDone, setAllDone] = useState(false);

  const currentQ: SubQuestion | null = isSingleQ ? null : subQs[subIdx] ?? null;
  const currentType = currentQ?.type ?? exercise.type;
  const currentQuestion = currentQ?.question ?? exercise.question;
  const currentOptions = currentQ?.options ?? exercise.options;
  const currentAnswer = currentQ?.answer ?? exercise.answer ?? '';
  const currentExplanation = currentQ?.explanation ?? exercise.explanation ?? '';

  // Restore position if Lua closed the app mid-exercise
  useEffect(() => {
    if (isSingleQ) return;
    const saved = loadInProgress();
    if (saved && saved.exerciseId === exercise.id && saved.subIdx > 0) {
      setSubIdx(saved.subIdx);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise.id]);

  useEffect(() => {
    setUserAnswer('');
    setPhase('question');
    setShowHint(false);
    setCorrect(false);
    setAttempts(0);
  }, [subIdx]);

  const handleSubmit = () => {
    if (!userAnswer.trim()) return;
    const isCorrect = checkAnswer(userAnswer.trim(), currentAnswer);
    const earned = calcXP(usedHint, isCorrect);
    setCorrect(isCorrect);
    setXpEarned(earned);
    setAttempts((a) => a + 1);

    if (isCorrect) {
      setXpToast(true);
      setTimeout(() => setXpToast(false), 2500);
    }

    setPhase('feedback');

    // Always record every attempt so the answer log is complete
    const progress = loadProgress();
    const result = {
      exerciseId: exercise.id + (currentQ ? `-${currentQ.label}` : ''),
      correct: isCorrect,
      usedHint,
      xpEarned: earned,
      attempts: attempts + 1,
      completedAt: Date.now(),
    };
    const updated = recordResult(progress, sectionSlug, result);
    const { progress: withBadges, newBadges: nb } = applyBadgeUnlocks(updated);
    saveProgress(withBadges);
    if (nb.length > 0) setNewBadges(nb);
    window.dispatchEvent(new Event('progress-updated'));
  };

  const handleNext = () => {
    if (isSingleQ) {
      clearInProgress();
      setAllDone(true);
      return;
    }
    if (subIdx < subQs.length - 1) {
      const nextIdx = subIdx + 1;
      saveInProgress(exercise.id, nextIdx);
      setSubIdx(nextIdx);
    } else {
      // All sub-questions done — record parent exercise so it appears in the
      // "Complétés" filter and the exercise card turns green
      clearInProgress();
      const prog = loadProgress();
      const parentResult = {
        exerciseId: exercise.id,
        correct: true,
        usedHint,
        xpEarned: 0,
        attempts: 1,
        completedAt: Date.now(),
      };
      const updatedProg = recordResult(prog, sectionSlug, parentResult);
      const { progress: withBadges } = applyBadgeUnlocks(updatedProg);
      saveProgress(withBadges);
      window.dispatchEvent(new Event('progress-updated'));
      setAllDone(true);
    }
  };

  const handleRetry = () => {
    setUserAnswer('');
    setPhase('question');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  if (allDone) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🎊</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Exercice terminé !</h2>
        <p className="text-gray-500 mb-8">Tu as complété toutes les questions.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/section/${sectionSlug}`}
            className="px-6 py-3 bg-violet-600 text-white font-semibold rounded-2xl hover:bg-violet-700 transition-colors"
          >
            ← Retour à la section
          </Link>
          <Link
            href="/tutor"
            className="px-6 py-3 bg-white border-2 border-violet-300 text-violet-700 font-semibold rounded-2xl hover:bg-violet-50 transition-colors"
          >
            💬 Demander à Mathis
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* XP Toast */}
      <XPToast xp={xpEarned} visible={xpToast} />

      {/* Badge Modal */}
      {newBadges.length > 0 && (
        <BadgeModal badgeIds={newBadges} onClose={() => setNewBadges([])} />
      )}

      {/* Progress indicator for multi-part */}
      {!isSingleQ && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            Partie {subIdx + 1}/{subQs.length}
          </span>
          <div className="flex gap-1 flex-1">
            {subQs.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full ${
                  i < subIdx ? 'bg-emerald-400' : i === subIdx ? 'bg-violet-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sub-question label */}
      {currentQ && (
        <div className="inline-block bg-violet-100 text-violet-700 font-bold text-sm px-3 py-1 rounded-full">
          {currentQ.label}
        </div>
      )}

      {/* Question */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-5">
        {!isSingleQ && subIdx === 0 && (
          <p className="text-gray-600 text-sm mb-3 whitespace-pre-line">{exercise.question}</p>
        )}
        <p className="text-gray-800 font-medium text-base leading-relaxed whitespace-pre-line">
          {currentQuestion}
        </p>
      </div>

      {phase === 'question' ? (
        <div className="space-y-4">
          {/* Input */}
          {currentType === 'multiple-choice' && currentOptions ? (
            <div className="flex flex-col gap-2">
              {currentOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setUserAnswer(opt)}
                  className={`text-left px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                    userAnswer === opt
                      ? 'border-violet-500 bg-violet-50 text-violet-800'
                      : 'border-gray-200 hover:border-violet-300 hover:bg-violet-50/50 text-gray-700'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : currentType === 'comparison' ? (
            <div className="flex gap-3 justify-center">
              {['<', '=', '>'].map((sym) => (
                <button
                  key={sym}
                  onClick={() => setUserAnswer(sym)}
                  className={`w-16 h-16 rounded-2xl border-2 text-2xl font-bold transition-all ${
                    userAnswer === sym
                      ? 'border-violet-500 bg-violet-100 text-violet-700'
                      : 'border-gray-200 hover:border-violet-300 text-gray-600'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
          ) : currentType === 'fraction-input' ? (
            <div className="flex justify-center">
              <FractionInput value={userAnswer} onChange={setUserAnswer} />
            </div>
          ) : (
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ta réponse…"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:border-violet-400 text-base"
            />
          )}

          {/* Hint */}
          {showHint ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
              💡 <span className="font-semibold">Indice :</span> {exercise.hint}
            </div>
          ) : (
            <button
              onClick={() => {
                setShowHint(true);
                setUsedHint(true);
              }}
              className="text-sm text-gray-400 hover:text-amber-600 transition-colors"
            >
              💡 Voir un indice (-5 XP)
            </button>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!userAnswer.trim()}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold py-3.5 rounded-2xl hover:opacity-90 disabled:opacity-40 transition-all shadow-sm"
          >
            Vérifier ma réponse →
          </button>

          {/* Ask tutor */}
          <Link
            href={`/tutor?section=${sectionSlug}`}
            className="block text-center text-sm text-violet-500 hover:text-violet-700 transition-colors"
          >
            💬 Demander de l'aide à Mathis
          </Link>
        </div>
      ) : (
        <AnswerFeedback
          correct={correct}
          explanation={currentExplanation}
          onNext={handleNext}
          onRetry={correct ? undefined : handleRetry}
          xpEarned={xpEarned}
          correctAnswer={!correct ? (Array.isArray(currentAnswer) ? currentAnswer[0] : currentAnswer) : undefined}
        />
      )}
    </div>
  );
}
