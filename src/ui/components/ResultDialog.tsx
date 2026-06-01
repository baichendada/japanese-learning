import { useEffect, useRef } from 'react';
import type { KanaTrainerState } from '../../app/KanaTrainer';

interface ResultDialogProps {
  readonly state: KanaTrainerState;
  readonly onRestart: () => void;
  readonly onNextLevel: () => void;
}

export function ResultDialog({ state, onRestart, onNextLevel }: ResultDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status === 'passed' || state.status === 'failed') {
      dialogRef.current?.focus();
    }
  }, [state.status]);

  if (state.status !== 'passed' && state.status !== 'failed') {
    return null;
  }

  const result = state.lastResult;
  const passedWithNextLevel =
    state.status === 'passed' && result !== undefined && result.levelId !== state.currentLevel.id;

  return (
    <div
      ref={dialogRef}
      className="result-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-title"
      tabIndex={-1}
    >
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

      {passedWithNextLevel ? (
        <>
          <p className="result-dialog__hint">下一关：{state.currentLevel.name}，按空格或点击下方按钮继续。</p>
          <button type="button" className="primary-button" aria-label="进入下一关" onClick={onNextLevel}>
            进入下一关
          </button>
        </>
      ) : (
        <button type="button" className="primary-button" aria-label="重试本关" onClick={onRestart}>
          重试本关
        </button>
      )}
    </div>
  );
}
