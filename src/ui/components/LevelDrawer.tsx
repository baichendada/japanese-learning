import type { Level } from '../../core/learning-content/levelCatalog';
import { courses } from '../../core/learning-content/levelCatalog';
import type { ProgressState } from '../../core/progress/model';
import { isLevelUnlocked } from '../../core/progress/progress';

interface LevelDrawerProps {
  readonly open: boolean;
  readonly currentLevel: Level;
  readonly progress: ProgressState;
  readonly onClose: () => void;
}

export function LevelDrawer({ currentLevel, open, progress, onClose }: LevelDrawerProps) {
  if (!open) {
    return null;
  }

  return (
    <aside className="level-drawer" role="dialog" aria-modal="true" aria-label="关卡列表">
      <div className="level-drawer__header">
        <h2>关卡列表</h2>
        <button type="button" className="icon-text-button" aria-label="关闭关卡列表" onClick={onClose}>
          关闭
        </button>
      </div>

      <div className="level-drawer__courses">
        {courses.map((course) => (
          <section key={course.id} className="level-drawer__course" aria-labelledby={`${course.id}-title`}>
            <h3 id={`${course.id}-title`}>{course.name}</h3>
            <ul className="level-list">
              {course.levels.map((level) => {
                const unlocked = isLevelUnlocked(progress, level.unlock);
                const result = progress.levelResults.find((candidate) => candidate.levelId === level.id);
                const current = currentLevel.id === level.id;

                return (
                  <li key={level.id} className={`level-list__item${current ? ' level-list__item--current' : ''}`}>
                    <div>
                      <strong>{level.name}</strong>
                      <span>{level.kanaTexts.join(' ')}</span>
                    </div>
                    <div className="level-list__meta">
                      <span>{current ? '当前' : result?.passed ? '已通过' : '未通过'}</span>
                      <span>{unlocked ? '已解锁' : '未解锁'}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </aside>
  );
}
