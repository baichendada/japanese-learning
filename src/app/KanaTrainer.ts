import type { AudioService, ProgressRepository } from './ports';
import { buildLevelPrompts } from '../core/learning-content/promptBuilder';
import { getLevelById } from '../core/learning-content/levelCatalog';
import type { Level } from '../core/learning-content/levelCatalog';
import { createPracticeSession } from '../core/practice/practiceSession';
import type { PracticeSession } from '../core/practice/practiceSession';
import type { PracticeStatus } from '../core/practice/model';
import { scorePracticeSession } from '../core/practice/scoring';
import { mergeProgress, parseProgressBackup } from '../core/progress/importExport';
import type { LevelResult, ProgressSettings, ProgressState } from '../core/progress/model';
import { getNextPlayableLevel, isLevelUnlocked, recordLevelResult, recordMistake } from '../core/progress/progress';
import { createConfusionPractice } from '../core/review/confusionPractice';
import { createReviewPractice } from '../core/review/reviewPractice';
import type { Clock } from '../core/shared/clock';
import type { LevelId } from '../core/shared/ids';

export type KanaTrainerStatus = 'ready' | 'running' | 'paused' | 'passed' | 'failed';

export interface KanaTrainerState {
  readonly progress: ProgressState;
  readonly currentLevel: Level;
  readonly session: PracticeSession;
  readonly status: KanaTrainerStatus;
  readonly lastResult?: LevelResult;
  readonly hasNextLevel: boolean;
}

export class KanaTrainer {
  private state?: KanaTrainerState;

  constructor(
    private readonly progressRepository: ProgressRepository,
    private readonly audioService: AudioService,
    private readonly clock: Clock,
  ) {}

  async load(): Promise<KanaTrainerState> {
    const progress = await this.progressRepository.load();
    const currentLevel = requireActiveLevel(progress.activeLevelId);
    const session = this.createSession(currentLevel);

    return this.storeState({
      progress,
      currentLevel,
      session,
      status: 'ready',
      hasNextLevel: getNextPlayableLevel(progress, currentLevel.id) !== undefined,
    });
  }

  async start(): Promise<KanaTrainerState> {
    const current = this.requireLoaded();
    const session = this.createSession(current.currentLevel);

    return this.storeState({
      ...current,
      session,
      status: 'running',
      lastResult: undefined,
    });
  }

  async restart(): Promise<KanaTrainerState> {
    return this.start();
  }

  pause(): KanaTrainerState {
    const current = this.requireLoaded();

    if (current.status !== 'running') {
      return current;
    }

    return this.storeState({ ...current, status: 'paused' });
  }

  resume(): KanaTrainerState {
    const current = this.requireLoaded();

    if (current.status !== 'paused') {
      return current;
    }

    return this.storeState({ ...current, status: 'running' });
  }

  async changeLevel(levelId: LevelId): Promise<KanaTrainerState> {
    const current = this.requireLoaded();
    const level = getLevelById(levelId);

    if (level === undefined) {
      throw new Error(`Unknown level: ${levelId}`);
    }

    if (!isLevelUnlocked(current.progress, level.unlock)) {
      throw new Error(`Level ${levelId} is locked`);
    }

    const progress = Object.freeze({
      ...current.progress,
      activeCourseId: level.courseId,
      activeLevelId: level.id,
      settings: { ...current.progress.settings },
      levelResults: current.progress.levelResults,
      mistakeStats: current.progress.mistakeStats,
    });
    const session = this.createSession(level);
    const nextState = this.storeState({
      progress,
      currentLevel: level,
      session,
      status: 'ready',
      lastResult: undefined,
      hasNextLevel: getNextPlayableLevel(progress, level.id) !== undefined,
    });

    try {
      await this.progressRepository.save(progress);
    } catch {
      return nextState;
    }

    return nextState;
  }

  async updateSettings(settings: ProgressSettings): Promise<KanaTrainerState> {
    const current = this.requireLoaded();
    const progress = Object.freeze({
      ...current.progress,
      settings: Object.freeze({ ...settings }),
      levelResults: current.progress.levelResults,
      mistakeStats: current.progress.mistakeStats,
    });
    const nextState = this.storeState({ ...current, progress });

    try {
      await this.progressRepository.save(progress);
    } catch {
      return nextState;
    }

    return nextState;
  }

  async importProgress(json: string): Promise<KanaTrainerState> {
    const current = this.requireLoaded();
    const imported = parseProgressBackup(json);
    const progress = mergeProgress(current.progress, imported);
    const currentLevel = requireActiveLevel(progress.activeLevelId);
    const session = this.createSession(currentLevel);
    const nextState = this.storeState({
      progress,
      currentLevel,
      session,
      status: 'ready',
      lastResult: undefined,
      hasNextLevel: getNextPlayableLevel(progress, currentLevel.id) !== undefined,
    });

    try {
      await this.progressRepository.save(progress);
    } catch {
      return nextState;
    }

    return nextState;
  }

