import { describe, expect, test } from 'vitest';
import { buildKanaChart } from '../../../src/core/learning-content/kanaChart';
import { getKanaRow } from '../../../src/core/learning-content/kanaCatalog';
import { getChartExtendedKana } from '../../../src/core/learning-content/kanaChartCatalog';

describe('buildKanaChart', () => {
  test('lays out seion rows in a five-vowel grid', () => {
    const chart = buildKanaChart('hiragana');
    const seion = chart.sections.find((section) => section.title === '清音');
    const aRow = seion?.rows.find((row) => row.label === 'あ行');
    const kaRow = seion?.rows.find((row) => row.label === 'か行');
    const raRow = seion?.rows.find((row) => row.label === 'ら行');

    expect(aRow?.cells.map((kana) => kana?.text)).toEqual(['あ', 'い', 'う', 'え', 'お']);
    expect(kaRow?.cells.map((kana) => kana?.text)).toEqual(['か', 'き', 'く', 'け', 'こ']);
    expect(raRow?.cells.map((kana) => kana?.text)).toEqual(['ら', 'り', 'る', 'れ', 'ろ']);
  });

  test('places sparse ya and wa rows in the standard chart slots', () => {
    const chart = buildKanaChart('hiragana');
    const seion = chart.sections.find((section) => section.title === '清音');

    expect(seion?.rows.find((row) => row.label === 'や行')?.cells.map((kana) => kana?.text ?? null)).toEqual([
      'や',
      null,
      'ゆ',
      null,
      'よ',
    ]);
    expect(seion?.rows.find((row) => row.label === 'わ行')?.cells.map((kana) => kana?.text ?? null)).toEqual([
      'わ',
      null,
      null,
      null,
      'を',
    ]);
  });

  test('renders standalone n outside the wa row grid', () => {
    const chart = buildKanaChart('katakana');
    const seion = chart.sections.find((section) => section.title === '清音');

    expect(seion?.standaloneN?.text).toBe('ン');
    expect(getKanaRow('katakana', 'wa').map((kana) => kana.text)).toEqual(['ワ', 'ヲ', 'ン']);
  });

  test('includes dakuon, handakuon, and youon sections', () => {
    const chart = buildKanaChart('hiragana');

    expect(chart.sections.map((section) => section.title)).toEqual(['清音', '浊音', '半浊音', '拗音']);

    const dakuon = chart.sections.find((section) => section.title === '浊音');
    expect(dakuon?.rows.find((row) => row.label === 'が行')?.cells.map((kana) => kana?.text)).toEqual([
      'が',
      'ぎ',
      'ぐ',
      'げ',
      'ご',
    ]);

    const handakuon = chart.sections.find((section) => section.title === '半浊音');
    expect(handakuon?.rows[0]?.cells.map((kana) => kana?.text)).toEqual(['ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ']);

    const youon = chart.sections.find((section) => section.title === '拗音');
    expect(youon?.rows.find((row) => row.label === 'き行')?.cells.map((kana) => kana?.text ?? null)).toEqual([
      'きゃ',
      null,
      'きゅ',
      null,
      'きょ',
    ]);
  });

  test('ships matching katakana chart entries for extended kana', () => {
    const extended = getChartExtendedKana('katakana');

    expect(extended.some((kana) => kana.text === 'ギャ' && kana.romaji === 'gya')).toBe(true);
    expect(extended.some((kana) => kana.text === 'パ' && kana.romaji === 'pa')).toBe(true);
  });
});
