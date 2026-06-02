import { describe, expect, test } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import * as ts from 'typescript';
import { findKanaByText } from '../../../src/core/learning-content/kanaCatalog';
import { courses, getCourse, getLevelById } from '../../../src/core/learning-content/levelCatalog';

describe('level catalog', () => {
  function courseLevels() {
    return courses.flatMap((course) => course.levels.map((level) => ({ course, level })));
  }

  function projectImportPath(fromDirectory: string, projectPath: string): string {
    const importPath = relative(fromDirectory, resolve(process.cwd(), projectPath)).replace(/\\/g, '/');

    return importPath.startsWith('.') ? importPath : `./${importPath}`;
  }

  test('returns the hiragana basic course with its opening a-row levels', () => {
    const course = getCourse('hiragana-basic');

    expect(course.name).toBe('平假名 - 基础');
    expect(course.levels[0]).toMatchObject({
      name: 'あ行',
      kanaTexts: ['あ', 'い', 'う', 'え', 'お'],
      promptOrder: 'sequential',
    });
    expect(course.levels[1]).toMatchObject({
      name: 'あ行复习',
      kanaTexts: ['あ', 'い', 'う', 'え', 'お'],
      promptOrder: 'shuffled',
    });
  });

  test('builds cumulative shuffled review levels after the first row', () => {
    expect(getLevelById('hiragana-ka-review')).toMatchObject({
      name: 'か行复习',
      promptOrder: 'shuffled',
      kanaTexts: ['あ', 'い', 'う', 'え', 'お', 'か', 'き', 'く', 'け', 'こ'],
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

  test('types previous-level unlock references as readonly LevelId values', () => {
    const tempDirectory = mkdtempSync(join(tmpdir(), 'level-catalog-types-'));
    const contractPath = join(tempDirectory, 'unlockRule.contract.ts');
    const levelCatalogImport = projectImportPath(tempDirectory, 'src/core/learning-content/levelCatalog');
    const idsImport = projectImportPath(tempDirectory, 'src/core/shared/ids');

    const contractSource = `
      import type { UnlockRule } from '${levelCatalogImport}';
      import { levelId } from '${idsImport}';
      import type { LevelId } from '${idsImport}';

      type PreviousLevelRule = Extract<UnlockRule, { type: 'previous-level-passed' }>;
      type IfEquals<X, Y, A = true, B = false> =
        (<T>() => T extends X ? 1 : 2) extends
        (<T>() => T extends Y ? 1 : 2) ? A : B;
      type WritableKeys<T> = {
        [K in keyof T]-?: IfEquals<{ [Q in K]: T[K] }, { -readonly [Q in K]: T[K] }, K, never>
      }[keyof T];
      type PreviousLevelIdIsReadonly =
        'previousLevelId' extends WritableKeys<PreviousLevelRule> ? false : true;

      const previousRule: PreviousLevelRule = {
        type: 'previous-level-passed',
        previousLevelId: levelId('hiragana-a'),
      };
      const previousLevelId: LevelId = previousRule.previousLevelId;
      const previousLevelIdIsReadonly: PreviousLevelIdIsReadonly = true;

      void previousLevelId;
      void previousLevelIdIsReadonly;

      // @ts-expect-error previousLevelId should be readonly.
      previousRule.previousLevelId = levelId('hiragana-ka');
    `;

    let diagnosticsText = '';

    try {
      writeFileSync(contractPath, contractSource);

      const program = ts.createProgram([contractPath], {
        noEmit: true,
        strict: true,
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        skipLibCheck: true,
        types: [],
      });
      const diagnostics = ts.getPreEmitDiagnostics(program);

      diagnosticsText = ts.formatDiagnosticsWithColorAndContext(diagnostics, {
        getCanonicalFileName: (fileName) => fileName,
        getCurrentDirectory: () => process.cwd(),
        getNewLine: () => '\n',
      });
    } finally {
      rmSync(tempDirectory, { recursive: true, force: true });
    }

    expect(diagnosticsText).toBe('');
  });

  test('ships MVP pass thresholds on every level', () => {
    for (const { level } of courseLevels()) {
      expect(level.passAccuracy).toBe(0.9);
      expect(level.maxMistakes).toBe(4);
    }
  });

  test('ships the full hiragana and katakana gojuon progression', () => {
    const hiraganaCourse = getCourse('hiragana-basic');
    const katakanaCourse = getCourse('katakana-basic');

    expect(hiraganaCourse.levels).toHaveLength(20);
    expect(katakanaCourse.levels).toHaveLength(20);
    expect(hiraganaCourse.levels.at(-1)?.name).toBe('わ行复习');
    expect(katakanaCourse.levels.at(-1)?.name).toBe('ワ行复习');
  });

  test('ships dakuon and youon courses with course-completed unlock gates', () => {
    expect(getCourse('hiragana-dakuon').levels[0]?.unlock).toEqual({
      type: 'course-completed',
      courseId: 'hiragana-basic',
    });
    expect(getCourse('hiragana-youon').levels[0]?.unlock).toEqual({
      type: 'course-completed',
      courseId: 'hiragana-dakuon',
    });
    expect(getLevelById('hiragana-master')?.unlock).toEqual({
      type: 'course-completed',
      courseId: 'hiragana-youon',
    });
    expect(getCourse('hiragana-dakuon').levels).toHaveLength(10);
    expect(getCourse('hiragana-youon').levels).toHaveLength(22);
    expect(getLevelById('hiragana-ga')?.kanaTexts).toEqual(['が', 'ぎ', 'ぐ', 'げ', 'ご']);
    expect(getLevelById('hiragana-k-yo')?.kanaTexts).toEqual(['きゃ', 'きゅ', 'きょ']);
  });

  test('ships master review levels with shuffled full-script prompts', () => {
    const master = getLevelById('hiragana-master');

    expect(master).toMatchObject({
      name: '全表总复习',
      promptOrder: 'shuffled',
      courseId: 'hiragana-master',
      displayMode: 'kana',
    });
    expect(master?.kanaTexts.length).toBeGreaterThan(46);
  });

  test('ships word courses unlocked after master completion', () => {
    expect(getCourse('katakana-words').levels[0]?.unlock).toEqual({
      type: 'course-completed',
      courseId: 'katakana-master',
    });
    expect(getLevelById('katakana-word-coffee')).toMatchObject({
      displayMode: 'word',
      wordLabels: ['コーヒー'],
      promptOrder: 'sequential',
    });
    expect(getCourse('katakana-words').levels).toHaveLength(10);
    expect(getCourse('hiragana-words').levels).toHaveLength(10);
  });

  test('ships the hiragana ka-row kana for the ka level', () => {
    expect(getLevelById('hiragana-ka')?.kanaTexts).toEqual(['か', 'き', 'く', 'け', 'こ']);
  });

  test('ships unique level ids', () => {
    const levelIds = courseLevels().map(({ level }) => level.id);

    expect(new Set(levelIds).size).toBe(levelIds.length);
  });

  test('keeps previous-level unlock references inside the same course', () => {
    for (const { course, level } of courseLevels()) {
      if (level.unlock.type === 'previous-level-passed') {
        expect(
          course.levels.some((candidate) => candidate.id === level.unlock.previousLevelId),
          `${level.id} unlocks from ${level.unlock.previousLevelId} in ${course.id}`,
        ).toBe(true);
      }
    }
  });

  test('keeps course-completed unlock references on known courses', () => {
    for (const { level } of courseLevels()) {
      if (level.unlock.type === 'course-completed') {
        expect(() => getCourse(level.unlock.courseId)).not.toThrow();
      }
    }
  });

  test('keeps every level attached to its containing course', () => {
    for (const { course, level } of courseLevels()) {
      expect(level.courseId).toBe(course.id);
    }
  });

  test('uses kana text shipped by the kana catalog', () => {
    for (const { level } of courseLevels()) {
      for (const kanaText of level.kanaTexts) {
        expect(findKanaByText(kanaText), `${level.id} includes ${kanaText}`).toBeDefined();
      }
    }
  });

  test('protects previous-level unlock objects from runtime mutation', () => {
    const kaLevel = getLevelById('hiragana-ka');

    if (kaLevel?.unlock.type !== 'previous-level-passed') {
      throw new Error('Expected hiragana-ka to have a previous-level unlock rule');
    }

    expect(Object.isFrozen(kaLevel.unlock)).toBe(true);
    expect(() => {
      (kaLevel.unlock as { previousLevelId: string }).previousLevelId = 'hiragana-a';
    }).toThrow(TypeError);
    expect(kaLevel.unlock.previousLevelId).toBe('hiragana-a-review');
  });
});
