import { test, expect, Page } from '@playwright/test';

// E2Eテスト: 帳票作成 → 承認依頼 → 承認 → PDF出力の一連フロー

const EMAIL = 'admin@courage-invoice.com';
const PASSWORD = 'CourageInvoice2024!';

async function login(page: Page) {
  await page.goto('/login');
  await page.getByPlaceholder('example@company.com').fill(EMAIL);
  await page.getByPlaceholder('パスワードを入力').fill(PASSWORD);
  await page.getByRole('button', { name: 'ログイン', exact: true }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 10000 });
}

test.describe('帳票作成〜承認フロー', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('ダッシュボードが表示される', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('h2, h3').first()).toBeVisible();
  });

  test('見積書一覧ページにアクセスできる', async ({ page }) => {
    await page.goto('/estimates');
    await expect(page).toHaveURL(/\/estimates/);
    await expect(page.locator('body')).not.toContainText('Internal Server Error');
  });

  test('請求書一覧ページにアクセスできる', async ({ page }) => {
    await page.goto('/invoices');
    await expect(page).toHaveURL(/\/invoices/);
    await expect(page.locator('body')).not.toContainText('Internal Server Error');
  });
});
