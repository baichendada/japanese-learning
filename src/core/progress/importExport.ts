import { getCourse, getLevelById } from '../learning-content/levelCatalog';
import { courseId, levelId } from '../shared/ids';
import type { CourseId, LevelId } from '../shared/ids';
import type { LevelResult, MistakeStat, ProgressSettings, ProgressState } from './model';

export interface ProgressImportPreview {
  readonly importedLevelCount: number;
  readonly importedMistakeCount: number;
  readonly importedActiveLevelId: LevelId;
}

type UnknownRecord = Record<string, unknown>;

export function parseProgressBackup(json: string): ProgressState {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Invalid progress backup JSON');
  }

  return parseProgressState(parsed);
}

export function previewProgressImport(_local: ProgressState, imported: ProgressState): ProgressImportPreview {
  return {
    importedLevelCount: imported.levelResults.length,
    importedMistakeCount: imported.mistakeStats.length,
    importedActiveLevelId: imported.activeLevelId,
  };
}

export function mergeProgress(local: ProgressState, imported: ProgressState): ProgressState {
  const validLocal = validateProgressState(local);
  const validImported = validateProgressState(imported);

  return freezeProgress({
    schemaVersion: 1,
    activeCourseId: validImported.activeCourseId,
    activeLevelId: validImported.activeLevelId,
    levelResults: mergeLevelResults(validLocal.levelResults, validImported.levelResults),
    mistakeStats: mergeMistakeStats(validLocal.mistakeStats, validImported.mistakeStats),
    settings: { ...validImported.settings },
  });
}

function parseProgressState(value: unknown): ProgressState {
  const record = requireRecord(value, 'progress');

  if (record.schemaVersion !== 1) {
    throw new Error(`Unsupported progress schemaVersion: ${String(record.schemaVersion)}`);
  }

  const activeCourseId = courseId(requireNonEmptyString(record.activeCourseId, 'activeCourseId'));
  const activeLevelId = levelId(requireNonEmptyString(record.activeLevelId, 'activeLevelId'));
  validateActiveIds(activeCourseId, activeLevelId);

  if (!Array.isArray(record.levelResults)) {
    throw new Error('levelResults must be an array');
  }

  if (!Array.isArray(record.mistakeStats)) {
    throw new Error('mistakeStats must be an array');
  }

  const levelResults = mergeLevelResults([], record.levelResults.map(parseLevelResult));
  const mistakeStats = record.mistakeStats.map(parseMistakeStat);
  const parsedSettings = parseSettings(record.settings);

  return freezeProgress({
    schemaVersion: 1,
    activeCourseId,
    activeLevelId,
    levelResults,
    mistakeStats,
    settings: parsedSettings,
  });
}

function validateProgressState(progress: ProgressState): ProgressState {
  if (progress.schemaVersion !== 1) {
    throw new Error(`Unsupported progress schemaVersion: ${String(progress.schemaVersion)}`);
  }

  validateActiveIds(progress.activeCourseId, progress.activeLevelId);

  if (!Array.isArray(progress.levelResults)) {
    throw new Error('levelResults must be an array');
  }

  if (!Array.isArray(progress.mistakeStats)) {
    throw new Error('mistakeStats must be an array');
  }

  return {
    schemaVersion: 1,
    activeCourseId: progress.activeCourseId,
    activeLevelId: progress.activeLevelId,
    levelResults: progress.levelResults.map(validateLevelResult),
    mistakeStats: progress.mistakeStats.map(validateMistakeStat),
    settings: validateSettings(progress.settings),
  };
}

function parseLevelResult(value: unknown): LevelResult {
  return validateLevelResult(readLevelResult(requireRecord(value, 'levelResult')));
}

function readLevelResult(record: UnknownRecord): LevelResult {
  return {
    levelId: levelId(requireNonEmptyString(record.levelId, 'levelId')),
    courseId: courseId(requireNonEmptyString(record.courseId, 'courseId')),
    passed: record.passed as LevelResult['passed'],
    accuracy: record.accuracy as LevelResult['accuracy'],
    kanaPerMinute: record.kanaPerMinute as LevelResult['kanaPerMinute'],
    stars: record.stars as LevelResult['stars'],
    completedAt: record.completedAt as LevelResult['completedAt'],
  };
}

function validateLevelResult(result: LevelResult): LevelResult {
  requireNonEmptyString(result.levelId, 'levelId');
  requireNonEmptyString(result.courseId, 'courseId');

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

  return { ...result };
}

