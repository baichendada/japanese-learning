import type { Course, Level } from '../../core/learning-content/levelCatalog';

export function formatLevelPosition(course: Course, level: Level): string {
  const index = course.levels.findIndex((candidate) => candidate.id === level.id);

  if (index === -1) {
    return level.name;
  }

  return `${index + 1}/${course.levels.length} ${level.name}`;
}
