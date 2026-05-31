import { describe, expect, test } from 'vitest';
import { createPracticeSession } from '../../../src/core/practice/practiceSession';

describe('practice session', () => {
  test('completes kana when romaji characters are typed in order', () => {
    let session = createPracticeSession({
      levelId: 'hiragana-ka',
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
      levelId: 'hiragana-sa',
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

  test('returns new immutable session values instead of mutating prior state', () => {
    const initial = createPracticeSession({
      levelId: 'hiragana-ka',
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

  test('fails when mistakes reach the configured threshold', () => {
    const session = createPracticeSession({
      levelId: 'hiragana-sa',
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

  test('reset returns a fresh running session for the same prompts and threshold', () => {
    const failed = createPracticeSession({
      levelId: 'hiragana-sa',
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
});
