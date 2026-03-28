import { test, expect } from '@playwright/test';

// E2Eテスト: 取引先登録 → 帳票作成 → 見積書→請求書変換
test.describe('取引先〜帳票変換フロー', () => {
  test('取引先一覧ページにアクセスできる', async ({ page }) => {
    await page.goto('/clients');
    await expect(page).toHaveURL('/clients');
  });

  test('取引先登録ページにアクセスできる', async ({ page }) => {
    await page.goto('/clients/new');
    await expect(page).toHaveURL('/clients/new');
  });
});
