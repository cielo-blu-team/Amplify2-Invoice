import { test, expect, Page } from '@playwright/test';

// E2Eテスト: 取引先登録 → 帳票作成 → 見積書→請求書変換

const EMAIL = 'admin@courage-invoice.com';
const PASSWORD = 'CourageInvoice2024!';

async function login(page: Page) {
  await page.goto('/login');
  await page.getByPlaceholder('example@company.com').fill(EMAIL);
  await page.getByPlaceholder('パスワードを入力').fill(PASSWORD);
  await page.getByRole('button', { name: 'ログイン', exact: true }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 10000 });
}

test.describe('取引先〜帳票変換フロー', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('取引先一覧ページにアクセスできる', async ({ page }) => {
    await page.goto('/clients');
    await expect(page).toHaveURL(/\/clients/);
    await expect(page.locator('body')).not.toContainText('Internal Server Error');
  });

  test('取引先登録ページにアクセスできる', async ({ page }) => {
    await page.goto('/clients/new');
    await expect(page).toHaveURL(/\/clients\/new/);
    await expect(page.locator('body')).not.toContainText('Internal Server Error');
  });
});
