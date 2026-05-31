import type { AudioService, ProgressRepository } from './ports';
import { findKanaByText } from '../core/learning-content/kanaCatalog';
import { getLevelById } from '../core/learning-content/levelCatalog';
import type { Level } from '../core/learning-content/levelCatalog';
import { createPracticeSession } from '../core/practice/practiceSession';
import type { PracticeSession } from '../core/practice/practiceSession';
import type { PracticePrompt, PracticeStatus } from '../core/practice/model';
import { scorePracticeSession } from '../core/practice/scoring';
import type { LevelResult, ProgressState } from '../core/progress/model';
import { recordLevelResult } from '../core/progress/progress';
import type { Clock } from '../core/shared/clock';

export type KanaTrainerStatus = 'ready' | 'running' | 'passed' | 'failed';

export interface KanaTrainerState {
  readonly progress: ProgressState;
  readonly currentLevel: Level;
  readonly session: PracticeSession;
  readonly status: KanaTrainerStatus;
  readonly lastResult?: LevelResult;
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

    return this.storeState({ progress, currentLevel, session, status: 'ready' });
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

  async typeCharacter(character: string): Promise<KanaTrainerState> {
    const current = this.requireStarted();

    if (current.status === 'passed' || current.status === 'failed') {
      return current;
    }

    playKeyFailSoft(this.audioService);

    const nextSession = current.session.typeCharacter(character, this.clock.now());

    if (isTerminalTransition(current.session.status, nextSession.status) && nextSession.endedAt !== undefined) {
      const score = scorePracticeSession({
        completedPrompts: nextSession.completedPrompts,
        mistakeCount: nextSession.mistakes.length,
        startedAt: nextSession.startedAt,
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
      const progress = recordLevelResult(current.progress, result);
      const nextState = this.storeState({
        ...current,
        progress,
        session: nextSession,
        status: result.passed ? 'passed' : 'failed',
        lastResult: result,
      });

      try {
        await this.progressRepository.save(progress);
      } catch {
        return nextState;
      }

      return nextState;
    }

    return this.storeState({ ...current, session: nextSession, status: 'running' });
  }

  private storeState(state: KanaTrainerState): KanaTrainerState {
    this.state = Object.freeze({ ...state });

    return this.state;
  }

  private createSession(level: Level): PracticeSession {
    return createPracticeSession({
      levelId: level.id,
      prompts: createPrompts(level),
      maxMistakes: level.maxMistakes,
      startedAt: this.clock.now(),
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

function createPrompts(level: Level): readonly PracticePrompt[] {
  return level.kanaTexts.map((kanaText) => {
    const kana = findKanaByText(kanaText);

    if (kana === undefined) {
      throw new Error(`Unknown kana in level ${level.id}: ${kanaText}`);
    }

    return { kanaText, romaji: kana.romaji };
  });
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
