import type { ProgressRepository } from '../../app/ports';
import type { ProgressState } from '../../core/progress/model';
import { parseProgressBackup } from '../../core/progress/importExport';
import { createEmptyProgress } from '../../core/progress/progress';

export class LocalStorageProgressRepository implements ProgressRepository {
  constructor(private readonly key = 'kana50-progress') {}

  async load(): Promise<ProgressState> {
    let savedProgress: string | null;

    try {
      savedProgress = localStorage.getItem(this.key);
    } catch {
      return createEmptyProgress();
    }

    if (savedProgress === null) {
      return createEmptyProgress();
    }

    return parseProgressBackup(savedProgress);
  }

  async save(progress: ProgressState): Promise<void> {
    const serializedProgress = JSON.stringify(progress);

    try {
      localStorage.setItem(this.key, serializedProgress);
    } catch {
      return;
    }
  }
}
