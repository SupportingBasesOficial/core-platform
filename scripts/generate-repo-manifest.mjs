#!/usr/bin/env node
import { promises as fs } from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const ROOT = process.cwd()
const OUTPUT_DIR = 'docs/repo'

const OUTPUT_FILES = [
  `${OUTPUT_DIR}/REPO_TREE.json`,
  `${OUTPUT_DIR}/REPO_FILES.json`,
  `${OUTPUT_DIR}/REPO_CONTRACTS.json`,
  `${OUTPUT_DIR}/REPO_EFFECTIVE_CONTRACTS.json`,
  `${OUTPUT_DIR}/REPO_RUNTIME.json`,
  `${OUTPUT_DIR}/REPO_TRUTH_BOUNDARY.json`,
  `${OUTPUT_DIR}/DB_RUNTIME_STATE.json`,
  `${OUTPUT_DIR}/REPO_INDEX.md`,
]

const IGNORED_DIRS = new Set([
  '.git',
  'node_modules',
  '.next',
  '.vercel',
  'dist',
  'build',
  'coverage',
  '.turbo',
  '.cache',
  '.idea',
  '.vscode',
])

const IGNORED_FILES = new Set(['.DS_Store'])

const TEXT_EXTENSIONS = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.sql',
  '.yml',
  '.yaml',
  '.txt',
  '.env',
  '.gitignore',
  '.nvmrc',
  '.sh',
  '.css',
  '.scss',
  '.html',
  '.toml',
])

const MAX_TEXT_BYTES = 1_500_000

function toPosix(value) {
  return value.split(path.sep).join('/')
}

function nowIso() {
  return new Date().toISOString()
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

function isOutputFile(relativePath) {
  return OUTPUT_FILES.includes(relativePath)
}

function fileExtension(relativePath) {
  const ext = path.extname(relativePath)
  if (ext) return ext

  const base = path.basename(relativePath)
  if (base.startsWith('.')) return base

  return ''
}

function isTextLike(relativePath) {
  return TEXT_EXTENSIONS.has(fileExtension(relativePath))
}

function detectLayer(relativePath) {
  if (relativePath.startsWith('src/app/')) return 'app'
  if (relativePath === 'src/middleware.ts' || relativePath === 'src/middleware.js') return 'app'
  if (relativePath.startsWith('src/server/')) return 'server'
  if (relativePath.startsWith('src/domains/')) return 'domains'
  if (relativePath.startsWith('src/workers/')) return 'workers'
  if (relativePath.startsWith('src/jobs/')) return 'jobs'
  if (relativePath.startsWith('src/infra/')) return 'infra'
  if (relativePath.startsWith('supabase/migrations/')) return 'supabase_migrations'
  if (relativePath.startsWith('.github/workflows/')) return 'github_workflow'
  if (relativePath.startsWith('docs/')) return 'docs'
  if (relativePath.startsWith('scripts/')) return 'scripts'
  return 'root_or_other'
}

function detectFileKind(relativePath) {
  const base = path.basename(relativePath)

  if (relativePath.startsWith('src/app/api/') && /\/route\.(ts|tsx|js|jsx)$/.test(relativePath)) {
    return 'route_handler'
  }
  if (/\/page\.(ts|tsx|js|jsx)$/.test(relativePath)) return 'page'
  if (/\/layout\.(ts|tsx|js|jsx)$/.test(relativePath)) return 'layout'
  if (base === 'middleware.ts' || base === 'middleware.js') return 'middleware'
  if (relativePath.startsWith('src/server/services/')) return 'service'
  if (relativePath.startsWith('src/server/repositories/')) return 'repository'
  if (relativePath.startsWith('src/server/auth/')) return 'auth_module'
  if (relativePath.startsWith('src/server/events/')) return 'event_module'
  if (relativePath.startsWith('src/server/utils/')) return 'utility'
  if (relativePath.startsWith('src/domains/')) return 'domain_file'
  if (relativePath.startsWith('supabase/migrations/') && relativePath.endsWith('.sql')) return 'migration'
  if (relativePath.startsWith('.github/workflows/')) return 'workflow'
  if (base === 'package.json') return 'package_manifest'
  if (base === 'tsconfig.json') return 'typescript_config'
  if (base === '.nvmrc') return 'node_version_file'
  if (base === 'README.md') return 'readme'
  return 'file'
}

function detectRoute(relativePath) {
  const normalized = toPosix(relativePath)

  if (normalized.startsWith('src/app/api/') && /\/route\.(ts|tsx|js|jsx)$/.test(normalized)) {
    const rest = normalized
      .replace(/^src\/app\/api/, '')
      .replace(/\/route\.(ts|tsx|js|jsx)$/, '')

    return {
      route_type: 'api',
      route_path: `/api${rest || ''}`,
    }
  }

  if (/^src\/app\/.*\/page\.(ts|tsx|js|jsx)$/.test(normalized)) {
    const rest = normalized
      .replace(/^src\/app/, '')
      .replace(/\/page\.(ts|tsx|js|jsx)$/, '')

    return {
      route_type: 'page',
      route_path: rest || '/',
    }
  }

  if (/^src\/app\/page\.(ts|tsx|js|jsx)$/.test(normalized)) {
    return {
      route_type: 'page',
      route_path: '/',
    }
  }

  return null
}

function detectDomainPath(relativePath) {
  const normalized = toPosix(relativePath)

  if (!normalized.startsWith('src/domains/')) return null

  const rest = normalized.replace(/^src\/domains\//, '')
  const parts = rest.split('/')

  if (parts.length <= 1) return parts[0] || null
  return parts.slice(0, parts.length - 1).join('/')
}

function extractImports(text) {
  const imports = new Set()
  const patterns = [
    /import\s+[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ]

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) imports.add(match[1])
  }

  return [...imports].sort()
}

function extractExports(text) {
  const exports = new Set()

  for (const match of text.matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/g)) exports.add(match[1])
  for (const match of text.matchAll(/export\s+const\s+([A-Za-z0-9_]+)/g)) exports.add(match[1])
  for (const match of text.matchAll(/export\s+class\s+([A-Za-z0-9_]+)/g)) exports.add(match[1])
  for (const match of text.matchAll(/export\s+type\s+([A-Za-z0-9_]+)/g)) exports.add(match[1])
  for (const match of text.matchAll(/export\s+interface\s+([A-Za-z0-9_]+)/g)) exports.add(match[1])
  if (/export\s+default\b/g.test(text)) exports.add('default')

  return [...exports].sort()
}

