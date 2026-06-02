import { describe, expect, test } from 'vitest';
import { buildLevelPrompts, shuffleReadonly } from '../../../src/core/learning-content/promptBuilder';
import { getLevelById } from '../../../src/core/learning-content/levelCatalog';

describe('promptBuilder', () => {
  test('builds sequential prompts in level order', () => {
    const level = getLevelById('hiragana-a');

    if (level === undefined) {
      throw new Error('Expected hiragana-a level');
    }

    expect(buildLevelPrompts(level).map((prompt) => prompt.kanaText)).toEqual(['あ', 'い', 'う', 'え', 'お']);
  });

  test('shuffles review prompts while keeping the same kana set', () => {
    const level = getLevelById('hiragana-ka-review');

    if (level === undefined) {
      throw new Error('Expected hiragana-ka-review level');
    }

    const prompts = buildLevelPrompts(level);
    const kanaTexts = prompts.map((prompt) => prompt.kanaText).slice().sort();

    expect(prompts).toHaveLength(10);
    expect(kanaTexts).toEqual(['あ', 'い', 'う', 'え', 'お', 'か', 'き', 'く', 'け', 'こ'].sort());
  });

  test('shuffleReadonly keeps the same items', () => {
    const source = ['あ', 'い', 'う'];
    const shuffled = shuffleReadonly(source, () => 0);

    expect([...shuffled].sort()).toEqual([...source].sort());
    expect(shuffled).not.toBe(source);
  });

  test('builds word prompts in mora order with wordIndex metadata', () => {
    const level = getLevelById('katakana-word-coffee');

    if (level === undefined) {
      throw new Error('Expected katakana-word-coffee level');
    }

    expect(buildLevelPrompts(level)).toEqual([
      { kanaText: 'コ', romaji: 'ko', wordIndex: 0 },
      { kanaText: 'ー', romaji: 'o', wordIndex: 0 },
      { kanaText: 'ヒ', romaji: 'hi', wordIndex: 0 },
      { kanaText: 'ー', romaji: 'i', wordIndex: 0 },
    ]);
  });

  test('shuffles word review levels by whole words', () => {
    const level = getLevelById('katakana-word-pizza-review');

    if (level === undefined) {
      throw new Error('Expected katakana-word-pizza-review level');
    }

    const prompts = buildLevelPrompts(level);
    const grouped = new Map<number, string[]>();

    for (const prompt of prompts) {
      const wordIndex = prompt.wordIndex ?? 0;
      const current = grouped.get(wordIndex) ?? [];
      current.push(prompt.kanaText);
      grouped.set(wordIndex, current);
    }

    expect([...grouped.values()].sort()).toEqual([
      ['パ', 'ン'],
      ['ピ', 'ザ'],
    ]);
  });

  test('uses wa romaji for こんにちは', () => {
    const level = getLevelById('hiragana-word-konnichiwa');

    if (level === undefined) {
      throw new Error('Expected hiragana-word-konnichiwa level');
    }

    expect(buildLevelPrompts(level).at(-1)).toEqual({ kanaText: 'は', romaji: 'wa', wordIndex: 0 });
  });
});
