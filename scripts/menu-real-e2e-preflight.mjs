#!/usr/bin/env node
import { URL } from 'node:url';

const failures = [];
const env = process.env.MENU_E2E_ENV || 'local';
const frontendBaseURL = process.env.E2E_BASE_URL || `http://127.0.0.1:${process.env.MENU_FRONTEND_E2E_PORT || '3000'}`;
const apiBaseURL = process.env.MENU_E2E_API_BASE_URL || process.env.VITE_MENU_API_BASE_URL || 'http://127.0.0.1:8196/api/v1/menu';
const token = process.env.MENU_E2E_AUTH_TOKEN || process.env.V_MENU_SMOKE_FIXTURE_TOKEN || '';
const orgId = process.env.MENU_E2E_ORG_ID || process.env.V_MENU_SMOKE_ORG_ID || '';

const prodEnvLabels = new Set(['prod', 'production', 'cloud', 'mix', 'release', 'prod-candidate']);
const prodHostPattern = /(prod|production|cloud|mix|agent-ecommerce|ai-menu|menuth\.com|\.com$|\.cn$)/i;

function checkURL(label, raw, { requireLoopbackForLocal = false } = {}) {
  try {
    const parsed = new URL(raw);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      failures.push(`${label} must use http(s): ${redact(raw)}`);
    }
    const host = parsed.hostname.toLowerCase();
    if (prodHostPattern.test(host)) {
      failures.push(`${label} refuses prod-like host: ${redact(raw)}`);
    }
    if (env === 'local' && requireLoopbackForLocal && !['localhost', '127.0.0.1', '::1'].includes(host)) {
      failures.push(`${label} local mode only accepts loopback host: ${redact(raw)}`);
    }
  } catch {
    failures.push(`${label} is not a valid URL: ${redact(raw)}`);
  }
}

function redact(value) {
  return String(value)
    .replace(/(bearer\s+)[A-Za-z0-9._~+/=-]+/gi, '$1[REDACTED]')
    .replace(/([?&](?:token|password|secret|api[_-]?key|authorization)=)[^&\s]+/gi, '$1[REDACTED]')
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[REDACTED_IP]');
}

if (prodEnvLabels.has(env.toLowerCase())) {
  failures.push(`MENU_E2E_ENV refuses prod-like label: ${env}`);
}
checkURL('E2E_BASE_URL', frontendBaseURL, { requireLoopbackForLocal: false });
checkURL('MENU_E2E_API_BASE_URL/VITE_MENU_API_BASE_URL', apiBaseURL, { requireLoopbackForLocal: true });

if (process.env.MENU_E2E_REAL_API !== '1') failures.push('MENU_E2E_REAL_API=1 is required for npm run test:e2e / test:e2e:real');
if (process.env.MENU_E2E_ALLOW_WRITES !== '1') failures.push('MENU_E2E_ALLOW_WRITES=1 is required because this browser smoke creates real assets/jobs');
if (process.env.MENU_E2E_CLEANUP_ACK !== '1') failures.push('MENU_E2E_CLEANUP_ACK=1 is required because the test cancels/cleans created jobs when possible');
if (!token) failures.push('MENU_E2E_AUTH_TOKEN or V_MENU_SMOKE_FIXTURE_TOKEN is required');
if (!orgId) failures.push('MENU_E2E_ORG_ID or V_MENU_SMOKE_ORG_ID is required');

if (failures.length) {
  console.error('Menu real E2E preflight REFUSED');
  for (const failure of failures) console.error(`- ${failure}`);
  console.error('\nOffline mocked regression is still available explicitly: npm run test:e2e:mock');
  process.exit(2);
}

console.log(JSON.stringify({
  status: 'PASS',
  mode: 'real-api',
  env,
  frontend_base_url: redact(frontendBaseURL),
  api_base_url: redact(apiBaseURL),
  auth_fixture: 'provided',
  org_fixture: 'provided',
}, null, 2));
