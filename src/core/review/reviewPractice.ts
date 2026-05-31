import type { PracticePrompt } from '../practice/model';
import type { MistakeStat } from '../progress/model';

export interface CreateReviewPracticeInput {
  readonly mistakeStats: readonly MistakeStat[];
  readonly maxPrompts: number;
}

export interface ReviewPractice {
  readonly levelId: 'review-mistakes';
  readonly prompts: readonly PracticePrompt[];
}

export function createReviewPractice(input: CreateReviewPracticeInput): ReviewPractice {
  validateMaxPrompts(input.maxPrompts);

  const prompts = validateMistakeStats(input.mistakeStats)
    .sort(compareMistakeStats)
    .slice(0, input.maxPrompts)
    .map((stat) =>
      Object.freeze({
        kanaText: stat.kanaText,
        romaji: stat.expectedRomaji,
      }),
    );

  return Object.freeze({
    levelId: 'review-mistakes',
    prompts: Object.freeze(prompts),
  });
}

function compareMistakeStats(left: MistakeStat, right: MistakeStat): number {
  return right.count - left.count || right.lastMistakeAt - left.lastMistakeAt;
}

function validateMaxPrompts(maxPrompts: number): void {
  if (!Number.isInteger(maxPrompts) || maxPrompts < 1) {
    throw new Error('Review practice maxPrompts must be a positive integer');
  }

  if (!Number.isSafeInteger(maxPrompts)) {
    throw new Error('Review practice maxPrompts must be a safe positive integer');
  }
}

function validateMistakeStats(mistakeStats: unknown): MistakeStat[] {
  if (!Array.isArray(mistakeStats)) {
    throw new Error('mistakeStats must be an array');
  }

  return mistakeStats.map(validateMistakeStat);
}

function validateMistakeStat(stat: unknown, index: number): MistakeStat {
  const prefix = `mistakeStats[${index}]`;

  if (!isObject(stat)) {
    throw new Error(`${prefix} must be an object`);
  }

  const kanaText = validateNonEmptyString(stat.kanaText, `${prefix}.kanaText`);
  const expectedRomaji = validateNonEmptyString(stat.expectedRomaji, `${prefix}.expectedRomaji`);
  const count = stat.count;
  const lastMistakeAt = stat.lastMistakeAt;

  if (typeof count !== 'number' || !Number.isInteger(count) || count < 1) {
    throw new Error(`${prefix}.count must be a positive integer`);
  }

  if (!Number.isSafeInteger(count)) {
    throw new Error(`${prefix}.count must be a safe positive integer`);
  }

  if (typeof lastMistakeAt !== 'number' || !Number.isFinite(lastMistakeAt)) {
    throw new Error(`${prefix}.lastMistakeAt must be a finite timestamp`);
  }

  return {
    kanaText,
    expectedRomaji,
    count,
    lastMistakeAt,
  };
}

function validateNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }

  if (value.trim().length === 0) {
    throw new Error(`${fieldName} must not be empty`);
  }

  return value;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
