import type { KanaTrainerState, KanaTrainerStatus } from '../../app/KanaTrainer';

interface DashboardProps {
  readonly state: KanaTrainerState;
}

const statusLabels: Record<KanaTrainerStatus, string> = {
  ready: '预备',
  running: '挑战中',
  paused: '已暂停',
  passed: '通关成功',
  failed: '本关未通过',
};

export function Dashboard({ state }: DashboardProps) {
  const totalPrompts = state.session.prompts.length;

  return (
    <header className="practice-header" aria-label="练习状态">
      <div className="practice-header__brand">
        <h1>kana50.com</h1>
      </div>

      <p className="practice-header__stats" aria-label="练习数据">
        <span className="practice-header__metric">
          <span className="practice-header__metric-label">状态</span>
          <span className="practice-header__metric-value">{statusLabels[state.status]}</span>
        </span>
        <span className="practice-header__divider" aria-hidden="true">
          ·
        </span>
        <span className="practice-header__metric">
          <span className="practice-header__metric-label">进度</span>
          <span className="practice-header__metric-value">
            {state.session.completedPrompts}/{totalPrompts}
          </span>
        </span>
        <span className="practice-header__divider" aria-hidden="true">
          ·
        </span>
        <span className="practice-header__metric">
          <span className="practice-header__metric-label">错误</span>
          <span className="practice-header__metric-value">
            {state.session.mistakes.length}/{state.session.maxMistakes}
          </span>
        </span>
      </p>
    </header>
  );
}
