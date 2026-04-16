import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const localesRoot = path.join(projectRoot, 'src/locales')
const maintainedLocaleCodes = ['en', 'zh', 'th']
const localeCodes = maintainedLocaleCodes

const sourceCache = new Map()

function readSource(filePath) {
  const normalizedPath = path.normalize(filePath)
  if (!sourceCache.has(normalizedPath)) {
    const text = fs.readFileSync(normalizedPath, 'utf8')
    sourceCache.set(
      normalizedPath,
      ts.createSourceFile(normalizedPath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS),
    )
  }
  return sourceCache.get(normalizedPath)
}

function resolveImportPath(fromFile, specifier) {
  if (!specifier.startsWith('.')) return null
  const basePath = path.resolve(path.dirname(fromFile), specifier)
  const candidates = [basePath, `${basePath}.ts`, `${basePath}.tsx`, path.join(basePath, 'index.ts')]
  return candidates.find((candidate) => fs.existsSync(candidate)) || null
}

function getModuleInfo(filePath) {
  const sourceFile = readSource(filePath)
  const imports = new Map()
  const exports = new Map()

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement) && statement.importClause && ts.isStringLiteral(statement.moduleSpecifier)) {
      const resolvedFile = resolveImportPath(filePath, statement.moduleSpecifier.text)
      if (!resolvedFile) continue
      const bindings = statement.importClause.namedBindings
      if (bindings && ts.isNamedImports(bindings)) {
        for (const element of bindings.elements) {
          const localName = element.name.text
          const importedName = (element.propertyName || element.name).text
          imports.set(localName, { filePath: resolvedFile, exportName: importedName })
        }
      }
    }

    if (ts.isVariableStatement(statement) && statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name) && declaration.initializer) {
          exports.set(declaration.name.text, declaration.initializer)
        }
      }
    }
  }

  return { imports, exports }
}

function collectLeafPaths(filePath, expression, trail = []) {
  if (ts.isParenthesizedExpression(expression) || ts.isAsExpression(expression) || ts.isSatisfiesExpression(expression)) {
    return collectLeafPaths(filePath, expression.expression, trail)
  }

  if (ts.isObjectLiteralExpression(expression)) {
    const paths = []
    for (const property of expression.properties) {
      if (ts.isPropertyAssignment(property)) {
        const key = getPropertyName(property.name)
        if (!key) continue
        paths.push(...collectLeafPaths(filePath, property.initializer, [...trail, key]))
      } else if (ts.isShorthandPropertyAssignment(property)) {
        paths.push(...resolveIdentifierPaths(filePath, property.name.text, trail))
      } else if (ts.isSpreadAssignment(property)) {
        paths.push(...collectLeafPaths(filePath, property.expression, trail))
      }
    }
    return paths
  }

  if (ts.isIdentifier(expression)) {
    return resolveIdentifierPaths(filePath, expression.text, trail)
  }

  return [trail.join('.')]
}

function resolveIdentifierPaths(filePath, identifierName, trail = []) {
  const { imports, exports } = getModuleInfo(filePath)

  if (imports.has(identifierName)) {
    const imported = imports.get(identifierName)
    return resolveExportPaths(imported.filePath, imported.exportName, trail)
  }

  if (exports.has(identifierName)) {
    return collectLeafPaths(filePath, exports.get(identifierName), trail)
  }

  throw new Error(`无法解析标识符 ${identifierName} in ${path.relative(projectRoot, filePath)}`)
}

function resolveExportPaths(filePath, exportName, trail = []) {
  const { exports } = getModuleInfo(filePath)
  const initializer = exports.get(exportName)
  if (!initializer) {
    throw new Error(`在 ${path.relative(projectRoot, filePath)} 中未找到导出 ${exportName}`)
  }
  return collectLeafPaths(filePath, initializer, trail)
}

function getPropertyName(nameNode) {
  if (ts.isIdentifier(nameNode) || ts.isStringLiteral(nameNode) || ts.isNumericLiteral(nameNode)) {
    return nameNode.text
  }
  return null
}

function collectLocalePaths(localeCode) {
  const filePath = path.join(localesRoot, `${localeCode}.ts`)
  return new Set(resolveExportPaths(filePath, localeCode))
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

console.log(`Locale key alignment passed for ${localeCodes.length} locale entry files.`)
