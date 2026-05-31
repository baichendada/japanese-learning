import { afterEach, describe, expect, test, vi } from 'vitest';
import { KanaTrainer } from '../../src/app/KanaTrainer';
import type { AudioService, ProgressRepository } from '../../src/app/ports';
import { findKanaByText } from '../../src/core/learning-content/kanaCatalog';
import { getLevelById } from '../../src/core/learning-content/levelCatalog';
import type { Level } from '../../src/core/learning-content/levelCatalog';
import type { ProgressState } from '../../src/core/progress/model';
import { createEmptyProgress } from '../../src/core/progress/progress';
import type { Clock } from '../../src/core/shared/clock';
import type { LevelId } from '../../src/core/shared/ids';
import { levelId } from '../../src/core/shared/ids';

describe('KanaTrainer', () => {
  const hiraganaA = levelId('hiragana-a');
  const hiraganaKa = levelId('hiragana-ka');

  afterEach(() => {
    vi.doUnmock('../../src/core/learning-content/levelCatalog');
    vi.resetModules();
    vi.restoreAllMocks();
  });

  test('load uses stored active level and starts the current session from that level', async () => {
    const currentLevel = requireLevel(hiraganaKa);
    const progress = progressForLevel(hiraganaKa);
    const repository = createRepository(progress);
    const trainer = new KanaTrainer(repository, createAudio(), createClock(1_000));

    const state = await trainer.load();

    expect(repository.load).toHaveBeenCalledTimes(1);
    expect(state.progress).toBe(progress);
    expect(state.currentLevel.id).toBe(currentLevel.id);
    expect(state.currentLevel.name).toBe(currentLevel.name);
    expect(state.session).toMatchObject({
      levelId: currentLevel.id,
      currentInput: '',
      currentPromptIndex: 0,
      maxMistakes: currentLevel.maxMistakes,
      startedAt: 1_000,
      status: 'running',
      completedPrompts: 0,
    });
    expect(state.session.prompts).toEqual(promptsForLevel(currentLevel));
  });

  test('typeCharacter plays key audio and advances currentInput', async () => {
    const audio = createAudio();
    const trainer = new KanaTrainer(createRepository(progressForLevel(hiraganaKa)), audio, createClock(1_000, 1_100));
    const loaded = await trainer.load();
    const character = loaded.session.prompts[0].romaji[0];

    const state = await trainer.typeCharacter(character);

    expect(audio.playKey).toHaveBeenCalledTimes(1);
    expect(state.session.currentInput).toBe(character);
  });

  test('audio rejection does not block typing', async () => {
    const audio = createAudio({
      playKey: vi.fn(async () => {
        throw new Error('audio unavailable');
      }),
    });
    const trainer = new KanaTrainer(createRepository(progressForLevel(hiraganaKa)), audio, createClock(1_000, 1_100));
    const loaded = await trainer.load();
    const character = loaded.session.prompts[0].romaji[0];

    const state = await trainer.typeCharacter(character);

    expect(audio.playKey).toHaveBeenCalledTimes(1);
    expect(state.session.currentInput).toBe(character);
  });

  test('passing a level records and saves progress with a passed result', async () => {
    const repository = createRepository(progressForLevel(hiraganaA));
    const trainer = new KanaTrainer(repository, createAudio(), createClock(1_000, 11_000, 21_000, 31_000, 41_000, 61_000, 71_000));
    const loaded = await trainer.load();

    const passed = await typeAllPrompts(trainer, loaded);

    expect(passed.session.status).toBe('passed');
    expect(passed.session.endedAt).toBe(61_000);
    expect(passed.progress.levelResults).toEqual([
      {
        levelId: loaded.currentLevel.id,
        courseId: loaded.currentLevel.courseId,
        passed: true,
        accuracy: 1,
        kanaPerMinute: 5,
        stars: 1,
        completedAt: 61_000,
      },
    ]);
    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(repository.save).toHaveBeenCalledWith(passed.progress);

    await trainer.typeCharacter('x');

    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  test('save rejection keeps the returned terminal state updated', async () => {
    const repository = createRepository(progressForLevel(hiraganaA), {
      save: vi.fn(async () => {
        throw new Error('save unavailable');
      }),
    });
    const trainer = new KanaTrainer(repository, createAudio(), createClock(1_000, 11_000, 21_000, 31_000, 41_000, 61_000));
    const loaded = await trainer.load();

    const passed = await typeAllPrompts(trainer, loaded);

    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(passed.session.status).toBe('passed');
    expect(passed.progress.levelResults).toHaveLength(1);
    expect(passed.progress.levelResults[0]).toMatchObject({
      levelId: loaded.currentLevel.id,
      passed: true,
      completedAt: 61_000,
    });
  });

  test('typeCharacter before explicit load lazily loads', async () => {
    const repository = createRepository(progressForLevel(hiraganaKa));
    const trainer = new KanaTrainer(repository, createAudio(), createClock(1_000, 1_100));

    const state = await trainer.typeCharacter('k');

    expect(repository.load).toHaveBeenCalledTimes(1);
    expect(state.currentLevel.id).toBe(hiraganaKa);
    expect(state.session.currentInput).toBe('k');
  });

  test('load throws a clear error for an unknown active level', async () => {
    const trainer = new KanaTrainer(createRepository(progressForLevel(levelId('missing-level'))), createAudio(), createClock(1_000));

    await expect(trainer.load()).rejects.toThrow('Unknown active level: missing-level');
  });

  test('load throws a clear error when the active level references unknown kana', async () => {
    vi.resetModules();
    vi.doMock('../../src/core/learning-content/levelCatalog', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../../src/core/learning-content/levelCatalog')>();
      const level = actual.getLevelById('hiragana-a');

      return {
        ...actual,
        getLevelById(id: string): Level | undefined {
          if (id === 'hiragana-a' && level !== undefined) {
            return { ...level, kanaTexts: ['missing-kana'] };
          }

          return actual.getLevelById(id);
        },
      };
    });
    const { KanaTrainer: MockedKanaTrainer } = await import('../../src/app/KanaTrainer');
    const trainer = new MockedKanaTrainer(createRepository(progressForLevel(hiraganaA)), createAudio(), createClock(1_000));

    await expect(trainer.load()).rejects.toThrow('Unknown kana in level hiragana-a: missing-kana');
  });
});

function createRepository(progress: ProgressState, overrides: Partial<ProgressRepository> = {}) {
  return {
    load: vi.fn(async () => progress),
    save: vi.fn(async (_progress: ProgressState) => undefined),
    ...overrides,
  } satisfies ProgressRepository;
}

function createAudio(overrides: Partial<AudioService> = {}) {
  return {
    playKey: vi.fn(async () => undefined),
    playKana: vi.fn(async (_kanaText: string) => undefined),
    replayCurrent: vi.fn(async () => undefined),
    ...overrides,
  } satisfies AudioService;
}

function createClock(...timestamps: number[]): Clock {
  let index = 0;

  return {
    now: vi.fn(() => timestamps[Math.min(index++, timestamps.length - 1)]),
  };
}

function progressForLevel(activeLevelId: LevelId): ProgressState {
  const level = getLevelById(activeLevelId);

  return {
    ...createEmptyProgress(),
    activeCourseId: level?.courseId ?? createEmptyProgress().activeCourseId,
    activeLevelId,
  };
}

function requireLevel(id: LevelId): Level {
  const level = getLevelById(id);

  if (level === undefined) {
    throw new Error(`Expected level ${id} to exist`);
  }

  return level;
}

function promptsForLevel(level: Level) {
  return level.kanaTexts.map((kanaText) => {
    const kana = findKanaByText(kanaText);

    if (kana === undefined) {
      throw new Error(`Expected kana ${kanaText} to exist`);
    }

    return { kanaText, romaji: kana.romaji };
  });
}

async function typeAllPrompts(trainer: KanaTrainer, initialState: Awaited<ReturnType<KanaTrainer['load']>>) {
  let state = initialState;

  for (const prompt of initialState.session.prompts) {
    for (const character of prompt.romaji) {
      state = await trainer.typeCharacter(character);
    }
  }

  return state;
}
