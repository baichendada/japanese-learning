import { describe, expect, test } from 'vitest';
import { getKanaAudioUrl } from '../../src/web/kanaAudioUrl';

describe('getKanaAudioUrl', () => {
  test('builds Tofugu hiragana audio urls from kana text', () => {
    expect(getKanaAudioUrl('あ')).toBe(
      'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%81%82.mp3',
    );
    expect(getKanaAudioUrl('きゃ')).toBe(
      'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/%E3%81%8D%E3%82%83.mp3',
    );
  });

  test('reuses hiragana audio for katakana glyphs', () => {
    expect(getKanaAudioUrl('ア')).toBe(getKanaAudioUrl('あ'));
    expect(getKanaAudioUrl('ギャ')).toBe(getKanaAudioUrl('ぎゃ'));
  });

  test('returns undefined for unsupported characters', () => {
    expect(getKanaAudioUrl('A')).toBeUndefined();
    expect(getKanaAudioUrl('')).toBeUndefined();
  });
});
