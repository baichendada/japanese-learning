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
});
