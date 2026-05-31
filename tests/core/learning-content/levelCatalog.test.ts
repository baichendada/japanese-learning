import { describe, expect, test } from 'vitest';
import { courses, getCourse, getLevelById } from '../../../src/core/learning-content/levelCatalog';

describe('level catalog', () => {
  test('returns the hiragana basic course with its opening a-row levels', () => {
    const course = getCourse('hiragana-basic');

    expect(course.name).toBe('平假名 - 基础');
    expect(course.levels[0]).toMatchObject({
      name: 'あ行',
      kanaTexts: ['あ', 'い', 'う', 'え', 'お'],
    });
    expect(course.levels[1]).toMatchObject({
      name: 'あ行复习',
      kanaTexts: ['あ', 'い', 'う', 'え', 'お'],
    });
  });

  test('finds the ka-row level locked behind the a-row review', () => {
    expect(getLevelById('hiragana-ka')?.unlock).toEqual({
      type: 'previous-level-passed',
      previousLevelId: 'hiragana-a-review',
    });
  });

  test('keeps catalog lookups predictable and immutable', () => {
    const course = getCourse('hiragana-basic');

    expect(() => getCourse('missing-course')).toThrow('Unknown course: missing-course');
    expect(getLevelById('missing-level')).toBeUndefined();
    expect(Object.isFrozen(courses)).toBe(true);
    expect(Object.isFrozen(course)).toBe(true);
    expect(Object.isFrozen(course.levels)).toBe(true);
    expect(Object.isFrozen(course.levels[0])).toBe(true);
    expect(Object.isFrozen(course.levels[0].kanaTexts)).toBe(true);
    expect(Object.isFrozen(course.levels[0].unlock)).toBe(true);

    expect(() => {
      (course.levels as unknown[]).push(course.levels[0]);
    }).toThrow(TypeError);
  });
});
