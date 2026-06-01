import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

test('learner can open practice, start with Space, type, and inspect levels', async ({ page }) => {
  await loadKaRowProgress(page);
  await page.goto('/');

  await expect(page.getByText('kana50.com')).toBeVisible();
  await expect(page.getByText('按空格开始')).toBeVisible();
  await expect(page.getByRole('region', { name: '假名提示' })).toContainText('か');

  await page.keyboard.press('Space');

  await expect(page.getByText('练习中')).toBeVisible();
  await expect(page.getByLabel('当前假名 か')).toBeVisible();

  await page.keyboard.press('k');

  await expect(page.getByLabel('当前输入')).toHaveText('k');

  await page.getByRole('button', { name: '切换关卡' }).click();

  await expect(page.getByRole('dialog', { name: '关卡列表' })).toBeVisible();
  await expect(page.getByText('平假名 - 基础')).toBeVisible();
});

test('Space activates focused level controls without starting practice globally', async ({ page }) => {
  await page.goto('/');

  const levelSwitch = page.getByRole('button', { name: '切换关卡' });
  await expect(levelSwitch).toBeVisible();
  await levelSwitch.focus();
  await page.keyboard.press('Space');

  await expect(page.getByRole('dialog', { name: '关卡列表' })).toBeVisible();
  await expect(page.getByText('预备')).toBeVisible();
  await expect(page.getByText('练习中')).not.toBeVisible();
});

test('Tab restarts the active practice session with a clean prompt', async ({ page }) => {
  await loadKaRowProgress(page);
  await page.goto('/');
  await expect(page.getByText('按空格开始')).toBeVisible();

  await page.keyboard.press('Space');
  await expect(page.getByText('练习中')).toBeVisible();

  await page.keyboard.press('k');
  await expect(page.getByLabel('当前输入')).toHaveText('k');

  await page.keyboard.press('Tab');

  await expect(page.getByText('练习中')).toBeVisible();
  await expect(page.getByLabel('当前假名 か')).toBeVisible();
  await expect(page.getByLabel('当前输入')).toHaveText('等待输入');
});

test('Tab in the result dialog focuses retry without restarting practice', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('按空格开始')).toBeVisible();

  await page.keyboard.press('Space');
  await expect(page.getByText('练习中')).toBeVisible();
  await failCurrentPrompt(page);

  const resultDialog = page.getByRole('dialog', { name: '本关未通过' });
  await expect(resultDialog).toBeVisible();

  await page.keyboard.press('Tab');

  const retryButton = page.getByRole('button', { name: '重试本关' });
  await expect(resultDialog).toBeVisible();
  await expect(retryButton).toBeFocused();
  await expect(page.getByText('练习中')).not.toBeVisible();
});

test('Tab on a focused control does not restart the running practice session', async ({ page }) => {
  await loadKaRowProgress(page);
  await page.goto('/');
  await expect(page.getByText('按空格开始')).toBeVisible();

  await page.keyboard.press('Space');
  await expect(page.getByText('练习中')).toBeVisible();
  await page.keyboard.press('k');
  await expect(page.getByLabel('当前输入')).toHaveText('k');

  const toolbarButton = page.getByRole('button', { name: '自学' });
  await toolbarButton.focus();
  await expect(toolbarButton).toBeFocused();
  await page.keyboard.press('Tab');

  await expect(page.getByText('练习中')).toBeVisible();
  await expect(page.getByLabel('当前假名 か')).toBeVisible();
  await expect(page.getByLabel('当前输入')).toHaveText('k');
});

async function loadKaRowProgress(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'kana50-progress',
      JSON.stringify({
        schemaVersion: 1,
        activeCourseId: 'hiragana-basic',
        activeLevelId: 'hiragana-ka',
        levelResults: [],
        mistakeStats: [],
        settings: {
          keySoundEnabled: true,
          kanaSoundEnabled: true,
          helperVisible: true,
        },
      }),
    );
  });
}

async function failCurrentPrompt(page: Page) {
  await page.keyboard.press('x');
  await page.keyboard.press('y');
  await page.keyboard.press('z');
  await page.keyboard.press('q');
}
