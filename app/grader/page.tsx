'use client';

import { useState, useCallback, useRef } from 'react';

interface SectionGrade {
  score: number;
  comment: string;
  strengths: string[];
  redFlags: string[];
}

interface StudentResult {
  studentNumber: string;
  totalScore: number;
  totalPercent: number;
  partA: SectionGrade;
  partB: SectionGrade;
  partC: SectionGrade;
  overallAssessment: string;
  strengths: string[];
  improvements: string[];
  aiSuspicion: boolean;
  aiPhrases: string[];
}

const SCORE_LABELS: Record<number, string> = {
  4: 'Mastery',
  3: 'Partial Mastery',
  2: 'Progressing',
  1: 'Emerging',
};

const SCORE_COLORS: Record<number, string> = {
  4: 'bg-green-100 text-green-800 border-green-300',
  3: 'bg-blue-100 text-blue-800 border-blue-300',
  2: 'bg-orange-100 text-orange-800 border-orange-300',
  1: 'bg-red-100 text-red-800 border-red-300',
};

const SCORE_DOT: Record<number, string> = {
  4: 'bg-green-500',
  3: 'bg-blue-500',
  2: 'bg-orange-500',
  1: 'bg-red-500',
};

function scoreToPercent(s: number): number {
  return ([0, 50, 75, 85, 100][s] ?? 50);
}

