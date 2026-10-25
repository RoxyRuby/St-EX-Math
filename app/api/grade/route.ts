import Anthropic from '@anthropic-ai/sdk';
import JSZip from 'jszip';
import { writeFile, readFile, unlink, mkdtemp, rm } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import path from 'path';

const execAsync = promisify(exec);

// Extract text from a Word XML part by reading <w:t> elements (the only
// elements that actually hold text runs in OOXML).  Building paragraphs from
// </w:p> boundaries gives correct line breaks without regex tag-stripping.
function xmlToText(xml: string): string {
  const paragraphs: string[] = [];
  // Split on paragraph close tags to get one chunk per paragraph
  for (const paraXml of xml.split(/<\/w:p>/)) {
    // Collect all text runs in this paragraph
    const runs: string[] = [];
    for (const m of paraXml.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)) {
      runs.push(m[1]);
    }
    // Also honour explicit line-breaks and tabs
    const hasBreak = /<w:br[\s/]/.test(paraXml);
    let para = runs.join('');
    if (hasBreak) para += '\n';
    para = para
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
      .replace(/&#x[0-9A-Fa-f]+;/g, '').replace(/&#\d+;/g, '');
    if (para.trim()) paragraphs.push(para.trim());
  }
  return paragraphs.join('\n');
}

// Read every relevant part of a .docx ZIP and concatenate all text.
async function extractWordText(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);

  const partPaths = [
    'word/document.xml',
    'word/header1.xml', 'word/header2.xml', 'word/header3.xml',
    'word/footer1.xml', 'word/footer2.xml', 'word/footer3.xml',
    'word/footnotes.xml',
    'word/endnotes.xml',
  ];

  const chunks: string[] = [];
  for (const p of partPaths) {
    const file = zip.file(p);
    if (!file) continue;
    const xml = await file.async('string');
    const text = xmlToText(xml);
    if (text.length > 0) chunks.push(text);
  }
  return chunks.join('\n\n');
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

  // Point at the bundled worker using an absolute file:// URL so Node.js can load it
  const workerPath = path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `file://${workerPath}`;

  const pdfDocument = await pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true,
  }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? (item as { str: string }).str : ''))
      .join(' ');
    pages.push(pageText);
  }

  return pages.join('\n\n');
}

async function extractPagesText(buffer: Buffer): Promise<string> {
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'pages-grade-'));
  const inputPath = path.join(tmpDir, 'submission.pages');
  const outputPath = path.join(tmpDir, 'submission.txt');
  try {
    await writeFile(inputPath, buffer);
    await execAsync(`/usr/bin/textutil -convert txt -output "${outputPath}" "${inputPath}"`);
    return await readFile(outputPath, 'utf-8');
  } finally {
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function extractText(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return extractPdfText(buffer);
  if (ext === 'pages') return extractPagesText(buffer);
  return extractWordText(buffer); // .doc / .docx
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const maxDuration = 120;

interface SectionGrade {
  score: number; // 1-4
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

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Header patterns for each section (matched against individual short lines)
const HEADER_PATTERNS: Record<string, RegExp[]> = {
  A: [
    /^part\s+a\b/i,
    /^section\s+a\b/i,
    /^a[.:)\s–—-]\s*(?:the\s+)?barren\s+wasteland/i,
    /^(?:the\s+)?barren\s+wasteland\b/i,
    // plain "A" or "A." only when the whole line is just that label
    /^a[.):–—-]?\s*$/i,
  ],
  B: [
    /^part\s+b\b/i,
    /^section\s+b\b/i,
    /^b[.:)\s–—-]\s*shallow\s+holes/i,
    /^b[.:)\s–—-]\s*deep\s+dig/i,
    /^shallow\s+holes\b/i,
    /^deep\s+dig/i,
    /^b[.):–—-]?\s*$/i,
  ],
  C: [
    /^part\s+c\b/i,
    /^section\s+c\b/i,
    /^c[.:)\s–—-]\s*resistance/i,
    /^c[.:)\s–—-]\s*the\s+ping/i,
    /^resistance\s*[&+]\s*the\s+ping/i,
    /^the\s+ping\b/i,
    /^c[.):–—-]?\s*$/i,
  ],
};

