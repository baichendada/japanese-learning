import type { KanaTrainerState } from '../../app/KanaTrainer';

interface ResultDialogProps {
  readonly state: KanaTrainerState;
  readonly onRestart: () => void;
}

export function ResultDialog({ state, onRestart }: ResultDialogProps) {
  if (state.status !== 'passed' && state.status !== 'failed') {
    return null;
  }

  const result = state.lastResult;

  return (
    <div className="result-dialog" role="dialog" aria-modal="true" aria-labelledby="result-title">
      <h2 id="result-title">{state.status === 'passed' ? '通关成功' : '本关未通过'}</h2>

      {result !== undefined ? (
        <dl className="result-dialog__scores">
          <div>
            <dt>正确率</dt>
            <dd>{Math.round(result.accuracy * 100)}%</dd>
          </div>
          <div>
            <dt>速度</dt>
            <dd>{result.kanaPerMinute}/分</dd>
          </div>
          <div>
            <dt>星级</dt>
            <dd>{result.stars}</dd>
          </div>
        </dl>
      ) : null}

      <button type="button" className="primary-button" aria-label="重试本关" onClick={onRestart}>
        重试本关
      </button>
    </div>
  );
}
