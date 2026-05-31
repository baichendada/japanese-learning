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
  const attempts = input.completedPrompts + input.mistakeCount;
  const accuracy = attempts === 0 ? 0 : roundTo(input.completedPrompts / attempts, 3);
  const elapsedMinutes = Math.max((input.endedAt - input.startedAt) / 60_000, 1 / 60);
  const kanaPerMinute = roundTo(input.completedPrompts / elapsedMinutes, 1);
  const passed = accuracy >= input.passAccuracy;

  return {
    accuracy,
    kanaPerMinute,
    passed,
    stars: scoreStars(passed, kanaPerMinute),
  };
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
