import type { AudioService } from '../../app/ports';

const keyFrequencyHz = 880;
const kanaFrequencyHz = 660;
const keyDurationSeconds = 0.035;
const kanaDurationSeconds = 0.06;
const volume = 0.04;

export class WebAudioService implements AudioService {
  private audioContext: AudioContext | undefined;
  private currentKanaText: string | undefined;

  async playKey(): Promise<void> {
    await this.beep(keyFrequencyHz, keyDurationSeconds);
  }

  async playKana(kanaText: string): Promise<void> {
    this.currentKanaText = kanaText;
    await this.beep(kanaFrequencyHz, kanaDurationSeconds);
  }

  async replayCurrent(): Promise<void> {
    if (this.currentKanaText === undefined) {
      return;
    }

    await this.playKana(this.currentKanaText);
  }

  private getAudioContext(): AudioContext | undefined {
    if (this.audioContext !== undefined) {
      return this.audioContext;
    }

    const AudioContextConstructor = window.AudioContext ?? window.webkitAudioContext;

    if (AudioContextConstructor === undefined) {
      return undefined;
    }

    this.audioContext = new AudioContextConstructor();
    return this.audioContext;
  }

  private async beep(frequencyHz: number, durationSeconds: number): Promise<void> {
    const audioContext = this.getAudioContext();

    if (audioContext === undefined) {
      return;
    }

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    await new Promise<void>((resolve) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const now = audioContext.currentTime;

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequencyHz, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.addEventListener(
        'ended',
        () => {
          oscillator.disconnect();
          gain.disconnect();
          resolve();
        },
        { once: true },
      );
      oscillator.start(now);
      oscillator.stop(now + durationSeconds);
    });
  }
}
