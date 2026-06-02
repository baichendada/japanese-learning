import type { PracticePrompt } from '../practice/model';
import { findKanaByText } from './kanaCatalog';
import type { Level } from './levelCatalog';
import { buildWordPrompts, getWordById } from './wordCatalog';

export function buildLevelPrompts(level: Level): readonly PracticePrompt[] {
  const prompts =
    level.displayMode === 'word' && level.wordIds !== undefined
      ? buildWordLevelPrompts(level)
      : buildKanaLevelPrompts(level);

  return Object.freeze(prompts);
}

function buildKanaLevelPrompts(level: Level): readonly PracticePrompt[] {
  const prompts = level.kanaTexts.map((kanaText) => {
    const kana = findKanaByText(kanaText);

    if (kana === undefined) {
      throw new Error(`Unknown kana in level ${level.id}: ${kanaText}`);
    }

    return Object.freeze({ kanaText, romaji: kana.romaji });
  });

  if (level.promptOrder === 'shuffled') {
    return shuffleReadonly(prompts);
  }

  return Object.freeze(prompts);
}

function buildWordLevelPrompts(level: Level): readonly PracticePrompt[] {
  const wordIds = level.wordIds ?? [];

  if (wordIds.length === 0) {
    throw new Error(`Word level ${level.id} is missing wordIds`);
  }

  for (const wordId of wordIds) {
    getWordById(wordId);
  }

  if (level.promptOrder === 'shuffled') {
    const shuffledWordIds = shuffleReadonly(wordIds);

    return buildWordPrompts(shuffledWordIds);
  }

  return buildWordPrompts(wordIds);
}

export function shuffleReadonly<T>(
  items: readonly T[],
  random: () => number = Math.random,
): readonly T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = copy[index];
    copy[index] = copy[swapIndex] as T;
    copy[swapIndex] = current as T;
  }

  return Object.freeze(copy);
}
