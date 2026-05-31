import type { Clock } from '../../core/shared/clock';

export class BrowserClock implements Clock {
  now(): number {
    return Date.now();
  }
}
