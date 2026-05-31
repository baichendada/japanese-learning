import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KanaTrainer } from '../app/KanaTrainer';
import type { KanaTrainerState } from '../app/KanaTrainer';
import { BrowserClock } from '../web/adapters/BrowserClock';
import { LocalStorageProgressRepository } from '../web/adapters/LocalStorageProgressRepository';
import { WebAudioService } from '../web/adapters/WebAudioService';
import { Dashboard } from './components/Dashboard';
import { KanaHelper } from './components/KanaHelper';
import { KanaLine } from './components/KanaLine';
import { LevelDrawer } from './components/LevelDrawer';
import { ResultDialog } from './components/ResultDialog';
import { TopToolbar } from './components/TopToolbar';

export function App() {
  const trainer = useMemo(
    () => new KanaTrainer(new LocalStorageProgressRepository(), new WebAudioService(), new BrowserClock()),
    [],
  );
  const [state, setState] = useState<KanaTrainerState>();
  const [loadError, setLoadError] = useState<string>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [visibleInput, setVisibleInput] = useState('');
  const stateRef = useRef<KanaTrainerState | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    trainer
      .load()
      .then((loadedState) => {
        if (cancelled) {
          return;
        }

        stateRef.current = loadedState;
        setState(loadedState);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setLoadError(error instanceof Error ? error.message : '未知错误');
      });

    return () => {
      cancelled = true;
    };
  }, [trainer]);

  const applyState = useCallback((nextState: KanaTrainerState) => {
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  const startPractice = useCallback(async () => {
    const current = stateRef.current;

    if (current === undefined || current.status === 'running') {
      return;
    }

    const nextState = current.status === 'ready' ? await trainer.start() : await trainer.restart();
    setVisibleInput('');
    applyState(nextState);
  }, [applyState, trainer]);

  const typeCharacter = useCallback(
    async (character: string) => {
      const current = stateRef.current;

      if (current === undefined || current.status !== 'running') {
        return;
      }

      const typedCharacter = character.toLowerCase();
      const nextState = await trainer.typeCharacter(typedCharacter);
      setVisibleInput(nextState.session.currentInput || typedCharacter);
      applyState(nextState);
    },
    [applyState, trainer],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      if (event.code === 'Space' || event.key === ' ') {
        event.preventDefault();
        void startPractice();
        return;
      }

      if (event.key.length === 1 && /^[a-z]$/i.test(event.key)) {
        event.preventDefault();
        void typeCharacter(event.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startPractice, typeCharacter]);

  if (loadError !== undefined) {
    return (
      <main className="practice-page practice-page--loading">
        <h1>kana50.com</h1>
        <p role="alert">加载失败：{loadError}</p>
      </main>
    );
  }

  if (state === undefined) {
    return (
      <main className="practice-page practice-page--loading">
        <h1>kana50.com</h1>
        <p>加载练习进度...</p>
      </main>
    );
  }

  return (
    <main className="practice-page">
      <div className="practice-page__top">
        <Dashboard state={state} onOpenLevels={() => setDrawerOpen(true)} />
        <TopToolbar />
      </div>

      <section className="practice-stage" aria-label="打字练习">
        <KanaLine state={state} visibleInput={visibleInput} onStart={startPractice} />
        <KanaHelper state={state} />
      </section>

      <LevelDrawer
        currentLevel={state.currentLevel}
        open={drawerOpen}
        progress={state.progress}
        onClose={() => setDrawerOpen(false)}
      />
      <ResultDialog state={state} onRestart={startPractice} />
    </main>
  );
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}
