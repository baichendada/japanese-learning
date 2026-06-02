import type { LevelId } from '../shared/ids';

export type PracticeStatus = 'ready' | 'running' | 'passed' | 'failed';

export interface PracticePrompt {
  readonly kanaText: string;
  readonly romaji: string;
  readonly wordIndex?: number;
}

export interface Mistake {
  readonly kanaText: string;
  readonly expectedRomaji: string;
  readonly actualInput: string;
  readonly occurredAt: number;
}

export interface PracticeSessionState {
  readonly levelId: LevelId;
  readonly prompts: readonly PracticePrompt[];
  readonly currentPromptIndex: number;
  readonly currentInput: string;
  readonly mistakes: readonly Mistake[];
  readonly maxMistakes: number;
  readonly startedAt?: number;
  readonly endedAt?: number;
  readonly status: PracticeStatus;
  readonly completedPrompts: number;
}
