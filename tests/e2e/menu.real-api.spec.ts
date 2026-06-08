import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/l6b6GQAAAABJRU5ErkJggg==',
  'base64',
);

const authToken = process.env.MENU_E2E_AUTH_TOKEN || process.env.V_MENU_SMOKE_FIXTURE_TOKEN || '';
const orgId = process.env.MENU_E2E_ORG_ID || process.env.V_MENU_SMOKE_ORG_ID || '';
const allowWrites = process.env.MENU_E2E_REAL_API === '1'
  && process.env.MENU_E2E_ALLOW_WRITES === '1'
  && process.env.MENU_E2E_CLEANUP_ACK === '1';

async function installRealSession(page: Page) {
  await page.addInitScript(({ token, org }) => {
    localStorage.setItem('v_menu_token', token);
    localStorage.setItem('v_menu_org_id', org);
  }, { token: authToken, org: orgId });
}

async function requestWithAuth(request: APIRequestContext, method: 'get' | 'post', path: string) {
  return request[method](path, {
    headers: {
      Authorization: `Bearer ${authToken}`,
      'X-Organization-ID': orgId,
    },
  });
}

test('@critical @business @real-api Template Center -> Studio four-slot generation uses real Menu API', async ({ page, request }) => {
  test.skip(!authToken || !orgId || !allowWrites, 'real API E2E requires MENU_E2E_REAL_API=1, token, org id, write approval, and cleanup acknowledgement');

  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await installRealSession(page);

  await test.step('real session and Template Center are served by backend', async () => {
    const session = await requestWithAuth(request, 'get', '/api/v1/menu/auth/session');
    expect(session.ok(), `session status ${session.status()}`).toBeTruthy();

    const catalog = await requestWithAuth(request, 'get', '/api/v1/menu/template-center/catalog');
    expect(catalog.ok(), `catalog status ${catalog.status()}`).toBeTruthy();
    const body = await catalog.json();
    const items = Array.isArray(body?.data) ? body.data : body?.data?.items || body?.items || [];
    expect(items.length, 'backend should expose at least one Menu template').toBeGreaterThan(0);
    const fourSlot = items.find((item: any) => (item.input_slots || []).filter((slot: any) => slot.required !== false).length >= 4);
    expect(fourSlot, 'backend should expose a four-slot critical Menu template').toBeTruthy();
  });

  let createJobPayload: any = null;
  let createdJobID = '';
  const createJobResponse = page.waitForResponse(async (response) => {
    const request = response.request();
    if (!response.url().includes('/api/v1/menu/studio/jobs') || request.method() !== 'POST') return false;
    createJobPayload = request.postDataJSON();
    if (response.ok()) {
      const body = await response.json().catch(() => null);
      const data = body?.data || body;
      createdJobID = data?.job_id || data?.id || '';
    }
    return true;
  });

  await test.step('browser launches template and uploads four real source assets through frontend service path', async () => {
    await page.goto('/dashboard/templates');
    await expect(page.locator('body')).toContainText(/Template|模板|เทมเพลต/i, { timeout: 15_000 });
    await page.getByRole('button', { name: /use|使用|ใช้/i }).first().click();
    await expect(page).toHaveURL(/\/studio$/, { timeout: 15_000 });

    const inputs = page.locator('input[type="file"]');
    await expect(inputs.nth(3), 'four upload inputs should be visible for the critical template').toBeAttached({ timeout: 15_000 });
    for (let index = 0; index < 4; index += 1) {
      const uploadRegistered = page.waitForResponse((response) =>
        response.url().includes('/api/v1/menu/studio/assets')
        && response.request().method() === 'POST'
        && response.ok(),
      );
      await inputs.nth(index).setInputFiles({
        name: `real-menu-material-${index + 1}.png`,
        mimeType: 'image/png',
        buffer: tinyPng,
      });
      await uploadRegistered;
    }
  });

  await test.step('browser creates real generation job and request preserves multi-image roles', async () => {
    await expect(page.getByRole('button', { name: /Generate|生成|สร้าง/i }).last()).toBeEnabled({ timeout: 15_000 });
    await page.getByRole('button', { name: /Generate|生成|สร้าง/i }).last().click();
    const response = await createJobResponse;
    expect(response.ok(), `create job status ${response.status()}`).toBeTruthy();
    expect(createJobPayload?.input_mode).toBe('multi_image');
    expect(createJobPayload?.generation_strategy).toBe('multi_image');
    expect(createJobPayload?.source_assets?.map((asset: any) => asset.role)).toEqual([
      'dish_photo',
      'brand_logo',
      'menu_reference',
      'style_reference',
    ]);
  });

  await test.step('created job is readable and cleanup/cancel is attempted', async () => {
    expect(createdJobID, 'create response should return job id').toBeTruthy();
    const detail = await requestWithAuth(request, 'get', `/api/v1/menu/studio/jobs/${createdJobID}`);
    expect(detail.ok(), `job detail status ${detail.status()}`).toBeTruthy();

    const cancel = await requestWithAuth(request, 'post', `/api/v1/menu/studio/jobs/${createdJobID}/cancel`);
    expect([200, 202, 204, 400, 409]).toContain(cancel.status());

    const history = await requestWithAuth(request, 'get', '/api/v1/menu/studio/history/jobs?limit=5');
    expect(history.ok(), `history status ${history.status()}`).toBeTruthy();
  });

  expect(consoleErrors).toEqual([]);
  await expect(page.locator('body')).not.toContainText(/runtime_job_id|provider_job_id|callback|STUDIO_BILLING_ALLOWANCE_INSUFFICIENT|package_activation/i);
});
