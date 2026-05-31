import { describe, expect, test } from 'vitest';
import type { MistakeStat } from '../../../src/core/progress/model';
import { createReviewPractice } from '../../../src/core/review/reviewPractice';

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

  test.each([
    ['empty kanaText', mistakeStat({ kanaText: '' }), 'mistakeStats[0].kanaText must not be empty'],
    ['empty expectedRomaji', mistakeStat({ expectedRomaji: '' }), 'mistakeStats[0].expectedRomaji must not be empty'],
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
});
