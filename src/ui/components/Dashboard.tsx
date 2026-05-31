import type { KanaTrainerState, KanaTrainerStatus } from '../../app/KanaTrainer';

interface DashboardProps {
  readonly state: KanaTrainerState;
  readonly onOpenLevels: () => void;
}

const statusLabels: Record<KanaTrainerStatus, string> = {
  ready: '预备',
  running: '练习中',
  passed: '通关成功',
  failed: '本关未通过',
};

export function Dashboard({ state, onOpenLevels }: DashboardProps) {
  const totalPrompts = state.session.prompts.length;

  return (
    <header className="dashboard" aria-label="练习状态">
      <div className="dashboard__brand">
        <h1>kana50.com</h1>
        <p>五十音打字练习</p>
      </div>

      <dl className="dashboard__stats">
        <div className="dashboard__stat">
          <dt>状态</dt>
          <dd>{statusLabels[state.status]}</dd>
        </div>
        <div className="dashboard__stat dashboard__stat--level">
          <dt>当前关卡</dt>
          <dd>
            <span>{state.currentLevel.name}</span>
            <button type="button" className="level-switch" aria-label="切换关卡" title="切换关卡" onClick={onOpenLevels}>
              切换
            </button>
          </dd>
        </div>
        <div className="dashboard__stat">
          <dt>进度</dt>
          <dd>
            {state.session.completedPrompts}/{totalPrompts}
          </dd>
        </div>
        <div className="dashboard__stat">
          <dt>错误</dt>
          <dd>
            {state.session.mistakes.length}/{state.session.maxMistakes}
          </dd>
        </div>
      </dl>
    </header>
  );
}
