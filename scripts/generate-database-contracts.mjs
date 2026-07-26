import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const CHECK_MODE = process.argv.includes("--check");
const DB_CONTAINER = process.env.SUPABASE_DB_CONTAINER || "supabase_db_hc20anos";
const OUTPUTS = {
  database: "docs/30-contratos/banco.generated.md",
  functions: "docs/30-contratos/RPCs.generated.md",
  security: "docs/30-contratos/RLS.generated.md",
  erd: "docs/30-contratos/erd.generated.mmd",
  types: "docs/30-contratos/database.types.generated.ts",
};
const SOURCE_PATHS = [
  "supabase/config.toml",
  "supabase/migrations",
  "scripts/generate-database-contracts.mjs",
];

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 32 * 1024 * 1024,
    ...options,
  });
}

function gitValue(args, fallback) {
  try {
    return run("git", args).trim() || fallback;
  } catch {
    return fallback;
  }
}

function sourceMetadata() {
  const pathArgs = ["--", ...SOURCE_PATHS];
  const commit = gitValue(["log", "-1", "--format=%H", ...pathArgs], "unknown");
  const date = gitValue(["log", "-1", "--format=%cs", ...pathArgs], "1970-01-01");
  return { commit, date };
}

function queryJson(query) {
  const output = run("docker", [
    "exec",
    DB_CONTAINER,
    "psql",
    "-X",
    "-v",
    "ON_ERROR_STOP=1",
    "-U",
    "postgres",
    "-d",
    "postgres",
    "-At",
    "-c",
    query,
  ]).trim();

  return output ? JSON.parse(output) : [];
}

function code(value) {
  const normalized = value === null || value === undefined || value === "" ? "—" : String(value);
  return `\`${normalized.replaceAll("`", "\\`")}\``;
}

function cell(value) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value)
    .replaceAll("|", "\\|")
    .replaceAll("\r", "")
    .replaceAll("\n", "<br>");
}

function frontMatter(title, metadata) {
  return [
    "---",
    "status: generated",
    "owner: tuliust",
    `last_verified: ${metadata.date}`,
    `last_verified_commit: ${metadata.commit}`,
    "generation_command: npm run docs:generate-db-contracts",
    "source_files:",
    "  - supabase/config.toml",
    "  - supabase/migrations/",
    "  - scripts/generate-database-contracts.mjs",
    "---",
    "",
    `# ${title}`,
    "",
    "> Arquivo gerado a partir de um banco Supabase local reconstruído por todas as migrations. Não editar manualmente.",
    "",
  ];
}

function markdownTable(headers, rows) {
  const lines = [
    `| ${headers.join(" | ")} |`,
    `|${headers.map(() => "---").join("|")}|`,
  ];

  for (const row of rows) lines.push(`| ${row.map(cell).join(" | ")} |`);
  if (!rows.length) lines.push(`| ${headers.map((_, index) => index === 0 ? "—" : "Nenhum registro").join(" | ")} |`);
  return lines;
}

function generateDatabaseContract(data, metadata) {
  const lines = frontMatter("Contrato do banco de dados", metadata);

  lines.push("## Enums", "");
  lines.push(...markdownTable(
    ["Schema", "Enum", "Ordem", "Valor"],
    data.enums.map(item => [code(item.schema_name), code(item.enum_name), item.sort_order, code(item.enum_value)]),
  ));

  lines.push("", "## Tabelas e colunas", "");
  lines.push(...markdownTable(
    ["Tabela", "Posição", "Coluna", "Tipo", "Nullable", "Default"],
    data.columns.map(item => [
      code(`${item.schema_name}.${item.table_name}`),
      item.ordinal_position,
      code(item.column_name),
      code(item.data_type === "USER-DEFINED" ? item.udt_name : item.data_type),
      item.is_nullable,
      code(item.column_default),
    ]),
  ));

  lines.push("", "## Constraints", "");
  lines.push(...markdownTable(
    ["Tabela", "Nome", "Tipo", "Definição"],
    data.constraints.map(item => [
      code(`${item.schema_name}.${item.table_name}`),
      code(item.constraint_name),
      code(item.constraint_type),
      code(item.definition),
    ]),
  ));

  lines.push("", "## Índices", "");
  lines.push(...markdownTable(
    ["Tabela", "Índice", "Definição"],
    data.indexes.map(item => [code(`${item.schema_name}.${item.table_name}`), code(item.index_name), code(item.definition)]),
  ));

  lines.push("", "## Views", "");
  lines.push(...markdownTable(
    ["Tipo", "View", "Definição"],
    data.views.map(item => [item.view_type, code(`${item.schema_name}.${item.view_name}`), code(item.definition)]),
  ));

  lines.push("", "## Triggers", "");
  lines.push(...markdownTable(
    ["Tabela", "Trigger", "Definição"],
    data.triggers.map(item => [code(`${item.schema_name}.${item.table_name}`), code(item.trigger_name), code(item.definition)]),
  ));

  return `${lines.join("\n")}\n`;
}

