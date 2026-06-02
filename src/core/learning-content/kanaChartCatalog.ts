import { kanaId } from '../shared/ids';
import type { KanaScript } from './model';

export interface KanaChartItem {
  readonly id: ReturnType<typeof kanaId>;
  readonly script: KanaScript;
  readonly text: string;
  readonly romaji: string;
}

interface RowTemplate {
  readonly idPrefix: string;
  readonly labelSeedHiragana: string;
  readonly romaji: readonly string[];
  readonly hiragana: readonly string[];
}

const DAKUON_ROWS: readonly RowTemplate[] = [
  {
    idPrefix: 'ga',
    labelSeedHiragana: 'が',
    romaji: ['ga', 'gi', 'gu', 'ge', 'go'],
    hiragana: ['が', 'ぎ', 'ぐ', 'げ', 'ご'],
  },
  {
    idPrefix: 'za',
    labelSeedHiragana: 'ざ',
    romaji: ['za', 'ji', 'zu', 'ze', 'zo'],
    hiragana: ['ざ', 'じ', 'ず', 'ぜ', 'ぞ'],
  },
  {
    idPrefix: 'da',
    labelSeedHiragana: 'だ',
    romaji: ['da', 'ji', 'zu', 'de', 'do'],
    hiragana: ['だ', 'ぢ', 'づ', 'で', 'ど'],
  },
  {
    idPrefix: 'ba',
    labelSeedHiragana: 'ば',
    romaji: ['ba', 'bi', 'bu', 'be', 'bo'],
    hiragana: ['ば', 'び', 'ぶ', 'べ', 'ぼ'],
  },
];

const HANDAKUON_ROW: RowTemplate = {
  idPrefix: 'pa',
  labelSeedHiragana: 'ぱ',
  romaji: ['pa', 'pi', 'pu', 'pe', 'po'],
  hiragana: ['ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ'],
};

const YOUON_ROWS: readonly RowTemplate[] = [
  {
    idPrefix: 'k-yo',
    labelSeedHiragana: 'き',
    romaji: ['kya', 'kyu', 'kyo'],
    hiragana: ['きゃ', 'きゅ', 'きょ'],
  },
  {
    idPrefix: 'g-yo',
    labelSeedHiragana: 'ぎ',
    romaji: ['gya', 'gyu', 'gyo'],
    hiragana: ['ぎゃ', 'ぎゅ', 'ぎょ'],
  },
  {
    idPrefix: 's-yo',
    labelSeedHiragana: 'し',
    romaji: ['sha', 'shu', 'sho'],
    hiragana: ['しゃ', 'しゅ', 'しょ'],
  },
  {
    idPrefix: 'j-yo',
    labelSeedHiragana: 'じ',
    romaji: ['ja', 'ju', 'jo'],
    hiragana: ['じゃ', 'じゅ', 'じょ'],
  },
  {
    idPrefix: 't-yo',
    labelSeedHiragana: 'ち',
    romaji: ['cha', 'chu', 'cho'],
    hiragana: ['ちゃ', 'ちゅ', 'ちょ'],
  },
  {
    idPrefix: 'n-yo',
    labelSeedHiragana: 'に',
    romaji: ['nya', 'nyu', 'nyo'],
    hiragana: ['にゃ', 'にゅ', 'にょ'],
  },
  {
    idPrefix: 'h-yo',
    labelSeedHiragana: 'ひ',
    romaji: ['hya', 'hyu', 'hyo'],
    hiragana: ['ひゃ', 'ひゅ', 'ひょ'],
  },
  {
    idPrefix: 'b-yo',
    labelSeedHiragana: 'び',
    romaji: ['bya', 'byu', 'byo'],
    hiragana: ['びゃ', 'びゅ', 'びょ'],
  },
  {
    idPrefix: 'p-yo',
    labelSeedHiragana: 'ぴ',
    romaji: ['pya', 'pyu', 'pyo'],
    hiragana: ['ぴゃ', 'ぴゅ', 'ぴょ'],
  },
  {
    idPrefix: 'm-yo',
    labelSeedHiragana: 'み',
    romaji: ['mya', 'myu', 'myo'],
    hiragana: ['みゃ', 'みゅ', 'みょ'],
  },
  {
    idPrefix: 'r-yo',
    labelSeedHiragana: 'り',
    romaji: ['rya', 'ryu', 'ryo'],
    hiragana: ['りゃ', 'りゅ', 'りょ'],
  },
];

const chartExtendedKana: readonly KanaChartItem[] = Object.freeze(
  buildChartExtendedKana().map((item) => Object.freeze(item)),
);

export function getChartExtendedKana(script: KanaScript): readonly KanaChartItem[] {
  return Object.freeze(chartExtendedKana.filter((item) => item.script === script));
}

export function getDakuonChartRows(script: KanaScript): readonly KanaChartRowDefinition[] {
  return Object.freeze(DAKUON_ROWS.map((row) => buildRowDefinition(script, row)));
}

export function getHandakuonChartRow(script: KanaScript): KanaChartRowDefinition {
  return buildRowDefinition(script, HANDAKUON_ROW);
}

export function getYouonChartRows(script: KanaScript): readonly KanaChartRowDefinition[] {
  return Object.freeze(YOUON_ROWS.map((row) => buildRowDefinition(script, row)));
}

export interface KanaChartRowDefinition {
  readonly label: string;
  readonly cells: readonly KanaChartItem[];
}

function buildChartExtendedKana(): KanaChartItem[] {
  const items: KanaChartItem[] = [];

  for (const script of ['hiragana', 'katakana'] as const) {
    for (const row of DAKUON_ROWS) {
      items.push(...buildRowItems(script, row));
    }
    items.push(...buildRowItems(script, HANDAKUON_ROW));
    for (const row of YOUON_ROWS) {
      items.push(...buildRowItems(script, row));
    }
  }

  return items;
}

function buildRowDefinition(script: KanaScript, row: RowTemplate): KanaChartRowDefinition {
  return {
    label: `${toDisplaySeed(script, row.labelSeedHiragana)}行`,
    cells: Object.freeze(buildRowItems(script, row)),
  };
}

function buildRowItems(script: KanaScript, row: RowTemplate): KanaChartItem[] {
  return row.hiragana.map((hiraganaText, index) =>
    defineChartKana(
      `${script}-${row.idPrefix}-${row.romaji[index]}`,
      script,
      script === 'hiragana' ? hiraganaText : toKatakana(hiraganaText),
      row.romaji[index] ?? '',
    ),
  );
}

function defineChartKana(
  id: string,
  script: KanaScript,
  text: string,
  romaji: string,
): KanaChartItem {
  return Object.freeze({
    id: kanaId(id),
    script,
    text,
    romaji,
  });
}

function toDisplaySeed(script: KanaScript, hiraganaSeed: string): string {
  return script === 'hiragana' ? hiraganaSeed : toKatakana(hiraganaSeed);
}

function toKatakana(text: string): string {
  return [...text]
    .map((character) => {
      const code = character.charCodeAt(0);

      if (code >= 0x3041 && code <= 0x3096) {
        return String.fromCharCode(code + 0x60);
      }

      return character;
    })
    .join('');
}