function extractEnvRefs(text) {
  const refs = new Set()
  for (const match of text.matchAll(/process\.env\.([A-Z0-9_]+)/g)) refs.add(match[1])
  return [...refs].sort()
}

function splitSqlTopLevel(input) {
  const parts = []
  let current = ''
  let depth = 0
  let inSingle = false
  let inDouble = false
  let inDollarQuote = false

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i]
    const prev = input[i - 1]
    const nextTwo = input.slice(i, i + 2)

    if (!inSingle && !inDouble && nextTwo === '$$') {
      inDollarQuote = !inDollarQuote
      current += '$$'
      i += 1
      continue
    }

    if (!inDollarQuote && char === "'" && prev !== '\\' && !inDouble) {
      inSingle = !inSingle
      current += char
      continue
    }

    if (!inDollarQuote && char === '"' && !inSingle) {
      inDouble = !inDouble
      current += char
      continue
    }

    if (!inSingle && !inDouble && !inDollarQuote) {
      if (char === '(') depth += 1
      if (char === ')') depth = Math.max(0, depth - 1)

      if (char === ',' && depth === 0) {
        const trimmed = current.trim()
        if (trimmed) parts.push(trimmed)
        current = ''
        continue
      }
    }

    current += char
  }

  const tail = current.trim()
  if (tail) parts.push(tail)
  return parts
}

