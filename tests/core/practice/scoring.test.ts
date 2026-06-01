import { describe, expect, test } from 'vitest';
import { scorePracticeSession } from '../../../src/core/practice/scoring';

describe('practice scoring', () => {
  test('passes when accuracy reaches the level threshold', () => {
    const score = scorePracticeSession({
      completedPrompts: 20,
      mistakeCount: 2,
      startedAt: 0,
      endedAt: 60_000,
      passAccuracy: 0.9,
    });

    expect(score).toEqual({
      accuracy: 0.909,
      kanaPerMinute: 20,
      passed: true,
      stars: 2,
    });
  });

  test('uses raw accuracy for pass decisions before returning rounded accuracy', () => {
    const score = scorePracticeSession({
      completedPrompts: 8995,
      mistakeCount: 1005,
      startedAt: 0,
      endedAt: 60_000,
      passAccuracy: 0.9,
    });

    expect(score.accuracy).toBe(0.9);
    expect(score.passed).toBe(false);
    expect(score.stars).toBe(0);
  });

  test('speed affects stars but not pass state', () => {
    const slowScore = scorePracticeSession({
      completedPrompts: 20,
      mistakeCount: 0,
      startedAt: 0,
      endedAt: 120_000,
      passAccuracy: 1,
    });
    const fastScore = scorePracticeSession({
      completedPrompts: 20,
      mistakeCount: 0,
      startedAt: 0,
      endedAt: 30_000,
      passAccuracy: 1,
    });

    expect(slowScore).toMatchObject({
      kanaPerMinute: 10,
      passed: true,
      stars: 2,
    });
    expect(fastScore).toMatchObject({
      kanaPerMinute: 40,
      passed: true,
      stars: 3,
    });
  });

  test('uses raw speed for the three-star threshold before returning rounded speed', () => {
    const score = scorePracticeSession({
      completedPrompts: 3999,
      mistakeCount: 0,
      startedAt: 0,
      endedAt: 6_000_000,
      passAccuracy: 1,
    });

    expect(score.kanaPerMinute).toBe(40);
    expect(score.passed).toBe(true);
    expect(score.stars).toBe(2);
  });

  test('uses raw speed for the two-star threshold before returning rounded speed', () => {
    const score = scorePracticeSession({
      completedPrompts: 999,
      mistakeCount: 0,
      startedAt: 0,
      endedAt: 6_000_000,
      passAccuracy: 1,
    });

    expect(score.kanaPerMinute).toBe(10);
    expect(score.passed).toBe(true);
    expect(score.stars).toBe(1);
  });

  test('failed scores receive zero stars', () => {
    const score = scorePracticeSession({
      completedPrompts: 8,
      mistakeCount: 4,
      startedAt: 0,
      endedAt: 60_000,
      passAccuracy: 0.8,
    });

    expect(score.passed).toBe(false);
    expect(score.stars).toBe(0);
  });

  test('zero attempts have zero accuracy', () => {
    const score = scorePracticeSession({
      completedPrompts: 0,
      mistakeCount: 0,
      startedAt: 0,
      endedAt: 60_000,
      passAccuracy: 0.8,
    });

    expect(score.accuracy).toBe(0);
    expect(score.passed).toBe(false);
    expect(score.stars).toBe(0);
  });

  test('very short elapsed time clamps to one second', () => {
    const score = scorePracticeSession({
      completedPrompts: 2,
      mistakeCount: 0,
      startedAt: 1_000,
      endedAt: 1_000,
      passAccuracy: 1,
    });

    expect(score.kanaPerMinute).toBe(120);
    expect(score.passed).toBe(true);
    expect(score.stars).toBe(3);
  });

  test('rejects negative counts', () => {
    expect(() =>
      scorePracticeSession({
        completedPrompts: -1,
        mistakeCount: 0,
        startedAt: 0,
        endedAt: 60_000,
        passAccuracy: 0.8,
      }),
    ).toThrow('completedPrompts must be a finite non-negative integer');

    expect(() =>
      scorePracticeSession({
        completedPrompts: 0,
        mistakeCount: -1,
        startedAt: 0,
        endedAt: 60_000,
        passAccuracy: 0.8,
      }),
    ).toThrow('mistakeCount must be a finite non-negative integer');
  });

  test.each([
    ['completedPrompts', Number.POSITIVE_INFINITY, 'completedPrompts must be a finite non-negative integer'],
    ['mistakeCount', Number.NaN, 'mistakeCount must be a finite non-negative integer'],
    ['startedAt', Number.NEGATIVE_INFINITY, 'startedAt must be a finite timestamp'],
    ['endedAt', Number.POSITIVE_INFINITY, 'endedAt must be a finite timestamp'],
    ['passAccuracy', Number.NaN, 'passAccuracy must be a finite number between 0 and 1'],
  ])('rejects non-finite %s values', (field, value, message) => {
    expect(() =>
      scorePracticeSession({
        completedPrompts: field === 'completedPrompts' ? value : 1,
        mistakeCount: field === 'mistakeCount' ? value : 0,
        startedAt: field === 'startedAt' ? value : 0,
        endedAt: field === 'endedAt' ? value : 60_000,
        passAccuracy: field === 'passAccuracy' ? value : 0.8,
      }),
    ).toThrow(message);
  });

  test.each([
    [-0.001],
    [1.001],
  ])('rejects passAccuracy outside the inclusive unit interval: %s', (passAccuracy) => {
    expect(() =>
      scorePracticeSession({
        completedPrompts: 1,
        mistakeCount: 0,
        startedAt: 0,
        endedAt: 60_000,
        passAccuracy,
      }),
    ).toThrow('passAccuracy must be a finite number between 0 and 1');
  });

  test('rejects sessions that end before they start', () => {
    expect(() =>
      scorePracticeSession({
        completedPrompts: 1,
        mistakeCount: 0,
        startedAt: 60_000,
        endedAt: 59_999,
        passAccuracy: 0.8,
      }),
    ).toThrow('endedAt must be greater than or equal to startedAt');
  });
});
