import { describe, expect, test } from 'vitest';
import { findKanaByText, getKanaRow, kanaCatalog } from '../../../src/core/learning-content/kanaCatalog';

describe('kana catalog', () => {
  test('ships unique kana ids and text', () => {
    const ids = kanaCatalog.map((kana) => kana.id);
    const text = kanaCatalog.map((kana) => kana.text);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(text).size).toBe(text.length);
  });

  test('knows special romaji for hiragana shi chi and tsu', () => {
    expect(findKanaByText('し')?.romaji).toBe('shi');
    expect(findKanaByText('ち')?.romaji).toBe('chi');
    expect(findKanaByText('つ')?.romaji).toBe('tsu');
  });

  test('returns undefined for unknown kana text', () => {
    expect(findKanaByText('not-kana')).toBeUndefined();
  });

  test('returns shipped rows as stable learning units', () => {
    expect(getKanaRow('hiragana', 'a').map((kana) => kana.text)).toEqual(['あ', 'い', 'う', 'え', 'お']);
    expect(getKanaRow('hiragana', 'ka').map((kana) => kana.text)).toEqual(['か', 'き', 'く', 'け', 'こ']);
    expect(getKanaRow('hiragana', 'sa').map((kana) => kana.text)).toEqual(['さ', 'し', 'す', 'せ', 'そ']);
    expect(getKanaRow('hiragana', 'ta').map((kana) => kana.text)).toEqual(['た', 'ち', 'つ', 'て', 'と']);
    expect(getKanaRow('katakana', 'a').map((kana) => kana.text)).toEqual(['ア', 'イ', 'ウ', 'エ', 'オ']);
  });

  test('protects shared catalog content from runtime mutation', () => {
    const kana = findKanaByText('し');
    const row = getKanaRow('hiragana', 'ka');

    expect(Object.isFrozen(kanaCatalog)).toBe(true);
    expect(Object.isFrozen(kana)).toBe(true);
    expect(Object.isFrozen(row)).toBe(true);

    expect(() => {
      (kana as { romaji: string }).romaji = 'si';
    }).toThrow(TypeError);

    expect(() => {
      (row as unknown[]).push(findKanaByText('あ'));
    }).toThrow(TypeError);

    expect(findKanaByText('し')?.romaji).toBe('shi');
  });
});
