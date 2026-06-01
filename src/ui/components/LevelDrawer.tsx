import { Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Course, Level } from '../../core/learning-content/levelCatalog';
import { courses, getCourse } from '../../core/learning-content/levelCatalog';
import type { CourseId, LevelId } from '../../core/shared/ids';
import type { ProgressState } from '../../core/progress/model';
import { isLevelUnlocked } from '../../core/progress/progress';

interface LevelDrawerProps {
  readonly open: boolean;
  readonly currentLevel: Level;
  readonly progress: ProgressState;
  readonly onClose: () => void;
  readonly onSelectLevel: (levelId: LevelId) => void;
}

export function LevelDrawer({ open, currentLevel, progress, onClose, onSelectLevel }: LevelDrawerProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<CourseId>(currentLevel.courseId);

  useEffect(() => {
    if (open) {
      setSelectedCourseId(currentLevel.courseId);
    }
  }, [currentLevel.courseId, open]);

  if (!open) {
    return null;
  }

  const selectedCourse = getCourse(selectedCourseId);

  return (
    <div className="level-drawer-layer">
      <button type="button" className="level-drawer-layer__backdrop" aria-label="关闭关卡列表" onClick={onClose} />
      <aside className="level-drawer" role="dialog" aria-modal="true" aria-label="关卡列表">
        <div className="level-drawer__header">
          <h2>切换关卡</h2>
          <button type="button" className="icon-text-button" aria-label="关闭关卡列表" onClick={onClose}>
            关闭
          </button>
        </div>

        <label className="level-drawer__course-picker">
          <span className="level-drawer__course-label">课程</span>
          <select
            className="level-drawer__course-select"
            value={selectedCourseId}
            aria-label="选择课程"
            onChange={(event) => setSelectedCourseId(event.target.value as CourseId)}
          >
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </label>

        <ol className="level-drawer__list">
          {selectedCourse.levels.map((level, index) => (
            <LevelDrawerItem
              key={level.id}
              course={selectedCourse}
              index={index}
              level={level}
              current={currentLevel.id === level.id}
              progress={progress}
              onSelectLevel={(levelId) => {
                onSelectLevel(levelId);
                onClose();
              }}
            />
          ))}
        </ol>
      </aside>
    </div>
  );
}

interface LevelDrawerItemProps {
  readonly course: Course;
  readonly index: number;
  readonly level: Level;
  readonly current: boolean;
  readonly progress: ProgressState;
  readonly onSelectLevel: (levelId: LevelId) => void;
}

function LevelDrawerItem({
  course,
  index,
  level,
  current,
  progress,
  onSelectLevel,
}: LevelDrawerItemProps) {
  const unlocked = isLevelUnlocked(progress, level.unlock);
  const result = progress.levelResults.find((candidate) => candidate.levelId === level.id);
  const levelNumber = `${index + 1}/${course.levels.length}`;

  return (
    <li className={`level-drawer__item${current ? ' level-drawer__item--current' : ''}${!unlocked ? ' level-drawer__item--locked' : ''}`}>
      <button
        type="button"
        className="level-drawer__button"
        disabled={!unlocked}
        aria-label={`选择关卡 ${level.name}`}
        aria-current={current ? 'true' : undefined}
        onClick={() => onSelectLevel(level.id)}
      >
        <div className="level-drawer__item-head">
          <span className="level-drawer__item-index">{levelNumber}</span>
          <strong className="level-drawer__item-name">{level.name}</strong>
          {!unlocked ? <Lock size={14} aria-hidden="true" className="level-drawer__lock" /> : null}
        </div>

        <div className="level-drawer__preview" aria-hidden="true">
          {level.kanaTexts.map((kana) => (
            <span key={kana} className="level-drawer__preview-char">
              {kana}
            </span>
          ))}
        </div>

        <div className="level-drawer__item-foot">
          {current ? (
            <span className="level-drawer__status level-drawer__status--active">挑战中 →</span>
          ) : result?.passed ? (
            <span className="level-drawer__status level-drawer__status--passed">已通过</span>
          ) : unlocked ? (
            <span className="level-drawer__status">可挑战</span>
          ) : (
            <span className="level-drawer__status level-drawer__status--locked">未解锁</span>
          )}
        </div>
      </button>
    </li>
  );
}
