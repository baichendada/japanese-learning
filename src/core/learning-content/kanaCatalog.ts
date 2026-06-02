import { kanaId } from '../shared/ids';
import { getChartExtendedKana } from './kanaChartCatalog';
import type { Kana, KanaRowName, KanaScript } from './model';

function defineKana(
  id: string,
  script: KanaScript,
  row: KanaRowName,
  text: string,
  romaji: string,
): Kana {
  return Object.freeze({ id: kanaId(id), script, row, text, romaji });
}

const shippedKana: readonly Kana[] = [
  defineKana('hiragana-a', 'hiragana', 'a', 'あ', 'a'),
  defineKana('hiragana-i', 'hiragana', 'a', 'い', 'i'),
  defineKana('hiragana-u', 'hiragana', 'a', 'う', 'u'),
  defineKana('hiragana-e', 'hiragana', 'a', 'え', 'e'),
  defineKana('hiragana-o', 'hiragana', 'a', 'お', 'o'),
  defineKana('hiragana-ka', 'hiragana', 'ka', 'か', 'ka'),
  defineKana('hiragana-ki', 'hiragana', 'ka', 'き', 'ki'),
  defineKana('hiragana-ku', 'hiragana', 'ka', 'く', 'ku'),
  defineKana('hiragana-ke', 'hiragana', 'ka', 'け', 'ke'),
  defineKana('hiragana-ko', 'hiragana', 'ka', 'こ', 'ko'),
  defineKana('hiragana-sa', 'hiragana', 'sa', 'さ', 'sa'),
  defineKana('hiragana-shi', 'hiragana', 'sa', 'し', 'shi'),
  defineKana('hiragana-su', 'hiragana', 'sa', 'す', 'su'),
  defineKana('hiragana-se', 'hiragana', 'sa', 'せ', 'se'),
  defineKana('hiragana-so', 'hiragana', 'sa', 'そ', 'so'),
  defineKana('hiragana-ta', 'hiragana', 'ta', 'た', 'ta'),
  defineKana('hiragana-chi', 'hiragana', 'ta', 'ち', 'chi'),
  defineKana('hiragana-tsu', 'hiragana', 'ta', 'つ', 'tsu'),
  defineKana('hiragana-te', 'hiragana', 'ta', 'て', 'te'),
  defineKana('hiragana-to', 'hiragana', 'ta', 'と', 'to'),
  defineKana('hiragana-na', 'hiragana', 'na', 'な', 'na'),
  defineKana('hiragana-ni', 'hiragana', 'na', 'に', 'ni'),
  defineKana('hiragana-nu', 'hiragana', 'na', 'ぬ', 'nu'),
  defineKana('hiragana-ne', 'hiragana', 'na', 'ね', 'ne'),
  defineKana('hiragana-no', 'hiragana', 'na', 'の', 'no'),
  defineKana('hiragana-ha', 'hiragana', 'ha', 'は', 'ha'),
  defineKana('hiragana-hi', 'hiragana', 'ha', 'ひ', 'hi'),
  defineKana('hiragana-fu', 'hiragana', 'ha', 'ふ', 'fu'),
  defineKana('hiragana-he', 'hiragana', 'ha', 'へ', 'he'),
  defineKana('hiragana-ho', 'hiragana', 'ha', 'ほ', 'ho'),
  defineKana('hiragana-ma', 'hiragana', 'ma', 'ま', 'ma'),
  defineKana('hiragana-mi', 'hiragana', 'ma', 'み', 'mi'),
  defineKana('hiragana-mu', 'hiragana', 'ma', 'む', 'mu'),
  defineKana('hiragana-me', 'hiragana', 'ma', 'め', 'me'),
  defineKana('hiragana-mo', 'hiragana', 'ma', 'も', 'mo'),
  defineKana('hiragana-ya', 'hiragana', 'ya', 'や', 'ya'),
  defineKana('hiragana-yu', 'hiragana', 'ya', 'ゆ', 'yu'),
  defineKana('hiragana-yo', 'hiragana', 'ya', 'よ', 'yo'),
  defineKana('hiragana-ra', 'hiragana', 'ra', 'ら', 'ra'),
  defineKana('hiragana-ri', 'hiragana', 'ra', 'り', 'ri'),
  defineKana('hiragana-ru', 'hiragana', 'ra', 'る', 'ru'),
  defineKana('hiragana-re', 'hiragana', 'ra', 'れ', 're'),
  defineKana('hiragana-ro', 'hiragana', 'ra', 'ろ', 'ro'),
  defineKana('hiragana-wa', 'hiragana', 'wa', 'わ', 'wa'),
  defineKana('hiragana-wo', 'hiragana', 'wa', 'を', 'wo'),
  defineKana('hiragana-n', 'hiragana', 'wa', 'ん', 'n'),
  defineKana('katakana-a', 'katakana', 'a', 'ア', 'a'),
  defineKana('katakana-i', 'katakana', 'a', 'イ', 'i'),
  defineKana('katakana-u', 'katakana', 'a', 'ウ', 'u'),
  defineKana('katakana-e', 'katakana', 'a', 'エ', 'e'),
  defineKana('katakana-o', 'katakana', 'a', 'オ', 'o'),
  defineKana('katakana-ka', 'katakana', 'ka', 'カ', 'ka'),
  defineKana('katakana-ki', 'katakana', 'ka', 'キ', 'ki'),
  defineKana('katakana-ku', 'katakana', 'ka', 'ク', 'ku'),
  defineKana('katakana-ke', 'katakana', 'ka', 'ケ', 'ke'),
  defineKana('katakana-ko', 'katakana', 'ka', 'コ', 'ko'),
  defineKana('katakana-sa', 'katakana', 'sa', 'サ', 'sa'),
  defineKana('katakana-shi', 'katakana', 'sa', 'シ', 'shi'),
  defineKana('katakana-su', 'katakana', 'sa', 'ス', 'su'),
  defineKana('katakana-se', 'katakana', 'sa', 'セ', 'se'),
  defineKana('katakana-so', 'katakana', 'sa', 'ソ', 'so'),
  defineKana('katakana-ta', 'katakana', 'ta', 'タ', 'ta'),
  defineKana('katakana-chi', 'katakana', 'ta', 'チ', 'chi'),
  defineKana('katakana-tsu', 'katakana', 'ta', 'ツ', 'tsu'),
  defineKana('katakana-te', 'katakana', 'ta', 'テ', 'te'),
  defineKana('katakana-to', 'katakana', 'ta', 'ト', 'to'),
  defineKana('katakana-na', 'katakana', 'na', 'ナ', 'na'),
  defineKana('katakana-ni', 'katakana', 'na', 'ニ', 'ni'),
  defineKana('katakana-nu', 'katakana', 'na', 'ヌ', 'nu'),
  defineKana('katakana-ne', 'katakana', 'na', 'ネ', 'ne'),
  defineKana('katakana-no', 'katakana', 'na', 'ノ', 'no'),
  defineKana('katakana-ha', 'katakana', 'ha', 'ハ', 'ha'),
  defineKana('katakana-hi', 'katakana', 'ha', 'ヒ', 'hi'),
  defineKana('katakana-fu', 'katakana', 'ha', 'フ', 'fu'),
  defineKana('katakana-he', 'katakana', 'ha', 'ヘ', 'he'),
  defineKana('katakana-ho', 'katakana', 'ha', 'ホ', 'ho'),
  defineKana('katakana-ma', 'katakana', 'ma', 'マ', 'ma'),
  defineKana('katakana-mi', 'katakana', 'ma', 'ミ', 'mi'),
  defineKana('katakana-mu', 'katakana', 'ma', 'ム', 'mu'),
  defineKana('katakana-me', 'katakana', 'ma', 'メ', 'me'),
  defineKana('katakana-mo', 'katakana', 'ma', 'モ', 'mo'),
  defineKana('katakana-ya', 'katakana', 'ya', 'ヤ', 'ya'),
  defineKana('katakana-yu', 'katakana', 'ya', 'ユ', 'yu'),
  defineKana('katakana-yo', 'katakana', 'ya', 'ヨ', 'yo'),
  defineKana('katakana-ra', 'katakana', 'ra', 'ラ', 'ra'),
  defineKana('katakana-ri', 'katakana', 'ra', 'リ', 'ri'),
  defineKana('katakana-ru', 'katakana', 'ra', 'ル', 'ru'),
  defineKana('katakana-re', 'katakana', 'ra', 'レ', 're'),
  defineKana('katakana-ro', 'katakana', 'ra', 'ロ', 'ro'),
  defineKana('katakana-wa', 'katakana', 'wa', 'ワ', 'wa'),
  defineKana('katakana-wo', 'katakana', 'wa', 'ヲ', 'wo'),
  defineKana('katakana-n', 'katakana', 'wa', 'ン', 'n'),
];

const extendedKana: readonly Kana[] = getChartExtendedKana('hiragana')
  .concat(getChartExtendedKana('katakana'))
  .map((item) =>
    defineKana(item.id, item.script, 'extended', item.text, item.romaji),
  )
  .concat([
    defineKana('katakana-chouon', 'katakana', 'extended', 'ー', '-'),
  ]);

export const kanaCatalog: readonly Kana[] = Object.freeze(
  [...shippedKana, ...extendedKana].map((kana) => Object.freeze(kana)),
);

export function findKanaByText(text: string): Kana | undefined {
  return kanaCatalog.find((kana) => kana.text === text);
}

export function getKanaRow(script: KanaScript, row: KanaRowName): readonly Kana[] {
  return Object.freeze(kanaCatalog.filter((kana) => kana.script === script && kana.row === row));
}

export function getAllKanaTexts(script: KanaScript): readonly string[] {
  return Object.freeze(kanaCatalog.filter((kana) => kana.script === script).map((kana) => kana.text));
}
