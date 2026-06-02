import { confusionPairs } from '../../core/review/confusionPractice';

interface ConfusionPanelProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onStartPractice: () => void;
}

export function ConfusionPanel({ open, onClose, onStartPractice }: ConfusionPanelProps) {
  if (!open) {
    return null;
  }

  return (
    <aside className="utility-panel" role="dialog" aria-modal="true" aria-label="易混淆假名">
      <div className="utility-panel__header">
        <h2>易混淆假名</h2>
        <button type="button" className="icon-text-button" aria-label="关闭易混淆假名" onClick={onClose}>
          关闭
        </button>
      </div>

      <div className="utility-panel__body">
        <p className="utility-panel__hint">对照相似字形，打字时先确认当前假名再输入。</p>
        <ul className="confusion-list">
          {confusionPairs.map((pair) => (
            <li key={`${pair.left}-${pair.right}`} className="confusion-list__item">
              <div className="confusion-list__pair">
                <span>{pair.left}</span>
                <span>vs</span>
                <span>{pair.right}</span>
              </div>
              <p>{pair.note}</p>
            </li>
          ))}
        </ul>
        <button type="button" className="primary-button" onClick={onStartPractice}>
          开始易混淆练习
        </button>
      </div>
    </aside>
  );
}
