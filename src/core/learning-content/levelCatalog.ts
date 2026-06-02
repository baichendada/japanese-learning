import { courseId, levelId } from '../shared/ids';
import type { CourseId, LevelId } from '../shared/ids';
import type { KanaScript } from './model';
import { getAllKanaTexts } from './kanaCatalog';
import {
  buildWordGroups,
  buildWordLabels,
  flattenWordKanaTexts,
} from './wordCatalog';
import {
  getDakuonChartRows,
  getHandakuonChartRow,
  getYouonChartRows,
  type KanaChartRowDefinition,
} from './kanaChartCatalog';

export type UnlockRule =
  | { readonly type: 'always' }
  | { readonly type: 'previous-level-passed'; readonly previousLevelId: LevelId }
  | { readonly type: 'course-completed'; readonly courseId: CourseId };

export type PromptOrder = 'sequential' | 'shuffled';
export type DisplayMode = 'kana' | 'word';

export interface Level {
  readonly id: LevelId;
  readonly courseId: CourseId;
  readonly name: string;
  readonly kanaTexts: readonly string[];
  readonly displayMode: DisplayMode;
  readonly wordIds?: readonly string[];
  readonly wordLabels?: readonly string[];
  readonly wordGroups?: readonly (readonly string[])[];
  readonly promptOrder: PromptOrder;
  readonly passAccuracy: number;
  readonly maxMistakes: number;
  readonly unlock: UnlockRule;
}

export interface Course {
  readonly id: CourseId;
  readonly name: string;
  readonly levels: readonly Level[];
}

interface RowDefinition {
  readonly id: LevelId;
  readonly reviewId: LevelId;
  readonly name: string;
  readonly kanaTexts: readonly string[];
}

interface WordRowDefinition {
  readonly id: LevelId;
  readonly reviewId: LevelId;
  readonly name: string;
  readonly wordIds: readonly string[];
}

interface BuildCourseLevelsOptions {
  readonly firstLevelUnlock?: UnlockRule;
}

const passAccuracy = 0.9;
const maxMistakes = 4;

const hiraganaBasicCourseId = courseId('hiragana-basic');
const katakanaBasicCourseId = courseId('katakana-basic');
const hiraganaDakuonCourseId = courseId('hiragana-dakuon');
const katakanaDakuonCourseId = courseId('katakana-dakuon');
const hiraganaYouonCourseId = courseId('hiragana-youon');
const katakanaYouonCourseId = courseId('katakana-youon');
const hiraganaMasterCourseId = courseId('hiragana-master');
const katakanaMasterCourseId = courseId('katakana-master');
const hiraganaWordsCourseId = courseId('hiragana-words');
const katakanaWordsCourseId = courseId('katakana-words');

export const hiraganaCourseTrack: readonly CourseId[] = Object.freeze([
  hiraganaBasicCourseId,
  hiraganaDakuonCourseId,
  hiraganaYouonCourseId,
  hiraganaMasterCourseId,
  hiraganaWordsCourseId,
]);

export const katakanaCourseTrack: readonly CourseId[] = Object.freeze([
  katakanaBasicCourseId,
  katakanaDakuonCourseId,
  katakanaYouonCourseId,
  katakanaMasterCourseId,
  katakanaWordsCourseId,
]);

function freezeLevel(level: Level): Level {
  return Object.freeze({
    ...level,
    kanaTexts: Object.freeze([...level.kanaTexts]),
    unlock: Object.freeze({ ...level.unlock }),
    ...(level.wordIds !== undefined ? { wordIds: Object.freeze([...level.wordIds]) } : {}),
    ...(level.wordLabels !== undefined ? { wordLabels: Object.freeze([...level.wordLabels]) } : {}),
    ...(level.wordGroups !== undefined
      ? { wordGroups: Object.freeze(level.wordGroups.map((group) => Object.freeze([...group]))) }
      : {}),
  });
}

function buildCourseLevels(
  course: CourseId,
  rows: readonly RowDefinition[],
  options?: BuildCourseLevelsOptions,
): readonly Level[] {
  const levels: Level[] = [];
  let previousReviewId: LevelId | undefined;
  const accumulatedKana: string[] = [];

  for (const row of rows) {
    accumulatedKana.push(...row.kanaTexts);

    levels.push(
      freezeLevel({
        id: row.id,
        courseId: course,
        name: row.name,
        kanaTexts: row.kanaTexts,
        displayMode: 'kana',
        promptOrder: 'sequential',
        passAccuracy,
        maxMistakes,
        unlock:
          previousReviewId === undefined
            ? (options?.firstLevelUnlock ?? { type: 'always' })
            : { type: 'previous-level-passed', previousLevelId: previousReviewId },
      }),
    );
    levels.push(
      freezeLevel({
        id: row.reviewId,
        courseId: course,
        name: `${row.name}复习`,
        kanaTexts: Object.freeze([...accumulatedKana]),
        displayMode: 'kana',
        promptOrder: 'shuffled',
        passAccuracy,
        maxMistakes,
        unlock: { type: 'previous-level-passed', previousLevelId: row.id },
      }),
    );
    previousReviewId = row.reviewId;
  }

  return Object.freeze(levels);
}

