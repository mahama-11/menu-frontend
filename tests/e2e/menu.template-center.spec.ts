import { test, expect } from '@playwright/test';
import { injectMenuSession, mockMenuCriticalApis, templateUseResult } from './menu.fixtures';

test('@critical @mock P0-2 Template Center use payload preserves Studio handoff contract', async ({ page }) => {
  await mockMenuCriticalApis(page);
  await injectMenuSession(page);

  await page.goto('/dashboard/templates');
  await expect(page.locator('body')).toContainText(/Multi-material menu hero|Template|模板|เทมเพลต/i);
  await expect(page.locator('body')).toContainText(/Dish photo|Brand logo|Menu reference|Style reference/i);

  const useRequestPromise = page.waitForRequest(request =>
    request.method() === 'POST' && request.url().includes('/template-center/catalog/tpl-menu-multi-hero/use')
  );
  await page.getByRole('button', { name: /use|使用|ใช้/i }).first().click();
  const useRequest = await useRequestPromise;
  const usePayload = useRequest.postDataJSON() as { target_platform?: string; language?: string };
  expect(usePayload.target_platform).toBeTruthy();
  expect(usePayload.language).toBeTruthy();
  await expect(page).toHaveURL(/.*studio/);

  // Contract-level assertion for the mocked backend handoff that the browser consumes.
  expect(templateUseResult.prefilled_job.input_mode).toBe('multi_image');
  expect(templateUseResult.input_slots.map(slot => slot.role)).toEqual(['dish_photo','brand_logo','menu_reference','style_reference']);
  expect(templateUseResult.prefilled_job.metadata.creative_source.template_id).toBe('tpl-menu-multi-hero');
});
