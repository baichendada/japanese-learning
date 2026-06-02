import { fireEvent, render, screen, waitFor, within, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createEmptyProgress } from '../../src/core/progress/progress';
import { levelId } from '../../src/core/shared/ids';
import { App } from '../../src/ui/App';
import { WebAudioService } from '../../src/web/adapters/WebAudioService';

describe('practice page', () => {
  beforeEach(() => {
    installLocalStorageMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('opens directly into the active kana practice level after async load', async () => {
    render(<App />);

    expect(await screen.findByText('预备')).toBeInTheDocument();
    expect(screen.getByText('kana50.com')).toBeInTheDocument();
    expect(screen.getByText(/1\/20 あ行/)).toBeInTheDocument();
    expect(screen.getByText('点击或按空格开始输入')).toBeInTheDocument();
  });

  test('loads a saved active kana level from local progress', async () => {
    saveActiveLevel('hiragana-ka');

    render(<App />);

    expect(await screen.findByText('预备')).toBeInTheDocument();
    expect(screen.getByText(/3\/20 か行/)).toBeInTheDocument();
    expect(screen.getByRole('table', { name: '平假名 ka 行' })).toBeInTheDocument();
  });

  test('opens the level drawer from the level switch', async () => {
    render(<App />);

    const switchButton = await screen.findByRole('button', { name: '切换关卡' });
    fireEvent.click(switchButton);

    const drawer = screen.getByRole('dialog', { name: '关卡列表' });

    expect(drawer).toBeInTheDocument();
    expect(within(drawer).getByLabelText('选择课程')).toBeInTheDocument();
    expect(within(drawer).getByRole('button', { name: '选择关卡 あ行' })).toBeInTheDocument();
  });

  test('switches course in the drawer and selects a katakana level', async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: '切换关卡' }));

    const drawer = screen.getByRole('dialog', { name: '关卡列表' });
    fireEvent.change(within(drawer).getByLabelText('选择课程'), { target: { value: 'katakana-basic' } });
    fireEvent.click(within(drawer).getByRole('button', { name: '选择关卡 ア行' }));

    expect(await screen.findByText('1/20 ア行')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: '关卡列表' })).not.toBeInTheDocument();
  });

  test('pressing Space starts practice and marks the kana line active', async () => {
    render(<App />);
    await screen.findByText('预备');

    fireEvent.keyDown(window, { key: ' ', code: 'Space' });

    expect(await screen.findByText('挑战中')).toBeInTheDocument();
    expect(screen.getByLabelText('当前假名 あ')).toBeInTheDocument();
  });

  test('shows running status as challenging in the dashboard', async () => {
    render(<App />);
    await screen.findByText('预备');

    fireEvent.keyDown(window, { key: ' ', code: 'Space' });

    expect(await screen.findByText('挑战中')).toBeInTheDocument();
  });

  test('Space on the focused level switch opens the drawer without starting practice', async () => {
    render(<App />);

    const switchButton = await screen.findByRole('button', { name: '切换关卡' });
    switchButton.focus();
    fireEvent.keyDown(switchButton, { key: ' ', code: 'Space' });
    fireEvent.keyUp(switchButton, { key: ' ', code: 'Space' });
    fireEvent.click(switchButton);

    expect(await screen.findByRole('dialog', { name: '关卡列表' })).toBeInTheDocument();
    expect(screen.getByText('预备')).toBeInTheDocument();
    expect(screen.queryByText('挑战中')).not.toBeInTheDocument();
  });

  test('Space on a focused toolbar button does not start practice', async () => {
    render(<App />);

    const toolbarButton = await screen.findByRole('button', { name: '设置' });
    toolbarButton.focus();
    fireEvent.keyDown(toolbarButton, { key: ' ', code: 'Space' });
    fireEvent.keyUp(toolbarButton, { key: ' ', code: 'Space' });

    await expect(screen.findByText('挑战中', undefined, { timeout: 250 })).rejects.toThrow();
    expect(screen.getByText('预备')).toBeInTheDocument();
  });

  test('clicking the main practice stage starts practice', async () => {
    render(<App />);
    await screen.findByText('预备');

    fireEvent.click(screen.getByRole('region', { name: '打字练习' }));

    expect(await screen.findByText('挑战中')).toBeInTheDocument();
    expect(screen.getByLabelText('当前假名 あ')).toBeInTheDocument();
  });

  test('typing the first romaji character after start updates the visible input', async () => {
    saveActiveLevel('hiragana-ka');
    render(<App />);
    await screen.findByText('预备');

    fireEvent.keyDown(window, { key: ' ', code: 'Space' });
    await screen.findByText('挑战中');
    fireEvent.keyDown(window, { key: 'k', code: 'KeyK' });

    await waitFor(() => expect(screen.getByLabelText('当前输入')).toHaveTextContent('k'));
  });

  test('shows a continue-typing hint after a wrong romaji input', async () => {
    render(<App />);
    await screen.findByText('预备');

    fireEvent.keyDown(window, { key: ' ', code: 'Space' });
    await screen.findByText('挑战中');
    fireEvent.keyDown(window, { key: 'b', code: 'KeyB' });

    expect(await screen.findByText('输入有误，请继续输入正确罗马音，或按退格键修改')).toBeInTheDocument();
    expect(screen.getByLabelText('当前输入')).toHaveTextContent('b');
    expect(screen.getByLabelText('当前输入').querySelector('.kana-line__input-char--error')).toHaveTextContent('b');
  });

  test('clears the continue-typing hint after recovering with the correct romaji', async () => {
    render(<App />);
    await screen.findByText('预备');

    fireEvent.keyDown(window, { key: ' ', code: 'Space' });
    await screen.findByText('挑战中');
    fireEvent.keyDown(window, { key: 'b', code: 'KeyB' });
    await screen.findByText('输入有误，请继续输入正确罗马音，或按退格键修改');
    fireEvent.keyDown(window, { key: 'a', code: 'KeyA' });

    await waitFor(() => {
      expect(document.querySelector('.kana-line__input-hint')).toHaveAttribute('aria-hidden', 'true');
    });
    expect(screen.getByLabelText('当前输入').querySelector('.kana-line__input-char--error')).toBeNull();
  });

  test('clears wrong input with Backspace so the user can retype', async () => {
    render(<App />);
    await screen.findByText('预备');

    fireEvent.keyDown(window, { key: ' ', code: 'Space' });
    await screen.findByText('挑战中');
    fireEvent.keyDown(window, { key: 'b', code: 'KeyB' });
    await screen.findByText('输入有误，请继续输入正确罗马音，或按退格键修改');
    fireEvent.keyDown(window, { key: 'Backspace' });

    await waitFor(() => {
      expect(screen.getByLabelText('当前输入')).toHaveTextContent('等待输入');
      expect(document.querySelector('.kana-line__input-hint')).toHaveAttribute('aria-hidden', 'true');
    });
  });

  test('completed ka-row prompt clears visible input and advances to the next kana', async () => {
    saveActiveLevel('hiragana-ka');
    render(<App />);
    await screen.findByText('预备');

    fireEvent.keyDown(window, { key: ' ', code: 'Space' });
    await screen.findByText('挑战中');
    fireEvent.keyDown(window, { key: 'k', code: 'KeyK' });
    await waitFor(() => expect(screen.getByLabelText('当前输入')).toHaveTextContent('k'));
    fireEvent.keyDown(window, { key: 'a', code: 'KeyA' });

    await waitFor(() => expect(screen.getByLabelText('当前假名 き')).toBeInTheDocument());
    expect(screen.getByLabelText('当前输入')).toHaveTextContent('等待输入');
  });

  test('failed result dialog can restart into a clean running session', async () => {
    render(<App />);
    await screen.findByText('预备');

    fireEvent.keyDown(window, { key: ' ', code: 'Space' });
    await screen.findByText('挑战中');
    fireEvent.keyDown(window, { key: 'x', code: 'KeyX' });
    fireEvent.keyDown(window, { key: 'y', code: 'KeyY' });
    fireEvent.keyDown(window, { key: 'z', code: 'KeyZ' });
    fireEvent.keyDown(window, { key: 'q', code: 'KeyQ' });

    expect(await screen.findByRole('dialog', { name: '本关未通过' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '重试本关' }));

    expect(await screen.findByText('挑战中')).toBeInTheDocument();
    expect(screen.getByLabelText('当前假名 あ')).toBeInTheDocument();
    expect(screen.getByLabelText('当前输入')).toHaveTextContent('等待输入');
  });

  test('shows right-top toolbar practice entries', async () => {
    render(<App />);

    expect(await screen.findByRole('button', { name: '50音' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '易混淆' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '错题' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '导出' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '导入' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '设置' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '全屏' })).toBeInTheDocument();
  });

  test('opens the kana chart panel and plays pronunciation on click', async () => {
    const playKana = vi.spyOn(WebAudioService.prototype, 'playKana').mockResolvedValue();

    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: '50音' }));

    const panel = screen.getByRole('dialog', { name: '五十音表' });
    expect(panel).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: '播放 あ a' })).toBeInTheDocument();

    fireEvent.click(within(panel).getByRole('button', { name: '播放 あ a' }));

    expect(playKana).toHaveBeenCalledWith('あ');
  });

  test('closes the kana chart panel when clicking the backdrop', async () => {
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: '50音' }));

    expect(screen.getByRole('dialog', { name: '五十音表' })).toBeInTheDocument();

    fireEvent.click(document.querySelector('.level-drawer-layer__backdrop')!);

    expect(screen.queryByRole('dialog', { name: '五十音表' })).not.toBeInTheDocument();
  });

  test('hides the header while fullscreen mode is active', async () => {
    render(<App />);
    await screen.findByText('预备');

    await act(async () => {
      Object.defineProperty(document, 'fullscreenElement', {
        configurable: true,
        value: document.documentElement,
      });
      document.dispatchEvent(new Event('fullscreenchange'));
    });

    await waitFor(() => {
      expect(document.querySelector('.practice-page')).toHaveClass('practice-page--fullscreen');
    });
    expect(screen.getByRole('button', { name: '退出全屏' })).toHaveClass('fullscreen-exit');
    expect(document.querySelector('.practice-page__header')).not.toBeInTheDocument();

    await act(async () => {
      Object.defineProperty(document, 'fullscreenElement', {
        configurable: true,
        value: null,
      });
      document.dispatchEvent(new Event('fullscreenchange'));
    });
  });
});

function saveActiveLevel(activeLevelId: string): void {
  localStorage.setItem(
    'kana50-progress',
    JSON.stringify({
      ...createEmptyProgress(),
      activeLevelId: levelId(activeLevelId),
    }),
  );
}

function installLocalStorageMock(): void {
  const store = new Map<string, string>();

  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => [...store.keys()][index] ?? null,
    get length() {
      return store.size;
    },
  });
}
