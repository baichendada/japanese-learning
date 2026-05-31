import type { ProgressRepository } from '../../app/ports';
import type { ProgressState } from '../../core/progress/model';
import { parseProgressBackup } from '../../core/progress/importExport';
import { createEmptyProgress } from '../../core/progress/progress';

export class LocalStorageProgressRepository implements ProgressRepository {
  constructor(private readonly key = 'kana50-progress') {}

  async load(): Promise<ProgressState> {
    const savedProgress = localStorage.getItem(this.key);

    if (savedProgress === null) {
      return createEmptyProgress();
    }

    return parseProgressBackup(savedProgress);
  }

  async save(progress: ProgressState): Promise<void> {
    localStorage.setItem(this.key, JSON.stringify(progress));
  }
}
