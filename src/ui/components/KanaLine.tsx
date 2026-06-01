import { useState } from 'react';
import type { MouseEvent } from 'react';
import type { KanaTrainerState } from '../../app/KanaTrainer';
import { isRomajiInputMismatch, splitRomajiInputForDisplay } from '../../core/practice/romajiInput';

interface KanaLineProps {
  readonly state: KanaTrainerState;
  readonly visibleInput: string;
  readonly onStart: () => void;
}

const TAB_TIP_STORAGE_KEY = 'kana50-tab-tip-dismissed';
const INPUT_HINT_TEXT = '输入有误，请继续输入正确罗马音，或按退格键修改';

export function KanaLine({ state, visibleInput, onStart }: KanaLineProps) {
  const active = state.status !== 'ready';
  const paused = state.status === 'paused';
  const frosted = state.status === 'ready' || paused;
  const currentIndex = state.session.currentPromptIndex;
  const currentPrompt = state.session.prompts[currentIndex];
  const inputActive = state.status === 'running' || state.status === 'paused';
  const inputMismatch =
    inputActive &&
    currentPrompt !== undefined &&
    isRomajiInputMismatch(visibleInput, currentPrompt.romaji);

  const handleFrostClick = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    onStart();
  };

  return (
    <div
      className={`kana-line ${active ? 'kana-line--active' : 'kana-line--preview'}${frosted ? ' kana-line--frosted' : ''}${paused ? ' kana-line--paused' : ''}`}
      aria-label="假名练习行"
    >
      <div className={`kana-line__stage${frosted ? ' kana-line__stage--frosted' : ''}`}>
        <div className="kana-line__sequence" aria-hidden={!active}>
          {state.currentLevel.kanaTexts.map((kanaText, index) => {
            const current = active && inputActive && index === currentIndex;

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

        {frosted ? (
          <div
            className="kana-line__frost"
            role="button"
            tabIndex={0}
            aria-label={paused ? '已暂停，点击或按空格继续' : '点击或按空格开始输入'}
            onClick={handleFrostClick}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.code === 'Space' || event.key === ' ') {
                event.preventDefault();
                onStart();
              }
            }}
          >
            <p className="kana-line__frost-action">
              {paused ? '已暂停，点击或按空格继续' : '点击或按空格开始输入'}
            </p>
            {!paused ? <p className="kana-line__frost-hint">在输入第一个字的时候，才会开始计时</p> : null}
            {paused ? <TabPracticeTip /> : null}
          </div>
        ) : null}
      </div>

      {!frosted ? (
        <div className="kana-line__input-wrap">
          <div className="kana-line__input" aria-label="当前输入" aria-invalid={inputMismatch || undefined}>
            {currentPrompt !== undefined ? (
              <RomajiInputDisplay input={visibleInput} expectedRomaji={currentPrompt.romaji} />
            ) : (
              <span className="kana-line__input-placeholder">等待输入</span>
            )}
          </div>
          <p
            className={`kana-line__input-hint${inputMismatch ? ' kana-line__input-hint--visible' : ''}`}
            role="status"
            aria-live="polite"
            aria-hidden={!inputMismatch}
          >
            {INPUT_HINT_TEXT}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function RomajiInputDisplay({
  input,
  expectedRomaji,
}: {
  readonly input: string;
  readonly expectedRomaji: string;
}) {
  if (input.length === 0) {
    return <span className="kana-line__input-placeholder">等待输入</span>;
  }

  const { validPart, errorPart } = splitRomajiInputForDisplay(input, expectedRomaji);

  return (
    <>
      {validPart.length > 0 ? <span className="kana-line__input-char">{validPart}</span> : null}
      {errorPart.length > 0 ? (
        <span className="kana-line__input-char kana-line__input-char--error">{errorPart}</span>
      ) : null}
    </>
  );
}

function TabPracticeTip() {
  const [dismissed, setDismissed] = useState(readTabTipDismissed);

  if (dismissed) {
    return null;
  }

  return (
    <div className="kana-line__tip" role="note" onClick={(event) => event.stopPropagation()}>
      <p className="kana-line__tip-text">
        练习时，使用 Tab 键可快速重置练习。通关成功后也可使用 Tab 键重复练习本关卡。
      </p>
      <button
        type="button"
        className="kana-line__tip-close"
        aria-label="关闭提示"
        onClick={(event) => {
          event.stopPropagation();
          writeTabTipDismissed();
          setDismissed(true);
        }}
      >
        ×
      </button>
    </div>
  );
}

function readTabTipDismissed(): boolean {
  try {
    return localStorage.getItem(TAB_TIP_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeTabTipDismissed(): void {
  try {
    localStorage.setItem(TAB_TIP_STORAGE_KEY, '1');
  } catch {
    // Ignore storage failures in restricted environments.
  }
}
