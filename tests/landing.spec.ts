import { test, expect } from '@playwright/test';

async function mockLandingApis(page: import('@playwright/test').Page) {
  await page.route('**/api/v1/menu/commercial/**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ code: 0, data: { offerings: { allowance_policies: [], packages: [], skus: [], rate_cards: [] }, orders: [] }, message: 'OK' }),
  }));
}

test('@mock has title', async ({ page }) => {
  await mockLandingApis(page);
  await page.goto('/');
  await expect(page).toHaveTitle(/AI Menu Growth Engine/);
});

test('@mock can navigate to login', async ({ page }) => {
  await mockLandingApis(page);
  await page.goto('/');
  const loginLink = page.locator('a[href="/login"]').first();
  await expect(loginLink).toBeVisible();
  await expect(loginLink).toContainText(/log in|登录|เข้าสู่ระบบ/i);
  await loginLink.click();
  await expect(page).toHaveURL(/.*login/);
});
