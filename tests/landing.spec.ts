import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/AI Menu Growth Engine/);
});

test('can navigate to login', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Log in');
  await expect(page).toHaveURL(/.*login/);
});
