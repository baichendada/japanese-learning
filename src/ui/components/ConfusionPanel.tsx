interface ConfusionPair {
  readonly left: string;
  readonly right: string;
  readonly note: string;
}

const confusionPairs: readonly ConfusionPair[] = [
  { left: 'し', right: 'ち', note: '竖笔与横折位置不同' },
  { left: 'さ', right: 'き', note: '注意左偏旁写法' },
  { left: 'ぬ', right: 'め', note: '右下圈与点位置' },
  { left: 'は', right: 'ほ', note: '右侧笔画数量' },
  { left: 'ア', right: 'マ', note: '片假名横竖比例' },
  { left: 'ソ', right: 'ン', note: '撇的方向与位置' },
];

interface ConfusionPanelProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

export function ConfusionPanel({ open, onClose }: ConfusionPanelProps) {
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
      </div>
    </aside>
  );
}
