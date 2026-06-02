const TOFUGU_HIRAGANA_AUDIO_BASE =
  'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/';

export function getKanaAudioUrl(kanaText: string): string | undefined {
  const audioKana = toHiraganaForAudio(kanaText);

  if (audioKana === undefined) {
    return undefined;
  }

  return `${TOFUGU_HIRAGANA_AUDIO_BASE}${encodeURIComponent(audioKana)}.mp3`;
}

function toHiraganaForAudio(kanaText: string): string | undefined {
  if (kanaText.length === 0) {
    return undefined;
  }

  const converted = [...kanaText]
    .map((character) => {
      const code = character.charCodeAt(0);

      if (code >= 0x3041 && code <= 0x3096) {
        return character;
      }

      if (code >= 0x30a1 && code <= 0x30f6) {
        return String.fromCharCode(code - 0x60);
      }

      return undefined;
    })
    .join('');

  return converted.length === kanaText.length ? converted : undefined;
}
