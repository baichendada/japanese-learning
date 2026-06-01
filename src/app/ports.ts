import type { ProgressState } from '../core/progress/model';

export interface ProgressRepository {
  load(): Promise<ProgressState>;
  save(progress: ProgressState): Promise<void>;
}

export interface AudioService {
  playKey(): Promise<void>;
  playKana(kanaText: string): Promise<void>;
  replayCurrent(): Promise<void>;
}

export interface FilePort {
  exportJson(data: unknown, filename: string): Promise<void>;
  importJson(): Promise<unknown>;
}
