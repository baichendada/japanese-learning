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

  test('load uses stored active level and prepares a ready session from that level', async () => {
    const currentLevel = requireLevel(hiraganaKa);
    const progress = progressForLevel(hiraganaKa);
    const repository = createRepository(progress);
    const trainer = new KanaTrainer(repository, createAudio(), createClock(1_000));

    const state = await trainer.load();

    expect(repository.load).toHaveBeenCalledTimes(1);
    expect(state.status).toBe('ready');
    expect(state.lastResult).toBeUndefined();
    expect(state.progress).toBe(progress);
    expect(state.currentLevel.id).toBe(currentLevel.id);
    expect(state.currentLevel.name).toBe(currentLevel.name);
    expect(state.session).toMatchObject({
      levelId: currentLevel.id,
      currentInput: '',
      currentPromptIndex: 0,
      maxMistakes: currentLevel.maxMistakes,
      status: 'running',
      completedPrompts: 0,
    });
    expect(state.session.prompts).toEqual(promptsForLevel(currentLevel));
  });

  test('start activates running state without starting the session timer', async () => {
    const trainer = new KanaTrainer(createRepository(progressForLevel(hiraganaKa)), createAudio(), createClock(1_100));

    const loaded = await trainer.load();
    const started = await trainer.start();
    const afterFirstKey = await trainer.typeCharacter(started.session.prompts[0].romaji[0]);

    expect(loaded.status).toBe('ready');
    expect(started.status).toBe('running');
    expect(started.session.startedAt).toBeUndefined();
    expect(afterFirstKey.session.startedAt).toBe(1_100);
    expect(started.session.currentInput).toBe('');
    expect(started.lastResult).toBeUndefined();
  });

  test('typeCharacter plays key audio and advances currentInput after start', async () => {
    const audio = createAudio();
    const trainer = new KanaTrainer(createRepository(progressForLevel(hiraganaKa)), audio, createClock(1_000, 1_100, 1_200));
    await trainer.load();
    const started = await trainer.start();
    const character = started.session.prompts[0].romaji[0];

    const state = await trainer.typeCharacter(character);

    expect(audio.playKey).toHaveBeenCalledTimes(1);
    expect(state.status).toBe('running');
    expect(state.session.currentInput).toBe(character);
  });

  test('audio rejection does not block typing', async () => {
    const audio = createAudio({
      playKey: vi.fn(async () => {
        throw new Error('audio unavailable');
      }),
    });
    const trainer = new KanaTrainer(createRepository(progressForLevel(hiraganaKa)), audio, createClock(1_000, 1_100, 1_200));
    await trainer.load();
    const started = await trainer.start();
    const character = started.session.prompts[0].romaji[0];

    const state = await trainer.typeCharacter(character);

    expect(audio.playKey).toHaveBeenCalledTimes(1);
    expect(state.session.currentInput).toBe(character);
  });

  test('completion with accuracy below pass threshold is app-visible failure and recorded failure', async () => {
    const repository = createRepository(progressForLevel(hiraganaA));
    const trainer = new KanaTrainer(
      repository,
      createAudio(),
      createClock(61_000, 71_000, 81_000, 91_000, 101_000, 121_000),
    );
    await trainer.load();
    const started = await trainer.start();

    const completed = await typeAllPromptsWithFirstMistake(trainer, started);

    expect(completed.session.status).toBe('passed');
    expect(completed.status).toBe('failed');
    expect(completed.lastResult).toEqual({
      levelId: started.currentLevel.id,
      courseId: started.currentLevel.courseId,
      passed: false,
      accuracy: 0.833,
      kanaPerMinute: 5,
      stars: 0,
      completedAt: 121_000,
    });
    expect(completed.progress.levelResults).toEqual([completed.lastResult]);
    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(repository.save).toHaveBeenCalledWith(completed.progress);
  });

  test('time before the first typed character does not affect scoring', async () => {
    const repository = createRepository(progressForLevel(hiraganaA));
    const trainer = new KanaTrainer(repository, createAudio(), createClock(61_000, 71_000, 91_000, 101_000, 121_000));
    await trainer.load();
    const started = await trainer.start();

    const passed = await typeAllPrompts(trainer, started);

    expect(passed.status).toBe('passed');
    expect(passed.lastResult).toMatchObject({
      passed: true,
      kanaPerMinute: 5,
      completedAt: 121_000,
    });
    expect(passed.progress.levelResults).toEqual([passed.lastResult]);
  });

  test('failed terminal path by max mistakes saves once and exposes a matching failed result', async () => {
    const repository = createRepository(progressForLevel(hiraganaA));
    const trainer = new KanaTrainer(repository, createAudio(), createClock(10_000, 11_000, 12_000, 13_000));
    await trainer.load();
    const started = await trainer.start();

    const failed = await typeCharacters(trainer, 'x', 'y', 'z', 'q');

    expect(failed.session.status).toBe('failed');
    expect(failed.status).toBe('failed');
    expect(failed.lastResult).toEqual({
      levelId: started.currentLevel.id,
      courseId: started.currentLevel.courseId,
      passed: false,
      accuracy: 0,
      kanaPerMinute: 0,
      stars: 0,
      completedAt: 13_000,
    });
    expect(failed.progress.levelResults).toEqual([failed.lastResult]);
    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(repository.save).toHaveBeenCalledWith(failed.progress);

    await trainer.typeCharacter('x');

    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  test('typeCharacter requires an explicit loaded and started lifecycle', async () => {
    const trainer = new KanaTrainer(createRepository(progressForLevel(hiraganaKa)), createAudio(), createClock(1_000, 1_100));

    await expect(trainer.typeCharacter('k')).rejects.toThrow('KanaTrainer must be loaded before typing');

    await trainer.load();

    await expect(trainer.typeCharacter('k')).rejects.toThrow('KanaTrainer must be started before typing');
  });

  test('restart creates a fresh running session without reloading progress', async () => {
    const repository = createRepository(progressForLevel(hiraganaKa));
    const trainer = new KanaTrainer(repository, createAudio(), createClock(1_000, 2_000, 3_000, 4_000));
    await trainer.load();
    const started = await trainer.start();
    await trainer.typeCharacter(started.session.prompts[0].romaji[0]);

    const restarted = await trainer.restart();

    expect(repository.load).toHaveBeenCalledTimes(1);
    expect(restarted.status).toBe('running');
    expect(restarted.session.startedAt).toBeUndefined();
    expect(restarted.session.currentInput).toBe('');
    expect(restarted.session.currentPromptIndex).toBe(0);
    expect(restarted.lastResult).toBeUndefined();
  });

  test('pause and resume preserve the running session and timer start time', async () => {
    const trainer = new KanaTrainer(createRepository(progressForLevel(hiraganaKa)), createAudio(), createClock(1_100, 1_200));
    await trainer.load();
    const started = await trainer.start();
    const typed = await trainer.typeCharacter(started.session.prompts[0].romaji[0]);

    const paused = trainer.pause();
    const resumed = trainer.resume();

    expect(typed.session.startedAt).toBe(1_100);
    expect(paused.status).toBe('paused');
    expect(paused.session.startedAt).toBe(1_100);
    expect(paused.session.currentInput).toBe(started.session.prompts[0].romaji[0]);
    expect(resumed.status).toBe('running');
    expect(resumed.session.startedAt).toBe(1_100);
    expect(resumed.session.currentInput).toBe(started.session.prompts[0].romaji[0]);
  });

  test('passing a level advances to the next unlocked level in ready state', async () => {
    const repository = createRepository(progressForLevel(hiraganaA));
    const trainer = new KanaTrainer(
      repository,
      createAudio(),
      createClock(61_000, 71_000, 91_000, 101_000, 121_000),
    );
    await trainer.load();
    const started = await trainer.start();
    const passed = await typeAllPrompts(trainer, started);

    expect(passed.status).toBe('passed');
    expect(passed.currentLevel.id).toBe(levelId('hiragana-a-review'));
    expect(passed.progress.activeLevelId).toBe(levelId('hiragana-a-review'));
    expect(passed.lastResult?.levelId).toBe(hiraganaA);
    expect(passed.session.levelId).toBe(levelId('hiragana-a-review'));
  });

  test('save rejection keeps the returned terminal state updated', async () => {
    const repository = createRepository(progressForLevel(hiraganaA), {
      save: vi.fn(async () => {
        throw new Error('save unavailable');
      }),
    });
    const trainer = new KanaTrainer(repository, createAudio(), createClock(11_000, 21_000, 31_000, 41_000, 71_000));
    await trainer.load();
    const started = await trainer.start();

    const passed = await typeAllPrompts(trainer, started);

    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(passed.status).toBe('passed');
    expect(passed.lastResult).toMatchObject({
      levelId: started.currentLevel.id,
      passed: true,
      completedAt: 71_000,
    });
    expect(passed.progress.levelResults).toEqual([passed.lastResult]);
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

async function typeAllPrompts(trainer: KanaTrainer, initialState: Awaited<ReturnType<KanaTrainer['start']>>) {
  let state = initialState;

  for (const prompt of initialState.session.prompts) {
    for (const character of prompt.romaji) {
      state = await trainer.typeCharacter(character);
    }
  }

  return state;
}

async function typeAllPromptsWithFirstMistake(
  trainer: KanaTrainer,
  initialState: Awaited<ReturnType<KanaTrainer['start']>>,
) {
  await trainer.typeCharacter('x');

  return typeAllPrompts(trainer, initialState);
}

async function typeCharacters(trainer: KanaTrainer, ...characters: readonly string[]) {
  let state: Awaited<ReturnType<KanaTrainer['typeCharacter']>> | undefined;

  for (const character of characters) {
    state = await trainer.typeCharacter(character);
  }

  if (state === undefined) {
    throw new Error('Expected at least one character');
  }

  return state;
}
