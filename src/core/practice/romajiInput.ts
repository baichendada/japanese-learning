export function findLastValidRomajiPrefix(input: string, expectedRomaji: string): string {
  const normalizedExpected = expectedRomaji.toLowerCase();

  for (let length = Math.min(input.length, expectedRomaji.length); length > 0; length -= 1) {
    const candidate = input.slice(0, length).toLowerCase();

    if (normalizedExpected.startsWith(candidate)) {
      return input.slice(0, length);
    }
  }

  return '';
}

export function splitRomajiInputForDisplay(
  currentInput: string,
  expectedRomaji: string,
): { readonly validPart: string; readonly errorPart: string } {
  const validPart = findLastValidRomajiPrefix(currentInput, expectedRomaji);

  return {
    validPart,
    errorPart: currentInput.slice(validPart.length),
  };
}

export function isRomajiInputMismatch(currentInput: string, expectedRomaji: string): boolean {
  if (currentInput.length === 0) {
    return false;
  }

  return splitRomajiInputForDisplay(currentInput, expectedRomaji).errorPart.length > 0;
}
