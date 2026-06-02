import { expect, type Page, type Route } from '@playwright/test';

export const menuAuthResponse = {
  access_token: 'menu-e2e-token',
  user: { id: 'user-e2e', name: 'QA Restaurant', email: 'qa@example.com', org_id: 'org-e2e' },
  access: { active_org_id: 'org-e2e', has_menu_access: true, menu_permissions: ['menu.studio.write', 'menu.template.read'] },
};

export const walletSummary = {
  assets: [
    { asset_code: 'MENU_CREDIT', asset_type: 'credit', lifecycle_type: 'permanent', available_balance: 12, account_balance: 12 },
    { asset_code: 'MENU_PROMO_CREDIT', asset_type: 'credit', lifecycle_type: 'expiring', available_balance: 3, account_balance: 3 },
    { asset_code: 'MENU_MONTHLY_ALLOWANCE', asset_type: 'quota', lifecycle_type: 'cycle_reset', available_balance: 20, account_balance: 20 },
    { asset_code: 'MENU_CASH', asset_type: 'cash', lifecycle_type: 'permanent', available_balance: 8800, account_balance: 8800 },
  ],
};

export const quotaSummary = { billable_item_code: 'menu.render.call', granted: 20, consumed: 2, reserved: 1, remaining: 17 };

export const multiImageTemplate = {
  template_id: 'tpl-menu-multi-hero',
  template_version_id: 'tpl-menu-multi-hero-v1',
  slug: 'multi-hero',
  name: 'Multi-material menu hero',
  description: 'Restaurant campaign template requiring four material slots.',
  business_goal: 'social_menu_campaign',
  platforms: ['instagram_feed', 'facebook_post'],
  tags: ['menu', 'campaign'],
  plan_required: 'basic',
  is_locked: false,
  locked: false,
  cuisine: 'thai',
  dish_type: 'signature_dish',
  moods: ['premium', 'campaign'],
  credits_cost: 1,
  recommend_score: 100,
  input_slots: [
    { role: 'dish_photo', label: 'Dish photo', required: true },
    { role: 'brand_logo', label: 'Brand logo', required: true },
    { role: 'menu_reference', label: 'Menu reference', required: true },
    { role: 'style_reference', label: 'Style reference', required: true },
  ],
  target_outputs: [{ platform: 'instagram_feed', aspect_ratio: '1:1' }],
  examples: [{ preview_url: 'data:image/png;base64,iVBORw0KGgo=' }],
};

export const templateUseResult = {
  template_id: multiImageTemplate.template_id,
  template_version_id: multiImageTemplate.template_version_id,
  target_route: '/studio',
  credits_cost: 1,
  plan_required: 'basic',
  business_goal: multiImageTemplate.business_goal,
  input_slots: multiImageTemplate.input_slots,
  target_outputs: multiImageTemplate.target_outputs,
  resolved_strategy: { input_mode: 'multi_image', generation_strategy: 'multi_image', provider: 'comfyui_bridge' },
  prefilled_job: {
    mode: 'single',
    provider: 'comfyui_bridge',
    input_mode: 'multi_image',
    generation_strategy: 'multi_image',
    requested_variants: 1,
    params: { target_platform: 'instagram_feed', input_mode: 'multi_image' },
    metadata: { creative_source: { source_type: 'template', template_id: multiImageTemplate.template_id, template_version_id: multiImageTemplate.template_version_id } },
  },
  template_context: { export_spec: { platform: 'instagram_feed' } },
};

