import { beforeEach, describe, expect, test } from 'vitest';
import type { LevelResult, MistakeStat, ProgressState } from '../../src/core/progress/model';
import { parseProgressBackup } from '../../src/core/progress/importExport';
import { createEmptyProgress } from '../../src/core/progress/progress';
import { courseId, levelId } from '../../src/core/shared/ids';
import { LocalStorageProgressRepository } from '../../src/web/adapters/LocalStorageProgressRepository';

describe('LocalStorageProgressRepository', () => {
  const storageKey = 'test-kana-progress';
  const hiraganaBasic = courseId('hiragana-basic');
  const hiraganaA = levelId('hiragana-a');
  const hiraganaKa = levelId('hiragana-ka');

  beforeEach(() => {
    localStorage.clear();
  });

  test('returns empty progress when no saved progress exists', async () => {
    const repository = new LocalStorageProgressRepository();

    await expect(repository.load()).resolves.toEqual(createEmptyProgress());
  });

  test('saves and loads valid progress', async () => {
    const repository = new LocalStorageProgressRepository(storageKey);
    const progress = savedProgress();

    await repository.save(progress);

    await expect(repository.load()).resolves.toEqual(progress);
  });

  test('loading invalid saved JSON rejects', async () => {
    const repository = new LocalStorageProgressRepository(storageKey);
    localStorage.setItem(storageKey, '{not json');

    await expect(repository.load()).rejects.toThrow('Invalid progress backup JSON');
  });

  test('loading unsupported schema rejects', async () => {
    const repository = new LocalStorageProgressRepository(storageKey);
    localStorage.setItem(storageKey, JSON.stringify({ ...createEmptyProgress(), schemaVersion: 2 }));

    await expect(repository.load()).rejects.toThrow('Unsupported progress schemaVersion: 2');
  });

  test('save output can round-trip through parseProgressBackup', async () => {
    const repository = new LocalStorageProgressRepository(storageKey);
    const progress = savedProgress();

    await repository.save(progress);

    const savedJson = localStorage.getItem(storageKey);
    expect(savedJson).not.toBeNull();
    expect(parseProgressBackup(savedJson as string)).toEqual(progress);
  });

  test('save does not mutate progress', async () => {
    const repository = new LocalStorageProgressRepository(storageKey);
    const progress = savedProgress();
    const beforeSave = structuredClone(progress);

    await repository.save(progress);

    expect(progress).toEqual(beforeSave);
  });

  function savedProgress(): ProgressState {
    return {
      ...createEmptyProgress(),
      activeCourseId: hiraganaBasic,
      activeLevelId: hiraganaKa,
      levelResults: [
        levelResult({
          levelId: hiraganaA,
          stars: 3,
          accuracy: 0.98,
          kanaPerMinute: 42,
          completedAt: 1_000,
        }),
      ],
      mistakeStats: [mistakeStat()],
      settings: {
        keySoundEnabled: false,
        kanaSoundEnabled: true,
        helperVisible: false,
      },
    };
  }

  function levelResult(overrides: Partial<LevelResult> = {}): LevelResult {
    return {
      levelId: hiraganaA,
      courseId: hiraganaBasic,
      passed: true,
      accuracy: 0.95,
      kanaPerMinute: 24,
      stars: 2,
      completedAt: 500,
      ...overrides,
    };
  }

  function mistakeStat(overrides: Partial<MistakeStat> = {}): MistakeStat {
    return {
      kanaText: 'ka',
      expectedRomaji: 'ka',
      count: 2,
      lastMistakeAt: 750,
      ...overrides,
    };
  }
});
