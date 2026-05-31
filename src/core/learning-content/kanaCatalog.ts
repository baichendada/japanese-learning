import { kanaId } from '../shared/ids';
import type { Kana, KanaRowName, KanaScript } from './model';

export const kanaCatalog: readonly Kana[] = [
  { id: kanaId('hiragana-a'), script: 'hiragana', row: 'a', text: 'あ', romaji: 'a' },
  { id: kanaId('hiragana-i'), script: 'hiragana', row: 'a', text: 'い', romaji: 'i' },
  { id: kanaId('hiragana-u'), script: 'hiragana', row: 'a', text: 'う', romaji: 'u' },
  { id: kanaId('hiragana-e'), script: 'hiragana', row: 'a', text: 'え', romaji: 'e' },
  { id: kanaId('hiragana-o'), script: 'hiragana', row: 'a', text: 'お', romaji: 'o' },
  { id: kanaId('hiragana-ka'), script: 'hiragana', row: 'ka', text: 'か', romaji: 'ka' },
  { id: kanaId('hiragana-ki'), script: 'hiragana', row: 'ka', text: 'き', romaji: 'ki' },
  { id: kanaId('hiragana-ku'), script: 'hiragana', row: 'ka', text: 'く', romaji: 'ku' },
  { id: kanaId('hiragana-ke'), script: 'hiragana', row: 'ka', text: 'け', romaji: 'ke' },
  { id: kanaId('hiragana-ko'), script: 'hiragana', row: 'ka', text: 'こ', romaji: 'ko' },
  { id: kanaId('hiragana-sa'), script: 'hiragana', row: 'sa', text: 'さ', romaji: 'sa' },
  { id: kanaId('hiragana-shi'), script: 'hiragana', row: 'sa', text: 'し', romaji: 'shi' },
  { id: kanaId('hiragana-su'), script: 'hiragana', row: 'sa', text: 'す', romaji: 'su' },
  { id: kanaId('hiragana-se'), script: 'hiragana', row: 'sa', text: 'せ', romaji: 'se' },
  { id: kanaId('hiragana-so'), script: 'hiragana', row: 'sa', text: 'そ', romaji: 'so' },
  { id: kanaId('hiragana-ta'), script: 'hiragana', row: 'ta', text: 'た', romaji: 'ta' },
  { id: kanaId('hiragana-chi'), script: 'hiragana', row: 'ta', text: 'ち', romaji: 'chi' },
  { id: kanaId('hiragana-tsu'), script: 'hiragana', row: 'ta', text: 'つ', romaji: 'tsu' },
  { id: kanaId('hiragana-te'), script: 'hiragana', row: 'ta', text: 'て', romaji: 'te' },
  { id: kanaId('hiragana-to'), script: 'hiragana', row: 'ta', text: 'と', romaji: 'to' },
  { id: kanaId('katakana-a'), script: 'katakana', row: 'a', text: 'ア', romaji: 'a' },
  { id: kanaId('katakana-i'), script: 'katakana', row: 'a', text: 'イ', romaji: 'i' },
  { id: kanaId('katakana-u'), script: 'katakana', row: 'a', text: 'ウ', romaji: 'u' },
  { id: kanaId('katakana-e'), script: 'katakana', row: 'a', text: 'エ', romaji: 'e' },
  { id: kanaId('katakana-o'), script: 'katakana', row: 'a', text: 'オ', romaji: 'o' },
] as const;

export function findKanaByText(text: string): Kana | undefined {
  return kanaCatalog.find((kana) => kana.text === text);
}

export function getKanaRow(script: KanaScript, row: KanaRowName): Kana[] {
  return kanaCatalog.filter((kana) => kana.script === script && kana.row === row);
}
