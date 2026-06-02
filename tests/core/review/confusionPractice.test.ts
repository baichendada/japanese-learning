import { describe, expect, test } from 'vitest';
import { createConfusionPractice, confusionPairs } from '../../../src/core/review/confusionPractice';

describe('confusionPractice', () => {
  test('creates shuffled prompts for every confusion kana', () => {
    const practice = createConfusionPractice();
    const expectedKana = [...new Set(confusionPairs.flatMap((pair) => [pair.left, pair.right]))].sort();

    expect(practice.levelId).toBe('practice-confusion');
    expect(practice.prompts.map((prompt) => prompt.kanaText).sort()).toEqual(expectedKana);
  });
});
