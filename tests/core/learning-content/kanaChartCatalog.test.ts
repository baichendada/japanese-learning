import { describe, expect, test } from 'vitest';
import { getChartExtendedKana } from '../../../src/core/learning-content/kanaChartCatalog';

describe('kana chart catalog', () => {
  test('ships unique extended chart kana for each script', () => {
    for (const script of ['hiragana', 'katakana'] as const) {
      const items = getChartExtendedKana(script);
      const ids = items.map((item) => item.id);
      const text = items.map((item) => item.text);

      expect(new Set(ids).size).toBe(ids.length);
      expect(new Set(text).size).toBe(text.length);
      expect(items.length).toBe(58);
    }
  });

  test('maps dakuon rows to expected hiragana glyphs', () => {
    const items = getChartExtendedKana('hiragana');
    const texts = items.map((item) => item.text);

    expect(texts).toContain('が');
    expect(texts).toContain('ぢ');
    expect(texts).toContain('びゃ');
  });
});
