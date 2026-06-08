import { test, expect, type Page } from '@playwright/test';
import { expectNoInternalRuntimeCopy, injectMenuSession, mockMenuCriticalApis } from './menu.fixtures';

const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/l6b6GQAAAABJRU5ErkJggg==',
  'base64',
);

const requiredMaterialSlots = [
  { label: /Dish photo/i },
  { label: /Brand logo/i },
  { label: /Menu reference/i },
  { label: /Style reference/i },
] as const;

async function uploadAllRequiredMaterials(page: Page) {
  for (const [index, slot] of requiredMaterialSlots.entries()) {
    const input = page.getByLabel(slot.label).first();
    await expect(input).toBeEnabled();
    const uploadRegistered = page.waitForResponse((response) =>
      response.url().includes('/api/v1/menu/studio/assets') &&
      response.request().method() === 'POST' &&
      response.status() === 200,
    );
    await input.setInputFiles({
      name: `menu-material-${index + 1}.png`,
      mimeType: 'image/png',
      buffer: tinyPng,
    });
    await uploadRegistered;
  }
}

test('@critical @business @mock template-to-studio generation completes with role-aware assets and result actions', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  await mockMenuCriticalApis(page);
  await injectMenuSession(page);

  let createJobPayload: any = null;
  await page.route('**/api/v1/menu/studio/jobs', async (route) => {
    if (route.request().method() !== 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 0, message: 'OK', request_id: 'req-e2e', data: { items: [] } }),
      });
    }

    createJobPayload = route.request().postDataJSON();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        message: 'OK',
        request_id: 'req-e2e',
        data: {
          job_id: 'job-business-flow',
          mode: 'single',
          provider: 'comfyui_bridge',
          input_mode: 'multi_image',
          generation_strategy: 'multi_image',
          status: 'queued',
          stage: 'queued',
          stage_message: 'Menu artwork queued',
          source_asset_ids: createJobPayload.source_asset_ids,
          variants: [],
          charge: { billable: true, billable_item_code: 'menu.render.call', status: 'reserved' },
        },
      }),
    });
  });

  await page.route('**/api/v1/menu/studio/jobs/job-business-flow', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      code: 0,
      message: 'OK',
      request_id: 'req-e2e',
      data: {
        job_id: 'job-business-flow',
        mode: 'single',
        provider: 'comfyui_bridge',
        input_mode: 'multi_image',
        generation_strategy: 'multi_image',
        status: 'completed',
        stage: 'completed',
        stage_message: 'Completed',
        progress: 100,
        source_asset_ids: ['asset-1', 'asset-2', 'asset-3', 'asset-4'],
        variants: [{
          variant_id: 'variant-menu-hero-1',
          asset_id: 'asset-result-1',
          status: 'completed',
          index: 0,
          is_selected: true,
          asset: {
            asset_id: 'asset-result-1',
            asset_type: 'generated',
            source_type: 'generated',
            status: 'ready',
            file_name: 'menu-hero-result.png',
            source_url: 'data:image/png;base64,iVBORw0KGgo=',
            preview_url: 'data:image/png;base64,iVBORw0KGgo=',
          },
        }],
        charge: { billable: true, billable_item_code: 'menu.render.call', status: 'committed', final_units: 1 },
      },
    }),
  }));

  await test.step('authenticated user opens template center and launches a production template', async () => {
    await page.goto('/dashboard/templates');
    await expect(page.locator('body')).toContainText(/Multi-material menu hero/i);
    await expect(page.locator('body')).toContainText(/Dish photo|Brand logo|Menu reference|Style reference/i);
    await page.getByRole('button', { name: /use|使用|ใช้/i }).first().click();
    await expect(page).toHaveURL(/\/studio$/);
    await expect(page.locator('body')).toContainText(/Multi-material menu hero/i);
  });

  await test.step('user uploads four required materials and submits a multi-image job', async () => {
    await uploadAllRequiredMaterials(page);
    await expect(page.getByRole('button', { name: /Generate/i }).last()).toBeEnabled();
    await page.getByRole('button', { name: /Generate/i }).last().click();

    await expect.poll(() => createJobPayload, { message: 'Studio should create a generation job' }).not.toBeNull();
    expect(createJobPayload.input_mode).toBe('multi_image');
    expect(createJobPayload.generation_strategy).toBe('multi_image');
    expect(createJobPayload.provider).toBe('comfyui_bridge');
    expect(createJobPayload.source_asset_ids).toEqual(['asset-1', 'asset-2', 'asset-3', 'asset-4']);
    expect(createJobPayload.source_assets.map((asset: any) => asset.role)).toEqual([
      'dish_photo',
      'brand_logo',
      'menu_reference',
      'style_reference',
    ]);
    expect(createJobPayload.metadata.creative_source.template_id).toBe('tpl-menu-multi-hero');
  });

  await test.step('completed result is visible and exposes customer actions', async () => {
    await expect(page.locator('body')).toContainText(/Completed/i, { timeout: 7_000 });
    await expect(page.getByRole('link', { name: /Download/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Use as New Base Image|Refine Further/i })).toBeVisible();
    await expectNoInternalRuntimeCopy(page);
    expect(consoleErrors).toEqual([]);
  });
});
