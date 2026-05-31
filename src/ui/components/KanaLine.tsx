import type { KanaTrainerState } from '../../app/KanaTrainer';

interface KanaLineProps {
  readonly state: KanaTrainerState;
  readonly visibleInput: string;
  readonly onStart: () => void;
}

export function KanaLine({ state, visibleInput, onStart }: KanaLineProps) {
  const active = state.status !== 'ready';
  const currentIndex = state.session.currentPromptIndex;

  return (
    <div className={`kana-line ${active ? 'kana-line--active' : 'kana-line--preview'}`} aria-label="假名练习行">
      <div className="kana-line__sequence" aria-hidden={!active}>
        {state.currentLevel.kanaTexts.map((kanaText, index) => {
          const current = active && state.status === 'running' && index === currentIndex;

          return (
            <span
              key={`${kanaText}-${index}`}
              className={`kana-line__token${current ? ' kana-line__token--current' : ''}${
                index < state.session.completedPrompts ? ' kana-line__token--done' : ''
              }`}
              aria-label={current ? `当前假名 ${kanaText}` : undefined}
            >
              {kanaText}
            </span>
          );
        })}
      </div>

      {state.status === 'ready' ? (
        <button type="button" className="stage-start" onClick={onStart}>
          按空格开始
        </button>
      ) : (
        <div className="kana-line__input" aria-label="当前输入">
          {visibleInput || '等待输入'}
        </div>
      )}
    </div>
  );
}
