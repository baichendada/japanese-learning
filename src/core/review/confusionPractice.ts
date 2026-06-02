import type { PracticePrompt } from '../practice/model';
import { findKanaByText } from '../learning-content/kanaCatalog';
import { levelId, type LevelId } from '../shared/ids';
import { shuffleReadonly } from '../learning-content/promptBuilder';

export interface ConfusionPair {
  readonly left: string;
  readonly right: string;
  readonly note: string;
}

export interface ConfusionPractice {
  readonly levelId: LevelId;
  readonly prompts: readonly PracticePrompt[];
}

export const confusionPracticeLevelId = levelId('practice-confusion');

export const confusionPairs: readonly ConfusionPair[] = Object.freeze([
  Object.freeze({ left: 'し', right: 'ち', note: '竖笔与横折位置不同' }),
  Object.freeze({ left: 'さ', right: 'き', note: '注意左偏旁写法' }),
  Object.freeze({ left: 'ぬ', right: 'め', note: '右下圈与点位置' }),
  Object.freeze({ left: 'は', right: 'ほ', note: '右侧笔画数量' }),
  Object.freeze({ left: 'ア', right: 'マ', note: '片假名横竖比例' }),
  Object.freeze({ left: 'ソ', right: 'ン', note: '撇的方向与位置' }),
]);

export function createConfusionPractice(): ConfusionPractice {
  const kanaTexts = [...new Set(confusionPairs.flatMap((pair) => [pair.left, pair.right]))];
  const prompts = shuffleReadonly(
    kanaTexts.map((kanaText) => {
      const kana = findKanaByText(kanaText);

      if (kana === undefined) {
        throw new Error(`Unknown confusion kana: ${kanaText}`);
      }

      return Object.freeze({ kanaText, romaji: kana.romaji });
    }),
  );

  return Object.freeze({
    levelId: confusionPracticeLevelId,
    prompts,
  });
}
