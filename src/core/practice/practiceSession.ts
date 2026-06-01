import type { Mistake, PracticePrompt, PracticeSessionState } from './model';
import type { LevelId } from '../shared/ids';
import { findLastValidRomajiPrefix } from './romajiInput';

export interface CreatePracticeSessionInput {
  readonly levelId: LevelId;
  readonly prompts: readonly PracticePrompt[];
  readonly maxMistakes: number;
  readonly startedAt?: number;
}

export interface PracticeSession extends PracticeSessionState {
  typeCharacter(character: string, occurredAt: number): PracticeSession;
  backspace(): PracticeSession;
  reset(): PracticeSession;
}

export function createPracticeSession(input: CreatePracticeSessionInput): PracticeSession {
  validateCreatePracticeSessionInput(input);

  return wrap({
    levelId: input.levelId,
    prompts: input.prompts,
    currentPromptIndex: 0,
    currentInput: '',
    mistakes: [],
    maxMistakes: input.maxMistakes,
    startedAt: input.startedAt,
    status: 'running',
    completedPrompts: 0,
  });
}

function wrap(state: PracticeSessionState): PracticeSession {
  const frozenState = freezeState(state);

  return Object.freeze({
    ...frozenState,
    typeCharacter(character: string, occurredAt: number) {
      return typeCharacter(frozenState, character, occurredAt);
    },
    backspace() {
      return backspaceCharacter(frozenState);
    },
    reset() {
      return createPracticeSession({
        levelId: frozenState.levelId,
        prompts: frozenState.prompts,
        maxMistakes: frozenState.maxMistakes,
      });
    },
  });
}

function typeCharacter(
  state: PracticeSessionState,
  character: string,
  occurredAt: number,
): PracticeSession {
  if (state.status === 'passed' || state.status === 'failed') {
    return wrap(state);
  }

  const activeState = startTimerIfNeeded(state, occurredAt);
  const prompt = activeState.prompts[activeState.currentPromptIndex];
  const expectedRomaji = prompt.romaji.toLowerCase();
  const validPrefix = findLastValidRomajiPrefix(activeState.currentInput, expectedRomaji);
  const nextInput = validPrefix + character.toLowerCase();
  const expectedPrefix = expectedRomaji.slice(0, nextInput.length);

  if (nextInput !== expectedPrefix) {
    const mistake: Mistake = {
      kanaText: prompt.kanaText,
      expectedRomaji: prompt.romaji,
      actualInput: nextInput,
      occurredAt,
    };
    const mistakes = [...activeState.mistakes, mistake];
    const failed = mistakes.length >= activeState.maxMistakes;

    return wrap({
      ...activeState,
      status: failed ? 'failed' : 'running',
      currentInput: nextInput,
      mistakes,
      endedAt: failed ? occurredAt : activeState.endedAt,
    });
  }

  if (nextInput === expectedRomaji) {
    const completedPrompts = activeState.completedPrompts + 1;
    const nextPromptIndex = activeState.currentPromptIndex + 1;
    const passed = completedPrompts === activeState.prompts.length;

    return wrap({
      ...activeState,
      status: passed ? 'passed' : 'running',
      currentInput: '',
      currentPromptIndex: passed ? activeState.currentPromptIndex : nextPromptIndex,
      completedPrompts,
      endedAt: passed ? occurredAt : activeState.endedAt,
    });
  }

  return wrap({
    ...activeState,
    status: 'running',
    currentInput: nextInput,
  });
}

function startTimerIfNeeded(state: PracticeSessionState, occurredAt: number): PracticeSessionState {
  if (state.startedAt !== undefined) {
    return state;
  }

  return {
    ...state,
    startedAt: occurredAt,
  };
}

function freezeState(state: PracticeSessionState): PracticeSessionState {
  return Object.freeze({
    ...state,
    prompts: freezePrompts(state.prompts),
    mistakes: freezeMistakes(state.mistakes),
  });
}

function freezePrompts(prompts: readonly PracticePrompt[]): readonly PracticePrompt[] {
  return Object.freeze(prompts.map((prompt) => Object.freeze({ ...prompt })));
}

function freezeMistakes(mistakes: readonly Mistake[]): readonly Mistake[] {
  return Object.freeze(mistakes.map((mistake) => Object.freeze({ ...mistake })));
}

function validateCreatePracticeSessionInput(input: CreatePracticeSessionInput): void {
  if (input.prompts.length === 0) {
    throw new Error('Practice session requires at least one prompt');
  }

  if (input.prompts.some((prompt) => prompt.romaji.length === 0)) {
    throw new Error('Practice prompt romaji is required');
  }

  if (!Number.isInteger(input.maxMistakes) || input.maxMistakes < 1) {
    throw new Error('Practice session maxMistakes must be at least 1');
  }
}

function backspaceCharacter(state: PracticeSessionState): PracticeSession {
  if (state.status === 'passed' || state.status === 'failed' || state.currentInput.length === 0) {
    return wrap(state);
  }

  return wrap({
    ...state,
    currentInput: state.currentInput.slice(0, -1),
  });
}