function ScoreBadge({ score }: { score: number }) {
  const pct = scoreToPercent(score);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${SCORE_COLORS[score] ?? ''}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${SCORE_DOT[score] ?? 'bg-gray-400'}`} />
      {SCORE_LABELS[score] ?? 'N/A'} — {pct}%
    </span>
  );
}

function SectionCard({ title, grade }: { title: string; grade: SectionGrade }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-800 text-sm">{title}</span>
          <ScoreBadge score={grade.score} />
        </div>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-4 py-3 space-y-3 bg-white">
          <p className="text-sm text-gray-700">{grade.comment}</p>

          {grade.strengths.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">What worked</p>
              <ul className="space-y-1">
                {grade.strengths.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-blue-800">
                    <span className="mt-0.5 shrink-0 text-blue-400">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {grade.redFlags.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">Concerns</p>
              <ul className="space-y-1">
                {grade.redFlags.map((f, i) => (
                  <li key={i} className="flex gap-2 text-sm text-red-800">
                    <span className="mt-0.5 shrink-0 text-red-400">!</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StudentCard({ result }: { result: StudentResult }) {
  const [open, setOpen] = useState(false);
  const levelScore = result.totalScore >= 90 ? 4 : result.totalScore >= 80 ? 3 : result.totalScore >= 70 ? 2 : 1;

  return (
    <div className={`rounded-xl border-2 overflow-hidden ${result.aiSuspicion ? 'border-amber-400' : 'border-gray-200'}`}>
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-4">
          <div className="text-center min-w-[3rem]">
            <div className={`text-2xl font-bold ${result.totalScore >= 90 ? 'text-green-600' : result.totalScore >= 80 ? 'text-blue-600' : result.totalScore >= 70 ? 'text-orange-600' : 'text-red-600'}`}>
              {result.totalScore}
            </div>
            <div className="text-xs text-gray-400">/ 100</div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900">{result.studentNumber}</span>
              {result.aiSuspicion && (
                <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-800 border border-amber-300 rounded-full px-2 py-0.5 font-semibold">
                  ⚠ AI Flagged
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              {[result.partA, result.partB, result.partC].map((p, i) => (
                <span key={i} className={`text-xs font-medium px-1.5 py-0.5 rounded ${SCORE_COLORS[p.score] ?? ''}`}>
                  {['A', 'B', 'C'][i]}: {scoreToPercent(p.score)}%
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-semibold px-3 py-1 rounded-full border ${SCORE_COLORS[levelScore] ?? ''}`}>
            {SCORE_LABELS[levelScore]}
          </span>
          <svg className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-200 px-5 py-4 bg-white space-y-4">
          {result.aiSuspicion && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <p className="text-sm font-semibold text-amber-800 mb-1">Potential AI-generated content detected</p>
              <p className="text-xs text-amber-700">Phrases found: {result.aiPhrases.join(', ')}</p>
            </div>
          )}

          <div className="space-y-2">
            <SectionCard title="Part A — The Barren Wasteland" grade={result.partA} />
            <SectionCard title="Part B — Shallow Holes vs. Deep Digs" grade={result.partB} />
            <SectionCard title="Part C — Resistance & The Ping" grade={result.partC} />
          </div>

          <div className="bg-gray-50 rounded-lg px-4 py-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Overall Assessment</p>
            <p className="text-sm text-gray-800">{result.overallAssessment}</p>
          </div>

          {result.strengths.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1.5">Specific Strengths</p>
              <ul className="space-y-1">
                {result.strengths.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-blue-900">
                    <span className="text-blue-400 shrink-0 mt-0.5">✓</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.improvements.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-1.5">Areas for Improvement</p>
              <ul className="space-y-1">
                {result.improvements.map((imp, i) => (
                  <li key={i} className="flex gap-2 text-sm text-orange-900">
                    <span className="text-orange-400 shrink-0 mt-0.5">→</span>{imp}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function GraderPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<'idle' | 'grading' | 'done' | 'error'>('idle');
  const [results, setResults] = useState<StudentResult[]>([]);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((incoming: File[]) => {
    const docx = incoming.filter(f => /\.(docx?|pdf|pages)$/i.test(f.name));
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name));
      return [...prev, ...docx.filter(f => !names.has(f.name))];
    });
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, [addFiles]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
  };

  const removeFile = (name: string) => {
    setFiles(prev => prev.filter(f => f.name !== name));
  };

  const grade = async () => {
    if (!files.length) return;
    setStatus('grading');
    setError('');
    try {
      const fd = new FormData();
      files.forEach(f => fd.append('files', f));
      const res = await fetch('/api/grade', { method: 'POST', body: fd });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResults(data.results);
      setStatus('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      setStatus('error');
    }
  };

  const download = async () => {
    if (!results.length) return;
    setDownloading(true);
    try {
      const res = await fetch('/api/grade/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results }),
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'grading_results.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const reset = () => {
    setFiles([]);
    setResults([]);
    setStatus('idle');
    setError('');
  };

  const avg = results.length ? Math.round(results.reduce((s, r) => s + r.totalScore, 0) / results.length) : 0;
  const dist = { mastery: 0, partial: 0, progressing: 0, emerging: 0 };
  results.forEach(r => {
    if (r.totalScore >= 90) dist.mastery++;
    else if (r.totalScore >= 80) dist.partial++;
    else if (r.totalScore >= 70) dist.progressing++;
    else dist.emerging++;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Hey Whipple Reflection Grader</h1>
          <p className="mt-1 text-slate-500 text-sm">Upload student .docx submissions (filename = student number). AI grades Parts A, B & C against the rubric.</p>
        </div>

        {status === 'idle' || status === 'error' ? (
          <div className="space-y-6">
            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${dragging ? 'border-violet-400 bg-violet-50' : 'border-gray-300 hover:border-violet-400 hover:bg-violet-50/40'}`}
              aria-label="Upload area for Word, PDF, or Pages documents"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Drop Word documents here</p>
                  <p className="text-sm text-slate-400 mt-0.5">or click to browse — .docx, .pdf, .pages</p>
                </div>
              </div>
              <input ref={inputRef} type="file" multiple accept=".doc,.docx,.pdf,.pages" className="hidden" onChange={onInputChange} />
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {files.map(f => (
                  <div key={f.name} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${/\.pdf$/i.test(f.name) ? 'bg-red-50 text-red-500' : /\.pages$/i.test(f.name) ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
                        {/\.pdf$/i.test(f.name) ? 'PDF' : /\.pages$/i.test(f.name) ? 'PAG' : 'DOC'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{f.name}</p>
                        <p className="text-xs text-slate-400">{(f.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); removeFile(f.name); }} className="text-gray-300 hover:text-red-400 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">{error}</div>
            )}

            <button
              onClick={grade}
              disabled={!files.length}
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold transition-colors"
            >
              Grade {files.length > 0 ? `${files.length} submission${files.length > 1 ? 's' : ''}` : 'submissions'}
            </button>
          </div>
        ) : status === 'grading' ? (
          <div className="flex flex-col items-center gap-6 py-20">
            <div className="w-14 h-14 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
            <div className="text-center">
              <p className="font-semibold text-slate-700">Grading {files.length} submission{files.length > 1 ? 's' : ''}…</p>
              <p className="text-sm text-slate-400 mt-1">Claude is reading each reflection and applying the rubric. This may take a minute.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary stats */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-2xl font-bold text-slate-900">{results.length} graded</p>
                  <p className="text-sm text-slate-500 mt-0.5">Class average: <span className="font-semibold text-slate-700">{avg}/100</span></p>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {[
                    { label: 'Mastery', val: dist.mastery, color: 'bg-green-100 text-green-800' },
                    { label: 'Partial', val: dist.partial, color: 'bg-blue-100 text-blue-800' },
                    { label: 'Progressing', val: dist.progressing, color: 'bg-orange-100 text-orange-800' },
                    { label: 'Emerging', val: dist.emerging, color: 'bg-red-100 text-red-800' },
                  ].map(d => (
                    <div key={d.label} className={`px-3 py-1.5 rounded-lg text-center ${d.color}`}>
                      <div className="text-xl font-bold">{d.val}</div>
                      <div className="text-xs">{d.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              {results.some(r => r.aiSuspicion) && (
                <div className="mt-4 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
                  <span>⚠</span>
                  <span><strong>{results.filter(r => r.aiSuspicion).length}</strong> submission{results.filter(r => r.aiSuspicion).length > 1 ? 's' : ''} flagged for potential AI generation</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={download}
                disabled={downloading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-700 disabled:bg-slate-300 text-white text-sm font-semibold transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {downloading ? 'Generating…' : 'Download .docx reports + summary'}
              </button>
              <button onClick={reset} className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-medium text-slate-600 transition-colors">
                Grade new batch
              </button>
            </div>

            {/* Results */}
            <div className="space-y-3">
              {[...results]
                .sort((a, b) => b.totalScore - a.totalScore)
                .map(r => <StudentCard key={r.studentNumber} result={r} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
