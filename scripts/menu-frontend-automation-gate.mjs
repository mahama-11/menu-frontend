#!/usr/bin/env node
import fs from 'node:fs';

const config = fs.readFileSync('playwright.config.ts', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const failures = [];

for (const token of ['chromium-smoke', 'chromium-real-api', 'chromium-visual-desktop', 'chromium-visual-mobile', 'webServer', 'retain-on-failure']) {
  if (!config.includes(token)) failures.push(`playwright.config.ts missing ${token}`);
}

for (const script of ['test:e2e', 'test:e2e:real', 'test:e2e:mock', 'test:visual', 'frontend:gate', 'acceptance:governance', 'ci:quick']) {
  if (!pkg.scripts?.[script]) failures.push(`package.json missing script ${script}`);
}

if (pkg.scripts?.['test:e2e'] !== 'npm run test:e2e:real') {
  failures.push('package.json test:e2e must point to real API mode; use test:e2e:mock explicitly for offline regression');
}
if (!pkg.scripts?.['test:e2e:real']?.includes('menu-real-e2e-preflight.mjs')) {
  failures.push('test:e2e:real must run menu-real-e2e-preflight.mjs before Playwright');
}
if (!config.includes('testIgnore: /.*real-api\\.spec\\.ts/')) {
  failures.push('chromium-smoke must ignore real-api specs so mock/offline and real evidence stay separated');
}

for (const file of ['tests/e2e/menu.smoke.spec.ts', 'tests/e2e/menu.visual.spec.ts', 'tests/e2e/menu.studio.spec.ts', 'tests/e2e/menu.template-center.spec.ts', 'tests/e2e/menu.real-api.spec.ts']) {
  const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (!text.includes('@critical')) failures.push(`${file} missing @critical tag`);
}

const realSpec = fs.existsSync('tests/e2e/menu.real-api.spec.ts') ? fs.readFileSync('tests/e2e/menu.real-api.spec.ts', 'utf8') : '';
for (const forbidden of ['page.route(', 'route.fulfill(', 'mockMenuCriticalApis']) {
  if (realSpec.includes(forbidden)) failures.push(`real API spec must not use mock/intercept helper: ${forbidden}`);
}
for (const required of ['MENU_E2E_REAL_API', 'MENU_E2E_ALLOW_WRITES', 'MENU_E2E_CLEANUP_ACK', '/api/v1/menu/auth/session', '/api/v1/menu/studio/jobs']) {
  if (!realSpec.includes(required) && !fs.readFileSync('scripts/menu-real-e2e-preflight.mjs', 'utf8').includes(required)) {
    failures.push(`real API gate missing required guard/route: ${required}`);
  }
}

const mockableSpecs = ['tests/e2e/menu.business-flow.spec.ts', 'tests/e2e/menu.studio.spec.ts', 'tests/e2e/menu.template-center.spec.ts', 'tests/e2e/menu.smoke.spec.ts'];
for (const file of mockableSpecs) {
  const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (text.includes('mockMenuCriticalApis') && !text.includes('@mock')) {
    failures.push(`${file} uses mocked API fixtures but is not tagged @mock`);
  }
}

if (failures.length) {
  console.error('Menu frontend automation gate FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('Menu frontend automation gate PASS');
