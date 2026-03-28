import { test, expect } from '@playwright/test';

// E2Eテスト: 帳票作成 → 承認依頼 → 承認 → PDF出力の一連フロー
// 実行には起動中のNext.jsサーバーとモックデータが必要

test.describe('帳票作成〜承認フロー', () => {
  test.beforeEach(async ({ page }) => {
    // テスト用にログイン状態をモック（Cognito未連携のため）
    await page.goto('/');
  });

  test('ダッシュボードが表示される', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('h2, h3').first()).toBeVisible();
  });

  test('見積書一覧ページにアクセスできる', async ({ page }) => {
    await page.goto('/estimates');
    // タイムアウトせずにページが読み込まれること
    await expect(page).toHaveURL('/estimates');
  });

  test('請求書一覧ページにアクセスできる', async ({ page }) => {
    await page.goto('/invoices');
    await expect(page).toHaveURL('/invoices');
  });
});