function generateFunctionsContract(functions, metadata) {
  const lines = frontMatter("RPCs e funções do schema público", metadata);
  lines.push(...markdownTable(
    ["Função", "Argumentos", "Retorno", "Security definer", "Volatilidade", "ACL"],
    functions.map(item => [
      code(`${item.schema_name}.${item.function_name}`),
      code(item.identity_arguments),
      code(item.result_type),
      item.security_definer ? "sim" : "não",
      code(item.volatility),
      code(item.acl),
    ]),
  ));
  lines.push("", "A presença nesta lista não implica exposição pública. A autorização efetiva depende de grants, RLS e validações internas da função.", "");
  return `${lines.join("\n")}\n`;
}

function generateSecurityContract(data, metadata) {
  const lines = frontMatter("RLS, grants e revokes", metadata);

  lines.push("## Estado de RLS por tabela", "");
  lines.push(...markdownTable(
    ["Tabela", "RLS habilitada", "RLS forçada"],
    data.tables.map(item => [code(`${item.schema_name}.${item.table_name}`), item.rls_enabled ? "sim" : "não", item.rls_forced ? "sim" : "não"]),
  ));

  lines.push("", "## Policies", "");
  lines.push(...markdownTable(
    ["Tabela", "Policy", "Modo", "Roles", "Comando", "USING", "WITH CHECK"],
    data.policies.map(item => [
      code(`${item.schema_name}.${item.table_name}`),
      code(item.policy_name),
      item.permissive,
      code(item.roles),
      code(item.command),
      code(item.using_expression),
      code(item.check_expression),
    ]),
  ));

  lines.push("", "## Grants de tabelas", "");
  lines.push(...markdownTable(
    ["Objeto", "Grantee", "Privilégio", "Grantable"],
    data.table_grants.map(item => [
      code(`${item.schema_name}.${item.table_name}`),
      code(item.grantee),
      code(item.privilege_type),
      item.is_grantable,
    ]),
  ));

  lines.push("", "## Grants de rotinas", "");
  lines.push(...markdownTable(
    ["Rotina", "Grantee", "Privilégio", "Grantable"],
    data.routine_grants.map(item => [
      code(`${item.schema_name}.${item.routine_name}`),
      code(item.grantee),
      code(item.privilege_type),
      item.is_grantable,
    ]),
  ));

  return `${lines.join("\n")}\n`;
}

function mermaidIdentifier(value) {
  return String(value).replace(/[^A-Za-z0-9_]/g, "_");
}

