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
    expect(courseLevels().map(({ level }) => [level.passAccuracy, level.maxMistakes])).toEqual([
      [0.9, 4],
      [0.9, 4],
      [0.9, 4],
    ]);
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
