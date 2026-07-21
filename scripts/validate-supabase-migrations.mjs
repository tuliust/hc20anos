import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const migrationsDir = path.join(projectRoot, 'supabase', 'migrations')

const validFilenamePattern = /^(\d{14})_([a-z0-9][a-z0-9_]*)\.sql$/
const destructiveAllowance = /--\s*migration-audit:\s*allow-destructive\b/i
const destructiveSqlPattern = /\b(?:delete\s+from|truncate(?:\s+table)?|drop\s+table)\b/gi
const demoEventUuidPattern = /00000000-0000-0000-0000-000000000001/gi
const backupReferencePattern = /(?:to_regclass\s*\(\s*'public\.([a-z0-9_]*backup[a-z0-9_]*)'\s*\)|public\.([a-z0-9_]*backup[a-z0-9_]*))/gi
const backupCreationPattern = /create\s+table\s+(?:if\s+not\s+exists\s+)?public\.([a-z0-9_]*backup[a-z0-9_]*)/gi

function stripSqlCommentsAndLiterals(sql) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--[^\r\n]*/g, ' ')
    .replace(/\$[a-zA-Z0-9_]*\$[\s\S]*?\$[a-zA-Z0-9_]*\$/g, ' ')
    .replace(/'(?:''|[^'])*'/g, "''")
}

function collectMatches(pattern, text) {
  const matches = []
  pattern.lastIndex = 0
  for (const match of text.matchAll(pattern)) {
    matches.push(match[0])
  }
  return matches
}

function formatFinding(finding) {
  const location = finding.file ? ` [${finding.file}]` : ''
  return `${finding.level.toUpperCase()}: ${finding.message}${location}`
}

const entries = (await readdir(migrationsDir, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
  .map((entry) => entry.name)
  .sort((left, right) => left.localeCompare(right))

const findings = []
const migrations = []
const timestamps = new Map()
const createdBackupTables = new Set()
const referencedBackupTables = new Map()

for (const filename of entries) {
  const match = filename.match(validFilenamePattern)

  if (!match) {
    findings.push({
      level: 'error',
      file: filename,
      code: 'invalid_filename',
      message: 'Nome inválido. Use <14 dígitos>_<nome_em_snake_case>.sql.',
    })
    continue
  }

  const [, timestamp] = match
  const currentFiles = timestamps.get(timestamp) ?? []
  currentFiles.push(filename)
  timestamps.set(timestamp, currentFiles)

  const fullPath = path.join(migrationsDir, filename)
  const sql = await readFile(fullPath, 'utf8')
  const normalizedSql = stripSqlCommentsAndLiterals(sql)

  for (const backupMatch of sql.matchAll(backupCreationPattern)) {
    createdBackupTables.add(backupMatch[1])
  }

  for (const backupMatch of sql.matchAll(backupReferencePattern)) {
    const backupName = backupMatch[1] ?? backupMatch[2]
    if (!backupName) continue
    const references = referencedBackupTables.get(backupName) ?? []
    references.push(filename)
    referencedBackupTables.set(backupName, references)
  }

  const destructiveStatements = collectMatches(destructiveSqlPattern, normalizedSql)
  if (destructiveStatements.length > 0 && !destructiveAllowance.test(sql)) {
    findings.push({
      level: 'error',
      file: filename,
      code: 'destructive_sql',
      message: `SQL destrutivo detectado (${[...new Set(destructiveStatements.map((item) => item.toLowerCase()))].join(', ')}). Mova a operação para supabase/manual ou documente uma exceção explícita.`,
    })
  }

  const demoUuidMatches = collectMatches(demoEventUuidPattern, normalizedSql)
  if (demoUuidMatches.length > 0) {
    findings.push({
      level: 'warning',
      file: filename,
      code: 'hardcoded_demo_event_uuid',
      message: 'UUID fixo do evento de demonstração encontrado. Verifique se a migration deve resolver o evento por identificador estável.',
    })
  }

  migrations.push({ filename, timestamp })
}

for (const [timestamp, files] of timestamps.entries()) {
  if (files.length > 1) {
    findings.push({
      level: 'error',
      code: 'duplicate_timestamp',
      message: `Timestamp duplicado ${timestamp}: ${files.join(', ')}.`,
    })
  }
}

for (const [backupName, files] of referencedBackupTables.entries()) {
  if (!createdBackupTables.has(backupName)) {
    findings.push({
      level: 'error',
      code: 'missing_backup_creation',
      message: `A tabela de backup public.${backupName} é referenciada, mas não é criada por nenhuma migration válida. Referências: ${files.join(', ')}.`,
    })
  }
}

const sortedByTimestamp = [...migrations].sort((left, right) => {
  const byTimestamp = left.timestamp.localeCompare(right.timestamp)
  return byTimestamp || left.filename.localeCompare(right.filename)
})

if (migrations.map((item) => item.filename).join('\n') !== sortedByTimestamp.map((item) => item.filename).join('\n')) {
  findings.push({
    level: 'warning',
    code: 'non_chronological_listing',
    message: 'A ordenação lexicográfica dos arquivos não corresponde à ordem cronológica dos timestamps.',
  })
}

const errors = findings.filter((finding) => finding.level === 'error')
const warnings = findings.filter((finding) => finding.level === 'warning')
const jsonMode = process.argv.includes('--json')

if (jsonMode) {
  process.stdout.write(`${JSON.stringify({ migrations: migrations.length, errors, warnings }, null, 2)}\n`)
} else {
  console.log(`Migrations analisadas: ${migrations.length}`)
  console.log(`Erros: ${errors.length}`)
  console.log(`Alertas: ${warnings.length}`)

  if (findings.length === 0) {
    console.log('Nenhum problema encontrado.')
  } else {
    console.log('')
    for (const finding of findings) {
      console.log(formatFinding(finding))
    }
  }
}

if (errors.length > 0) {
  process.exitCode = 1
}
