import { test, expect } from '@playwright/test';
import { expectNoInternalRuntimeCopy, injectMenuSession, mockMenuCriticalApis } from './menu.fixtures';

const tinyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/l6b6GQAAAABJRU5ErkJggg==', 'base64');

async function uploadStudioMaterials(page: import('@playwright/test').Page, count: number) {
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'dish.png', mimeType: 'image/png', buffer: tinyPng });
  await expect(page.getByRole('button', { name: /style preset/i }).first()).toBeVisible();
  for (let index = 1; index < count; index += 1) {
    await page.locator('input[type="file"]').nth(index).setInputFiles({ name: `material-${index}.png`, mimeType: 'image/png', buffer: tinyPng });
  }
}

async function selectOfficialTemplate(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: /style preset/i }).first().click();
  await page.getByRole('button', { name: /Multi-material menu hero/i }).first().click();
  await expect(page.getByRole('button', { name: /Generate/i }).last()).toBeEnabled();
}

test('@critical @mock P0-3 Studio route renders generation status language without internal runtime copy', async ({ page }) => {
  await mockMenuCriticalApis(page);
  await injectMenuSession(page);
  await page.goto('/studio');
  await expect(page.locator('body')).toContainText(/Studio|Generate|生成|สร้าง/i);
  await expectNoInternalRuntimeCopy(page);
});

test('@critical @mock P0-4 multi-image UI job request keeps four role-aware source assets and comfyui route', async ({ page }) => {
  await mockMenuCriticalApis(page);
  await injectMenuSession(page);
  let capturedPayload: any = null;
  await page.route('**/api/v1/menu/studio/jobs', async route => {
    if (route.request().method() !== 'POST') return route.fallback();
    capturedPayload = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'OK', data: { job_id: 'job-multi', status: 'queued', stage: 'queued' } }),
    });
  });
  await page.goto('/studio');
  await uploadStudioMaterials(page, 4);
  await selectOfficialTemplate(page);
  await page.getByRole('button', { name: /Generate/i }).last().click();
  await expect.poll(() => capturedPayload, { message: 'studio UI should create a job request' }).not.toBeNull();
  expect(capturedPayload.input_mode).toBe('multi_image');
  expect(capturedPayload.generation_strategy).toBe('multi_image');
  expect(capturedPayload.provider).toBe('comfyui_bridge');
  expect(capturedPayload.source_assets.map((asset: any) => asset.role)).toEqual(['dish_photo','brand_logo','menu_reference','style_reference']);
  expect(capturedPayload.source_assets).toHaveLength(4);
});

test('@critical @mock P0-5 insufficient allowance error is sanitized and fail-closed through Studio UI', async ({ page }) => {
  await mockMenuCriticalApis(page, { insufficient: true });
  await injectMenuSession(page);
  let jobCreateAttempts = 0;
  await page.route('**/api/v1/menu/studio/jobs', async route => {
    if (route.request().method() !== 'POST') return route.fallback();
    jobCreateAttempts += 1;
    await route.fulfill({
      status: 402,
      contentType: 'application/json',
      body: JSON.stringify({ code: 1001, message: 'Error', error_code: 'STUDIO_BILLING_ALLOWANCE_INSUFFICIENT', error_hint: 'You need more generation allowance before starting this job.', request_id: 'req-e2e' }),
    });
  });
  await page.goto('/studio');
  await uploadStudioMaterials(page, 1);
  await selectOfficialTemplate(page);
  await page.getByRole('button', { name: /Generate/i }).last().click();
  await expect.poll(() => jobCreateAttempts, { message: 'UI should try one create request then stop on allowance error' }).toBe(1);
  await expect(page.locator('body')).toContainText(/Insufficient (credits|balance)|Generation failed|allowance/i);
  await expectNoInternalRuntimeCopy(page);
});