function generateErd(data, metadata) {
  const lines = [
    `%% status: generated`,
    `%% last_verified: ${metadata.date}`,
    `%% last_verified_commit: ${metadata.commit}`,
    `%% generation_command: npm run docs:generate-db-contracts`,
    `%% Não editar manualmente.`,
    "erDiagram",
  ];

  const columnsByTable = new Map();
  for (const column of data.columns) {
    const key = `${column.schema_name}.${column.table_name}`;
    if (!columnsByTable.has(key)) columnsByTable.set(key, []);
    columnsByTable.get(key).push(column);
  }

  for (const [table, columns] of [...columnsByTable.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`  ${mermaidIdentifier(table)} {`);
    for (const column of columns) {
      const type = mermaidIdentifier(column.data_type === "USER-DEFINED" ? column.udt_name : column.data_type);
      lines.push(`    ${type} ${mermaidIdentifier(column.column_name)}`);
    }
    lines.push("  }");
  }

  for (const relation of data.foreign_keys) {
    const from = mermaidIdentifier(`${relation.schema_name}.${relation.table_name}`);
    const to = mermaidIdentifier(`${relation.foreign_schema_name}.${relation.foreign_table_name}`);
    const label = `${relation.column_name} → ${relation.foreign_column_name}`.replaceAll('"', "'");
    lines.push(`  ${to} ||--o{ ${from} : "${label}"`);
  }

  return `${lines.join("\n")}\n`;
}

async function writeOrCheck(relativePath, content) {
  const absolute = path.join(ROOT, relativePath);

  if (CHECK_MODE) {
    let existing = null;
    try {
      existing = await readFile(absolute, "utf8");
    } catch {
      // Ausência é drift.
    }
    if (existing !== content) {
      console.error(`Contrato desatualizado: ${relativePath}`);
      process.exitCode = 1;
    }
    return;
  }

  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, content, "utf8");
  console.log(`Gerado: ${relativePath}`);
}

