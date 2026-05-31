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

  const prompts = [...input.mistakeStats]
    .map(validateMistakeStat)
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

function validateMistakeStat(stat: MistakeStat, index: number): MistakeStat {
  const prefix = `mistakeStats[${index}]`;

  if (stat.kanaText.length === 0) {
    throw new Error(`${prefix}.kanaText must not be empty`);
  }

  if (stat.expectedRomaji.length === 0) {
    throw new Error(`${prefix}.expectedRomaji must not be empty`);
  }

  if (!Number.isInteger(stat.count) || stat.count < 1) {
    throw new Error(`${prefix}.count must be a positive integer`);
  }

  if (!Number.isSafeInteger(stat.count)) {
    throw new Error(`${prefix}.count must be a safe positive integer`);
  }

  if (!Number.isFinite(stat.lastMistakeAt)) {
    throw new Error(`${prefix}.lastMistakeAt must be a finite timestamp`);
  }

  return stat;
}
