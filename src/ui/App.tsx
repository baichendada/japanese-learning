import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { KanaTrainer } from '../app/KanaTrainer';
import type { KanaTrainerState } from '../app/KanaTrainer';
import type { ProgressSettings } from '../core/progress/model';
import { BrowserClock } from '../web/adapters/BrowserClock';
import { BrowserFilePort } from '../web/adapters/BrowserFilePort';
import { LocalStorageProgressRepository } from '../web/adapters/LocalStorageProgressRepository';
import { WebAudioService } from '../web/adapters/WebAudioService';
import { ConfusionPanel } from './components/ConfusionPanel';
import { Dashboard } from './components/Dashboard';
import { KanaChartPanel } from './components/KanaChartPanel';
import { KanaHelper } from './components/KanaHelper';
import { KanaLine } from './components/KanaLine';
import { LevelDrawer } from './components/LevelDrawer';
import { LevelInfoBar } from './components/LevelInfoBar';
import { MistakePanel } from './components/MistakePanel';
import { ResultDialog } from './components/ResultDialog';
import { SettingsPanel } from './components/SettingsPanel';
import { TopToolbar, type ToolbarAction } from './components/TopToolbar';

export function App() {
  const audioService = useMemo(() => new WebAudioService(), []);
  const trainer = useMemo(
    () => new KanaTrainer(new LocalStorageProgressRepository(), audioService, new BrowserClock()),
    [audioService],
  );
  const filePort = useMemo(() => new BrowserFilePort(), []);
  const [state, setState] = useState<KanaTrainerState>();
  const [loadError, setLoadError] = useState<string>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confusionOpen, setConfusionOpen] = useState(false);
  const [kanaChartOpen, setKanaChartOpen] = useState(false);
  const [mistakeOpen, setMistakeOpen] = useState(false);
  const [toolbarMessage, setToolbarMessage] = useState<string>();
  const [isFullscreen, setIsFullscreen] = useState(false);
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

  useEffect(() => {
    if (toolbarMessage === undefined) {
      return;
    }

    const timer = window.setTimeout(() => setToolbarMessage(undefined), 3200);

    return () => window.clearTimeout(timer);
  }, [toolbarMessage]);

  const applyState = useCallback((nextState: KanaTrainerState) => {
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  const startPractice = useCallback(async () => {
    const current = stateRef.current;

    if (current === undefined || current.status === 'running') {
      return;
    }

    if (current.status === 'paused') {
      applyState(trainer.resume());
      return;
    }

    const nextState =
      current.status === 'ready' || current.status === 'passed' ? await trainer.start() : await trainer.restart();
    setVisibleInput('');
    applyState(nextState);
  }, [applyState, trainer]);

  const restartPractice = useCallback(async () => {
    const current = stateRef.current;

    if (current === undefined || current.status === 'ready') {
      return;
    }

    const nextState = await trainer.restart();
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
      setVisibleInput(nextState.session.currentInput);
      applyState(nextState);
    },
    [applyState, trainer],
  );

  const backspaceInput = useCallback(() => {
    const current = stateRef.current;

    if (current === undefined || current.status !== 'running') {
      return;
    }

    const nextState = trainer.backspace();
    setVisibleInput(nextState.session.currentInput);
    applyState(nextState);
  }, [applyState, trainer]);

  const pauseIfRunning = useCallback(() => {
    const current = stateRef.current;

    if (current?.status !== 'running') {
      return;
    }

    applyState(trainer.pause());
  }, [applyState, trainer]);

  const handleSelectLevel = useCallback(
    async (levelId: Parameters<typeof trainer.changeLevel>[0]) => {
      try {
        const nextState = await trainer.changeLevel(levelId);
        setVisibleInput('');
        applyState(nextState);
      } catch (error: unknown) {
        setToolbarMessage(error instanceof Error ? error.message : '无法切换关卡');
      }
    },
    [applyState, trainer],
  );

  const handleSettingsChange = useCallback(
    async (settings: ProgressSettings) => {
      const nextState = await trainer.updateSettings(settings);
      applyState(nextState);
    },
    [applyState, trainer],
  );

  const handleExportProgress = useCallback(async () => {
    const current = stateRef.current;

    if (current === undefined) {
      return;
    }

    try {
      await filePort.exportJson(current.progress, 'kana50-progress.json');
      setToolbarMessage('进度已导出');
    } catch (error: unknown) {
      setToolbarMessage(error instanceof Error ? error.message : '导出失败');
    }
  }, [filePort]);

  const handleImportProgress = useCallback(async () => {
    try {
      const imported = await filePort.importJson();
      const nextState = await trainer.importProgress(JSON.stringify(imported));
      setVisibleInput('');
      applyState(nextState);
      setToolbarMessage('进度已导入');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '导入失败';

      if (message !== 'No file selected') {
        setToolbarMessage(message);
      }
    }
  }, [applyState, filePort, trainer]);

  const handleStartMistakeReview = useCallback(async () => {
    try {
      const nextState = await trainer.startMistakeReview();
      setVisibleInput('');
      applyState(nextState);
      setMistakeOpen(false);
    } catch (error: unknown) {
      setToolbarMessage(error instanceof Error ? error.message : '无法开始错题复习');
    }
  }, [applyState, trainer]);

  const handleStartConfusionPractice = useCallback(async () => {
    try {
      const nextState = await trainer.startConfusionPractice();
      setVisibleInput('');
      applyState(nextState);
      setConfusionOpen(false);
    } catch (error: unknown) {
      setToolbarMessage(error instanceof Error ? error.message : '无法开始易混淆练习');
    }
  }, [applyState, trainer]);

  const handleToolbarAction = useCallback(
    (action: ToolbarAction) => {
      switch (action) {
        case 'kanaChart':
          setKanaChartOpen(true);
          return;
        case 'confusion':
          setConfusionOpen(true);
          return;
        case 'mistakes':
          setMistakeOpen(true);
          return;
        case 'export':
          void handleExportProgress();
          return;
        case 'import':
          void handleImportProgress();
          return;
        case 'settings':
          setSettingsOpen(true);
          return;
        case 'fullscreen':
          if (document.fullscreenElement !== null) {
            void document.exitFullscreen?.().catch(() => {
              setToolbarMessage('无法退出全屏');
            });
            return;
          }

          void document.documentElement.requestFullscreen?.().catch(() => {
            setToolbarMessage('当前浏览器不支持全屏');
          });
          return;
      }
    },
    [handleExportProgress, handleImportProgress],
  );

  const handlePlayKana = useCallback(
    (kanaText: string) => {
      void audioService.playKana(kanaText);
    },
    [audioService],
  );

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement !== null);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isInteractiveTarget(event.target)) {
        return;
      }

      if (event.key === 'Tab') {
        if (stateRef.current?.status === 'running') {
          event.preventDefault();
          void restartPractice();
        }

        return;
      }

      if (event.code === 'Space' || event.key === ' ') {
        event.preventDefault();
        void startPractice();
        return;
      }

      if (event.key === 'Backspace') {
        event.preventDefault();
        backspaceInput();
        return;
      }

      if (event.key.length === 1 && /^[a-z]$/i.test(event.key)) {
        event.preventDefault();
        void typeCharacter(event.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [backspaceInput, restartPractice, startPractice, typeCharacter]);

  useEffect(() => {
    const handleBlur = () => pauseIfRunning();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        pauseIfRunning();
      }
    };

    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pauseIfRunning]);

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
    <main className={`practice-page${isFullscreen ? ' practice-page--fullscreen' : ''}`}>
      {!isFullscreen ? (
        <div className="practice-page__header">
          <Dashboard state={state} />
          <TopToolbar isFullscreen={isFullscreen} onAction={handleToolbarAction} />
        </div>
      ) : null}

      {isFullscreen ? (
        <button
          type="button"
          className="fullscreen-exit"
          aria-label="退出全屏"
          onClick={() => void document.exitFullscreen?.()}
        >
          退出全屏
        </button>
      ) : null}

      {toolbarMessage !== undefined ? (
        <p className="practice-page__toast" role="status">
          {toolbarMessage}
        </p>
      ) : null}

      <section className="type-area-main" aria-label="打字练习" onClick={handleStageClick(startPractice)}>
        <div className="type-area">
          <KanaLine state={state} visibleInput={visibleInput} onStart={startPractice} />
        </div>
        <LevelInfoBar state={state} onOpenLevels={() => setDrawerOpen(true)} />
        {state.progress.settings.helperVisible ? <KanaHelper state={state} /> : null}
      </section>

      <LevelDrawer
        currentLevel={state.currentLevel}
        open={drawerOpen}
        progress={state.progress}
        onClose={() => setDrawerOpen(false)}
        onSelectLevel={(levelId) => void handleSelectLevel(levelId)}
      />
      <SettingsPanel
        open={settingsOpen}
        settings={state.progress.settings}
        onClose={() => setSettingsOpen(false)}
        onChange={(settings) => void handleSettingsChange(settings)}
      />
      <ConfusionPanel
        open={confusionOpen}
        onClose={() => setConfusionOpen(false)}
        onStartPractice={() => {
          void handleStartConfusionPractice();
        }}
      />
      <KanaChartPanel
        open={kanaChartOpen}
        onClose={() => setKanaChartOpen(false)}
        onPlayKana={handlePlayKana}
      />
      <MistakePanel
        open={mistakeOpen}
        mistakes={state.progress.mistakeStats}
        onClose={() => setMistakeOpen(false)}
        onStartReview={() => void handleStartMistakeReview()}
      />
      <ResultDialog state={state} onRestart={startPractice} onNextLevel={startPractice} />
    </main>
  );
}

function handleStageClick(startPractice: () => Promise<void>) {
  return (event: MouseEvent<HTMLElement>) => {
    if (event.target instanceof HTMLButtonElement) {
      return;
    }

    void startPractice();
  };
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  return (
    target.closest(
      [
        'button',
        'a[href]',
        'input',
        'select',
        'textarea',
        'summary',
        '[contenteditable="true"]',
        '[role="button"]',
        '[role="link"]',
        '[role="menuitem"]',
        '[role="option"]',
        '[role="tab"]',
        '[role="switch"]',
        '[role="checkbox"]',
      ].join(','),
    ) !== null
  );
}
