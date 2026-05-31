import type { AudioService, ProgressRepository } from './ports';
import { findKanaByText } from '../core/learning-content/kanaCatalog';
import { getLevelById } from '../core/learning-content/levelCatalog';
import type { Level } from '../core/learning-content/levelCatalog';
import { createPracticeSession } from '../core/practice/practiceSession';
import type { PracticeSession } from '../core/practice/practiceSession';
import type { PracticePrompt, PracticeStatus } from '../core/practice/model';
import { scorePracticeSession } from '../core/practice/scoring';
import type { ProgressState } from '../core/progress/model';
import { recordLevelResult } from '../core/progress/progress';
import type { Clock } from '../core/shared/clock';

export interface KanaTrainerState {
  readonly progress: ProgressState;
  readonly currentLevel: Level;
  readonly session: PracticeSession;
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
    const session = createPracticeSession({
      levelId: currentLevel.id,
      prompts: createPrompts(currentLevel),
      maxMistakes: currentLevel.maxMistakes,
      startedAt: this.clock.now(),
    });

    return this.storeState({ progress, currentLevel, session });
  }

  async typeCharacter(character: string): Promise<KanaTrainerState> {
    const current = this.state ?? (await this.load());

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
      const progress = recordLevelResult(current.progress, {
        levelId: current.currentLevel.id,
        courseId: current.currentLevel.courseId,
        passed: score.passed,
        accuracy: score.accuracy,
        kanaPerMinute: score.kanaPerMinute,
        stars: score.stars,
        completedAt: nextSession.endedAt,
      });
      const nextState = this.storeState({ ...current, progress, session: nextSession });

      try {
        await this.progressRepository.save(progress);
      } catch {
        return nextState;
      }

      return nextState;
    }

    return this.storeState({ ...current, session: nextSession });
  }

  private storeState(state: KanaTrainerState): KanaTrainerState {
    this.state = Object.freeze({ ...state });

    return this.state;
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
