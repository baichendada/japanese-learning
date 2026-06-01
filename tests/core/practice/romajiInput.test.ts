import { describe, expect, test } from 'vitest';
import {
  findLastValidRomajiPrefix,
  isRomajiInputMismatch,
  splitRomajiInputForDisplay,
} from '../../../src/core/practice/romajiInput';

describe('romaji input helpers', () => {
  test('findLastValidRomajiPrefix keeps the longest matching prefix', () => {
    expect(findLastValidRomajiPrefix('si', 'shi')).toBe('s');
    expect(findLastValidRomajiPrefix('sh', 'shi')).toBe('sh');
    expect(findLastValidRomajiPrefix('b', 'a')).toBe('');
  });

  test('splitRomajiInputForDisplay separates valid and error segments', () => {
    expect(splitRomajiInputForDisplay('si', 'shi')).toEqual({
      validPart: 's',
      errorPart: 'i',
    });
    expect(splitRomajiInputForDisplay('sh', 'shi')).toEqual({
      validPart: 'sh',
      errorPart: '',
    });
  });

  test('isRomajiInputMismatch returns false for empty input', () => {
    expect(isRomajiInputMismatch('', 'shi')).toBe(false);
  });

  test('isRomajiInputMismatch returns false for a valid prefix', () => {
    expect(isRomajiInputMismatch('sh', 'shi')).toBe(false);
    expect(isRomajiInputMismatch('S', 'shi')).toBe(false);
  });

  test('isRomajiInputMismatch returns true when input diverges from expected romaji', () => {
    expect(isRomajiInputMismatch('si', 'shi')).toBe(true);
    expect(isRomajiInputMismatch('b', 'a')).toBe(true);
  });
});
