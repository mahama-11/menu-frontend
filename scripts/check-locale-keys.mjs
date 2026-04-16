import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const localesRoot = path.join(projectRoot, 'src/locales')
const maintainedLocaleCodes = ['en', 'zh', 'th']
const localeCodes = maintainedLocaleCodes

function getJsonPaths(obj, prefix = '') {
  let paths = [];
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      paths = paths.concat(getJsonPaths(obj[key], prefix ? `${prefix}.${key}` : key));
    } else {
      paths.push(prefix ? `${prefix}.${key}` : key);
    }
  }
  return paths;
}

function collectLocalePaths(localeCode) {
  const filePath = path.join(localesRoot, `${localeCode}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Locale file not found: ${filePath}`);
  }
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return new Set(getJsonPaths(content));
}

function compareLocales(baseCode, targetCode) {
  const basePaths = collectLocalePaths(baseCode)
  const targetPaths = collectLocalePaths(targetCode)
  const missing = [...basePaths].filter((item) => !targetPaths.has(item)).sort()
  const extra = [...targetPaths].filter((item) => !basePaths.has(item)).sort()
  return { missing, extra }
}

const baseCode = 'en'
const failures = []
const warnings = []

for (const localeCode of localeCodes) {
  if (localeCode === baseCode) continue
  const result = compareLocales(baseCode, localeCode)
  if (result.missing.length) {
    failures.push({ localeCode, ...result })
  } else if (result.extra.length) {
    warnings.push({ localeCode, ...result })
  }
}

if (failures.length) {
  console.error('Locale key alignment check failed.\n')
  for (const failure of failures) {
    console.error(`[${failure.localeCode}]`)
    if (failure.missing.length) {
      console.error(`  Missing keys (${failure.missing.length}):`)
      for (const key of failure.missing) console.error(`    - ${key}`)
    }
    if (failure.extra.length) {
      console.error(`  Extra keys (${failure.extra.length}):`)
      for (const key of failure.extra) console.error(`    - ${key}`)
    }
    console.error('')
  }
  process.exit(1)
}

if (warnings.length) {
  console.warn('Locale key alignment warnings:\n')
  for (const warning of warnings) {
    console.warn(`[${warning.localeCode}]`)
    console.warn(`  Extra keys (${warning.extra.length}):`)
    for (const key of warning.extra) console.warn(`    - ${key}`)
    console.warn('')
  }
}

console.log(`Locale key alignment passed for ${localeCodes.length} locale JSON files.`)
