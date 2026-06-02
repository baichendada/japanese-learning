import { describe, expect, test } from 'vitest';
import { getLevelPreviewItems } from '../../../src/core/learning-content/levelPreview';
import { getLevelById } from '../../../src/core/learning-content/levelCatalog';

describe('levelPreview', () => {
  test('shows word labels for word levels', () => {
    const level = getLevelById('katakana-word-pan');

    if (level === undefined) {
      throw new Error('Expected katakana-word-pan level');
    }

    expect(getLevelPreviewItems(level)).toEqual([{ type: 'word', label: 'パン' }]);
  });

  test('shows every kana for long levels so the drawer can wrap naturally', () => {
    const level = getLevelById('hiragana-master');

    if (level === undefined) {
      throw new Error('Expected hiragana-master level');
    }

    expect(getLevelPreviewItems(level)).toHaveLength(level.kanaTexts.length);
    expect(getLevelPreviewItems(level).every((item) => item.type === 'kana')).toBe(true);
  });

  test('shows every word label for word review levels', () => {
    const level = getLevelById('katakana-word-tv-review');

    if (level === undefined || level.wordLabels === undefined) {
      throw new Error('Expected katakana-word-tv-review level');
    }

    expect(getLevelPreviewItems(level)).toEqual(
      level.wordLabels.map((label) => ({ type: 'word', label })),
    );
  });
});
