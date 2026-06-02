import type { Level } from './levelCatalog';

export type LevelPreviewItem =
  | { readonly type: 'kana'; readonly text: string }
  | { readonly type: 'word'; readonly label: string };

export function getLevelPreviewItems(level: Level): readonly LevelPreviewItem[] {
  if (level.displayMode === 'word' && level.wordLabels !== undefined) {
    return Object.freeze(level.wordLabels.map((label) => Object.freeze({ type: 'word' as const, label })));
  }

  return Object.freeze(level.kanaTexts.map((text) => Object.freeze({ type: 'kana' as const, text })));
}