function normalizeSqlName(rawName) {
  const clean = rawName.replace(/"/g, '').trim()
  const parts = clean.split('.').filter(Boolean)

  if (parts.length === 1) {
    return { raw: rawName.trim(), qualified_name: clean, schema: null, name: parts[0] }
  }

  return { raw: rawName.trim(), qualified_name: clean, schema: parts[0], name: parts[1] }
}

function parseLikeClause(definition) {
  const trimmed = definition.trim()
  const match = trimmed.match(/^like\s+([A-Za-z0-9_."-]+)(?:\s+(.*))?$/i)

  if (!match) return null

  return {
    source_table: normalizeSqlName(match[1]),
    options_literal: match[2]?.trim() ?? null,
    literal_sql: trimmed,
  }
}

function parseColumnDefinition(definition) {
  const trimmed = definition.trim()

  if (/^(constraint|primary key|foreign key|unique|check|like)\b/i.test(trimmed)) return null

  const match = trimmed.match(
    /^"?(?<name>[A-Za-z_][A-Za-z0-9_]*)"?\s+(?<type>[A-Za-z0-9_.\s\[\],()]+?)(?=\s+(?:not null|null|default|generated|check|references|constraint|primary key|unique)\b|$)/i,
  )

  if (!match?.groups?.name || !match.groups.type) return null

  const refMatch = trimmed.match(/\breferences\s+([A-Za-z0-9_."-]+)\s*\(([^)]+)\)/i)
  const defaultMatch = trimmed.match(
    /\bdefault\s+(.+?)(?=\s+(?:generated|check|references|constraint|primary key|unique|not null|null)\b|$)/i,
  )
  const generatedMatch = trimmed.match(/\bgenerated\s+always\s+as\s*\(([\s\S]+)\)\s+stored/i)
  const isPrimaryKey = /\bprimary key\b/i.test(trimmed)
  const isUnique = /\bunique\b/i.test(trimmed)
  const checkMatch = trimmed.match(/\bcheck\s*\((.+)\)$/i)

  return {
    name: match.groups.name.trim(),
    data_type: match.groups.type.trim().replace(/\s+/g, ' '),
    nullable: !(isPrimaryKey || /\bnot null\b/i.test(trimmed)),
    primary_key: isPrimaryKey,
    unique: isUnique,
    has_default: Boolean(defaultMatch),
    default_value: defaultMatch ? defaultMatch[1].trim() : null,
    generated_always: Boolean(generatedMatch),
    generated_expression: generatedMatch ? generatedMatch[1].trim() : null,
    references: refMatch
      ? { ...normalizeSqlName(refMatch[1]), column: refMatch[2].replace(/"/g, '').trim() }
      : null,
    check_expression: checkMatch ? checkMatch[1].trim() : null,
    literal_sql: trimmed,
  }
}

function parseTableConstraint(definition) {
  const trimmed = definition.trim()
  const namedConstraintMatch = trimmed.match(/^constraint\s+"?([A-Za-z0-9_]+)"?\s+([\s\S]+)$/i)
  const constraintName = namedConstraintMatch ? namedConstraintMatch[1] : null
  const body = namedConstraintMatch ? namedConstraintMatch[2].trim() : trimmed

  const primaryKeyMatch = body.match(/^primary key\s*\(([^)]+)\)/i)
  if (primaryKeyMatch) {
    return {
      constraint_type: 'primary_key',
      constraint_name: constraintName,
      columns_literal: primaryKeyMatch[1].trim(),
      references: null,
      check_expression: null,
      literal_sql: trimmed,
    }
  }

  const uniqueMatch = body.match(/^unique\s*\(([^)]+)\)/i)
  if (uniqueMatch) {
    return {
      constraint_type: 'unique',
      constraint_name: constraintName,
      columns_literal: uniqueMatch[1].trim(),
      references: null,
      check_expression: null,
      literal_sql: trimmed,
    }
  }

  const foreignKeyMatch = body.match(
    /^foreign key\s*\(([^)]+)\)\s+references\s+([A-Za-z0-9_."-]+)\s*\(([^)]+)\)/i,
  )
  if (foreignKeyMatch) {
    return {
      constraint_type: 'foreign_key',
      constraint_name: constraintName,
      columns_literal: foreignKeyMatch[1].trim(),
      references: {
        ...normalizeSqlName(foreignKeyMatch[2]),
        column: foreignKeyMatch[3].replace(/"/g, '').trim(),
      },
      check_expression: null,
      literal_sql: trimmed,
    }
  }

  const checkMatch = body.match(/^check\s*\((.+)\)$/i)
  if (checkMatch) {
    return {
      constraint_type: 'check',
      constraint_name: constraintName,
      columns_literal: null,
      references: null,
      check_expression: checkMatch[1].trim(),
      literal_sql: trimmed,
    }
  }

  const likeClause = parseLikeClause(body)
  if (likeClause) {
    return {
      constraint_type: 'like_clause',
      constraint_name: constraintName,
      columns_literal: null,
      references: null,
      check_expression: null,
      like_clause: likeClause,
      literal_sql: trimmed,
    }
  }

  return {
    constraint_type: 'unknown_constraint',
    constraint_name: constraintName,
    columns_literal: null,
    references: null,
    check_expression: null,
    literal_sql: trimmed,
  }
}

function parseTables(sqlText, sourcePath) {
  const tables = []
  const regex = /create table(?:\s+if not exists)?\s+([A-Za-z0-9_."-]+)\s*\(([\s\S]*?)\)\s*;/gi

  for (const match of sqlText.matchAll(regex)) {
    const tableName = normalizeSqlName(match[1])
    const body = match[2]
    const definitions = splitSqlTopLevel(body)
    const columns = []
    const tableConstraints = []
    const likeClauses = []

    for (const definition of definitions) {
      const likeClause = parseLikeClause(definition)
      if (likeClause) {
        likeClauses.push(likeClause)
        continue
      }

      const parsedColumn = parseColumnDefinition(definition)
      if (parsedColumn) {
        columns.push(parsedColumn)
        continue
      }

      tableConstraints.push(parseTableConstraint(definition))
    }

    tables.push({
      ...tableName,
      columns,
      table_constraints: tableConstraints,
      like_clauses: likeClauses,
      source_path: sourcePath,
      literal_sql_header: match[0].slice(0, 300),
    })
  }

  return tables
}

function parseIndexes(sqlText, sourcePath) {
  const indexes = []
  const regex =
    /create\s+(unique\s+)?index(?:\s+if not exists)?\s+([A-Za-z0-9_."-]+)\s+on\s+([A-Za-z0-9_."-]+)\s*\(([^)]+)\)/gi

  for (const match of sqlText.matchAll(regex)) {
    indexes.push({
      name: match[2].replace(/"/g, '').trim(),
      unique: Boolean(match[1]),
      table: normalizeSqlName(match[3]),
      columns_literal: match[4].trim(),
      source_path: sourcePath,
      literal_sql: match[0].trim(),
    })
  }

  return indexes
}

function parseRlsEnabledTables(sqlText, sourcePath) {
  const items = []
  const regex = /alter table\s+([A-Za-z0-9_."-]+)\s+enable row level security/gi

  for (const match of sqlText.matchAll(regex)) {
    items.push({
      table: normalizeSqlName(match[1]),
      source_path: sourcePath,
      literal_sql: match[0].trim(),
    })
  }

  return items
}

function parsePolicies(sqlText, sourcePath) {
  const policies = []
  const statements = sqlText.match(/create policy[\s\S]*?;/gi) ?? []

  for (const statement of statements) {
    const nameMatch = statement.match(/create policy\s+"?([^"\n]+)"?/i)
    const tableMatch = statement.match(/\bon\s+([A-Za-z0-9_."-]+)/i)
    const commandMatch = statement.match(/\bfor\s+(select|insert|update|delete|all)\b/i)
    const usingMatch = statement.match(/\busing\s*\(([\s\S]*?)\)(?=\s+with check|;)/i)
    const withCheckMatch = statement.match(/\bwith check\s*\(([\s\S]*?)\)(?=;)/i)

    policies.push({
      name: nameMatch ? nameMatch[1].trim() : null,
      table: tableMatch ? normalizeSqlName(tableMatch[1]) : null,
      command: commandMatch ? commandMatch[1].toLowerCase() : null,
      using_expression: usingMatch ? usingMatch[1].trim() : null,
      with_check_expression: withCheckMatch ? withCheckMatch[1].trim() : null,
      source_path: sourcePath,
      literal_sql: statement.trim(),
    })
  }

  return policies
}

function parseFunctions(sqlText, sourcePath) {
  const functions = []
  const statements =
    sqlText.match(
      /create or replace function[\s\S]*?(?:\$\$[\s\S]*?\$\$|language[\s\S]*?)\s*;/gi,
    ) ?? []

  for (const statement of statements) {
    const headerMatch = statement.match(
      /create or replace function\s+([A-Za-z0-9_."-]+)\s*\(([\s\S]*?)\)\s*returns\s+([\s\S]*?)\s+language\s+([A-Za-z0-9_]+)/i,
    )
    const securityInvoker = /\bsecurity invoker\b/i.test(statement)
    const securityDefiner = /\bsecurity definer\b/i.test(statement)

    functions.push({
      name: headerMatch ? normalizeSqlName(headerMatch[1]) : null,
      arguments_literal: headerMatch ? headerMatch[2].trim() : null,
      returns_literal: headerMatch ? headerMatch[3].trim().replace(/\s+/g, ' ') : null,
      language: headerMatch ? headerMatch[4].trim().toLowerCase() : null,
      security: securityDefiner ? 'definer' : securityInvoker ? 'invoker' : null,
      source_path: sourcePath,
      literal_sql_header: statement.slice(0, 500).trim(),
    })
  }

  return functions
}

function parseViews(sqlText, sourcePath) {
  const views = []
  const regex = /create(?: or replace)? view\s+([A-Za-z0-9_."-]+)\s+as/gi

  for (const match of sqlText.matchAll(regex)) {
    views.push({
      name: normalizeSqlName(match[1]),
      source_path: sourcePath,
      literal_sql: match[0].trim(),
    })
  }

  return views
}

function parseTriggers(sqlText, sourcePath) {
  const triggers = []
  const regex = /create trigger\s+([A-Za-z0-9_."-]+)[\s\S]*?\bon\s+([A-Za-z0-9_."-]+)/gi

  for (const match of sqlText.matchAll(regex)) {
    triggers.push({
      name: match[1].replace(/"/g, '').trim(),
      table: normalizeSqlName(match[2]),
      source_path: sourcePath,
      literal_sql: match[0].trim(),
    })
  }

  return triggers
}

function parseEnums(sqlText, sourcePath) {
  const enums = []
  const regex = /create type\s+([A-Za-z0-9_."-]+)\s+as enum\s*\(([\s\S]*?)\)/gi

  for (const match of sqlText.matchAll(regex)) {
    const values = splitSqlTopLevel(match[2]).map((item) =>
      item.trim().replace(/^'/, '').replace(/'$/, ''),
    )

    enums.push({
      name: normalizeSqlName(match[1]),
      values,
      source_path: sourcePath,
      literal_sql: match[0].trim(),
    })
  }

  return enums
}

function parseSqlContracts(sqlText, sourcePath) {
  return {
    tables: parseTables(sqlText, sourcePath),
    indexes: parseIndexes(sqlText, sourcePath),
    policies: parsePolicies(sqlText, sourcePath),
    functions: parseFunctions(sqlText, sourcePath),
    views: parseViews(sqlText, sourcePath),
    triggers: parseTriggers(sqlText, sourcePath),
    enums: parseEnums(sqlText, sourcePath),
    rls_enabled_tables: parseRlsEnabledTables(sqlText, sourcePath),
  }
}

function makeDirNode(relativePath) {
  return {
    path: relativePath,
    name: path.basename(relativePath),
    node_type: 'directory',
    depth: relativePath === '.' ? 0 : relativePath.split('/').length,
    layer: detectLayer(relativePath),
  }
}

function buildTree(nodes) {
  const root = { name: '.', path: '.', node_type: 'directory', children: [] }
  const index = new Map()
  index.set('.', root)

  const sorted = [...nodes].sort((a, b) => a.path.localeCompare(b.path))

  for (const node of sorted) {
    if (node.path === '.') continue

    const parentPath = node.path.includes('/') ? node.path.slice(0, node.path.lastIndexOf('/')) : '.'
    const parent = index.get(parentPath)
    if (!parent) continue

    const slimNode = { name: node.name, path: node.path, node_type: node.node_type }

    if (node.node_type === 'file') {
      slimNode.kind = node.kind
      slimNode.layer = node.layer
    } else {
      slimNode.children = []
    }

    parent.children.push(slimNode)

    if (node.node_type === 'directory') index.set(node.path, slimNode)
  }

  return root
}

async function readMaybeText(absPath, relativePath, size, warnings) {
  if (!isTextLike(relativePath)) return null

  if (size > MAX_TEXT_BYTES) {
    warnings.push({
      path: relativePath,
      code: 'TEXT_ANALYSIS_SKIPPED_FILE_TOO_LARGE',
      size_bytes: size,
    })
    return null
  }

  try {
    return await fs.readFile(absPath, 'utf8')
  } catch {
    warnings.push({ path: relativePath, code: 'TEXT_ANALYSIS_FAILED_TO_READ_UTF8' })
    return null
  }
}

async function walk(relativeDir, directoryNodes, fileRecords, runtime, contracts, warnings) {
  const absDir = path.join(ROOT, relativeDir)
  const entries = await fs.readdir(absDir, { withFileTypes: true })
  entries.sort((a, b) => a.name.localeCompare(b.name))

  for (const entry of entries) {
    if (IGNORED_FILES.has(entry.name)) continue
    if (entry.isDirectory() && IGNORED_DIRS.has(entry.name)) continue

    const relativePath = relativeDir ? toPosix(path.join(relativeDir, entry.name)) : entry.name
    if (isOutputFile(relativePath)) continue

    const absPath = path.join(ROOT, relativePath)

    if (entry.isDirectory()) {
      directoryNodes.push(makeDirNode(relativePath))
      await walk(relativePath, directoryNodes, fileRecords, runtime, contracts, warnings)
      continue
    }

    if (!entry.isFile()) continue

    const stat = await fs.stat(absPath)
    const buffer = await fs.readFile(absPath)
    const ext = fileExtension(relativePath)
    const layer = detectLayer(relativePath)
    const kind = detectFileKind(relativePath)
    const route = detectRoute(relativePath)
    const domainPath = detectDomainPath(relativePath)
    const text = await readMaybeText(absPath, relativePath, stat.size, warnings)

    const record = {
      path: relativePath,
      name: path.basename(relativePath),
      node_type: 'file',
      extension: ext,
      size_bytes: stat.size,
      sha256: sha256(buffer),
      layer,
      kind,
      domain_path: domainPath,
      route,
      env_refs: [],
      imports: [],
      exports: [],
      source_status: 'confirmed_from_repo_file',
    }

    if (text !== null) {
      record.env_refs = extractEnvRefs(text)
      record.imports = extractImports(text)
      record.exports = extractExports(text)

      for (const envRef of record.env_refs) runtime.env_references.add(envRef)
      if (relativePath.startsWith('.github/workflows/')) runtime.workflows.push(relativePath)

      if (relativePath === 'package.json') {
        try { runtime.package_json = JSON.parse(text) } catch { warnings.push({ path: relativePath, code: 'PACKAGE_JSON_PARSE_FAILED' }) }
      }

      if (relativePath === 'tsconfig.json') {
        try { runtime.tsconfig_json = JSON.parse(text) } catch { warnings.push({ path: relativePath, code: 'TSCONFIG_PARSE_FAILED' }) }
      }

      if (relativePath === '.nvmrc') runtime.nvmrc = text.trim() || null

      if (relativePath.startsWith('supabase/migrations/') && relativePath.endsWith('.sql')) {
        const parsed = parseSqlContracts(text, relativePath)
        contracts.tables.push(...parsed.tables)
        contracts.indexes.push(...parsed.indexes)
        contracts.policies.push(...parsed.policies)
        contracts.functions.push(...parsed.functions)
        contracts.views.push(...parsed.views)
        contracts.triggers.push(...parsed.triggers)
        contracts.enums.push(...parsed.enums)
        contracts.rls_enabled_tables.push(...parsed.rls_enabled_tables)
        contracts.sources.push(relativePath)
      }
    }

    fileRecords.push(record)
  }
}

function countBy(items, key) {
  const map = new Map()
  for (const item of items) {
    const value = item[key] ?? 'null'
    map.set(value, (map.get(value) ?? 0) + 1)
  }
  return Object.fromEntries([...map.entries()].sort((a, b) => a[0].localeCompare(b[0])))
}

function dedupeLatest(items, keyFn) {
  const map = new Map()
  const history = new Map()

  for (const item of items) {
    const key = keyFn(item)
    if (!history.has(key)) history.set(key, [])
    history.get(key).push(item)
    map.set(key, item)
  }

  return {
    latest: [...map.entries()].map(([key, value]) => ({
      key,
      source_path: value.source_path ?? null,
      value,
      override_count: (history.get(key)?.length ?? 1) - 1,
      history_source_paths: (history.get(key) ?? []).map((entry) => entry.source_path ?? null),
    })),
    duplicates: [...history.entries()]
      .filter(([, values]) => values.length > 1)
      .map(([key, values]) => ({
        key,
        occurrences: values.map((value) => ({ source_path: value.source_path ?? null })),
      })),
  }
}

function buildEffectiveContracts(contracts) {
  const functions = dedupeLatest(contracts.functions, (item) => item.name?.qualified_name ?? 'unknown_function')
  const policies = dedupeLatest(
    contracts.policies,
    (item) => `${item.table?.qualified_name ?? 'unknown_table'}::${item.command ?? 'unknown_command'}::${item.name ?? 'unknown_policy'}`
  )
  const indexes = dedupeLatest(
    contracts.indexes,
    (item) => `${item.table?.qualified_name ?? 'unknown_table'}::${item.name ?? 'unknown_index'}`
  )
  const rlsEnabledTables = dedupeLatest(
    contracts.rls_enabled_tables,
    (item) => item.table?.qualified_name ?? 'unknown_table'
  )
  const tables = dedupeLatest(contracts.tables, (item) => item.qualified_name ?? 'unknown_table')

  return {
    summary: {
      effective_tables: tables.latest.length,
      effective_indexes: indexes.latest.length,
      effective_policies: policies.latest.length,
      effective_functions: functions.latest.length,
      effective_rls_enabled_tables: rlsEnabledTables.latest.length,
      duplicate_tables: tables.duplicates.length,
      duplicate_indexes: indexes.duplicates.length,
      duplicate_policies: policies.duplicates.length,
      duplicate_functions: functions.duplicates.length,
    },
    effective: {
      tables: tables.latest,
      indexes: indexes.latest,
      policies: policies.latest,
      functions: functions.latest,
      rls_enabled_tables: rlsEnabledTables.latest,
    },
    duplicates: {
      tables: tables.duplicates,
      indexes: indexes.duplicates,
      policies: policies.duplicates,
      functions: functions.duplicates,
    },
  }
}

function buildTruthBoundary(metadata) {
  return {
    metadata,
    truth_boundary: {
      repo_files: {
        verified: true,
        source: 'repository filesystem at workflow runtime',
      },
      migrations_local: {
        verified: true,
        source: 'supabase/migrations/*.sql in repository',
      },
      remote_database_runtime: {
        verified: false,
        source: null,
        reason: 'requires explicit remote connection and credentials',
      },
      applied_migrations_remote: {
        verified: false,
        source: null,
        reason: 'requires explicit remote connection and credentials',
      },
      remote_functions_policies_rls: {
        verified: false,
        source: null,
        reason: 'requires explicit remote connection and credentials',
      },
    },
    guidance: [
      'REPO_CONTRACTS.json reflects repository contracts found in code and migrations.',
      'REPO_EFFECTIVE_CONTRACTS.json reflects latest effective repository definitions by key within repository history.',
      'DB_RUNTIME_STATE.json remains unavailable until explicit remote database access is configured.',
    ],
  }
}

function buildDbRuntimeState(metadata) {
  return {
    metadata,
    status: 'unavailable_without_remote_connection',
    verified: false,
    required_inputs: [
      'database connection or Supabase management credentials',
      'explicit workflow secrets for remote verification',
    ],
    checks_not_performed: [
      'applied migration history on remote database',
      'remote functions/RPCs inventory',
      'remote policies inventory',
      'remote RLS enablement state',
      'drift between repository and remote database',
    ],
  }
}

async function writeJson(relativePath, payload) {
  const absPath = path.join(ROOT, relativePath)
  await fs.mkdir(path.dirname(absPath), { recursive: true })
  await fs.writeFile(absPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
}

async function writeText(relativePath, content) {
  const absPath = path.join(ROOT, relativePath)
  await fs.mkdir(path.dirname(absPath), { recursive: true })
  await fs.writeFile(absPath, content, 'utf8')
}

function buildIndexMarkdown(context) {
  const {
    metadata,
    directoryNodes,
    fileRecords,
    contractsManifest,
    effectiveContractsManifest,
    runtimeManifest,
    truthBoundaryManifest,
    filesManifest,
  } = context

  const routes = fileRecords
    .filter((file) => file.route)
    .map((file) => `- \`${file.route.route_path}\` — ${file.path}`)
    .join('\n')

  const workflows = runtimeManifest.runtime.workflows
    .map((workflow) => `- \`${workflow}\``)
    .join('\n')

  return `# REPO REALITY INDEX

Gerado automaticamente a partir da realidade do repositório.

## Metadados

- generated_at: \`${metadata.generated_at}\`
- repository: \`${metadata.repository ?? 'unknown'}\`
- branch: \`${metadata.branch ?? 'unknown'}\`
- commit_sha: \`${metadata.commit_sha ?? 'unknown'}\`
- generator: \`${metadata.generator}\`

## Contagem estrutural

- directories: ${directoryNodes.length}
- files: ${fileRecords.length}

## Contagem por camada

${Object.entries(filesManifest.summary.files_by_layer).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

## Contagem por kind

${Object.entries(filesManifest.summary.files_by_kind).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

## Contratos SQL detectados

- tables: ${contractsManifest.contracts.tables.length}
- indexes: ${contractsManifest.contracts.indexes.length}
- policies: ${contractsManifest.contracts.policies.length}
- functions: ${contractsManifest.contracts.functions.length}
- views: ${contractsManifest.contracts.views.length}
- triggers: ${contractsManifest.contracts.triggers.length}
- enums: ${contractsManifest.contracts.enums.length}
- rls_enabled_tables: ${contractsManifest.contracts.rls_enabled_tables.length}

## Contratos efetivos

- effective_tables: ${effectiveContractsManifest.summary.effective_tables}
- effective_indexes: ${effectiveContractsManifest.summary.effective_indexes}
- effective_policies: ${effectiveContractsManifest.summary.effective_policies}
- effective_functions: ${effectiveContractsManifest.summary.effective_functions}
- duplicate_functions: ${effectiveContractsManifest.summary.duplicate_functions}

## Runtime detectado

- env_references: ${runtimeManifest.runtime.env_references.length}
- workflows: ${runtimeManifest.runtime.workflows.length}
- nvmrc: ${runtimeManifest.runtime.nvmrc ?? 'null'}

## Fronteira de verdade

- repo_files_verified: ${truthBoundaryManifest.truth_boundary.repo_files.verified}
- remote_database_runtime_verified: ${truthBoundaryManifest.truth_boundary.remote_database_runtime.verified}

## Rotas detectadas

${routes || '- nenhuma rota detectada'}

## Workflows detectados

${workflows || '- nenhum workflow detectado'}

## Arquivos gerados

- \`docs/repo/REPO_TREE.json\`
- \`docs/repo/REPO_FILES.json\`
- \`docs/repo/REPO_CONTRACTS.json\`
- \`docs/repo/REPO_EFFECTIVE_CONTRACTS.json\`
- \`docs/repo/REPO_RUNTIME.json\`
- \`docs/repo/REPO_TRUTH_BOUNDARY.json\`
- \`docs/repo/DB_RUNTIME_STATE.json\`
- \`docs/repo/REPO_INDEX.md\`

## Observações

- Tudo aqui é derivado apenas de arquivos reais do repositório.
- Estado remoto do banco não é inferido a partir das migrations.
- O que não estiver no repositório não entra como fato.
`
}

async function main() {
  const metadata = {
    generated_at: nowIso(),
    repository: process.env.GITHUB_REPOSITORY ?? null,
    branch: process.env.GITHUB_REF_NAME ?? null,
    commit_sha: process.env.GITHUB_SHA ?? null,
    generator: 'scripts/generate-repo-manifest.mjs',
    root: ROOT,
  }

  const directoryNodes = [makeDirNode('.')]
  const fileRecords = []
  const warnings = []

  const runtime = {
    package_json: null,
    tsconfig_json: null,
    nvmrc: null,
    workflows: [],
    env_references: new Set(),
  }

  const contracts = {
    sources: [],
    tables: [],
    indexes: [],
    policies: [],
    functions: [],
    views: [],
    triggers: [],
    enums: [],
    rls_enabled_tables: [],
  }

  await walk('', directoryNodes, fileRecords, runtime, contracts, warnings)

  const runtimeManifest = {
    metadata,
    runtime: {
      package_json: runtime.package_json,
      tsconfig_json: runtime.tsconfig_json,
      nvmrc: runtime.nvmrc,
      workflows: [...new Set(runtime.workflows)].sort(),
      env_references: [...runtime.env_references].sort(),
    },
    warnings,
  }

  const filesManifest = {
    metadata,
    directories: directoryNodes.sort((a, b) => a.path.localeCompare(b.path)),
    files: fileRecords.sort((a, b) => a.path.localeCompare(b.path)),
    summary: {
      total_directories: directoryNodes.length,
      total_files: fileRecords.length,
      files_by_layer: countBy(fileRecords, 'layer'),
      files_by_kind: countBy(fileRecords, 'kind'),
    },
    warnings,
  }

  const contractsManifest = {
    metadata,
    contracts: {
      sql_sources: [...new Set(contracts.sources)].sort(),
      tables: contracts.tables,
      indexes: contracts.indexes,
      policies: contracts.policies,
      functions: contracts.functions,
      views: contracts.views,
      triggers: contracts.triggers,
      enums: contracts.enums,
      rls_enabled_tables: contracts.rls_enabled_tables,
    },
    warnings,
  }

  const effectiveContractsManifest = {
    metadata,
    ...buildEffectiveContracts(contractsManifest.contracts),
    warnings,
  }

  const truthBoundaryManifest = buildTruthBoundary(metadata)
  const dbRuntimeStateManifest = buildDbRuntimeState(metadata)

  const treeNodes = [
    ...filesManifest.directories.map((dir) => ({
      path: dir.path,
      name: dir.name,
      node_type: 'directory',
      layer: dir.layer,
    })),
    ...filesManifest.files.map((file) => ({
      path: file.path,
      name: file.name,
      node_type: 'file',
      kind: file.kind,
      layer: file.layer,
    })),
  ]

  const treeManifest = { metadata, tree: buildTree(treeNodes), warnings }

  const indexMarkdown = buildIndexMarkdown({
    metadata,
    directoryNodes: filesManifest.directories,
    fileRecords: filesManifest.files,
    contractsManifest,
    effectiveContractsManifest,
    runtimeManifest,
    truthBoundaryManifest,
    filesManifest,
  })

  await writeJson(`${OUTPUT_DIR}/REPO_TREE.json`, treeManifest)
  await writeJson(`${OUTPUT_DIR}/REPO_FILES.json`, filesManifest)
  await writeJson(`${OUTPUT_DIR}/REPO_CONTRACTS.json`, contractsManifest)
  await writeJson(`${OUTPUT_DIR}/REPO_EFFECTIVE_CONTRACTS.json`, effectiveContractsManifest)
  await writeJson(`${OUTPUT_DIR}/REPO_RUNTIME.json`, runtimeManifest)
  await writeJson(`${OUTPUT_DIR}/REPO_TRUTH_BOUNDARY.json`, truthBoundaryManifest)
  await writeJson(`${OUTPUT_DIR}/DB_RUNTIME_STATE.json`, dbRuntimeStateManifest)
  await writeText(`${OUTPUT_DIR}/REPO_INDEX.md`, indexMarkdown)

  console.log(
    JSON.stringify(
      {
        ok: true,
        output_dir: OUTPUT_DIR,
        files_generated: OUTPUT_FILES,
        total_directories: filesManifest.summary.total_directories,
        total_files: filesManifest.summary.total_files,
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
      },
      null,
      2,
    ),
  )
  process.exit(1)
})
