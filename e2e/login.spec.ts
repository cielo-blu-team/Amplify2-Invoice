import { test, expect } from '@playwright/test';

const EMAIL = 'admin@courage-invoice.com';
const PASSWORD = 'CourageInvoice2024!';

test.describe('ログイン', () => {
  test('ログインページが表示される', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible();
    await expect(page.getByPlaceholder('example@company.com')).toBeVisible();
    await expect(page.getByPlaceholder('パスワードを入力')).toBeVisible();
  });

  test('正しい認証情報でログインできる', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('example@company.com').fill(EMAIL);
    await page.getByPlaceholder('パスワードを入力').fill(PASSWORD);
    await page.getByRole('button', { name: 'ログイン' }).click();

    // ログイン後にダッシュボードまたは請求書一覧へリダイレクト
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 10000 });
    expect(page.url()).not.toContain('/login');
  });

  test('誤ったパスワードでエラーが表示される', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('example@company.com').fill(EMAIL);
    await page.getByPlaceholder('パスワードを入力').fill('wrongpassword');
    await page.getByRole('button', { name: 'ログイン' }).click();

    await expect(page.getByText('メールアドレスまたはパスワードが正しくありません')).toBeVisible({ timeout: 10000 });
  });

  test('未認証でトップページにアクセスするとログインへリダイレクト', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/\/login/, { timeout: 5000 });
    expect(page.url()).toContain('/login');
  });

  test('Googleでログインボタンが表示される', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /Google/ })).toBeVisible();
  });
});
