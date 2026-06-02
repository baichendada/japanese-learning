import type { KanaTrainerState } from '../../app/KanaTrainer';
import { findKanaByText, getKanaRow } from '../../core/learning-content/kanaCatalog';

import type { KanaRowName } from '../../core/learning-content/model';

const ROWS_WITH_TABLE = new Set<KanaRowName>(['a', 'ka', 'sa', 'ta', 'na', 'ha', 'ma', 'ya', 'ra', 'wa']);

interface KanaHelperProps {
  readonly state: KanaTrainerState;
}

export function KanaHelper({ state }: KanaHelperProps) {
  const prompt = state.session.prompts[state.session.currentPromptIndex];
  const kana = findKanaByText(prompt.kanaText);

  if (kana === undefined) {
    return null;
  }

  const rowKana = ROWS_WITH_TABLE.has(kana.row) ? getKanaRow(kana.script, kana.row) : [];

  return (
    <section className="kana-helper" aria-label="假名提示">
      <div className="kana-helper__focus">
        <span className="kana-helper__kana">{kana.text}</span>
        <span className="kana-helper__romaji">{prompt.romaji}</span>
      </div>

      {rowKana.length > 0 ? (
        <table className="kana-helper__table" aria-label={`${formatScript(kana.script)} ${kana.row} 行`}>
          <tbody>
            <tr>
              {rowKana.map((rowItem) => (
                <th key={rowItem.id} scope="col">
                  {rowItem.text}
                </th>
              ))}
            </tr>
            <tr>
              {rowKana.map((rowItem) => (
                <td key={`${rowItem.id}-romaji`}>{rowItem.romaji}</td>
              ))}
            </tr>
          </tbody>
        </table>
      ) : null}
    </section>
  );
}

function formatScript(script: string): string {
  return script === 'hiragana' ? '平假名' : '片假名';
}
