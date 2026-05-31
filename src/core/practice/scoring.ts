export interface ScorePracticeSessionInput {
  readonly completedPrompts: number;
  readonly mistakeCount: number;
  readonly startedAt: number;
  readonly endedAt: number;
  readonly passAccuracy: number;
}

export interface PracticeScore {
  readonly accuracy: number;
  readonly kanaPerMinute: number;
  readonly passed: boolean;
  readonly stars: 0 | 1 | 2 | 3;
}

export function scorePracticeSession(input: ScorePracticeSessionInput): PracticeScore {
  validateScorePracticeSessionInput(input);

  const attempts = input.completedPrompts + input.mistakeCount;
  const rawAccuracy = attempts === 0 ? 0 : input.completedPrompts / attempts;
  const accuracy = roundTo(rawAccuracy, 3);
  const elapsedMinutes = Math.max((input.endedAt - input.startedAt) / 60_000, 1 / 60);
  const rawKanaPerMinute = input.completedPrompts / elapsedMinutes;
  const kanaPerMinute = roundTo(rawKanaPerMinute, 1);
  const passed = rawAccuracy >= input.passAccuracy;

  return {
    accuracy,
    kanaPerMinute,
    passed,
    stars: scoreStars(passed, rawKanaPerMinute),
  };
}

function validateScorePracticeSessionInput(input: ScorePracticeSessionInput): void {
  validateCount(input.completedPrompts, 'completedPrompts');
  validateCount(input.mistakeCount, 'mistakeCount');

  if (!Number.isFinite(input.startedAt)) {
    throw new Error('startedAt must be a finite timestamp');
  }

  if (!Number.isFinite(input.endedAt)) {
    throw new Error('endedAt must be a finite timestamp');
  }

  if (!Number.isFinite(input.passAccuracy) || input.passAccuracy < 0 || input.passAccuracy > 1) {
    throw new Error('passAccuracy must be a finite number between 0 and 1');
  }

  if (input.endedAt < input.startedAt) {
    throw new Error('endedAt must be greater than or equal to startedAt');
  }
}

function validateCount(value: number, fieldName: 'completedPrompts' | 'mistakeCount'): void {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new Error(`${fieldName} must be a finite non-negative integer`);
  }
}

function scoreStars(passed: boolean, kanaPerMinute: number): 0 | 1 | 2 | 3 {
  if (!passed) {
    return 0;
  }

  if (kanaPerMinute >= 40) {
    return 3;
  }

  if (kanaPerMinute >= 10) {
    return 2;
  }

  return 1;
}

function roundTo(value: number, decimalPlaces: number): number {
  const scale = 10 ** decimalPlaces;

  return Math.round(value * scale) / scale;
}
