import type { CourseId, LevelId } from '../shared/ids';

export interface LevelResult {
  readonly levelId: LevelId;
  readonly courseId: CourseId;
  readonly passed: boolean;
  readonly accuracy: number;
  readonly kanaPerMinute: number;
  readonly stars: 0 | 1 | 2 | 3;
  readonly completedAt: number;
}

export interface MistakeStat {
  readonly kanaText: string;
  readonly expectedRomaji: string;
  readonly count: number;
  readonly lastMistakeAt: number;
}

export interface ProgressSettings {
  readonly keySoundEnabled: boolean;
  readonly kanaSoundEnabled: boolean;
  readonly helperVisible: boolean;
}

export interface ProgressState {
  readonly schemaVersion: 1;
  readonly activeCourseId: CourseId;
  readonly activeLevelId: LevelId;
  readonly levelResults: readonly LevelResult[];
  readonly mistakeStats: readonly MistakeStat[];
  readonly settings: ProgressSettings;
}
