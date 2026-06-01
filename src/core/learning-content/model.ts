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
  readonly id: KanaId;
  readonly script: KanaScript;
  readonly row: KanaRowName;
  readonly text: string;
  readonly romaji: string;
}
