import type { KanaId } from '../shared/ids';

export type KanaScript = 'hiragana' | 'katakana';

export type KanaRowName =
  | 'a'
  | 'ka'
  | 'sa'
  | 'ta'
  | 'na'
  | 'ha'
  | 'ma'
  | 'ya'
  | 'ra'
  | 'wa';

export interface Kana {
  id: KanaId;
  script: KanaScript;
  row: KanaRowName;
  text: string;
  romaji: string;
}