export async function mockMenuCriticalApis(page: Page, overrides: { insufficient?: boolean } = {}) {
  await page.route('**/api/v1/menu/auth/register', route => json(route, menuAuthResponse));
  await page.route('**/api/v1/menu/auth/login', route => json(route, menuAuthResponse));
  await page.route('**/api/v1/menu/auth/session', route => json(route, { authenticated: true, user: menuAuthResponse.user, access: menuAuthResponse.access, credits: { balance: 20 } }));
  await page.route('**/api/v1/menu/user/wallet-summary', route => json(route, overrides.insufficient ? { assets: [] } : walletSummary));
  await page.route('**/api/v1/menu/user/quota-summary', route => json(route, overrides.insufficient ? { ...quotaSummary, granted: 0, consumed: 0, reserved: 0, remaining: 0 } : quotaSummary));
  await page.route('**/api/v1/menu/user/credits', route => json(route, { balance: overrides.insufficient ? 0 : 20, max_credits: 20, plan_name: 'Trial' }));
  await page.route('**/api/v1/menu/user/profile', route => json(route, { user: menuAuthResponse.user, org: { id: 'org-e2e', name: 'QA Restaurant' }, preferences: { language_preference: 'en' } }));
  await page.route('**/api/v1/menu/user/activities**', route => json(route, { items: [], total: 0 }));
  await page.route('**/api/v1/menu/commercial/**', route => json(route, { offerings: [], orders: [], latest_subscription: { order: { package_code: 'menu.pkg.trial.signup', status: 'fulfilled', fulfilled_at: new Date().toISOString(), total_amount: 0 }, fulfillment: { amount: 20 } } }));
  await page.route('**/api/v1/menu/template-center/meta', route => json(route, {
    categories: [{ id: 'campaign', label: 'Campaign' }],
    cuisines: [{ id: 'thai', label: 'Thai' }],
    dish_types: [{ id: 'signature_dish', label: 'Signature dish' }],
    platforms: [{ id: 'instagram_feed', label: 'Instagram Feed' }, { id: 'facebook_post', label: 'Facebook Post' }],
    moods: [{ id: 'premium', label: 'Premium' }, { id: 'campaign', label: 'Campaign' }],
    plans: [{ id: 'basic', label: 'Basic' }],
  }));
  await page.route('**/api/v1/menu/template-center/favorites**', route => json(route, { items: [] }));
  await page.route('**/api/v1/menu/template-center/catalog', route => json(route, { items: [multiImageTemplate] }));
  await page.route('**/api/v1/menu/template-center/catalog/tpl-menu-multi-hero', route => json(route, multiImageTemplate));
  await page.route('**/api/v1/menu/template-center/catalog/tpl-menu-multi-hero/use', route => json(route, templateUseResult));
  await page.route('**/api/v1/menu/studio/assets', route => json(route, { asset_id: `asset-${Date.now()}`, asset_type: 'source', source_type: 'upload', status: 'ready', file_name: 'qa.png', source_url: 'data:image/png;base64,iVBORw0KGgo=', preview_url: 'data:image/png;base64,iVBORw0KGgo=' }));
  await page.route('**/api/v1/menu/studio/styles**', route => json(route, { items: [] }));
  await page.route('**/api/v1/menu/studio/jobs', async route => {
    if (route.request().method() !== 'POST') return json(route, { items: [] });
    if (overrides.insufficient) return jsonError(route, 'STUDIO_BILLING_ALLOWANCE_INSUFFICIENT', 'You need more generation allowance before starting this job.', 402);
    return json(route, { job_id: 'job-e2e', mode: 'single', provider: 'comfyui_bridge', status: 'queued', stage: 'queued', stage_message: 'Runtime job queued', source_asset_ids: ['asset-1'], variants: [], charge: { billing_enabled: true, billable: true, billable_item_code: 'menu.render.call' } });
  });
  await page.route('**/api/v1/menu/studio/jobs/job-e2e', route => json(route, { job_id: 'job-e2e', mode: 'single', provider: 'comfyui_bridge', status: 'completed', stage: 'completed', stage_message: 'Completed', progress: 100, variants: [{ variant_id: 'variant-1', asset_id: 'asset-result' }] }));
  await page.route('**/api/v1/menu/studio/history/jobs**', route => json(route, { items: [{ job: { job_id: 'job-e2e', status: 'completed', stage_message: 'Completed' }, source_assets: [], result_assets: [], selected_asset: null }], total: 1 }));
  await page.route('**/api/v1/menu/studio/library/assets**', route => json(route, { items: [], total: 0 }));
}

export async function injectMenuSession(page: Page) {
  await page.addInitScript(({ auth }) => {
    localStorage.setItem('v_menu_token', auth.access_token);
    localStorage.setItem('v_menu_org_id', auth.access.active_org_id);
  }, { auth: menuAuthResponse });
}

export async function expectNoInternalRuntimeCopy(page: Page) {
  const body = page.locator('body');
  await expect(body).not.toContainText(/runtime_job_id|provider_job_id|callback|STUDIO_BILLING_ALLOWANCE_INSUFFICIENT|package_activation/i);
}

async function json(route: Route, data: unknown, status = 200, code = 0) {
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ code, data, message: code === 0 ? 'OK' : 'Error', request_id: 'req-e2e' }) });
}

async function jsonError(route: Route, errorCode: string, errorHint: string, status = 400) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify({ code: 1001, message: 'Error', error_code: errorCode, error_hint: errorHint, request_id: 'req-e2e' }),
  });
}
