import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createEmptyProgress } from '../../src/core/progress/progress';
import { levelId } from '../../src/core/shared/ids';
import { App } from '../../src/ui/App';

describe('practice page', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('opens directly into the active kana practice level after async load', async () => {
    render(<App />);

    expect(await screen.findByText('预备')).toBeInTheDocument();
    expect(screen.getByText('kana50.com')).toBeInTheDocument();
    expect(screen.getByText('あ行')).toBeInTheDocument();
    expect(screen.getByText('按空格开始')).toBeInTheDocument();
  });

  test('loads a saved active kana level from local progress', async () => {
    localStorage.setItem(
      'kana50-progress',
      JSON.stringify({
        ...createEmptyProgress(),
        activeLevelId: levelId('hiragana-ka'),
      }),
    );

    render(<App />);

    expect(await screen.findByText('预备')).toBeInTheDocument();
    expect(screen.getByText('か行')).toBeInTheDocument();
    expect(screen.getByRole('table', { name: '平假名 ka 行' })).toBeInTheDocument();
  });

  test('opens the level drawer from the level switch', async () => {
    render(<App />);

    const switchButton = await screen.findByRole('button', { name: '切换关卡' });
    fireEvent.click(switchButton);

    const drawer = screen.getByRole('dialog', { name: '关卡列表' });

    expect(drawer).toBeInTheDocument();
    expect(within(drawer).getByText('平假名 - 基础')).toBeInTheDocument();
    expect(within(drawer).getByText('あ行')).toBeInTheDocument();
    expect(within(drawer).getByText('あ行复习')).toBeInTheDocument();
    expect(within(drawer).getByText('か行')).toBeInTheDocument();
  });

  test('pressing Space starts practice and marks the kana line active', async () => {
    render(<App />);
    await screen.findByText('预备');

    fireEvent.keyDown(window, { key: ' ', code: 'Space' });

    expect(await screen.findByText('练习中')).toBeInTheDocument();
    expect(screen.getByLabelText('当前假名 あ')).toBeInTheDocument();
  });

  test('clicking the main practice stage starts practice', async () => {
    render(<App />);
    await screen.findByText('预备');

    fireEvent.click(screen.getByRole('region', { name: '打字练习' }));

    expect(await screen.findByText('练习中')).toBeInTheDocument();
    expect(screen.getByLabelText('当前假名 あ')).toBeInTheDocument();
  });

  test('typing the first romaji character after start updates the visible input', async () => {
    render(<App />);
    await screen.findByText('预备');

    fireEvent.keyDown(window, { key: ' ', code: 'Space' });
    await screen.findByText('练习中');
    fireEvent.keyDown(window, { key: 'a', code: 'KeyA' });

    await waitFor(() => expect(screen.getByLabelText('当前输入')).toHaveTextContent('a'));
  });

  test('shows right-top toolbar practice entries', async () => {
    render(<App />);

    expect(await screen.findByRole('button', { name: '自学' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '易混淆' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '错题' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '导出' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '导入' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '设置' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '全屏' })).toBeInTheDocument();
  });
});
