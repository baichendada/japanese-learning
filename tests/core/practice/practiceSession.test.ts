import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import * as ts from 'typescript';
import { describe, expect, test } from 'vitest';
import { levelId } from '../../../src/core/shared/ids';
import { createPracticeSession } from '../../../src/core/practice/practiceSession';

function projectImportPath(fromDirectory: string, projectPath: string): string {
  const importPath = relative(fromDirectory, resolve(process.cwd(), projectPath)).replace(/\\/g, '/');

  return importPath.startsWith('.') ? importPath : `./${importPath}`;
}

describe('practice session', () => {
  test('completes kana when romaji characters are typed in order', () => {
    let session = createPracticeSession({
      levelId: levelId('hiragana-ka'),
      prompts: [{ kanaText: 'け', romaji: 'ke' }],
      maxMistakes: 4,
      startedAt: 1000,
    });

    session = session.typeCharacter('k', 1100);
    expect(session.currentInput).toBe('k');
    expect(session.status).toBe('running');

    session = session.typeCharacter('e', 1200);
    expect(session.status).toBe('passed');
    expect(session.completedPrompts).toBe(1);
  });

  test('records a mistake when special romaji input does not match the expected prefix', () => {
    const session = createPracticeSession({
      levelId: levelId('hiragana-sa'),
      prompts: [{ kanaText: 'し', romaji: 'shi' }],
      maxMistakes: 4,
      startedAt: 1000,
    })
      .typeCharacter('s', 1100)
      .typeCharacter('i', 1200);

    expect(session.mistakes).toEqual([
      {
        kanaText: 'し',
        expectedRomaji: 'shi',
        actualInput: 'si',
        occurredAt: 1200,
      },
    ]);
    expect(session.status).toBe('running');
    expect(session.currentPromptIndex).toBe(0);
    expect(session.currentInput).toBe('si');
  });

  test('recovers from visible wrong input by continuing from the last valid prefix', () => {
    const mistaken = createPracticeSession({
      levelId: levelId('hiragana-sa'),
      prompts: [{ kanaText: '\u3057', romaji: 'shi' }],
      maxMistakes: 4,
      startedAt: 1000,
    })
      .typeCharacter('s', 1100)
      .typeCharacter('i', 1200);

    expect(mistaken.currentInput).toBe('si');

    const recovered = mistaken.typeCharacter('h', 1300);
    expect(recovered.currentInput).toBe('sh');

    const passed = recovered.typeCharacter('i', 1400);
    expect(passed.status).toBe('passed');
    expect(passed.completedPrompts).toBe(1);
    expect(passed.mistakes).toEqual([
      {
        kanaText: '\u3057',
        expectedRomaji: 'shi',
        actualInput: 'si',
        occurredAt: 1200,
      },
    ]);
  });

  test('returns new immutable session values instead of mutating prior state', () => {
    const initial = createPracticeSession({
      levelId: levelId('hiragana-ka'),
      prompts: [{ kanaText: 'け', romaji: 'ke' }],
      maxMistakes: 4,
      startedAt: 1000,
    });

    const typed = initial.typeCharacter('k', 1100);

    expect(initial).not.toBe(typed);
    expect(initial.currentInput).toBe('');
    expect(initial.status).toBe('running');
    expect(typed.currentInput).toBe('k');
    expect(Object.isFrozen(typed)).toBe(true);
    expect(Object.isFrozen(typed.prompts)).toBe(true);
    expect(Object.isFrozen(typed.prompts[0])).toBe(true);
    expect(Object.isFrozen(typed.mistakes)).toBe(true);
  });

  test('rejects empty prompt lists', () => {
    expect(() =>
      createPracticeSession({
        levelId: levelId('empty-prompts'),
        prompts: [],
        maxMistakes: 4,
        startedAt: 1000,
      }),
    ).toThrow('Practice session requires at least one prompt');
  });

  test('rejects prompts with empty romaji', () => {
    expect(() =>
      createPracticeSession({
        levelId: levelId('empty-romaji'),
        prompts: [{ kanaText: '\u3057', romaji: '' }],
        maxMistakes: 4,
        startedAt: 1000,
      }),
    ).toThrow('Practice prompt romaji is required');
  });

  test('rejects invalid maxMistakes values', () => {
    expect(() =>
      createPracticeSession({
        levelId: levelId('invalid-max-mistakes'),
        prompts: [{ kanaText: '\u3057', romaji: 'shi' }],
        maxMistakes: 0,
        startedAt: 1000,
      }),
    ).toThrow('Practice session maxMistakes must be at least 1');
  });

  test('fails when mistakes reach the configured threshold', () => {
    const session = createPracticeSession({
      levelId: levelId('hiragana-sa'),
      prompts: [{ kanaText: 'し', romaji: 'shi' }],
      maxMistakes: 2,
      startedAt: 1000,
    })
      .typeCharacter('x', 1100)
      .typeCharacter('y', 1200);

    expect(session.status).toBe('failed');
    expect(session.mistakes).toHaveLength(2);
    expect(session.endedAt).toBe(1200);
  });

  test('typing after passed or failed sessions does not change state fields', () => {
    const passed = createPracticeSession({
      levelId: levelId('hiragana-ka'),
      prompts: [{ kanaText: '\u3051', romaji: 'ke' }],
      maxMistakes: 4,
      startedAt: 1000,
    })
      .typeCharacter('k', 1100)
      .typeCharacter('e', 1200);

    const afterPassed = passed.typeCharacter('x', 1300);
    expect(afterPassed).toMatchObject({
      status: 'passed',
      currentInput: '',
      currentPromptIndex: 0,
      completedPrompts: 1,
      endedAt: 1200,
    });
    expect(afterPassed.mistakes).toEqual([]);

    const failed = createPracticeSession({
      levelId: levelId('hiragana-sa'),
      prompts: [{ kanaText: '\u3057', romaji: 'shi' }],
      maxMistakes: 1,
      startedAt: 2000,
    }).typeCharacter('x', 2100);

    const afterFailed = failed.typeCharacter('s', 2200);
    expect(afterFailed).toMatchObject({
      status: 'failed',
      currentInput: 'x',
      currentPromptIndex: 0,
      completedPrompts: 0,
      endedAt: 2100,
    });
    expect(afterFailed.mistakes).toEqual(failed.mistakes);
  });

  test('reset returns a fresh running session for the same prompts and threshold', () => {
    const failed = createPracticeSession({
      levelId: levelId('hiragana-sa'),
      prompts: [{ kanaText: 'し', romaji: 'shi' }],
      maxMistakes: 1,
      startedAt: 1000,
    }).typeCharacter('x', 1100);

    const reset = failed.reset(2000);

    expect(reset).not.toBe(failed);
    expect(reset).toMatchObject({
      levelId: 'hiragana-sa',
      currentInput: '',
      currentPromptIndex: 0,
      completedPrompts: 0,
      maxMistakes: 1,
      startedAt: 2000,
      status: 'running',
    });
    expect(reset.prompts).toEqual([{ kanaText: 'し', romaji: 'shi' }]);
    expect(reset.mistakes).toEqual([]);
    expect(reset.endedAt).toBeUndefined();
  });

  test('requires branded LevelId values at the practice session boundary', () => {
    const tempDirectory = mkdtempSync(join(tmpdir(), 'practice-session-types-'));
    const contractPath = join(tempDirectory, 'practiceSession.contract.ts');
    const practiceSessionImport = projectImportPath(tempDirectory, 'src/core/practice/practiceSession');
    const idsImport = projectImportPath(tempDirectory, 'src/core/shared/ids');

    const contractSource = `
      import { createPracticeSession } from '${practiceSessionImport}';
      import type { CreatePracticeSessionInput } from '${practiceSessionImport}';
      import { levelId } from '${idsImport}';
      import type { LevelId } from '${idsImport}';

      const input: CreatePracticeSessionInput = {
        levelId: levelId('hiragana-sa'),
        prompts: [{ kanaText: '\\u3057', romaji: 'shi' }],
        maxMistakes: 4,
        startedAt: 1000,
      };
      const inputLevelId: LevelId = input.levelId;
      createPracticeSession(input);

      const plainStringInput: CreatePracticeSessionInput = {
        // @ts-expect-error plain strings are not branded LevelId values.
        levelId: 'hiragana-sa',
        prompts: [{ kanaText: '\\u3057', romaji: 'shi' }],
        maxMistakes: 4,
        startedAt: 1000,
      };

      void inputLevelId;
      void plainStringInput;
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
});
