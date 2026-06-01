import { getKanaRow } from './kanaCatalog';
import {
  getDakuonChartRows,
  getHandakuonChartRow,
  getYouonChartRows,
  type KanaChartItem,
  type KanaChartRowDefinition,
} from './kanaChartCatalog';
import type { Kana, KanaRowName, KanaScript } from './model';

const SEION_STANDARD_ROWS: readonly KanaRowName[] = ['a', 'ka', 'sa', 'ta', 'na', 'ha', 'ma', 'ra'];
const VOWEL_COLUMNS = ['a', 'i', 'u', 'e', 'o'] as const;
const YA_COLUMNS = ['ya', null, 'yu', null, 'yo'] as const;
const WA_COLUMNS = ['wa', null, null, null, 'wo'] as const;
const YOUON_COLUMN_HEADERS = ['ya', '', 'yu', '', 'yo'] as const;

export interface KanaChartRow {
  readonly label: string;
  readonly cells: readonly (KanaChartItem | null)[];
}

export interface KanaChartSection {
  readonly title: string;
  readonly columnHeaders: readonly string[];
  readonly rows: readonly KanaChartRow[];
  readonly standaloneN?: KanaChartItem | null;
}

export interface KanaChart {
  readonly sections: readonly KanaChartSection[];
}

export function buildKanaChart(script: KanaScript): KanaChart {
  const waRowKana = getKanaRow(script, 'wa');

  return Object.freeze({
    sections: Object.freeze([
      buildSeionSection(script, waRowKana),
      buildFixedWidthSection('浊音', VOWEL_COLUMNS, getDakuonChartRows(script)),
      buildFixedWidthSection('半浊音', VOWEL_COLUMNS, [getHandakuonChartRow(script)]),
      buildYouonSection(script),
    ]),
  });
}

function buildSeionSection(script: KanaScript, waRowKana: readonly Kana[]): KanaChartSection {
  const rows: KanaChartRow[] = [
    ...SEION_STANDARD_ROWS.map((row) => buildSeionStandardRow(script, row)),
    buildSeionColumnRow(script, 'ya', YA_COLUMNS),
    buildSeionColumnRow(script, 'wa', WA_COLUMNS),
  ];

  return Object.freeze({
    title: '清音',
    columnHeaders: VOWEL_COLUMNS,
    rows: Object.freeze(rows.map(freezeRow)),
    standaloneN: waRowKana.find((kana) => kana.romaji === 'n') ?? null,
  });
}

function buildYouonSection(script: KanaScript): KanaChartSection {
  const rows = getYouonChartRows(script).map((row) => ({
    label: row.label,
    cells: padYouonCells(row),
  }));

  return Object.freeze({
    title: '拗音',
    columnHeaders: YOUON_COLUMN_HEADERS,
    rows: Object.freeze(rows.map(freezeRow)),
  });
}

function buildFixedWidthSection(
  title: string,
  columnHeaders: readonly string[],
  rowDefinitions: readonly KanaChartRowDefinition[],
): KanaChartSection {
  const rows = rowDefinitions.map((row) => ({
    label: row.label,
    cells: [...row.cells],
  }));

  return Object.freeze({
    title,
    columnHeaders,
    rows: Object.freeze(rows.map(freezeRow)),
  });
}

function buildSeionStandardRow(script: KanaScript, row: KanaRowName): KanaChartRow {
  const rowKana = getKanaRow(script, row);

  return {
    label: formatRowLabel(rowKana[0]?.text ?? row),
    cells: VOWEL_COLUMNS.map((_, index) => rowKana[index] ?? null),
  };
}

function buildSeionColumnRow(
  script: KanaScript,
  row: KanaRowName,
  columns: readonly (string | null)[],
): KanaChartRow {
  const rowKana = getKanaRow(script, row);
  const byRomaji = new Map(rowKana.map((kana) => [kana.romaji, kana]));

  return {
    label: formatRowLabel(rowKana[0]?.text ?? row),
    cells: columns.map((romaji) => (romaji === null ? null : (byRomaji.get(romaji) ?? null))),
  };
}

function padYouonCells(row: KanaChartRowDefinition): readonly (KanaChartItem | null)[] {
  return Object.freeze([
    row.cells[0] ?? null,
    null,
    row.cells[1] ?? null,
    null,
    row.cells[2] ?? null,
  ]);
}

function formatRowLabel(seed: string): string {
  return `${seed}行`;
}

function freezeRow(row: KanaChartRow): KanaChartRow {
  return Object.freeze({
    ...row,
    cells: Object.freeze(row.cells),
  });
}
