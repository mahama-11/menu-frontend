import { test, expect } from '@playwright/test';
import { expectNoInternalRuntimeCopy, injectMenuSession, mockMenuCriticalApis } from './menu.fixtures';

test('@critical @smoke @mock P0-1 dashboard shows allowance after authenticated bootstrap', async ({ page }) => {
  await mockMenuCriticalApis(page);
  await injectMenuSession(page);
  await page.goto('/dashboard');
  await expect(page.locator('body')).toContainText(/17|Remaining allowance|剩余额度|โควตา/i);
  await expect(page.locator('body')).toContainText(/Trial|当前套餐|Current Package|แพ็กเกจ/i);
  await expectNoInternalRuntimeCopy(page);
});

test('@critical @smoke @mock protected template center route renders with mocked catalog', async ({ page }) => {
  await mockMenuCriticalApis(page);
  await injectMenuSession(page);
  await page.goto('/dashboard/templates');
  await expect(page.locator('body')).toContainText(/Multi-material menu hero|Template|模板|เทมเพลต/i);
  await expectNoInternalRuntimeCopy(page);
});
