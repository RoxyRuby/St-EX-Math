'use client';

interface AnswerFeedbackProps {
  correct: boolean;
  explanation: string;
  onNext: () => void;
  onRetry?: () => void;
  xpEarned: number;
  correctAnswer?: string;
}

const encouragingCorrect = [
  'Excellent ! 🎉',
  'Bravo ! Tu es brillante ! ⭐',
  'Parfait ! Continue comme ça ! 🚀',
  'Super ! Tu maîtrises ça ! 💪',
  'Génial ! 🌟',
];

const encouragingWrong = [
  'Pas tout à fait, mais tu peux y arriver !',
  'Presque ! Regarde bien l\’explication.',
  'Continue d\’essayer, tu vas comprendre !',
  'C\’est en essayant qu\’on apprend !',
];

export default function AnswerFeedback({
  correct,
  explanation,
  onNext,
  onRetry,
  xpEarned,
  correctAnswer,
}: AnswerFeedbackProps) {
  const encouragement = correct
    ? encouragingCorrect[Math.floor(Math.random() * encouragingCorrect.length)]
    : encouragingWrong[Math.floor(Math.random() * encouragingWrong.length)];

  return (
    <div
      className={`rounded-2xl p-5 border-2 ${
        correct
          ? 'bg-emerald-50 border-emerald-300'
          : 'bg-red-50 border-red-300'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{correct ? '✅' : '❌'}</span>
        <div>
          <p className="font-bold text-gray-800">{encouragement}</p>
          {correct && xpEarned > 0 && (
            <p className="text-sm text-emerald-600 font-semibold">+{xpEarned} XP gagné !</p>
          )}
          {!correct && correctAnswer && (
            <p className="text-sm text-gray-600">
              Bonne réponse : <span className="font-bold text-red-700">{correctAnswer}</span>
            </p>
          )}
        </div>
      </div>

      {/* Explanation */}
      <div className="bg-white/70 rounded-xl p-4 mb-4">
        <p className="text-sm font-semibold text-gray-700 mb-1">📖 Explication :</p>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{explanation}</p>
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        {!correct && onRetry && (
          <button
            onClick={onRetry}
            className="flex-1 bg-white border-2 border-gray-300 text-gray-700 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Essayer encore
          </button>
        )}
        <button
          onClick={onNext}
          className={`flex-1 font-semibold py-2.5 rounded-xl transition-colors ${
            correct
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-gray-800 hover:bg-gray-900 text-white'
          }`}
        >
          {correct ? 'Question suivante →' : 'Continuer →'}
        </button>
      </div>
    </div>
  );
}