  async startMistakeReview(): Promise<KanaTrainerState> {
    const current = this.requireLoaded();
    const review = createReviewPractice({
      mistakeStats: current.progress.mistakeStats,
      maxPrompts: 20,
    });

    if (review.prompts.length === 0) {
      throw new Error('No mistakes to review');
    }

    const session = createPracticeSession({
      levelId: review.levelId,
      prompts: review.prompts,
      maxMistakes: 4,
    });

    return this.storeState({
      ...current,
      session,
      status: 'running',
      lastResult: undefined,
    });
  }

  async startConfusionPractice(): Promise<KanaTrainerState> {
    const current = this.requireLoaded();
    const practice = createConfusionPractice();
    const session = createPracticeSession({
      levelId: practice.levelId,
      prompts: practice.prompts,
      maxMistakes: 4,
    });

    return this.storeState({
      ...current,
      session,
      status: 'running',
      lastResult: undefined,
    });
  }

  async typeCharacter(character: string): Promise<KanaTrainerState> {
    const current = this.requireStarted();

    if (current.status !== 'running') {
      return current;
    }

    playKeyFailSoft(this.audioService);

    const nextSession = current.session.typeCharacter(character, this.clock.now());
    let progress = current.progress;

    if (nextSession.mistakes.length > current.session.mistakes.length) {
      const latestMistake = nextSession.mistakes[nextSession.mistakes.length - 1];
      progress = recordMistake(progress, {
        kanaText: latestMistake.kanaText,
        expectedRomaji: latestMistake.expectedRomaji,
        occurredAt: latestMistake.occurredAt,
      });
    }

    if (isTerminalTransition(current.session.status, nextSession.status) && nextSession.endedAt !== undefined) {
      const startedAt = nextSession.startedAt ?? nextSession.endedAt;
      const score = scorePracticeSession({
        completedPrompts: nextSession.completedPrompts,
        mistakeCount: nextSession.mistakes.length,
        startedAt,
        endedAt: nextSession.endedAt,
        passAccuracy: current.currentLevel.passAccuracy,
      });
      const result: LevelResult = {
        levelId: current.currentLevel.id,
        courseId: current.currentLevel.courseId,
        passed: score.passed,
        accuracy: score.accuracy,
        kanaPerMinute: score.kanaPerMinute,
        stars: score.stars,
        completedAt: nextSession.endedAt,
      };
      progress = recordLevelResult(progress, result);
      let nextLevel = current.currentLevel;
      let sessionForNext = nextSession;

      if (result.passed) {
        const playableNextLevel = getNextPlayableLevel(progress, current.currentLevel.id);

        if (playableNextLevel !== undefined) {
          progress = Object.freeze({
            ...progress,
            activeCourseId: playableNextLevel.courseId,
            activeLevelId: playableNextLevel.id,
            settings: { ...progress.settings },
            levelResults: progress.levelResults,
            mistakeStats: progress.mistakeStats,
          });
          nextLevel = playableNextLevel;
          sessionForNext = this.createSession(playableNextLevel);
        }
      }

      const nextState = this.storeState({
        ...current,
        progress,
        currentLevel: nextLevel,
        session: sessionForNext,
        status: result.passed ? 'passed' : 'failed',
        lastResult: result,
        hasNextLevel: getNextPlayableLevel(progress, nextLevel.id) !== undefined,
      });

      try {
        await this.progressRepository.save(progress);
      } catch {
        return nextState;
      }

      return nextState;
    }

    return this.storeState({ ...current, progress, session: nextSession, status: 'running' });
  }

  backspace(): KanaTrainerState {
    const current = this.requireStarted();

    if (current.status !== 'running') {
      return current;
    }

    playKeyFailSoft(this.audioService);

    const nextSession = current.session.backspace();

    return this.storeState({ ...current, session: nextSession, status: 'running' });
  }

  private storeState(state: KanaTrainerState): KanaTrainerState {
    this.state = Object.freeze({ ...state });

    return this.state;
  }

  private createSession(level: Level): PracticeSession {
    return createPracticeSession({
      levelId: level.id,
      prompts: buildLevelPrompts(level),
      maxMistakes: level.maxMistakes,
    });
  }

  private requireLoaded(): KanaTrainerState {
    if (this.state === undefined) {
      throw new Error('KanaTrainer must be loaded before typing');
    }

    return this.state;
  }

  private requireStarted(): KanaTrainerState {
    const current = this.requireLoaded();

    if (current.status === 'ready') {
      throw new Error('KanaTrainer must be started before typing');
    }

    return current;
  }
}

function requireActiveLevel(id: string): Level {
  const level = getLevelById(id);

  if (level === undefined) {
    throw new Error(`Unknown active level: ${id}`);
  }

  return level;
}

function playKeyFailSoft(audioService: AudioService): void {
  try {
    void audioService.playKey().catch(() => undefined);
  } catch {
    return;
  }
}

function isTerminalTransition(previous: PracticeStatus, next: PracticeStatus): boolean {
  return !isTerminal(previous) && isTerminal(next);
}

function isTerminal(status: PracticeStatus): boolean {
  return status === 'passed' || status === 'failed';
}