function buildWordCourseLevels(
  course: CourseId,
  rows: readonly WordRowDefinition[],
  options?: BuildCourseLevelsOptions,
): readonly Level[] {
  const levels: Level[] = [];
  let previousReviewId: LevelId | undefined;
  const accumulatedWordIds: string[] = [];

  for (const row of rows) {
    accumulatedWordIds.push(...row.wordIds);
    const wordIds = row.wordIds;
    const reviewWordIds = [...accumulatedWordIds];

    levels.push(
      freezeLevel({
        id: row.id,
        courseId: course,
        name: row.name,
        kanaTexts: flattenWordKanaTexts(wordIds),
        displayMode: 'word',
        wordIds,
        wordLabels: buildWordLabels(wordIds),
        wordGroups: buildWordGroups(wordIds),
        promptOrder: 'sequential',
        passAccuracy,
        maxMistakes,
        unlock:
          previousReviewId === undefined
            ? (options?.firstLevelUnlock ?? { type: 'always' })
            : { type: 'previous-level-passed', previousLevelId: previousReviewId },
      }),
    );
    levels.push(
      freezeLevel({
        id: row.reviewId,
        courseId: course,
        name: `${row.name}复习`,
        kanaTexts: flattenWordKanaTexts(reviewWordIds),
        displayMode: 'word',
        wordIds: Object.freeze([...reviewWordIds]),
        wordLabels: buildWordLabels(reviewWordIds),
        wordGroups: buildWordGroups(reviewWordIds),
        promptOrder: 'shuffled',
        passAccuracy,
        maxMistakes,
        unlock: { type: 'previous-level-passed', previousLevelId: row.id },
      }),
    );
    previousReviewId = row.reviewId;
  }

  return Object.freeze(levels);
}

function chartRowsToLevelRows(scriptPrefix: 'hiragana' | 'katakana', chartRows: readonly KanaChartRowDefinition[]): readonly RowDefinition[] {
  return Object.freeze(
    chartRows.map((row) => ({
      id: levelId(`${scriptPrefix}-${row.idPrefix}`),
      reviewId: levelId(`${scriptPrefix}-${row.idPrefix}-review`),
      name: row.label,
      kanaTexts: Object.freeze(row.cells.map((cell) => cell.text)),
    })),
  );
}

function buildDakuonRows(script: KanaScript): readonly RowDefinition[] {
  const scriptPrefix = script === 'hiragana' ? 'hiragana' : 'katakana';

  return chartRowsToLevelRows(scriptPrefix, [...getDakuonChartRows(script), getHandakuonChartRow(script)]);
}

function buildYouonRows(script: KanaScript): readonly RowDefinition[] {
  const scriptPrefix = script === 'hiragana' ? 'hiragana' : 'katakana';

  return chartRowsToLevelRows(scriptPrefix, getYouonChartRows(script));
}

function buildMasterCourse(
  course: CourseId,
  script: KanaScript,
  courseName: string,
  unlockAfterCourseId: CourseId,
): Course {
  const scriptPrefix = script === 'hiragana' ? 'hiragana' : 'katakana';

  return Object.freeze({
    id: course,
    name: courseName,
    levels: Object.freeze([
      freezeLevel({
        id: levelId(`${scriptPrefix}-master`),
        courseId: course,
        name: '全表总复习',
        kanaTexts: getAllKanaTexts(script),
        displayMode: 'kana',
        promptOrder: 'shuffled',
        passAccuracy,
        maxMistakes,
        unlock: { type: 'course-completed', courseId: unlockAfterCourseId },
      }),
    ]),
  });
}

