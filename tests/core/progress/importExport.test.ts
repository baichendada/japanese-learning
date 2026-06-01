import { describe, expect, test } from 'vitest';
import { courseId, levelId } from '../../../src/core/shared/ids';
import type { LevelResult, MistakeStat, ProgressSettings, ProgressState } from '../../../src/core/progress/model';
import { createEmptyProgress } from '../../../src/core/progress/progress';
import { mergeProgress, parseProgressBackup, previewProgressImport } from '../../../src/core/progress/importExport';

describe('progress import and export merge', () => {
  const hiraganaBasic = courseId('hiragana-basic');
  const hiraganaA = levelId('hiragana-a');
  const hiraganaAReview = levelId('hiragana-a-review');
  const hiraganaKa = levelId('hiragana-ka');

  function levelResult(overrides: Partial<LevelResult> = {}): LevelResult {
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

  function mistakeStat(overrides: Partial<MistakeStat> = {}): MistakeStat {
    return {
      kanaText: 'ka',
      expectedRomaji: 'ka',
      count: 1,
      lastMistakeAt: 1_000,
      ...overrides,
    };
  }

  function settings(overrides: Partial<ProgressSettings> = {}): ProgressSettings {
    return {
      keySoundEnabled: true,
      kanaSoundEnabled: true,
      helperVisible: true,
      ...overrides,
    };
  }

  function progress(overrides: Partial<ProgressState> = {}): ProgressState {
    return {
      schemaVersion: 1,
      activeCourseId: hiraganaBasic,
      activeLevelId: hiraganaA,
      levelResults: [],
      mistakeStats: [],
      settings: settings(),
      ...overrides,
    };
  }

  function backupJson(overrides: Partial<ProgressState> = {}): string {
    return JSON.stringify(progress(overrides));
  }

  test('previews imported backup before replacing local progress', () => {
    const imported = parseProgressBackup(
      backupJson({
        activeLevelId: hiraganaKa,
        levelResults: [levelResult({ levelId: hiraganaKa, stars: 3, kanaPerMinute: 42 })],
      }),
    );

    const preview = previewProgressImport(createEmptyProgress(), imported);

    expect(preview).toEqual({
      importedLevelCount: 1,
      importedMistakeCount: 0,
      importedActiveLevelId: hiraganaKa,
    });
  });

  test('merges better level results and mistake counts using the array model', () => {
    const local = progress({
      levelResults: [levelResult({ stars: 1, accuracy: 0.91, kanaPerMinute: 9 })],
      mistakeStats: [mistakeStat({ count: 2, lastMistakeAt: 1_000 })],
    });
    const imported = progress({
      activeLevelId: hiraganaKa,
      levelResults: [
        levelResult({ stars: 3, accuracy: 0.93, kanaPerMinute: 45, completedAt: 2_000 }),
        levelResult({ levelId: hiraganaAReview, stars: 2, completedAt: 1_500 }),
      ],
      mistakeStats: [
        mistakeStat({ count: 3, lastMistakeAt: 2_000 }),
        mistakeStat({ kanaText: 'ki', expectedRomaji: 'ki', count: 4, lastMistakeAt: 1_500 }),
      ],
      settings: settings({ keySoundEnabled: false, helperVisible: false }),
    });

    const merged = mergeProgress(local, imported);

    expect(merged.activeCourseId).toBe(hiraganaBasic);
    expect(merged.activeLevelId).toBe(hiraganaKa);
    expect(merged.settings).toEqual(settings({ keySoundEnabled: false, helperVisible: false }));
    expect(merged.levelResults).toEqual([
      levelResult({ stars: 3, accuracy: 0.93, kanaPerMinute: 45, completedAt: 2_000 }),
      levelResult({ levelId: hiraganaAReview, stars: 2, completedAt: 1_500 }),
    ]);
    expect(merged.mistakeStats).toEqual([
      mistakeStat({ count: 5, lastMistakeAt: 2_000 }),
      mistakeStat({ kanaText: 'ki', expectedRomaji: 'ki', count: 4, lastMistakeAt: 1_500 }),
    ]);
    expect(Object.isFrozen(merged)).toBe(true);
    expect(Object.isFrozen(merged.levelResults)).toBe(true);
    expect(Object.isFrozen(merged.mistakeStats)).toBe(true);
    expect(Object.isFrozen(merged.settings)).toBe(true);
  });

  test('parse rejects unsupported schema version and invalid JSON', () => {
    expect(() => parseProgressBackup(backupJson({ schemaVersion: 2 as ProgressState['schemaVersion'] }))).toThrow(
      'Unsupported progress schemaVersion: 2',
    );
    expect(() => parseProgressBackup('{not json')).toThrow('Invalid progress backup JSON');
  });

  test.each([
    ['non-array levelResults', { levelResults: {} }, 'levelResults must be an array'],
    ['non-boolean setting', { settings: settings({ keySoundEnabled: 'true' as unknown as boolean }) }, 'settings.keySoundEnabled must be a boolean'],
    ['unknown active course', { activeCourseId: courseId('missing-course') }, 'Unknown course: missing-course'],
    ['unknown active level', { activeLevelId: levelId('missing-level') }, 'Unknown level: missing-level'],
    ['mismatched active ids', { activeCourseId: courseId('missing-course'), activeLevelId: hiraganaA }, 'Unknown course: missing-course'],
    ['non-boolean passed value', { levelResults: [levelResult({ passed: 'true' as unknown as boolean })] }, 'passed must be a boolean'],
    ['invalid pass and star values', { levelResults: [levelResult({ passed: false, stars: 1 })] }, 'failed results must have zero stars'],
    ['non-array mistakeStats', { mistakeStats: {} }, 'mistakeStats must be an array'],
    ['empty kanaText', { mistakeStats: [mistakeStat({ kanaText: '' })] }, 'mistakeStats[0].kanaText must not be empty'],
    ['empty expectedRomaji', { mistakeStats: [mistakeStat({ expectedRomaji: '' })] }, 'mistakeStats[0].expectedRomaji must not be empty'],
    ['zero mistake count', { mistakeStats: [mistakeStat({ count: 0 })] }, 'mistakeStats[0].count must be a positive integer'],
    [
      'unsafe mistake count',
      { mistakeStats: [mistakeStat({ count: Number.MAX_SAFE_INTEGER + 1 })] },
      'mistakeStats[0].count must be a safe positive integer',
    ],
    ['non-finite mistake timestamp', { mistakeStats: [{ ...mistakeStat(), lastMistakeAt: null as unknown as number }] }, 'mistakeStats[0].lastMistakeAt must be a finite timestamp'],
  ])('parse rejects malformed progress: %s', (_caseName, overrides, message) => {
    expect(() => parseProgressBackup(backupJson(overrides as Partial<ProgressState>))).toThrow(message);
  });

  test('parse canonicalizes duplicate mistake stats by summing counts and keeping the latest timestamp', () => {
    const parsed = parseProgressBackup(
      backupJson({
        mistakeStats: [
          mistakeStat({ count: 2, lastMistakeAt: 1_000 }),
          mistakeStat({ count: 3, lastMistakeAt: 2_000 }),
          mistakeStat({ kanaText: 'ki', expectedRomaji: 'ki', count: 4, lastMistakeAt: 1_500 }),
        ],
      }),
    );

    expect(parsed.mistakeStats).toEqual([
      mistakeStat({ count: 5, lastMistakeAt: 2_000 }),
      mistakeStat({ kanaText: 'ki', expectedRomaji: 'ki', count: 4, lastMistakeAt: 1_500 }),
    ]);
  });

  test('merge rejects mistake count overflow beyond a safe integer', () => {
    expect(() =>
      mergeProgress(
        progress({ mistakeStats: [mistakeStat({ count: Number.MAX_SAFE_INTEGER })] }),
        progress({ mistakeStats: [mistakeStat({ count: 1 })] }),
      ),
    ).toThrow('mistake count merge would exceed Number.MAX_SAFE_INTEGER');
  });

  test('merge result survives a JSON stringify and parse round trip', () => {
    const merged = mergeProgress(
      progress({ mistakeStats: [mistakeStat({ count: 2, lastMistakeAt: 1_000 })] }),
      progress({
        activeLevelId: hiraganaKa,
        mistakeStats: [mistakeStat({ count: 3, lastMistakeAt: 2_000 })],
        settings: settings({ keySoundEnabled: false }),
      }),
    );

    expect(parseProgressBackup(JSON.stringify(merged))).toEqual(merged);
  });

  test('merge does not mutate local or imported progress', () => {
    const local = progress({
      levelResults: [levelResult({ stars: 1, completedAt: 1_000 })],
      mistakeStats: [mistakeStat({ count: 1, lastMistakeAt: 1_000 })],
    });
    const imported = progress({
      activeLevelId: hiraganaKa,
      levelResults: [levelResult({ stars: 3, completedAt: 2_000 })],
      mistakeStats: [mistakeStat({ count: 2, lastMistakeAt: 2_000 })],
      settings: settings({ kanaSoundEnabled: false }),
    });
    const localBefore = structuredClone(local);
    const importedBefore = structuredClone(imported);

    const merged = mergeProgress(local, imported);

    expect(local).toEqual(localBefore);
    expect(imported).toEqual(importedBefore);
    expect(merged.levelResults).not.toBe(local.levelResults);
    expect(merged.levelResults).not.toBe(imported.levelResults);
    expect(merged.mistakeStats).not.toBe(local.mistakeStats);
    expect(merged.mistakeStats).not.toBe(imported.mistakeStats);
  });

  test('merge keeps local better level result when imported is worse', () => {
    const localBest = levelResult({ stars: 3, accuracy: 0.99, kanaPerMinute: 48, completedAt: 2_000 });
    const importedWorse = levelResult({ stars: 2, accuracy: 1, kanaPerMinute: 120, completedAt: 3_000 });

    const merged = mergeProgress(
      progress({ levelResults: [localBest] }),
      progress({ activeLevelId: hiraganaKa, levelResults: [importedWorse] }),
    );

    expect(merged.levelResults).toEqual([localBest]);
  });

  test('merge keeps passed results over failed imported results and applies Task 6 tie-breakers', () => {
    const passedLocal = levelResult({ levelId: hiraganaA, passed: true, stars: 1, accuracy: 0.9, kanaPerMinute: 8 });
    const failedImported = levelResult({
      levelId: hiraganaA,
      passed: false,
      stars: 0,
      accuracy: 1,
      kanaPerMinute: 120,
      completedAt: 3_000,
    });
    const localAccuracyBest = levelResult({
      levelId: hiraganaAReview,
      stars: 2,
      accuracy: 0.91,
      kanaPerMinute: 40,
      completedAt: 1_000,
    });
    const importedAccuracyBest = levelResult({
      levelId: hiraganaAReview,
      stars: 2,
      accuracy: 0.92,
      kanaPerMinute: 10,
      completedAt: 900,
    });

    const merged = mergeProgress(
      progress({ levelResults: [passedLocal, localAccuracyBest] }),
      progress({ levelResults: [failedImported, importedAccuracyBest] }),
    );

    expect(merged.levelResults).toEqual([passedLocal, importedAccuracyBest]);
  });
});