function findSectionBoundaries(
  lines: string[],
): { label: string; idx: number }[] {
  const headers: { label: string; idx: number }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Headers are short lines (< 80 chars) — skip long prose lines
    if (!line || line.length > 80) continue;
    for (const [lbl, patterns] of Object.entries(HEADER_PATTERNS)) {
      if (patterns.some(re => re.test(line))) {
        // Avoid duplicate detections for the same label
        if (!headers.find(h => h.label === lbl)) {
          headers.push({ label: lbl, idx: i });
        }
        break;
      }
    }
  }
  return headers.sort((a, b) => a.idx - b.idx);
}

function parseSection(text: string, label: string): string {
  const lines = text.split('\n');
  const headers = findSectionBoundaries(lines);

  const target = headers.find(h => h.label === label.toUpperCase());
  if (!target) return '';

  const next = headers.find(h => h.idx > target.idx);
  const start = target.idx + 1;
  const end = next ? next.idx : lines.length;

  return lines.slice(start, end).filter(l => l.trim()).join('\n').trim();
}

function detectAI(text: string): string[] {
  const suspects = [
    'multifaceted journey', 'delve into', 'in conclusion', 'it is important to note',
    'furthermore', 'moreover', 'in today\'s world', 'plays a crucial role',
    'it is worth noting', 'in summary', 'to summarize', 'as a result of',
    'navigate the complexities', 'foster a deeper understanding',
    'it goes without saying', 'needless to say', 'at the end of the day',
    'in the realm of', 'embark on', 'holistic approach', 'paradigm shift',
    'leverage', 'synergy', 'impactful', 'unpack', 'takeaway',
  ];
  const lower = text.toLowerCase();
  return suspects.filter(p => lower.includes(p));
}

const SYSTEM_PROMPT = `You are a graphic design professor grading short personal reflection journals written by young adults (late teens / early twenties) in a college graphic design program. Many of them have limited experience writing self-reflections. Grade with empathy and realism: reward genuine attempts at honesty and self-awareness, even when the writing is imperfect or informal.

The journal is based on Luke Sullivan's "Hey Whipple, Squeeze This," but students are NOT required to formally cite or apply Sullivan's framework. What matters is whether they are honestly answering the question for that section — not whether they use the right theoretical vocabulary.

Respond ONLY with valid JSON — no markdown, no prose outside the JSON object.`;

