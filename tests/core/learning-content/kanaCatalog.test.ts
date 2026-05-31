import { describe, expect, test } from 'vitest';
import { findKanaByText, getKanaRow } from '../../../src/core/learning-content/kanaCatalog';

describe('kana catalog', () => {
  test('knows special romaji for hiragana shi chi and tsu', () => {
    expect(findKanaByText('し')?.romaji).toBe('shi');
    expect(findKanaByText('ち')?.romaji).toBe('chi');
    expect(findKanaByText('つ')?.romaji).toBe('tsu');
  });

  test('returns the ka row as a stable learning unit', () => {
    expect(getKanaRow('hiragana', 'ka').map((kana) => kana.text)).toEqual([
      'か',
      'き',
      'く',
      'け',
      'こ',
    ]);
  });
});
