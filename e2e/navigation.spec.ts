import { test, expect, Page } from '@playwright/test';

const EMAIL = 'admin@courage-invoice.com';
const PASSWORD = 'CourageInvoice2024!';

async function login(page: Page) {
  await page.goto('/login');
  await page.getByPlaceholder('example@company.com').fill(EMAIL);
  await page.getByPlaceholder('パスワードを入力').fill(PASSWORD);
  await page.getByRole('button', { name: 'ログイン' }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 10000 });
}

test.describe('ナビゲーション', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('請求書一覧ページが表示される', async ({ page }) => {
    await page.goto('/invoices');
    await expect(page).toHaveURL(/\/invoices/);
    // ページがエラーなく読み込まれることを確認
    await expect(page.locator('body')).not.toContainText('Internal Server Error');
  });

  test('見積書一覧ページが表示される', async ({ page }) => {
    await page.goto('/estimates');
    await expect(page).toHaveURL(/\/estimates/);
    await expect(page.locator('body')).not.toContainText('Internal Server Error');
  });

  test('取引先一覧ページが表示される', async ({ page }) => {
    await page.goto('/clients');
    await expect(page).toHaveURL(/\/clients/);
    await expect(page.locator('body')).not.toContainText('Internal Server Error');
  });

  test('ヘルスチェックAPIが正常応答する', async ({ page }) => {
    const res = await page.request.get('/api/health');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });
});
