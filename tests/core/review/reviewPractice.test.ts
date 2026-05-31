import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import * as ts from 'typescript';
import { describe, expect, test } from 'vitest';
import type { MistakeStat } from '../../../src/core/progress/model';
import { createReviewPractice } from '../../../src/core/review/reviewPractice';

function projectImportPath(fromDirectory: string, projectPath: string): string {
  const importPath = relative(fromDirectory, resolve(process.cwd(), projectPath)).replace(/\\/g, '/');

  return importPath.startsWith('.') ? importPath : `./${importPath}`;
}

describe('review practice', () => {
  function mistakeStat(overrides: Partial<MistakeStat> = {}): MistakeStat {
    return {
      kanaText: '\u3051',
      expectedRomaji: 'ke',
      count: 1,
      lastMistakeAt: 1_000,
      ...overrides,
    };
  }

  test('creates prompts from mistake stats sorted by highest count first', () => {
    const reviewPractice = createReviewPractice({
      mistakeStats: [
        mistakeStat({ kanaText: '\u3051', expectedRomaji: 'ke', count: 1, lastMistakeAt: 3_000 }),
        mistakeStat({ kanaText: '\u3042', expectedRomaji: 'a', count: 2, lastMistakeAt: 1_000 }),
        mistakeStat({ kanaText: '\u3057', expectedRomaji: 'shi', count: 3, lastMistakeAt: 2_000 }),
      ],
      maxPrompts: 10,
    });

    expect(reviewPractice).toEqual({
      levelId: 'review-mistakes',
      prompts: [
        { kanaText: '\u3057', romaji: 'shi' },
        { kanaText: '\u3042', romaji: 'a' },
        { kanaText: '\u3051', romaji: 'ke' },
      ],
    });
  });

  test('does not mutate the input array or stat objects', () => {
    const shi = mistakeStat({ kanaText: '\u3057', expectedRomaji: 'shi', count: 3, lastMistakeAt: 2_000 });
    const ke = mistakeStat({ kanaText: '\u3051', expectedRomaji: 'ke', count: 1, lastMistakeAt: 3_000 });
    const mistakeStats = [ke, shi];
    const before = structuredClone(mistakeStats);

    const reviewPractice = createReviewPractice({ mistakeStats, maxPrompts: 10 });

    expect(mistakeStats).toEqual(before);
    expect(mistakeStats[0]).toBe(ke);
    expect(mistakeStats[1]).toBe(shi);
    expect(reviewPractice.prompts).not.toBe(mistakeStats);
  });

  test('respects maxPrompts', () => {
    const reviewPractice = createReviewPractice({
      mistakeStats: [
        mistakeStat({ kanaText: '\u3057', expectedRomaji: 'shi', count: 3, lastMistakeAt: 1_000 }),
        mistakeStat({ kanaText: '\u3042', expectedRomaji: 'a', count: 2, lastMistakeAt: 1_000 }),
        mistakeStat({ kanaText: '\u3051', expectedRomaji: 'ke', count: 1, lastMistakeAt: 1_000 }),
      ],
      maxPrompts: 2,
    });

    expect(reviewPractice.prompts).toEqual([
      { kanaText: '\u3057', romaji: 'shi' },
      { kanaText: '\u3042', romaji: 'a' },
    ]);
  });

  test('tie-breaks equal counts by most recent lastMistakeAt first', () => {
    const reviewPractice = createReviewPractice({
      mistakeStats: [
        mistakeStat({ kanaText: '\u3042', expectedRomaji: 'a', count: 2, lastMistakeAt: 1_000 }),
        mistakeStat({ kanaText: '\u3057', expectedRomaji: 'shi', count: 2, lastMistakeAt: 3_000 }),
        mistakeStat({ kanaText: '\u3051', expectedRomaji: 'ke', count: 2, lastMistakeAt: 2_000 }),
      ],
      maxPrompts: 10,
    });

    expect(reviewPractice.prompts).toEqual([
      { kanaText: '\u3057', romaji: 'shi' },
      { kanaText: '\u3051', romaji: 'ke' },
      { kanaText: '\u3042', romaji: 'a' },
    ]);
  });

  test('empty mistakeStats returns review-mistakes with empty prompts', () => {
    const reviewPractice = createReviewPractice({ mistakeStats: [], maxPrompts: 10 });

    expect(reviewPractice).toEqual({
      levelId: 'review-mistakes',
      prompts: [],
    });
  });

  test('returns immutable copy-safe review practice results', () => {
    const reviewPractice = createReviewPractice({
      mistakeStats: [mistakeStat({ kanaText: '\u3057', expectedRomaji: 'shi', count: 2 })],
      maxPrompts: 10,
    });

    expect(Object.isFrozen(reviewPractice)).toBe(true);
    expect(Object.isFrozen(reviewPractice.prompts)).toBe(true);
    expect(Object.isFrozen(reviewPractice.prompts[0])).toBe(true);
  });

  test.each([
    ['zero maxPrompts', { maxPrompts: 0 }, 'Review practice maxPrompts must be a positive integer'],
    ['fractional maxPrompts', { maxPrompts: 1.5 }, 'Review practice maxPrompts must be a positive integer'],
    [
      'unsafe maxPrompts',
      { maxPrompts: Number.MAX_SAFE_INTEGER + 1 },
      'Review practice maxPrompts must be a safe positive integer',
    ],
  ])('rejects invalid maxPrompts: %s', (_caseName, overrides, message) => {
    expect(() =>
      createReviewPractice({
        mistakeStats: [mistakeStat()],
        maxPrompts: 10,
        ...overrides,
      }),
    ).toThrow(message);
  });

  test('rejects non-array mistakeStats with a clear validation error', () => {
    expect(() =>
      createReviewPractice({
        mistakeStats: {} as unknown as readonly MistakeStat[],
        maxPrompts: 10,
      }),
    ).toThrow('mistakeStats must be an array');
  });

  test('rejects non-object mistake stats with a clear validation error', () => {
    expect(() =>
      createReviewPractice({
        mistakeStats: ['not-a-stat' as unknown as MistakeStat],
        maxPrompts: 10,
      }),
    ).toThrow('mistakeStats[0] must be an object');
  });

  test.each([
    ['empty kanaText', mistakeStat({ kanaText: '' }), 'mistakeStats[0].kanaText must not be empty'],
    [
      'non-string kanaText',
      mistakeStat({ kanaText: 42 as unknown as string }),
      'mistakeStats[0].kanaText must be a string',
    ],
    ['whitespace-only kanaText', mistakeStat({ kanaText: '   ' }), 'mistakeStats[0].kanaText must not be empty'],
    ['empty expectedRomaji', mistakeStat({ expectedRomaji: '' }), 'mistakeStats[0].expectedRomaji must not be empty'],
    [
      'non-string expectedRomaji',
      mistakeStat({ expectedRomaji: 42 as unknown as string }),
      'mistakeStats[0].expectedRomaji must be a string',
    ],
    [
      'whitespace-only expectedRomaji',
      mistakeStat({ expectedRomaji: '   ' }),
      'mistakeStats[0].expectedRomaji must not be empty',
    ],
    ['zero count', mistakeStat({ count: 0 }), 'mistakeStats[0].count must be a positive integer'],
    [
      'unsafe count',
      mistakeStat({ count: Number.MAX_SAFE_INTEGER + 1 }),
      'mistakeStats[0].count must be a safe positive integer',
    ],
    [
      'non-finite lastMistakeAt',
      mistakeStat({ lastMistakeAt: Number.POSITIVE_INFINITY }),
      'mistakeStats[0].lastMistakeAt must be a finite timestamp',
    ],
  ])('rejects invalid mistake stat fields: %s', (_caseName, stat, message) => {
    expect(() => createReviewPractice({ mistakeStats: [stat], maxPrompts: 10 })).toThrow(message);
  });

  test('provides a branded level id that can start a practice session without casts', () => {
    const tempDirectory = mkdtempSync(join(tmpdir(), 'review-practice-types-'));
    const contractPath = join(tempDirectory, 'reviewPractice.contract.ts');
    const reviewPracticeImport = projectImportPath(tempDirectory, 'src/core/review/reviewPractice');
    const practiceSessionImport = projectImportPath(tempDirectory, 'src/core/practice/practiceSession');
    const idsImport = projectImportPath(tempDirectory, 'src/core/shared/ids');

    const contractSource = `
      import { createPracticeSession } from '${practiceSessionImport}';
      import { createReviewPractice } from '${reviewPracticeImport}';
      import type { LevelId } from '${idsImport}';

      const review = createReviewPractice({
        mistakeStats: [
          {
            kanaText: '\\u3057',
            expectedRomaji: 'shi',
            count: 2,
            lastMistakeAt: 1_000,
          },
        ],
        maxPrompts: 10,
      });

      const reviewLevelId: LevelId = review.levelId;

      createPracticeSession({
        levelId: review.levelId,
        prompts: review.prompts,
        maxMistakes: 4,
        startedAt: 2_000,
      });

      void reviewLevelId;
    `;

    let diagnosticsText = '';

    try {
      writeFileSync(contractPath, contractSource);

      const program = ts.createProgram([contractPath], {
        noEmit: true,
        strict: true,
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        skipLibCheck: true,
        types: [],
      });
      const diagnostics = ts.getPreEmitDiagnostics(program);

      diagnosticsText = ts.formatDiagnosticsWithColorAndContext(diagnostics, {
        getCanonicalFileName: (fileName) => fileName,
        getCurrentDirectory: () => process.cwd(),
        getNewLine: () => '\n',
      });
    } finally {
      rmSync(tempDirectory, { recursive: true, force: true });
    }

    expect(diagnosticsText).toBe('');
  });
});
