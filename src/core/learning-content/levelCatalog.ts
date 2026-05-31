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

const passAccuracy = 0.9;
const maxMistakes = 4;

function freezeLevel(level: Level): Level {
  return Object.freeze({
    ...level,
    kanaTexts: Object.freeze([...level.kanaTexts]),
    unlock: Object.freeze({ ...level.unlock }),
  });
}

const hiraganaBasicCourseId = courseId('hiragana-basic');
const hiraganaARow = Object.freeze(['あ', 'い', 'う', 'え', 'お']);

const hiraganaBasicLevels = Object.freeze([
  freezeLevel({
    id: levelId('hiragana-a'),
    courseId: hiraganaBasicCourseId,
    name: 'あ行',
    kanaTexts: hiraganaARow,
    passAccuracy,
    maxMistakes,
    unlock: { type: 'always' },
  }),
  freezeLevel({
    id: levelId('hiragana-a-review'),
    courseId: hiraganaBasicCourseId,
    name: 'あ行复习',
    kanaTexts: hiraganaARow,
    passAccuracy,
    maxMistakes,
    unlock: { type: 'previous-level-passed', previousLevelId: levelId('hiragana-a') },
  }),
  freezeLevel({
    id: levelId('hiragana-ka'),
    courseId: hiraganaBasicCourseId,
    name: 'か行',
    kanaTexts: ['か', 'き', 'く', 'け', 'こ'],
    passAccuracy,
    maxMistakes,
    unlock: { type: 'previous-level-passed', previousLevelId: levelId('hiragana-a-review') },
  }),
]);

export const courses: readonly Course[] = Object.freeze([
  Object.freeze({
    id: hiraganaBasicCourseId,
    name: '平假名 - 基础',
    levels: hiraganaBasicLevels,
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
