import type { PracticePrompt } from '../practice/model';
import type { KanaScript } from './model';

export interface WordMora {
  readonly kanaText: string;
  readonly romaji: string;
}

export interface WordEntry {
  readonly id: string;
  readonly label: string;
  readonly script: KanaScript;
  readonly morae: readonly WordMora[];
}

const wordEntries: readonly WordEntry[] = Object.freeze([
  Object.freeze({
    id: 'word-katakana-pan',
    label: 'パン',
    script: 'katakana' as const,
    morae: Object.freeze([
      Object.freeze({ kanaText: 'パ', romaji: 'pa' }),
      Object.freeze({ kanaText: 'ン', romaji: 'n' }),
    ]),
  }),
  Object.freeze({
    id: 'word-katakana-pizza',
    label: 'ピザ',
    script: 'katakana' as const,
    morae: Object.freeze([
      Object.freeze({ kanaText: 'ピ', romaji: 'pi' }),
      Object.freeze({ kanaText: 'ザ', romaji: 'za' }),
    ]),
  }),
  Object.freeze({
    id: 'word-katakana-coffee',
    label: 'コーヒー',
    script: 'katakana' as const,
    morae: Object.freeze([
      Object.freeze({ kanaText: 'コ', romaji: 'ko' }),
      Object.freeze({ kanaText: 'ー', romaji: 'o' }),
      Object.freeze({ kanaText: 'ヒ', romaji: 'hi' }),
      Object.freeze({ kanaText: 'ー', romaji: 'i' }),
    ]),
  }),
  Object.freeze({
    id: 'word-katakana-menu',
    label: 'メニュー',
    script: 'katakana' as const,
    morae: Object.freeze([
      Object.freeze({ kanaText: 'メ', romaji: 'me' }),
      Object.freeze({ kanaText: 'ニュ', romaji: 'nyu' }),
      Object.freeze({ kanaText: 'ー', romaji: 'u' }),
    ]),
  }),
  Object.freeze({
    id: 'word-katakana-tv',
    label: 'テレビ',
    script: 'katakana' as const,
    morae: Object.freeze([
      Object.freeze({ kanaText: 'テ', romaji: 'te' }),
      Object.freeze({ kanaText: 'レ', romaji: 're' }),
      Object.freeze({ kanaText: 'ビ', romaji: 'bi' }),
    ]),
  }),
  Object.freeze({
    id: 'word-hiragana-arigatou',
    label: 'ありがとう',
    script: 'hiragana' as const,
    morae: Object.freeze([
      Object.freeze({ kanaText: 'あ', romaji: 'a' }),
      Object.freeze({ kanaText: 'り', romaji: 'ri' }),
      Object.freeze({ kanaText: 'が', romaji: 'ga' }),
      Object.freeze({ kanaText: 'と', romaji: 'to' }),
      Object.freeze({ kanaText: 'う', romaji: 'u' }),
    ]),
  }),
  Object.freeze({
    id: 'word-hiragana-sumimasen',
    label: 'すみません',
    script: 'hiragana' as const,
    morae: Object.freeze([
      Object.freeze({ kanaText: 'す', romaji: 'su' }),
      Object.freeze({ kanaText: 'み', romaji: 'mi' }),
      Object.freeze({ kanaText: 'ま', romaji: 'ma' }),
      Object.freeze({ kanaText: 'せ', romaji: 'se' }),
      Object.freeze({ kanaText: 'ん', romaji: 'n' }),
    ]),
  }),
  Object.freeze({
    id: 'word-hiragana-konnichiwa',
    label: 'こんにちは',
    script: 'hiragana' as const,
    morae: Object.freeze([
      Object.freeze({ kanaText: 'こ', romaji: 'ko' }),
      Object.freeze({ kanaText: 'ん', romaji: 'n' }),
      Object.freeze({ kanaText: 'に', romaji: 'ni' }),
      Object.freeze({ kanaText: 'ち', romaji: 'chi' }),
      Object.freeze({ kanaText: 'は', romaji: 'wa' }),
    ]),
  }),
  Object.freeze({
    id: 'word-hiragana-sayounara',
    label: 'さようなら',
    script: 'hiragana' as const,
    morae: Object.freeze([
      Object.freeze({ kanaText: 'さ', romaji: 'sa' }),
      Object.freeze({ kanaText: 'よ', romaji: 'yo' }),
      Object.freeze({ kanaText: 'う', romaji: 'u' }),
      Object.freeze({ kanaText: 'な', romaji: 'na' }),
      Object.freeze({ kanaText: 'ら', romaji: 'ra' }),
    ]),
  }),
  Object.freeze({
    id: 'word-hiragana-ohayou',
    label: 'おはよう',
    script: 'hiragana' as const,
    morae: Object.freeze([
      Object.freeze({ kanaText: 'お', romaji: 'o' }),
      Object.freeze({ kanaText: 'は', romaji: 'ha' }),
      Object.freeze({ kanaText: 'よ', romaji: 'yo' }),
      Object.freeze({ kanaText: 'う', romaji: 'u' }),
    ]),
  }),
]);

export function getWordById(id: string): WordEntry {
  const word = wordEntries.find((entry) => entry.id === id);

  if (word === undefined) {
    throw new Error(`Unknown word: ${id}`);
  }

  return word;
}

export function buildWordPrompts(wordIds: readonly string[], wordIndexOffset = 0): readonly PracticePrompt[] {
  return Object.freeze(
    wordIds.flatMap((wordId, wordOffset) => {
      const word = getWordById(wordId);
      const wordIndex = wordIndexOffset + wordOffset;

      return word.morae.map((mora) =>
        Object.freeze({
          kanaText: mora.kanaText,
          romaji: mora.romaji,
          wordIndex,
        }),
      );
    }),
  );
}

export function flattenWordKanaTexts(wordIds: readonly string[]): readonly string[] {
  return Object.freeze(wordIds.flatMap((wordId) => getWordById(wordId).morae.map((mora) => mora.kanaText)));
}

export function buildWordGroups(wordIds: readonly string[]): readonly (readonly string[])[] {
  return Object.freeze(wordIds.map((wordId) => Object.freeze(getWordById(wordId).morae.map((mora) => mora.kanaText))));
}

export function buildWordLabels(wordIds: readonly string[]): readonly string[] {
  return Object.freeze(wordIds.map((wordId) => getWordById(wordId).label));
}
