import { useMemo, useState } from 'react';
import { buildKanaChart } from '../../core/learning-content/kanaChart';
import type { KanaChartItem } from '../../core/learning-content/kanaChartCatalog';
import type { KanaScript } from '../../core/learning-content/model';

interface KanaChartPanelProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onPlayKana: (kanaText: string) => void;
}

export function KanaChartPanel({ open, onClose, onPlayKana }: KanaChartPanelProps) {
  const [script, setScript] = useState<KanaScript>('hiragana');
  const [activeKanaId, setActiveKanaId] = useState<string>();
  const chart = useMemo(() => buildKanaChart(script), [script]);

  if (!open) {
    return null;
  }

  const handlePlay = (kana: KanaChartItem) => {
    setActiveKanaId(kana.id);
    onPlayKana(kana.text);
  };

  return (
    <div className="level-drawer-layer">
      <button type="button" className="level-drawer-layer__backdrop" aria-label="关闭五十音表" onClick={onClose} />
      <aside
        className="utility-panel utility-panel--wide"
        role="dialog"
        aria-modal="true"
        aria-label="五十音表"
      >
      <div className="utility-panel__header">
        <h2>50音</h2>
        <button type="button" className="icon-text-button" aria-label="关闭五十音表" onClick={onClose}>
          关闭
        </button>
      </div>

      <div className="utility-panel__body">
        <p className="utility-panel__hint">点击假名即可播放读音，对照罗马音快速识记五十音。</p>

        <div className="kana-chart__script-toggle" role="tablist" aria-label="假名类型">
          <button
            type="button"
            role="tab"
            className={`kana-chart__script-button${script === 'hiragana' ? ' kana-chart__script-button--active' : ''}`}
            aria-selected={script === 'hiragana'}
            onClick={() => setScript('hiragana')}
          >
            平假名
          </button>
          <button
            type="button"
            role="tab"
            className={`kana-chart__script-button${script === 'katakana' ? ' kana-chart__script-button--active' : ''}`}
            aria-selected={script === 'katakana'}
            onClick={() => setScript('katakana')}
          >
            片假名
          </button>
        </div>

        {chart.sections.map((section) => (
          <section key={section.title} className="kana-chart__section" aria-label={section.title}>
            <h3 className="kana-chart__section-title">{section.title}</h3>

            <div className="kana-chart__table-wrap">
              <table className="kana-chart__table">
                <thead>
                  <tr>
                    <th scope="col" className="kana-chart__corner">
                      行 / 音
                    </th>
                    {section.columnHeaders.map((header, headerIndex) => (
                      <th key={`${section.title}-${headerIndex}`} scope="col">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.rows.map((row) => (
                    <tr key={`${section.title}-${row.label}`}>
                      <th scope="row" className="kana-chart__row-label">
                        {row.label}
                      </th>
                      {row.cells.map((kana, index) => (
                        <td key={`${section.title}-${row.label}-${index}`}>
                          {kana === null ? (
                            <span className="kana-chart__empty" aria-hidden="true" />
                          ) : (
                            <KanaChartCell
                              kana={kana}
                              active={activeKanaId === kana.id}
                              onPlay={handlePlay}
                            />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {section.standaloneN ? (
              <div className="kana-chart__standalone">
                <KanaChartCell
                  kana={section.standaloneN}
                  active={activeKanaId === section.standaloneN.id}
                  onPlay={handlePlay}
                />
              </div>
            ) : null}
          </section>
        ))}
      </div>
      </aside>
    </div>
  );
}

function KanaChartCell({
  kana,
  active,
  onPlay,
}: {
  readonly kana: KanaChartItem;
  readonly active: boolean;
  readonly onPlay: (kana: KanaChartItem) => void;
}) {
  return (
    <button
      type="button"
      className={`kana-chart__cell${active ? ' kana-chart__cell--active' : ''}`}
      aria-label={`播放 ${kana.text} ${kana.romaji}`}
      onClick={() => onPlay(kana)}
    >
      <span className="kana-chart__glyph">{kana.text}</span>
      <span className="kana-chart__romaji">{kana.romaji}</span>
    </button>
  );
}
