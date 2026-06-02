import type { KanaTrainerState } from '../../app/KanaTrainer';
import { getCourse } from '../../core/learning-content/levelCatalog';
import { formatLevelPosition } from './levelDisplay';

interface LevelInfoBarProps {
  readonly state: KanaTrainerState;
  readonly onOpenLevels: () => void;
}

export function LevelInfoBar({ state, onOpenLevels }: LevelInfoBarProps) {
  const course = getCourse(state.currentLevel.courseId);
  const levelPosition = formatLevelPosition(course, state.currentLevel);

  return (
    <div className="level-info-bar" aria-label="当前关卡信息">
      <p className="level-info-bar__text">
        <span className="level-info-bar__course">{course.name}</span>
        <span className="level-info-bar__divider" aria-hidden="true">
          /
        </span>
        <span className="level-info-bar__level">{levelPosition}</span>
      </p>
      <button type="button" className="level-info-bar__switch" aria-label="切换关卡" title="切换关卡" onClick={onOpenLevels}>
        切换
      </button>
    </div>
  );
}
