import { test, expect } from '@playwright/test';

async function mockLandingApis(page: import('@playwright/test').Page) {
  await page.route('**/api/v1/menu/commercial/**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ code: 0, data: { offerings: [], orders: [] }, message: 'OK' }),
  }));
}

test('has title', async ({ page }) => {
  await mockLandingApis(page);
  await page.goto('/');
  await expect(page).toHaveTitle(/AI Menu Growth Engine/);
});

test('can navigate to login', async ({ page }) => {
  await mockLandingApis(page);
  await page.goto('/');
  const loginHref = await page.getByRole('link', { name: /log in/i }).first().getAttribute('href');
  expect(loginHref).toBe('/login');
  await page.goto(loginHref!);
  await expect(page).toHaveURL(/.*login/);
});
