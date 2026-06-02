import { describe, expect, test } from 'vitest';
import { getLevelById } from '../../../src/core/learning-content/levelCatalog';
import type { UnlockRule } from '../../../src/core/learning-content/levelCatalog';
import { courseId, levelId } from '../../../src/core/shared/ids';
import type { LevelResult, ProgressState } from '../../../src/core/progress/model';
import { createEmptyProgress, getNextPlayableLevel, isLevelUnlocked, recordLevelResult } from '../../../src/core/progress/progress';

describe('progress aggregate', () => {
  const hiraganaBasic = courseId('hiragana-basic');
  const hiraganaA = levelId('hiragana-a');
  const hiraganaAReview = levelId('hiragana-a-review');

  function result(overrides: Partial<LevelResult> = {}): LevelResult {
    return {
      levelId: hiraganaA,
      courseId: hiraganaBasic,
      passed: true,
      accuracy: 0.95,
      kanaPerMinute: 24,
      stars: 2,
      completedAt: 1_000,
      ...overrides,
    };
  }

  test('starts on the opening hiragana level with sound helpers enabled', () => {
    const progress = createEmptyProgress();

    expect(progress).toEqual({
      schemaVersion: 1,
      activeCourseId: courseId('hiragana-basic'),
      activeLevelId: levelId('hiragana-a'),
      levelResults: [],
      mistakeStats: [],
      settings: {
        keySoundEnabled: true,
        kanaSoundEnabled: true,
        helperVisible: true,
      },
    });
  });

  test('unlocks a next level only after the previous level has a passed result', () => {
    const nextLevelRule: UnlockRule = {
      type: 'previous-level-passed',
      previousLevelId: hiraganaA,
    };
    const progress = recordLevelResult(createEmptyProgress(), result());

    expect(isLevelUnlocked(progress, nextLevelRule)).toBe(true);
  });

  test('returns the next unlocked level in course order', () => {
    const afterA = recordLevelResult(createEmptyProgress(), result());

    expect(getNextPlayableLevel(afterA, hiraganaA)?.id).toBe(hiraganaAReview);

    const afterReview = recordLevelResult(afterA, result({ levelId: hiraganaAReview }));

    expect(getNextPlayableLevel(afterReview, hiraganaAReview)?.id).toBe(levelId('hiragana-ka'));
    expect(getNextPlayableLevel(afterReview, levelId('hiragana-ka'))).toBeUndefined();
  });

  test('always rules unlock and previous-level rules stay locked for missing or failed results', () => {
    const previousLevelRule: UnlockRule = {
      type: 'previous-level-passed',
      previousLevelId: hiraganaA,
    };
    const failedProgress = recordLevelResult(
      createEmptyProgress(),
      result({ passed: false, accuracy: 0.4, stars: 0 }),
    );

    expect(isLevelUnlocked(createEmptyProgress(), { type: 'always' })).toBe(true);
    expect(isLevelUnlocked(createEmptyProgress(), previousLevelRule)).toBe(false);
    expect(isLevelUnlocked(failedProgress, previousLevelRule)).toBe(false);
  });

  test('does not unlock from imported progress with a non-boolean passed value', () => {
    const corruptedProgress = {
      ...createEmptyProgress(),
      levelResults: [{ ...result(), passed: 'false' }],
    } as unknown as ProgressState;
    const previousLevelRule: UnlockRule = {
      type: 'previous-level-passed',
      previousLevelId: hiraganaA,
    };

    expect(isLevelUnlocked(corruptedProgress, previousLevelRule)).toBe(false);
  });

  test('keeps the better result for the same level', () => {
    const progress = recordLevelResult(createEmptyProgress(), result({ stars: 2, accuracy: 0.98 }));
    const afterWorseAttempt = recordLevelResult(progress, result({ stars: 1, accuracy: 1, kanaPerMinute: 120 }));
    const afterBetterAttempt = recordLevelResult(progress, result({ stars: 3, accuracy: 0.92, kanaPerMinute: 18 }));

    expect(afterWorseAttempt.levelResults).toEqual([result({ stars: 2, accuracy: 0.98 })]);
    expect(afterBetterAttempt.levelResults).toEqual([result({ stars: 3, accuracy: 0.92, kanaPerMinute: 18 })]);
  });

  test('uses accuracy, speed, and completed time as tie-breakers after stars', () => {
    const baseProgress = recordLevelResult(
      createEmptyProgress(),
      result({ stars: 2, accuracy: 0.91, kanaPerMinute: 20, completedAt: 1_000 }),
    );
    const higherAccuracy = recordLevelResult(
      baseProgress,
      result({ stars: 2, accuracy: 0.92, kanaPerMinute: 15, completedAt: 900 }),
    );
    const higherSpeed = recordLevelResult(
      baseProgress,
      result({ stars: 2, accuracy: 0.91, kanaPerMinute: 21, completedAt: 900 }),
    );
    const newerCompletion = recordLevelResult(
      baseProgress,
      result({ stars: 2, accuracy: 0.91, kanaPerMinute: 20, completedAt: 1_001 }),
    );

    expect(higherAccuracy.levelResults[0]).toEqual(result({ stars: 2, accuracy: 0.92, kanaPerMinute: 15, completedAt: 900 }));
    expect(higherSpeed.levelResults[0]).toEqual(result({ stars: 2, accuracy: 0.91, kanaPerMinute: 21, completedAt: 900 }));
    expect(newerCompletion.levelResults[0]).toEqual(result({ stars: 2, accuracy: 0.91, kanaPerMinute: 20, completedAt: 1_001 }));
  });

  test('keeps a passed best result over a newer failed result with otherwise tied fields', () => {
    const importedProgressWithPassedBest = {
      ...createEmptyProgress(),
      levelResults: [result({ passed: true, stars: 0, accuracy: 0.9, kanaPerMinute: 30, completedAt: 1_000 })],
    } as unknown as ProgressState;
    const afterFailedAttempt = recordLevelResult(
      importedProgressWithPassedBest,
      result({ passed: false, stars: 0, accuracy: 0.9, kanaPerMinute: 30, completedAt: 2_000 }),
    );

    expect(afterFailedAttempt.levelResults).toEqual([
      result({ passed: true, stars: 0, accuracy: 0.9, kanaPerMinute: 30, completedAt: 1_000 }),
    ]);
  });

  test('recording a result returns a new state without mutating the previous state', () => {
    const previous = createEmptyProgress();
    const next = recordLevelResult(previous, result({ levelId: hiraganaAReview }));

    expect(next).not.toBe(previous);
    expect(next.levelResults).not.toBe(previous.levelResults);
    expect(previous.levelResults).toEqual([]);
    expect(previous.activeLevelId).toBe(hiraganaA);
    expect(next.activeLevelId).toBe(hiraganaAReview);
    expect(next.activeCourseId).toBe(hiraganaBasic);
  });

  test('rejects non-boolean passed values forced through untrusted input', () => {
    expect(() =>
      recordLevelResult(createEmptyProgress(), { ...result(), passed: 'false' } as unknown as LevelResult),
    ).toThrow('passed must be a boolean');
  });

  test('rejects pass and star combinations that cannot come from valid scoring', () => {
    expect(() => recordLevelResult(createEmptyProgress(), result({ passed: false, stars: 1 }))).toThrow(
      'failed results must have zero stars',
    );
    expect(() => recordLevelResult(createEmptyProgress(), result({ passed: true, stars: 0 }))).toThrow(
      'passed results must have at least one star',
    );
  });

  test('rejects unknown levels and level-course mismatches', () => {
    const catalogLevel = getLevelById('hiragana-a');

    if (catalogLevel === undefined) {
      throw new Error('Expected hiragana-a to be present in the level catalog');
    }

    expect(() => recordLevelResult(createEmptyProgress(), result({ levelId: levelId('missing-level') }))).toThrow(
      'Unknown level: missing-level',
    );
    expect(() =>
      recordLevelResult(createEmptyProgress(), result({ levelId: catalogLevel.id, courseId: courseId('missing-course') })),
    ).toThrow('Level hiragana-a belongs to course hiragana-basic, not missing-course');
  });

  test('rejects empty level and course ids', () => {
    expect(() => recordLevelResult(createEmptyProgress(), result({ levelId: levelId('') }))).toThrow(
      'levelId must not be empty',
    );
    expect(() => recordLevelResult(createEmptyProgress(), result({ courseId: courseId('') }))).toThrow(
      'courseId must not be empty',
    );
  });

  test('rejects invalid level results without corrupting existing progress', () => {
    const progress = recordLevelResult(createEmptyProgress(), result());
    const snapshot: ProgressState = structuredClone(progress);

    expect(() => recordLevelResult(progress, result({ accuracy: 1.1 }))).toThrow(
      'accuracy must be a finite number between 0 and 1',
    );
    expect(() => recordLevelResult(progress, result({ kanaPerMinute: Number.NaN }))).toThrow(
      'kanaPerMinute must be a finite non-negative number',
    );
    expect(() => recordLevelResult(progress, result({ stars: 4 as LevelResult['stars'] }))).toThrow(
      'stars must be an integer between 0 and 3',
    );
    expect(() => recordLevelResult(progress, result({ completedAt: Number.POSITIVE_INFINITY }))).toThrow(
      'completedAt must be a finite timestamp',
    );
    expect(progress).toEqual(snapshot);
  });
});
