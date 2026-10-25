import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
} from 'docx';
import JSZip from 'jszip';

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
  4: 'Mastery (90-100%)',
  3: 'Partial Mastery (80-89%)',
  2: 'Progressing (70-79%)',
  1: 'Emerging (0-69%)',
};

const SCORE_COLORS: Record<number, string> = {
  4: '2E7D32',
  3: '1565C0',
  2: 'E65100',
  1: 'B71C1C',
};

function scoreToPercent(s: number): number {
  return ([0, 50, 75, 85, 100][s] ?? 50);
}

function makeParagraph(text: string, bold = false, color?: string, heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel]): Paragraph {
  return new Paragraph({
    heading,
    children: [
      new TextRun({
        text,
        bold,
        color: color ?? '000000',
        size: heading ? undefined : 22,
      }),
    ],
  });
}

function makeBullet(text: string, color?: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    children: [new TextRun({ text, color: color ?? '000000', size: 22 })],
  });
}

function makeSectionBlock(
  label: string,
  grade: SectionGrade,
): Paragraph[] {
  const pct = scoreToPercent(grade.score);
  const label_ = SCORE_LABELS[grade.score] ?? 'N/A';
  const color = SCORE_COLORS[grade.score] ?? '000000';
  const paras: Paragraph[] = [];

  paras.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: label, bold: true, size: 28 })],
      spacing: { before: 300, after: 60 },
    }),
  );

  paras.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Grade: ', bold: true, size: 22 }),
        new TextRun({ text: `${label_} — ${pct}%`, bold: true, color, size: 22 }),
      ],
      spacing: { after: 120 },
    }),
  );

  paras.push(makeParagraph(grade.comment, false, '222222'));
  paras.push(new Paragraph({ children: [] }));

  if (grade.strengths.length) {
    paras.push(makeParagraph('What worked:', true, '1A5276'));
    grade.strengths.forEach(s => paras.push(makeBullet(s, '1A5276')));
    paras.push(new Paragraph({ children: [] }));
  }

  if (grade.redFlags.length) {
    paras.push(makeParagraph('Areas of concern:', true, '922B21'));
    grade.redFlags.forEach(f => paras.push(makeBullet(f, '922B21')));
    paras.push(new Paragraph({ children: [] }));
  }

  return paras;
}

function buildStudentDoc(r: StudentResult): Document {
  const gradeLabel = SCORE_LABELS[
    r.totalScore >= 90 ? 4 : r.totalScore >= 80 ? 3 : r.totalScore >= 70 ? 2 : 1
  ];
  const gradeColor = SCORE_COLORS[
    r.totalScore >= 90 ? 4 : r.totalScore >= 80 ? 3 : r.totalScore >= 70 ? 2 : 1
  ];

  const sections = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: `Self-Reflection Feedback — Student ${r.studentNumber}`, bold: true, size: 36 })],
      spacing: { after: 200 },
    }),

    new Paragraph({
      children: [
        new TextRun({ text: 'Overall Grade: ', bold: true, size: 26 }),
        new TextRun({ text: `${r.totalScore}/100 — ${gradeLabel}`, bold: true, color: gradeColor, size: 26 }),
      ],
      spacing: { after: 80 },
    }),

    ...(r.aiSuspicion ? [
      new Paragraph({
        shading: { type: ShadingType.SOLID, color: 'FFF3CD', fill: 'FFF3CD' },
        children: [
          new TextRun({ text: '⚠ AI-Generation Flag: ', bold: true, color: '856404', size: 22 }),
          new TextRun({ text: 'Phrases detected: ' + r.aiPhrases.join(', '), color: '856404', size: 22 }),
        ],
        spacing: { after: 120 },
      }),
    ] : []),

    new Paragraph({ children: [], spacing: { after: 100 } }),

    ...makeSectionBlock('Part A: The Barren Wasteland', r.partA),
    ...makeSectionBlock('Part B: Shallow Holes vs. Deep Digs', r.partB),
    ...makeSectionBlock('Part C: Resistance & The Ping', r.partC),

    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: 'Overall Assessment', bold: true, size: 28 })],
      spacing: { before: 300, after: 80 },
    }),
    makeParagraph(r.overallAssessment, false, '222222'),
    new Paragraph({ children: [] }),

    ...(r.strengths.length ? [
      makeParagraph('Specific Strengths', true, '1A5276'),
      ...r.strengths.map(s => makeBullet(s, '1A5276')),
      new Paragraph({ children: [] }),
    ] : []),

    ...(r.improvements.length ? [
      makeParagraph('Areas for Improvement', true, '922B21'),
      ...r.improvements.map(i => makeBullet(i, '922B21')),
    ] : []),
  ];

  return new Document({
    sections: [{ properties: {}, children: sections }],
  });
}

