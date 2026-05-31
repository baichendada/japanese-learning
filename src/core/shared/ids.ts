export type Brand<T, TBrand extends string> = T & { readonly __brand: TBrand };

export type KanaId = Brand<string, 'KanaId'>;
export type CourseId = Brand<string, 'CourseId'>;
export type LevelId = Brand<string, 'LevelId'>;

export function kanaId(value: string): KanaId {
  return value as KanaId;
}

export function courseId(value: string): CourseId {
  return value as CourseId;
}

export function levelId(value: string): LevelId {
  return value as LevelId;
}
