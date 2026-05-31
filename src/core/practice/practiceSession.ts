import type { Mistake, PracticePrompt, PracticeSessionState } from './model';

export interface CreatePracticeSessionInput {
  readonly levelId: string;
  readonly prompts: readonly PracticePrompt[];
  readonly maxMistakes: number;
  readonly startedAt: number;
}

export interface PracticeSession extends PracticeSessionState {
  typeCharacter(character: string, occurredAt: number): PracticeSession;
  reset(startedAt: number): PracticeSession;
}

export function createPracticeSession(input: CreatePracticeSessionInput): PracticeSession {
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
    reset(startedAt: number) {
      return createPracticeSession({
        levelId: frozenState.levelId,
        prompts: frozenState.prompts,
        maxMistakes: frozenState.maxMistakes,
        startedAt,
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

  const prompt = state.prompts[state.currentPromptIndex];
  const expectedRomaji = prompt.romaji.toLowerCase();
  const nextInput = state.currentInput + character.toLowerCase();
  const expectedPrefix = expectedRomaji.slice(0, nextInput.length);

  if (nextInput !== expectedPrefix) {
    const mistake: Mistake = {
      kanaText: prompt.kanaText,
      expectedRomaji: prompt.romaji,
      actualInput: nextInput,
      occurredAt,
    };
    const mistakes = [...state.mistakes, mistake];
    const failed = mistakes.length >= state.maxMistakes;

    return wrap({
      ...state,
      status: failed ? 'failed' : 'running',
      currentInput: nextInput,
      mistakes,
      endedAt: failed ? occurredAt : state.endedAt,
    });
  }

  if (nextInput === expectedRomaji) {
    const completedPrompts = state.completedPrompts + 1;
    const nextPromptIndex = state.currentPromptIndex + 1;
    const passed = completedPrompts === state.prompts.length;

    return wrap({
      ...state,
      status: passed ? 'passed' : 'running',
      currentInput: '',
      currentPromptIndex: passed ? state.currentPromptIndex : nextPromptIndex,
      completedPrompts,
      endedAt: passed ? occurredAt : state.endedAt,
    });
  }

  return wrap({
    ...state,
    status: 'running',
    currentInput: nextInput,
  });
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