const hiraganaRows: readonly RowDefinition[] = Object.freeze([
  {
    id: levelId('hiragana-a'),
    reviewId: levelId('hiragana-a-review'),
    name: 'あ行',
    kanaTexts: ['あ', 'い', 'う', 'え', 'お'],
  },
  {
    id: levelId('hiragana-ka'),
    reviewId: levelId('hiragana-ka-review'),
    name: 'か行',
    kanaTexts: ['か', 'き', 'く', 'け', 'こ'],
  },
  {
    id: levelId('hiragana-sa'),
    reviewId: levelId('hiragana-sa-review'),
    name: 'さ行',
    kanaTexts: ['さ', 'し', 'す', 'せ', 'そ'],
  },
  {
    id: levelId('hiragana-ta'),
    reviewId: levelId('hiragana-ta-review'),
    name: 'た行',
    kanaTexts: ['た', 'ち', 'つ', 'て', 'と'],
  },
  {
    id: levelId('hiragana-na'),
    reviewId: levelId('hiragana-na-review'),
    name: 'な行',
    kanaTexts: ['な', 'に', 'ぬ', 'ね', 'の'],
  },
  {
    id: levelId('hiragana-ha'),
    reviewId: levelId('hiragana-ha-review'),
    name: 'は行',
    kanaTexts: ['は', 'ひ', 'ふ', 'へ', 'ほ'],
  },
  {
    id: levelId('hiragana-ma'),
    reviewId: levelId('hiragana-ma-review'),
    name: 'ま行',
    kanaTexts: ['ま', 'み', 'む', 'め', 'も'],
  },
  {
    id: levelId('hiragana-ya'),
    reviewId: levelId('hiragana-ya-review'),
    name: 'や行',
    kanaTexts: ['や', 'ゆ', 'よ'],
  },
  {
    id: levelId('hiragana-ra'),
    reviewId: levelId('hiragana-ra-review'),
    name: 'ら行',
    kanaTexts: ['ら', 'り', 'る', 'れ', 'ろ'],
  },
  {
    id: levelId('hiragana-wa'),
    reviewId: levelId('hiragana-wa-review'),
    name: 'わ行',
    kanaTexts: ['わ', 'を', 'ん'],
  },
]);

const katakanaRows: readonly RowDefinition[] = Object.freeze([
  {
    id: levelId('katakana-a'),
    reviewId: levelId('katakana-a-review'),
    name: 'ア行',
    kanaTexts: ['ア', 'イ', 'ウ', 'エ', 'オ'],
  },
  {
    id: levelId('katakana-ka'),
    reviewId: levelId('katakana-ka-review'),
    name: 'カ行',
    kanaTexts: ['カ', 'キ', 'ク', 'ケ', 'コ'],
  },
  {
    id: levelId('katakana-sa'),
    reviewId: levelId('katakana-sa-review'),
    name: 'サ行',
    kanaTexts: ['サ', 'シ', 'ス', 'セ', 'ソ'],
  },
  {
    id: levelId('katakana-ta'),
    reviewId: levelId('katakana-ta-review'),
    name: 'タ行',
    kanaTexts: ['タ', 'チ', 'ツ', 'テ', 'ト'],
  },
  {
    id: levelId('katakana-na'),
    reviewId: levelId('katakana-na-review'),
    name: 'ナ行',
    kanaTexts: ['ナ', 'ニ', 'ヌ', 'ネ', 'ノ'],
  },
  {
    id: levelId('katakana-ha'),
    reviewId: levelId('katakana-ha-review'),
    name: 'ハ行',
    kanaTexts: ['ハ', 'ヒ', 'フ', 'ヘ', 'ホ'],
  },
  {
    id: levelId('katakana-ma'),
    reviewId: levelId('katakana-ma-review'),
    name: 'マ行',
    kanaTexts: ['マ', 'ミ', 'ム', 'メ', 'モ'],
  },
  {
    id: levelId('katakana-ya'),
    reviewId: levelId('katakana-ya-review'),
    name: 'ヤ行',
    kanaTexts: ['ヤ', 'ユ', 'ヨ'],
  },
  {
    id: levelId('katakana-ra'),
    reviewId: levelId('katakana-ra-review'),
    name: 'ラ行',
    kanaTexts: ['ラ', 'リ', 'ル', 'レ', 'ロ'],
  },
  {
    id: levelId('katakana-wa'),
    reviewId: levelId('katakana-wa-review'),
    name: 'ワ行',
    kanaTexts: ['ワ', 'ヲ', 'ン'],
  },
]);

const katakanaWordRows: readonly WordRowDefinition[] = Object.freeze([
  {
    id: levelId('katakana-word-pan'),
    reviewId: levelId('katakana-word-pan-review'),
    name: 'パン',
    wordIds: ['word-katakana-pan'],
  },
  {
    id: levelId('katakana-word-pizza'),
    reviewId: levelId('katakana-word-pizza-review'),
    name: 'ピザ',
    wordIds: ['word-katakana-pizza'],
  },
  {
    id: levelId('katakana-word-coffee'),
    reviewId: levelId('katakana-word-coffee-review'),
    name: 'コーヒー',
    wordIds: ['word-katakana-coffee'],
  },
  {
    id: levelId('katakana-word-menu'),
    reviewId: levelId('katakana-word-menu-review'),
    name: 'メニュー',
    wordIds: ['word-katakana-menu'],
  },
  {
    id: levelId('katakana-word-tv'),
    reviewId: levelId('katakana-word-tv-review'),
    name: 'テレビ',
    wordIds: ['word-katakana-tv'],
  },
]);

