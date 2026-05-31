import { getLevelById } from '../learning-content/levelCatalog';
import type { UnlockRule } from '../learning-content/levelCatalog';
import { courseId, levelId } from '../shared/ids';
import type { LevelResult, MistakeStat, ProgressSettings, ProgressState } from './model';

export function createEmptyProgress(): ProgressState {
  return freezeProgress({
    schemaVersion: 1,
    activeCourseId: courseId('hiragana-basic'),
    activeLevelId: levelId('hiragana-a'),
    levelResults: [],
    mistakeStats: [],
    settings: {
      keySoundEnabled: true,
      kanaSoundEnabled: true,
      helperVisible: true,
    },
  });
}

export function recordLevelResult(progress: ProgressState, result: LevelResult): ProgressState {
  validateLevelResult(result);

  const existingIndex = progress.levelResults.findIndex((candidate) => candidate.levelId === result.levelId);
  const levelResults =
    existingIndex === -1
      ? [...progress.levelResults, result]
      : progress.levelResults.map((candidate, index) =>
          index === existingIndex && isBetterLevelResult(result, candidate) ? result : candidate,
        );

  return freezeProgress({
    ...progress,
    activeCourseId: result.courseId,
    activeLevelId: result.levelId,
    levelResults,
    mistakeStats: [...progress.mistakeStats],
    settings: { ...progress.settings },
  });
}

export function isLevelUnlocked(progress: ProgressState, rule: UnlockRule): boolean {
  if (rule.type === 'always') {
    return true;
  }

  return progress.levelResults.some((result) => result.levelId === rule.previousLevelId && result.passed === true);
}

function isBetterLevelResult(candidate: LevelResult, current: LevelResult): boolean {
  if (candidate.passed !== current.passed) {
    return candidate.passed;
  }

  if (candidate.stars !== current.stars) {
    return candidate.stars > current.stars;
  }

  if (candidate.accuracy !== current.accuracy) {
    return candidate.accuracy > current.accuracy;
  }

  if (candidate.kanaPerMinute !== current.kanaPerMinute) {
    return candidate.kanaPerMinute > current.kanaPerMinute;
  }

  return candidate.completedAt > current.completedAt;
}

function validateLevelResult(result: LevelResult): void {
  validateNonEmptyId(result.levelId, 'levelId');
  validateNonEmptyId(result.courseId, 'courseId');

  const catalogLevel = getLevelById(result.levelId);

  if (catalogLevel === undefined) {
    throw new Error(`Unknown level: ${result.levelId}`);
  }

  if (catalogLevel.courseId !== result.courseId) {
    throw new Error(`Level ${result.levelId} belongs to course ${catalogLevel.courseId}, not ${result.courseId}`);
  }

  if (typeof result.passed !== 'boolean') {
    throw new Error('passed must be a boolean');
  }

  if (!Number.isFinite(result.accuracy) || result.accuracy < 0 || result.accuracy > 1) {
    throw new Error('accuracy must be a finite number between 0 and 1');
  }

  if (!Number.isFinite(result.kanaPerMinute) || result.kanaPerMinute < 0) {
    throw new Error('kanaPerMinute must be a finite non-negative number');
  }

  if (!Number.isInteger(result.stars) || result.stars < 0 || result.stars > 3) {
    throw new Error('stars must be an integer between 0 and 3');
  }

  if (!result.passed && result.stars > 0) {
    throw new Error('failed results must have zero stars');
  }

  if (result.passed && result.stars === 0) {
    throw new Error('passed results must have at least one star');
  }

  if (!Number.isFinite(result.completedAt)) {
    throw new Error('completedAt must be a finite timestamp');
  }
}

function validateNonEmptyId(value: string, fieldName: 'levelId' | 'courseId'): void {
  if (value.trim() === '') {
    throw new Error(`${fieldName} must not be empty`);
  }
}

function freezeProgress(progress: ProgressState): ProgressState {
  return Object.freeze({
    ...progress,
    levelResults: Object.freeze(progress.levelResults.map(freezeLevelResult)),
    mistakeStats: Object.freeze(progress.mistakeStats.map(freezeMistakeStat)),
    settings: freezeSettings(progress.settings),
  });
}

function freezeLevelResult(result: LevelResult): LevelResult {
  return Object.freeze({ ...result });
}

function freezeMistakeStat(stat: MistakeStat): MistakeStat {
  return Object.freeze({ ...stat });
}

function freezeSettings(settings: ProgressSettings): ProgressSettings {
  return Object.freeze({ ...settings });
}