function buildSummaryDoc(results: StudentResult[]): Document {
  const sorted = [...results].sort((a, b) => b.totalScore - a.totalScore);

  const headerRow = new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Student #', bold: true })] })] }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Part A', bold: true })] })] }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Part B', bold: true })] })] }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Part C', bold: true })] })] }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Total', bold: true })] })] }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Level', bold: true })] })] }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'AI Flag', bold: true })] })] }),
    ],
    tableHeader: true,
  });

  const dataRows = sorted.map(r => {
    const pA = scoreToPercent(r.partA.score);
    const pB = scoreToPercent(r.partB.score);
    const pC = scoreToPercent(r.partC.score);
    const level = r.totalScore >= 90 ? 'Mastery' : r.totalScore >= 80 ? 'Partial' : r.totalScore >= 70 ? 'Progressing' : 'Emerging';
    return new TableRow({
      children: [
        new TableCell({ children: [new Paragraph(r.studentNumber)] }),
        new TableCell({ children: [new Paragraph(`${pA}%`)] }),
        new TableCell({ children: [new Paragraph(`${pB}%`)] }),
        new TableCell({ children: [new Paragraph(`${pC}%`)] }),
        new TableCell({ children: [new Paragraph(`${r.totalScore}%`)] }),
        new TableCell({ children: [new Paragraph(level)] }),
        new TableCell({ children: [new Paragraph(r.aiSuspicion ? 'YES' : '')] }),
      ],
    });
  });

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, size: 1 },
    },
    rows: [headerRow, ...dataRows],
  });

  const avg = results.length
    ? Math.round(results.reduce((s, r) => s + r.totalScore, 0) / results.length)
    : 0;

  const dist = { mastery: 0, partial: 0, progressing: 0, emerging: 0 };
  results.forEach(r => {
    if (r.totalScore >= 90) dist.mastery++;
    else if (r.totalScore >= 80) dist.partial++;
    else if (r.totalScore >= 70) dist.progressing++;
    else dist.emerging++;
  });

  return new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'Self-Reflection Grades — Summary Report', bold: true, size: 36 })],
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Total submissions: ${results.length}   |   Class average: ${avg}%   |   ` }),
            new TextRun({ text: `Mastery: ${dist.mastery}  Partial: ${dist.partial}  Progressing: ${dist.progressing}  Emerging: ${dist.emerging}`, bold: true }),
          ],
          spacing: { after: 300 },
        }),
        table,
        new Paragraph({ children: [], spacing: { before: 300 } }),
        new Paragraph({
          children: [new TextRun({ text: 'AI Flagged Submissions', bold: true, size: 24 })],
          spacing: { after: 100 },
        }),
        ...results
          .filter(r => r.aiSuspicion)
          .flatMap(r => [
            makeBullet(`${r.studentNumber}: ${r.aiPhrases.join(', ')}`, '856404'),
          ]),
        ...(results.filter(r => r.aiSuspicion).length === 0
          ? [makeParagraph('None detected.', false, '555555')]
          : []),
      ],
    }],
  });
}

export async function POST(request: Request) {
  try {
    const { results } = (await request.json()) as { results: StudentResult[] };
    if (!results?.length) {
      return new Response('No results provided', { status: 400 });
    }

    const zip = new JSZip();
    const feedback = zip.folder('feedback');

    for (const r of results) {
      const doc = buildStudentDoc(r);
      const buf = await Packer.toBuffer(doc);
      feedback!.file(`${r.studentNumber}_feedback.docx`, buf);
    }

    const summaryDoc = buildSummaryDoc(results);
    const summaryBuf = await Packer.toBuffer(summaryDoc);
    zip.file('summary_report.docx', summaryBuf);

    const zipBuf = await zip.generateAsync({ type: 'nodebuffer' });

    return new Response(new Uint8Array(zipBuf), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="grading_results.zip"',
      },
    });
  } catch (error) {
    console.error('Download route error:', error);
    return new Response('Server error', { status: 500 });
  }
}