const hiraganaWordRows: readonly WordRowDefinition[] = Object.freeze([
  {
    id: levelId('hiragana-word-arigatou'),
    reviewId: levelId('hiragana-word-arigatou-review'),
    name: 'ありがとう',
    wordIds: ['word-hiragana-arigatou'],
  },
  {
    id: levelId('hiragana-word-sumimasen'),
    reviewId: levelId('hiragana-word-sumimasen-review'),
    name: 'すみません',
    wordIds: ['word-hiragana-sumimasen'],
  },
  {
    id: levelId('hiragana-word-konnichiwa'),
    reviewId: levelId('hiragana-word-konnichiwa-review'),
    name: 'こんにちは',
    wordIds: ['word-hiragana-konnichiwa'],
  },
  {
    id: levelId('hiragana-word-sayounara'),
    reviewId: levelId('hiragana-word-sayounara-review'),
    name: 'さようなら',
    wordIds: ['word-hiragana-sayounara'],
  },
  {
    id: levelId('hiragana-word-ohayou'),
    reviewId: levelId('hiragana-word-ohayou-review'),
    name: 'おはよう',
    wordIds: ['word-hiragana-ohayou'],
  },
]);

export const courses: readonly Course[] = Object.freeze([
  Object.freeze({
    id: hiraganaBasicCourseId,
    name: '平假名 - 基础',
    levels: buildCourseLevels(hiraganaBasicCourseId, hiraganaRows),
  }),
  Object.freeze({
    id: hiraganaDakuonCourseId,
    name: '平假名 - 浊音/半浊音',
    levels: buildCourseLevels(hiraganaDakuonCourseId, buildDakuonRows('hiragana'), {
      firstLevelUnlock: { type: 'course-completed', courseId: hiraganaBasicCourseId },
    }),
  }),
  Object.freeze({
    id: hiraganaYouonCourseId,
    name: '平假名 - 拗音',
    levels: buildCourseLevels(hiraganaYouonCourseId, buildYouonRows('hiragana'), {
      firstLevelUnlock: { type: 'course-completed', courseId: hiraganaDakuonCourseId },
    }),
  }),
  buildMasterCourse(hiraganaMasterCourseId, 'hiragana', '平假名 - 全表总复习', hiraganaYouonCourseId),
  Object.freeze({
    id: hiraganaWordsCourseId,
    name: '平假名 - 假名词入门',
    levels: buildWordCourseLevels(hiraganaWordsCourseId, hiraganaWordRows, {
      firstLevelUnlock: { type: 'course-completed', courseId: hiraganaMasterCourseId },
    }),
  }),
  Object.freeze({
    id: katakanaBasicCourseId,
    name: '片假名 - 基础',
    levels: buildCourseLevels(katakanaBasicCourseId, katakanaRows),
  }),
  Object.freeze({
    id: katakanaDakuonCourseId,
    name: '片假名 - 浊音/半浊音',
    levels: buildCourseLevels(katakanaDakuonCourseId, buildDakuonRows('katakana'), {
      firstLevelUnlock: { type: 'course-completed', courseId: katakanaBasicCourseId },
    }),
  }),
  Object.freeze({
    id: katakanaYouonCourseId,
    name: '片假名 - 拗音',
    levels: buildCourseLevels(katakanaYouonCourseId, buildYouonRows('katakana'), {
      firstLevelUnlock: { type: 'course-completed', courseId: katakanaDakuonCourseId },
    }),
  }),
  buildMasterCourse(katakanaMasterCourseId, 'katakana', '片假名 - 全表总复习', katakanaYouonCourseId),
  Object.freeze({
    id: katakanaWordsCourseId,
    name: '片假名 - 假名词入门',
    levels: buildWordCourseLevels(katakanaWordsCourseId, katakanaWordRows, {
      firstLevelUnlock: { type: 'course-completed', courseId: katakanaMasterCourseId },
    }),
  }),
]);

export function getCourse(id: string): Course {
  const course = courses.find((candidate) => candidate.id === id);

  if (course === undefined) {
    throw new Error(`Unknown course: ${id}`);
  }

  return course;
}

export function getLevelById(id: string): Level | undefined {
  return courses.flatMap((course) => course.levels).find((level) => level.id === id);
}

export function getSuccessorCourse(currentCourseId: CourseId): CourseId | undefined {
  for (const track of [hiraganaCourseTrack, katakanaCourseTrack]) {
    const index = track.indexOf(currentCourseId);

    if (index >= 0 && index < track.length - 1) {
      return track[index + 1];
    }
  }

  return undefined;
}
