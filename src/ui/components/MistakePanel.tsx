import type { MistakeStat } from '../../core/progress/model';

interface MistakePanelProps {
  readonly open: boolean;
  readonly mistakes: readonly MistakeStat[];
  readonly onClose: () => void;
  readonly onStartReview: () => void;
}

export function MistakePanel({ open, mistakes, onClose, onStartReview }: MistakePanelProps) {
  if (!open) {
    return null;
  }

  return (
    <aside className="utility-panel" role="dialog" aria-modal="true" aria-label="错题复习">
      <div className="utility-panel__header">
        <h2>错题复习</h2>
        <button type="button" className="icon-text-button" aria-label="关闭错题复习" onClick={onClose}>
          关闭
        </button>
      </div>

      <div className="utility-panel__body">
        {mistakes.length === 0 ? (
          <p className="utility-panel__empty">暂无错题记录，继续练习后会在这里汇总。</p>
        ) : (
          <>
            <p className="utility-panel__hint">按错误次数排序，优先复习最容易出错的假名。</p>
            <ul className="mistake-list">
              {mistakes
                .slice()
                .sort((left, right) => right.count - left.count || right.lastMistakeAt - left.lastMistakeAt)
                .slice(0, 12)
                .map((mistake) => (
                  <li key={`${mistake.kanaText}-${mistake.expectedRomaji}`} className="mistake-list__item">
                    <strong>{mistake.kanaText}</strong>
                    <span>{mistake.expectedRomaji}</span>
                    <span>{mistake.count} 次</span>
                  </li>
                ))}
            </ul>
            <button type="button" className="primary-button" onClick={onStartReview}>
              开始错题复习
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
