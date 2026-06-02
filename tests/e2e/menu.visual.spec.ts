import { test, expect } from '@playwright/test';
import { expectNoInternalRuntimeCopy, injectMenuSession, mockMenuCriticalApis } from './menu.fixtures';

for (const target of ['/dashboard', '/dashboard/templates', '/studio']) {
  test(`@critical @visual P1-2 ${target} has no horizontal overflow`, async ({ page }) => {
    await mockMenuCriticalApis(page);
    await injectMenuSession(page);
    await page.goto(target);
    await expect(page.locator('body')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(4);
    await expectNoInternalRuntimeCopy(page);
  });
}
