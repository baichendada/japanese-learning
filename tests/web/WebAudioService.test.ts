import { afterEach, describe, expect, test, vi } from 'vitest';
import { WebAudioService } from '../../src/web/adapters/WebAudioService';

const originalAudioContext = Object.getOwnPropertyDescriptor(window, 'AudioContext');
const originalWebkitAudioContext = Object.getOwnPropertyDescriptor(window, 'webkitAudioContext');

describe('WebAudioService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    restoreWindowProperty('AudioContext', originalAudioContext);
    restoreWindowProperty('webkitAudioContext', originalWebkitAudioContext);
  });

  test('playKey resolves when no AudioContext or webkitAudioContext exists', async () => {
    setWindowProperty('AudioContext', undefined);
    setWindowProperty('webkitAudioContext', undefined);
    const service = new WebAudioService();

    await expect(service.playKey()).resolves.toBeUndefined();
  });

  test('playKey resolves when AudioContext construction throws', async () => {
    setWindowProperty(
      'AudioContext',
      class ThrowingAudioContext {
        constructor() {
          throw new Error('audio blocked');
        }
      },
    );
    setWindowProperty('webkitAudioContext', undefined);
    const service = new WebAudioService();

    await expect(service.playKey()).resolves.toBeUndefined();
  });

  test('playKey resolves when AudioContext resume rejects', async () => {
    const close = vi.fn().mockResolvedValue(undefined);
    const context = audioContext({
      state: 'suspended',
      resume: vi.fn().mockRejectedValue(new Error('resume denied')),
      close,
    });
    setWindowProperty('AudioContext', audioContextConstructor(context));
    setWindowProperty('webkitAudioContext', undefined);
    const service = new WebAudioService();

    await expect(service.playKey()).resolves.toBeUndefined();
    expect(close).toHaveBeenCalledTimes(1);
  });

  test('playKey resolves when audio node setup throws', async () => {
    const close = vi.fn().mockResolvedValue(undefined);
    const context = audioContext({
      createOscillator: vi.fn(() => {
        throw new Error('oscillator unavailable');
      }),
      close,
    });
    setWindowProperty('AudioContext', audioContextConstructor(context));
    setWindowProperty('webkitAudioContext', undefined);
    const service = new WebAudioService();

    await expect(service.playKey()).resolves.toBeUndefined();
    expect(close).toHaveBeenCalledTimes(1);
  });

  test('replayCurrent resolves with no last kana and after a stored kana when audio is unavailable', async () => {
    setWindowProperty('AudioContext', undefined);
    setWindowProperty('webkitAudioContext', undefined);
    const service = new WebAudioService();

    await expect(service.replayCurrent()).resolves.toBeUndefined();
    await expect(service.playKana('あ')).resolves.toBeUndefined();
    await expect(service.replayCurrent()).resolves.toBeUndefined();
  });
});

function setWindowProperty(name: 'AudioContext' | 'webkitAudioContext', value: unknown): void {
  Object.defineProperty(window, name, {
    configurable: true,
    writable: true,
    value,
  });
}

function restoreWindowProperty(
  name: 'AudioContext' | 'webkitAudioContext',
  descriptor: PropertyDescriptor | undefined,
): void {
  if (descriptor === undefined) {
    delete (window as Partial<Record<'AudioContext' | 'webkitAudioContext', unknown>>)[name];
    return;
  }

  Object.defineProperty(window, name, descriptor);
}

function audioContext(overrides: Partial<AudioContext> = {}): AudioContext {
  return {
    state: 'running',
    currentTime: 1,
    destination: {},
    resume: vi.fn().mockResolvedValue(undefined),
    createOscillator: vi.fn(() => oscillatorNode()),
    createGain: vi.fn(() => gainNode()),
    close: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as AudioContext;
}

function audioContextConstructor(context: AudioContext): typeof AudioContext {
  return vi.fn(function AudioContextMock() {
    return context;
  }) as unknown as typeof AudioContext;
}

function oscillatorNode(): OscillatorNode {
  return {
    type: 'sine',
    frequency: { setValueAtTime: vi.fn() },
    connect: vi.fn(),
    disconnect: vi.fn(),
    addEventListener: vi.fn((_eventName, listener: EventListenerOrEventListenerObject) => {
      if (typeof listener === 'function') {
        listener(new Event('ended'));
        return;
      }

      listener.handleEvent(new Event('ended'));
    }),
    start: vi.fn(),
    stop: vi.fn(),
  } as unknown as OscillatorNode;
}

function gainNode(): GainNode {
  return {
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  } as unknown as GainNode;
}