const GRADING_PROMPT = (section: 'A' | 'B' | 'C', text: string) => {
  const specs: Record<string, { question: string; lookFor: string; concerns: string }> = {
    A: {
      question: `Part A asks: Describe a moment during your creative process when you felt completely stuck, blocked, or empty — your personal "barren wasteland."`,
      lookFor: `Did they actually describe a specific moment of being stuck? Is there any personal detail that makes it feel real and theirs — even something small like what they were working on, how they felt, or what they did (or didn't do)? Honest, imperfect writing beats polished vagueness. They don't need to name Sullivan or use any specific vocabulary.`,
      concerns: `Vague statements like "I was stressed" with no specifics. A response that could have been written by literally anyone without any real creative experience. Writing that sounds like it was generated by AI (perfectly formal, no genuine voice, suspiciously generic).`,
    },
    B: {
      question: `Part B asks: Describe a moment when you pushed an idea further instead of abandoning it — or when you chose to dig deeper into something rather than start over.`,
      lookFor: `Did they describe a specific creative decision, even briefly? Is there evidence they actually made a choice about their work — to push through, to try something different, to go back to an idea? A short but genuine example beats a long theoretical answer.`,
      concerns: `Only talking about the idea of pushing harder in abstract terms, with no actual example from their own experience. Generic "I learned I should keep trying" without any specific moment. AI-style writing.`,
    },
    C: {
      question: `Part C asks: Describe a moment of resistance during your creative process — when you felt the pull to avoid the work, distract yourself, or take the easy way out. What did you do?`,
      lookFor: `Did they name something specific — a distraction, a feeling, a choice they made? Even "I kept going on my phone" is honest and real. The key is: does the response feel like it actually happened to this specific person? Acknowledging they chose comfort over the hard thing is fine — honesty is more valuable than a triumphant ending.`,
      concerns: `Only describing what one "should" do without any personal moment. Avoiding the question of what they actually chose. Perfectly structured paragraphs with no real voice or vulnerability.`,
    },
  };

  const spec = specs[section];

  return `Grade this graphic design student's Part ${section} reflection.

THE QUESTION BEING ANSWERED:
${spec.question}

WHAT TO LOOK FOR:
${spec.lookFor}

CONCERNS TO FLAG:
${spec.concerns}

RUBRIC:
- Score 4 (Mastery): Answers the question with at least one specific, personal detail. Feels genuinely theirs. Honest, even if the writing is rough or informal. Shows some self-awareness about their creative process.
- Score 3 (Partial Mastery): Answers the question but stays somewhat surface-level or generic. There's a real attempt, and some personal connection, but it could go deeper or be more specific.
- Score 2 (Progressing): Attempts the question but mostly stays abstract or descriptive without any real reflection. Could apply to almost any student. The effort is visible but the personal connection is thin.
- Score 1 (Emerging): Does not meaningfully answer the question, OR shows strong signs of AI generation (no real voice, suspiciously formal/generic, no specific details).

IMPORTANT: These are young students who may not write polished reflections. A genuine but rough answer should score higher than a polished but empty one. Do not penalize informal language, short sentences, or imperfect structure. Focus only on whether they answered the question with some personal honesty.

STUDENT TEXT:
"""
${text}
"""

Respond with ONLY this JSON (no markdown):
{
  "score": <1-4>,
  "comment": "<2-3 sentences: what specifically worked and what, if anything, is missing — written directly to the student in a supportive tone>",
  "strengths": ["<something specific and genuine in their response>", ...],
  "redFlags": ["<specific concern if any>", ...]
}`;
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files.length) {
      return Response.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const results: StudentResult[] = [];

    for (const file of files) {
      const studentNumber = file.name.replace(/\.(docx?|pdf|pages)$/i, '');
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      let rawText = '';
      try {
        rawText = await extractText(buffer, file.name);
      } catch (extractErr) {
        console.error(`[grade] failed to extract text from ${file.name}:`, extractErr);
        results.push({
          studentNumber,
          totalScore: 0,
          totalPercent: 0,
          partA: { score: 0, comment: 'Could not parse document.', strengths: [], redFlags: [] },
          partB: { score: 0, comment: 'Could not parse document.', strengths: [], redFlags: [] },
          partC: { score: 0, comment: 'Could not parse document.', strengths: [], redFlags: [] },
          overallAssessment: 'Document could not be read.',
          strengths: [],
          improvements: [],
          aiSuspicion: false,
          aiPhrases: [],
        });
        continue;
      }

      const textA = parseSection(rawText, 'A');
      const textB = parseSection(rawText, 'B');
      const textC = parseSection(rawText, 'C');

      // Log extraction diagnostics so the dev server terminal shows what's happening
      console.log(`[grade] ${file.name} — extracted ${rawText.length} chars`);
      console.log(`[grade]   Part A: ${countWords(textA)} words | Part B: ${countWords(textB)} words | Part C: ${countWords(textC)} words`);
      if (!textA && !textB && !textC) {
        const lines = rawText.split('\n');
        console.log(`[grade]   No sections found. Newline count: ${lines.length - 1}`);
        console.log(`[grade]   First 300 chars: ${JSON.stringify(rawText.substring(0, 300))}`);
        console.log(`[grade]   Line lengths: ${lines.slice(0, 20).map(l => l.length).join(', ')}`);
      }

      const aiPhrases = detectAI(rawText);

      // If no section labels were found, try to split by paragraph order:
      // assume the student wrote A, B, C as consecutive blocks of text.
      function splitUnlabeled(text: string): [string, string, string] {
        // Split on blank lines first, then on single newlines
        const blocks = text
          .split(/\n{2,}/)
          .map(b => b.trim())
          .filter(Boolean);

        if (blocks.length >= 3) {
          // More than 3 blocks: merge extras into the last section
          const a = blocks[0];
          const b = blocks[1];
          const c = blocks.slice(2).join('\n\n');
          return [a, b, c];
        }
        if (blocks.length === 2) {
          // Two blocks: split the longer one in half for B/C
          const [first, second] = blocks;
          const mid = Math.floor(second.length / 2);
          const splitAt = second.lastIndexOf('\n', mid) > 0
            ? second.lastIndexOf('\n', mid)
            : mid;
          return [first, second.slice(0, splitAt).trim(), second.slice(splitAt).trim()];
        }
        // Single block: split into rough thirds by word count
        const words = text.split(/\s+/);
        const third = Math.floor(words.length / 3);
        return [
          words.slice(0, third).join(' '),
          words.slice(third, third * 2).join(' '),
          words.slice(third * 2).join(' '),
        ];
      }

      const noSectionsDetected = !textA && !textB && !textC;
      let effectiveA = textA, effectiveB = textB, effectiveC = textC;
      if (noSectionsDetected) {
        [effectiveA, effectiveB, effectiveC] = splitUnlabeled(rawText);
        console.log(`[grade]   Split unlabeled: A=${countWords(effectiveA)}w B=${countWords(effectiveB)}w C=${countWords(effectiveC)}w`);
      }

      const gradeSection = async (section: 'A' | 'B' | 'C', text: string): Promise<SectionGrade> => {
        const fallback: SectionGrade = {
          score: 1,
          comment: 'Section not found or too brief to grade.',
          strengths: [],
          redFlags: ['This section appears to be missing or extremely brief.'],
        };

        if (countWords(text) < 10) return fallback;

        try {
          const msg = await client.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 600,
            system: SYSTEM_PROMPT,
            messages: [{ role: 'user', content: GRADING_PROMPT(section, text) }],
          });

          const raw = (msg.content[0] as { type: string; text: string }).text.trim();
          const parsed = JSON.parse(raw);

          return {
            score: Math.min(4, Math.max(1, Number(parsed.score))),
            comment: String(parsed.comment || ''),
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
            redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : [],
          };
        } catch {
          return fallback;
        }
      };

      const [gradeA, gradeB, gradeC] = await Promise.all([
        gradeSection('A', effectiveA),
        gradeSection('B', effectiveB),
        gradeSection('C', effectiveC),
      ]);

      // Score mapping: 4→100%, 3→85%, 2→75%, 1→50%
      const scoreToPercent = (s: number) => [0, 50, 75, 85, 100][s] ?? 50;
      const pA = scoreToPercent(gradeA.score);
      const pB = scoreToPercent(gradeB.score);
      const pC = scoreToPercent(gradeC.score);

      // Each part is worth ~33.3 points
      const totalScore = Math.round((pA + pB + pC) / 3);

      // Generate overall assessment
      let overallAssessment = '';
      let strengths: string[] = [];
      let improvements: string[] = [];

      try {
        const overallMsg = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 512,
          system: SYSTEM_PROMPT,
          messages: [{
            role: 'user',
            content: `These are the section grades for a graphic design student's creative process journal (based on Hey Whipple, Squeeze This). The student is a young adult, likely in their first or second year of a college design program. Write feedback that is direct, honest, and encouraging — not academic.

Part A (${gradeA.score}/4): ${gradeA.comment}
Part B (${gradeB.score}/4): ${gradeB.comment}
Part C (${gradeC.score}/4): ${gradeC.comment}
${aiPhrases.length > 0 ? 'Note: possible AI-generated phrases detected: ' + aiPhrases.join(', ') : ''}

JSON only:
{
  "overallAssessment": "<2-3 sentences addressed directly to the student — acknowledge what they did well, note what's missing, keep it human and encouraging>",
  "strengths": ["<something genuine or specific in their writing>", ...],
  "improvements": ["<one concrete thing they could do differently to score higher — practical, not abstract>", ...]
}`,
          }],
        });

        const raw = (overallMsg.content[0] as { type: string; text: string }).text.trim();
        const parsed = JSON.parse(raw);
        overallAssessment = String(parsed.overallAssessment || '');
        strengths = Array.isArray(parsed.strengths) ? parsed.strengths : [];
        improvements = Array.isArray(parsed.improvements) ? parsed.improvements : [];
      } catch {
        overallAssessment = 'Overall assessment unavailable.';
      }

      results.push({
        studentNumber,
        totalScore,
        totalPercent: totalScore,
        partA: gradeA,
        partB: gradeB,
        partC: gradeC,
        overallAssessment,
        strengths,
        improvements,
        aiSuspicion: aiPhrases.length > 0,
        aiPhrases,
      });
    }

    return Response.json({ results });
  } catch (error) {
    console.error('Grade API error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
