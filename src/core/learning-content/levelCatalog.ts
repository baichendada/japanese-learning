import { courseId, levelId } from '../shared/ids';
import type { CourseId, LevelId } from '../shared/ids';

export type UnlockRule =
  | { readonly type: 'always' }
  | { readonly type: 'previous-level-passed'; readonly previousLevelId: LevelId };

export interface Level {
  readonly id: LevelId;
  readonly courseId: CourseId;
  readonly name: string;
  readonly kanaTexts: readonly string[];
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

const passAccuracy = 0.9;
const maxMistakes = 4;

function freezeLevel(level: Level): Level {
  return Object.freeze({
    ...level,
    kanaTexts: Object.freeze([...level.kanaTexts]),
    unlock: Object.freeze({ ...level.unlock }),
  });
}

function buildCourseLevels(course: CourseId, rows: readonly RowDefinition[]): readonly Level[] {
  const levels: Level[] = [];
  let previousReviewId: LevelId | undefined;

  for (const row of rows) {
    levels.push(
      freezeLevel({
        id: row.id,
        courseId: course,
        name: row.name,
        kanaTexts: row.kanaTexts,
        passAccuracy,
        maxMistakes,
        unlock:
          previousReviewId === undefined
            ? { type: 'always' }
            : { type: 'previous-level-passed', previousLevelId: previousReviewId },
      }),
    );
    levels.push(
      freezeLevel({
        id: row.reviewId,
        courseId: course,
        name: `${row.name}复习`,
        kanaTexts: row.kanaTexts,
        passAccuracy,
        maxMistakes,
        unlock: { type: 'previous-level-passed', previousLevelId: row.id },
      }),
    );
    previousReviewId = row.reviewId;
  }

  return Object.freeze(levels);
}

const hiraganaBasicCourseId = courseId('hiragana-basic');
const katakanaBasicCourseId = courseId('katakana-basic');

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

export const courses: readonly Course[] = Object.freeze([
  Object.freeze({
    id: hiraganaBasicCourseId,
    name: '平假名 - 基础',
    levels: buildCourseLevels(hiraganaBasicCourseId, hiraganaRows),
  }),
  Object.freeze({
    id: katakanaBasicCourseId,
    name: '片假名 - 基础',
    levels: buildCourseLevels(katakanaBasicCourseId, katakanaRows),
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
