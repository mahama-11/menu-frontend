#!/usr/bin/env node
import fs from 'node:fs';

const requiredFiles = [
  'docs/acceptance-tdd-governance.md',
  'docs/menu-critical-journeys.md',
  'docs/templates/frontend-cta-acceptance-matrix.md',
  'contract-governance/critical-journeys.json',
  'tests/e2e/menu.fixtures.ts',
  'tests/e2e/menu.smoke.spec.ts',
  'tests/e2e/menu.visual.spec.ts',
  'tests/e2e/menu.studio.spec.ts',
  'tests/e2e/menu.template-center.spec.ts'
];

const requiredJourneyIds = ['P0-1','P0-2','P0-3','P0-4','P0-5','P1-1','P1-2'];
const failures = [];
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`missing required file: ${file}`);
}
if (fs.existsSync('contract-governance/critical-journeys.json')) {
  const doc = JSON.parse(fs.readFileSync('contract-governance/critical-journeys.json', 'utf8'));
  const ids = new Set((doc.journeys || []).map((j) => j.id));
  for (const id of requiredJourneyIds) {
    if (!ids.has(id)) failures.push(`missing journey id: ${id}`);
  }
  const p04 = (doc.journeys || []).find((j) => j.id === 'P0-4');
  const roles = new Set(p04?.source_asset_roles || []);
  for (const role of ['dish_photo','brand_logo','menu_reference','style_reference']) {
    if (!roles.has(role)) failures.push(`P0-4 missing source asset role: ${role}`);
  }
}
for (const file of ['docs/acceptance-tdd-governance.md', 'docs/menu-critical-journeys.md']) {
  if (fs.existsSync(file)) {
    const text = fs.readFileSync(file, 'utf8');
    for (const needle of ['P0-1', 'P0-4', 'multi_image', 'PASS_WITH_NOTES', 'BLOCKED']) {
      if (!text.includes(needle)) failures.push(`${file} missing ${needle}`);
    }
  }
}
if (failures.length) {
  console.error('Menu acceptance governance gate FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('Menu acceptance governance gate PASS');