function parseMistakeStat(value: unknown, index: number): MistakeStat {
  return validateMistakeStat(readMistakeStat(requireRecord(value, `mistakeStats[${index}]`)), index);
}

function readMistakeStat(record: UnknownRecord): MistakeStat {
  return {
    kanaText: record.kanaText as MistakeStat['kanaText'],
    expectedRomaji: record.expectedRomaji as MistakeStat['expectedRomaji'],
    count: record.count as MistakeStat['count'],
    lastMistakeAt: record.lastMistakeAt as MistakeStat['lastMistakeAt'],
  };
}

function validateMistakeStat(stat: MistakeStat, index = 0): MistakeStat {
  const prefix = `mistakeStats[${index}]`;

  if (typeof stat.kanaText !== 'string' || stat.kanaText.trim() === '') {
    throw new Error(`${prefix}.kanaText must not be empty`);
  }

  if (typeof stat.expectedRomaji !== 'string' || stat.expectedRomaji.trim() === '') {
    throw new Error(`${prefix}.expectedRomaji must not be empty`);
  }

  if (!Number.isInteger(stat.count) || stat.count <= 0) {
    throw new Error(`${prefix}.count must be a positive integer`);
  }

  if (!Number.isFinite(stat.lastMistakeAt)) {
    throw new Error(`${prefix}.lastMistakeAt must be a finite timestamp`);
  }

  return { ...stat };
}

function parseSettings(value: unknown): ProgressSettings {
  return validateSettings(requireRecord(value, 'settings') as unknown as ProgressSettings);
}

function validateSettings(settings: ProgressSettings): ProgressSettings {
  validateSettingBoolean(settings.keySoundEnabled, 'keySoundEnabled');
  validateSettingBoolean(settings.kanaSoundEnabled, 'kanaSoundEnabled');
  validateSettingBoolean(settings.helperVisible, 'helperVisible');

  return { ...settings };
}

function validateSettingBoolean(value: unknown, fieldName: keyof ProgressSettings): void {
  if (typeof value !== 'boolean') {
    throw new Error(`settings.${fieldName} must be a boolean`);
  }
}

function validateActiveIds(activeCourseId: CourseId, activeLevelId: LevelId): void {
  requireNonEmptyString(activeCourseId, 'activeCourseId');
  requireNonEmptyString(activeLevelId, 'activeLevelId');
  getCourse(activeCourseId);

  const activeLevel = getLevelById(activeLevelId);

  if (activeLevel === undefined) {
    throw new Error(`Unknown level: ${activeLevelId}`);
  }

  if (activeLevel.courseId !== activeCourseId) {
    throw new Error(`Level ${activeLevelId} belongs to course ${activeLevel.courseId}, not ${activeCourseId}`);
  }
}

function mergeLevelResults(
  localResults: readonly LevelResult[],
  importedResults: readonly LevelResult[],
): readonly LevelResult[] {
  const merged = localResults.map((result) => ({ ...result }));

  for (const importedResult of importedResults) {
    const result = validateLevelResult(importedResult);
    const existingIndex = merged.findIndex((candidate) => candidate.levelId === result.levelId);

    if (existingIndex === -1) {
      merged.push(result);
      continue;
    }

    if (isBetterLevelResult(result, merged[existingIndex])) {
      merged[existingIndex] = result;
    }
  }

  return merged;
}

function mergeMistakeStats(localStats: readonly MistakeStat[], importedStats: readonly MistakeStat[]): readonly MistakeStat[] {
  const merged = localStats.map((stat, index) => validateMistakeStat(stat, index));

  for (const importedStat of importedStats) {
    const stat = validateMistakeStat(importedStat);
    const existingIndex = merged.findIndex(
      (candidate) => candidate.kanaText === stat.kanaText && candidate.expectedRomaji === stat.expectedRomaji,
    );

    if (existingIndex === -1) {
      merged.push(stat);
      continue;
    }

    const existing = merged[existingIndex];
    merged[existingIndex] = {
      ...existing,
      count: existing.count + stat.count,
      lastMistakeAt: Math.max(existing.lastMistakeAt, stat.lastMistakeAt),
    };
  }

  return merged;
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

function requireRecord(value: unknown, fieldName: string): UnknownRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${fieldName} must be an object`);
  }

  return value as UnknownRecord;
}

function requireNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }

  if (value.trim() === '') {
    throw new Error(`${fieldName} must not be empty`);
  }

  return value;
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
