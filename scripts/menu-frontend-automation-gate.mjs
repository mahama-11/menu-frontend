#!/usr/bin/env node
import fs from 'node:fs';

const config = fs.readFileSync('playwright.config.ts', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const failures = [];
for (const token of ['chromium-smoke', 'chromium-visual-desktop', 'chromium-visual-mobile', 'webServer', 'retain-on-failure']) {
  if (!config.includes(token)) failures.push(`playwright.config.ts missing ${token}`);
}
for (const script of ['test:e2e', 'test:visual', 'frontend:gate', 'acceptance:governance', 'ci:quick']) {
  if (!pkg.scripts?.[script]) failures.push(`package.json missing script ${script}`);
}
for (const file of ['tests/e2e/menu.smoke.spec.ts', 'tests/e2e/menu.visual.spec.ts', 'tests/e2e/menu.studio.spec.ts', 'tests/e2e/menu.template-center.spec.ts']) {
  const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (!text.includes('@critical')) failures.push(`${file} missing @critical tag`);
}
if (failures.length) {
  console.error('Menu frontend automation gate FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('Menu frontend automation gate PASS');