async function main() {
  const metadata = sourceMetadata();

  const columns = queryJson(`
    select coalesce(json_agg(row_to_json(q) order by q.schema_name, q.table_name, q.ordinal_position), '[]'::json)::text
    from (
      select c.table_schema as schema_name, c.table_name, c.ordinal_position, c.column_name,
             c.data_type, c.udt_name, c.is_nullable, c.column_default
      from information_schema.columns c
      join information_schema.tables t
        on t.table_schema = c.table_schema and t.table_name = c.table_name
      where c.table_schema = 'public' and t.table_type = 'BASE TABLE'
    ) q;
  `);

  const enums = queryJson(`
    select coalesce(json_agg(row_to_json(q) order by q.schema_name, q.enum_name, q.sort_order), '[]'::json)::text
    from (
      select n.nspname as schema_name, t.typname as enum_name, e.enumsortorder as sort_order, e.enumlabel as enum_value
      from pg_type t
      join pg_enum e on e.enumtypid = t.oid
      join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public'
    ) q;
  `);

  const constraints = queryJson(`
    select coalesce(json_agg(row_to_json(q) order by q.schema_name, q.table_name, q.constraint_name), '[]'::json)::text
    from (
      select n.nspname as schema_name, c.relname as table_name, con.conname as constraint_name,
             case con.contype when 'p' then 'PRIMARY KEY' when 'f' then 'FOREIGN KEY'
               when 'u' then 'UNIQUE' when 'c' then 'CHECK' when 'x' then 'EXCLUDE' else con.contype::text end as constraint_type,
             pg_get_constraintdef(con.oid, true) as definition
      from pg_constraint con
      join pg_class c on c.oid = con.conrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
    ) q;
  `);

  const indexes = queryJson(`
    select coalesce(json_agg(row_to_json(q) order by q.schema_name, q.table_name, q.index_name), '[]'::json)::text
    from (
      select schemaname as schema_name, tablename as table_name, indexname as index_name, indexdef as definition
      from pg_indexes where schemaname = 'public'
    ) q;
  `);

  const views = queryJson(`
    select coalesce(json_agg(row_to_json(q) order by q.view_type, q.schema_name, q.view_name), '[]'::json)::text
    from (
      select 'view' as view_type, schemaname as schema_name, viewname as view_name, definition
      from pg_views where schemaname = 'public'
      union all
      select 'materialized view' as view_type, schemaname as schema_name, matviewname as view_name, definition
      from pg_matviews where schemaname = 'public'
    ) q;
  `);

  const triggers = queryJson(`
    select coalesce(json_agg(row_to_json(q) order by q.schema_name, q.table_name, q.trigger_name), '[]'::json)::text
    from (
      select n.nspname as schema_name, c.relname as table_name, t.tgname as trigger_name,
             pg_get_triggerdef(t.oid, true) as definition
      from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and not t.tgisinternal
    ) q;
  `);

  const functions = queryJson(`
    select coalesce(json_agg(row_to_json(q) order by q.schema_name, q.function_name, q.identity_arguments), '[]'::json)::text
    from (
      select n.nspname as schema_name, p.proname as function_name,
             pg_get_function_identity_arguments(p.oid) as identity_arguments,
             pg_get_function_result(p.oid) as result_type,
             p.prosecdef as security_definer,
             case p.provolatile when 'i' then 'immutable' when 's' then 'stable' else 'volatile' end as volatility,
             coalesce(array_to_string(p.proacl, ','), '') as acl
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
    ) q;
  `);

  const rlsTables = queryJson(`
    select coalesce(json_agg(row_to_json(q) order by q.schema_name, q.table_name), '[]'::json)::text
    from (
      select n.nspname as schema_name, c.relname as table_name,
             c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind in ('r', 'p')
    ) q;
  `);

  const policies = queryJson(`
    select coalesce(json_agg(row_to_json(q) order by q.schema_name, q.table_name, q.policy_name), '[]'::json)::text
    from (
      select schemaname as schema_name, tablename as table_name, policyname as policy_name,
             permissive, array_to_string(roles, ',') as roles, cmd as command,
             qual as using_expression, with_check as check_expression
      from pg_policies where schemaname = 'public'
    ) q;
  `);

  const tableGrants = queryJson(`
    select coalesce(json_agg(row_to_json(q) order by q.schema_name, q.table_name, q.grantee, q.privilege_type), '[]'::json)::text
    from (
      select table_schema as schema_name, table_name, grantee, privilege_type, is_grantable
      from information_schema.role_table_grants where table_schema = 'public'
    ) q;
  `);

  const routineGrants = queryJson(`
    select coalesce(json_agg(row_to_json(q) order by q.schema_name, q.routine_name, q.grantee, q.privilege_type), '[]'::json)::text
    from (
      select routine_schema as schema_name, routine_name, grantee, privilege_type, is_grantable
      from information_schema.role_routine_grants where routine_schema = 'public'
    ) q;
  `);

  const foreignKeys = queryJson(`
    select coalesce(json_agg(row_to_json(q) order by q.schema_name, q.table_name, q.constraint_name, q.ordinal_position), '[]'::json)::text
    from (
      select tc.table_schema as schema_name, tc.table_name, tc.constraint_name,
             kcu.ordinal_position, kcu.column_name,
             ccu.table_schema as foreign_schema_name, ccu.table_name as foreign_table_name,
             ccu.column_name as foreign_column_name
      from information_schema.table_constraints tc
      join information_schema.key_column_usage kcu
        on tc.constraint_name = kcu.constraint_name and tc.constraint_schema = kcu.constraint_schema
      join information_schema.constraint_column_usage ccu
        on ccu.constraint_name = tc.constraint_name and ccu.constraint_schema = tc.constraint_schema
      where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public'
    ) q;
  `);

  const types = run("npx", ["supabase", "gen", "types", "typescript", "--local"]);

  const databaseData = { columns, enums, constraints, indexes, views, triggers, foreign_keys: foreignKeys };
  const securityData = { tables: rlsTables, policies, table_grants: tableGrants, routine_grants: routineGrants };

  await writeOrCheck(OUTPUTS.database, generateDatabaseContract(databaseData, metadata));
  await writeOrCheck(OUTPUTS.functions, generateFunctionsContract(functions, metadata));
  await writeOrCheck(OUTPUTS.security, generateSecurityContract(securityData, metadata));
  await writeOrCheck(OUTPUTS.erd, generateErd(databaseData, metadata));
  await writeOrCheck(OUTPUTS.types, `// Generated by npm run docs:generate-db-contracts\n// Source commit: ${metadata.commit}\n\n${types}`);

  if (CHECK_MODE && !process.exitCode) console.log("Contratos do banco estão atualizados.");
}

main().catch(error => {
  console.error("Falha ao gerar contratos do banco:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
