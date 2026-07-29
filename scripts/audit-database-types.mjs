import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const CHECK_MODE = process.argv.includes("--check");
const MANUAL_PATH = "src/lib/database.types.ts";
const GENERATED_PATH = "docs/30-contratos/database.types.generated.ts";
const OUTPUT_PATH = "docs/30-contratos/compatibilidade-de-tipos.generated.md";
const SOURCE_PATHS = [MANUAL_PATH, "supabase/migrations", "scripts/audit-database-types.mjs"];
const SECTIONS = ["Tables", "Views", "Functions", "Enums", "CompositeTypes"];

function gitValue(args, fallback) {
  try {
    return execFileSync("git", args, {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim() || fallback;
  } catch {
    return fallback;
  }
}

function metadata() {
  const paths = ["--", ...SOURCE_PATHS];
  return {
    commit: gitValue(["log", "--no-merges", "-1", "--format=%H", ...paths], "unknown"),
    date: gitValue(["log", "--no-merges", "-1", "--format=%cs", ...paths], "1970-01-01"),
  };
}

function splitLines(content) {
  return content.replaceAll("\r\n", "\n").split("\n");
}

function publicStart(lines) {
  const index = lines.findIndex(line => line === "  public: {");
  if (index < 0) throw new Error("Schema Database.public não encontrado");
  return index;
}

function sectionRange(lines, section) {
  const schemaStart = publicStart(lines);
  const start = lines.findIndex((line, index) => index > schemaStart && line === `    ${section}: {`);
  if (start < 0) throw new Error(`Seção public.${section} não encontrada`);

  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    const nextSection = lines[index].match(/^    ([A-Za-z0-9_]+): \{$/);
    if (nextSection && SECTIONS.includes(nextSection[1])) {
      end = index;
      break;
    }
    if (lines[index] === "  }" || lines[index] === "}") {
      end = index;
      break;
    }
  }

  return { start, end };
}

function sectionNames(lines, section) {
  const { start, end } = sectionRange(lines, section);
  const names = [];
  for (let index = start + 1; index < end; index += 1) {
    const match = lines[index].match(/^      ([A-Za-z0-9_]+):/);
    if (match && match[1] !== "_") names.push(match[1]);
  }
  return unique(names);
}

function manualMappings(lines, section) {
  const { start, end } = sectionRange(lines, section);
  const mappings = new Map();
  for (let index = start + 1; index < end; index += 1) {
    const match = lines[index].match(/^      ([A-Za-z0-9_]+):\s*\{\s*Row:\s*([^;]+);/);
    if (match) mappings.set(match[1], match[2].trim());
  }
  return mappings;
}

function interfaceFields(lines) {
  const interfaces = new Map();
  for (let index = 0; index < lines.length; index += 1) {
    const declaration = lines[index].match(/^export interface ([A-Za-z0-9_]+)(?:\s+extends[^\{]+)?\s*\{$/);
    if (!declaration) continue;

    const fields = [];
    let depth = 1;
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const line = lines[cursor];
      const field = depth === 1 ? line.match(/^\s{2}([A-Za-z0-9_]+)\??\s*:/) : null;
      if (field) fields.push(field[1]);
      depth += (line.match(/\{/g) ?? []).length;
      depth -= (line.match(/\}/g) ?? []).length;
      if (depth <= 0) {
        index = cursor;
        break;
      }
    }
    interfaces.set(declaration[1], unique(fields));
  }
  return interfaces;
}

function generatedRows(lines, section) {
  const { start, end } = sectionRange(lines, section);
  const rows = new Map();
  const objectStarts = [];

  for (let index = start + 1; index < end; index += 1) {
    const match = lines[index].match(/^      ([A-Za-z0-9_]+): \{$/);
    if (match) objectStarts.push({ name: match[1], index });
  }

  for (let position = 0; position < objectStarts.length; position += 1) {
    const current = objectStarts[position];
    const objectEnd = objectStarts[position + 1]?.index ?? end;
    const rowStart = lines.findIndex((line, index) => (
      index > current.index && index < objectEnd && line === "        Row: {"
    ));
    const fields = [];
    if (rowStart >= 0) {
      for (let index = rowStart + 1; index < objectEnd; index += 1) {
        if (lines[index] === "        }") break;
        const field = lines[index].match(/^          ([A-Za-z0-9_]+)\??:/);
        if (field) fields.push(field[1]);
      }
    }
    rows.set(current.name, unique(fields));
  }

  return rows;
}

function unique(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function difference(left, right) {
  const rightSet = new Set(right);
  return unique(left.filter(value => !rightSet.has(value)));
}

function intersection(left, right) {
  const rightSet = new Set(right);
  return unique(left.filter(value => rightSet.has(value)));
}

function code(value) {
  return `\`${String(value).replaceAll("`", "\\`")}\``;
}

function codeList(values) {
  return values.length ? values.map(code).join(", ") : "—";
}

function cell(value) {
  return String(value ?? "—").replaceAll("|", "\\|").replaceAll("\n", "<br>");
}

function table(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `|${headers.map(() => "---").join("|")}|`,
    ...rows.map(row => `| ${row.map(cell).join(" | ")} |`),
  ];
}

function fieldDrift(mappings, interfaces, generated) {
  const rows = [];
  for (const [objectName, rowType] of mappings) {
    if (!generated.has(objectName)) continue;
    if (rowType === "any" || rowType === "never") {
      rows.push([code(objectName), code(rowType), "não comparável", "não comparável"]);
      continue;
    }
    const manualFields = interfaces.get(rowType);
    if (!manualFields) {
      rows.push([code(objectName), code(rowType), "interface não analisável", "interface não analisável"]);
      continue;
    }
    const actualFields = generated.get(objectName) ?? [];
    const missing = difference(actualFields, manualFields);
    const extra = difference(manualFields, actualFields);
    if (missing.length || extra.length) {
      rows.push([code(objectName), code(rowType), codeList(missing), codeList(extra)]);
    }
  }
  return rows;
}

function frontMatter(meta) {
  return [
    "---",
    "status: generated",
    "owner: tuliust",
    `last_verified: ${meta.date}`,
    `last_verified_commit: ${meta.commit}`,
    "generation_command: npm run docs:generate-type-compatibility",
    "source_files:",
    ...SOURCE_PATHS.map(source => `  - ${source}`),
    "---",
    "",
    "# Compatibilidade dos tipos Supabase",
    "",
    "> Relatório gerado por comparação estrutural. Não editar manualmente.",
    "",
  ];
}

async function generateReport() {
  const [manualText, generatedText] = await Promise.all([
    readFile(path.join(ROOT, MANUAL_PATH), "utf8"),
    readFile(path.join(ROOT, GENERATED_PATH), "utf8"),
  ]);
  const manual = splitLines(manualText);
  const generated = splitLines(generatedText);
  const meta = metadata();

  const manualObjects = Object.fromEntries(["Tables", "Views", "Functions", "Enums"].map(section => [section, sectionNames(manual, section)]));
  const generatedObjects = Object.fromEntries(["Tables", "Views", "Functions", "Enums"].map(section => [section, sectionNames(generated, section)]));
  const manualTableMap = manualMappings(manual, "Tables");
  const manualViewMap = manualMappings(manual, "Views");
  const interfaces = interfaceFields(manual);
  const generatedTableRows = generatedRows(generated, "Tables");
  const generatedViewRows = generatedRows(generated, "Views");

  const missing = Object.fromEntries(Object.keys(manualObjects).map(section => [section, difference(generatedObjects[section], manualObjects[section])]));
  const extra = Object.fromEntries(Object.keys(manualObjects).map(section => [section, difference(manualObjects[section], generatedObjects[section])]));
  const tablesThatAreViews = intersection(manualObjects.Tables, generatedObjects.Views);
  const viewsThatAreTables = intersection(manualObjects.Views, generatedObjects.Tables);
  const anyMappings = [...manualTableMap, ...manualViewMap]
    .filter(([, rowType]) => rowType === "any")
    .map(([name]) => name);
  const drift = [
    ...fieldDrift(manualTableMap, interfaces, generatedTableRows),
    ...fieldDrift(manualViewMap, interfaces, generatedViewRows),
  ];

  const output = frontMatter(meta);
  output.push(
    "## Conclusão",
    "",
    "`src/lib/database.types.ts` não é uma saída atual da Supabase CLI. Ele combina interfaces de domínio, agregados de interface, aliases históricos e um mapa parcial do banco.",
    "",
    "A substituição direta é insegura. A migração deve separar o contrato bruto do Supabase dos tipos de domínio e apresentação usados pelos componentes.",
    "",
    "## Cobertura estrutural",
    "",
    ...table(
      ["Categoria", "Baseline gerada", "Mapa manual", "Ausentes no manual", "Somente no manual"],
      [
        ["Tabelas", generatedObjects.Tables.length, manualObjects.Tables.length, missing.Tables.length, extra.Tables.length],
        ["Views", generatedObjects.Views.length, manualObjects.Views.length, missing.Views.length, extra.Views.length],
        ["Funções/RPCs", generatedObjects.Functions.length, manualObjects.Functions.length, missing.Functions.length, extra.Functions.length],
        ["Enums", generatedObjects.Enums.length, manualObjects.Enums.length, missing.Enums.length, extra.Enums.length],
      ],
    ),
    "",
    "## Objetos ausentes no mapa manual",
    "",
    `### Tabelas (${missing.Tables.length})`, "", codeList(missing.Tables), "",
    `### Views (${missing.Views.length})`, "", codeList(missing.Views), "",
    `### Funções e RPCs (${missing.Functions.length})`, "", codeList(missing.Functions), "",
    `### Enums (${missing.Enums.length})`, "", codeList(missing.Enums), "",
    "## Objetos presentes somente no mapa manual",
    "",
    `- Tabelas: ${codeList(extra.Tables)}.`,
    `- Views: ${codeList(extra.Views)}.`,
    `- Funções: ${codeList(extra.Functions)}.`,
    `- Enums: ${codeList(extra.Enums)}.`,
    "",
    "Essas diferenças podem representar aliases históricos, objetos removidos, classificação incorreta ou tipos de aplicação que nunca foram objetos físicos do banco.",
    "",
    "## Classificação divergente",
    "",
    `- Entradas tratadas como tabela no arquivo manual, mas geradas como view: ${codeList(tablesThatAreViews)}.`,
    `- Entradas tratadas como view no arquivo manual, mas geradas como tabela: ${codeList(viewsThatAreTables)}.`,
    "",
    "## Linhas sem tipagem efetiva",
    "",
    `Mapeamentos com \`Row: any\`: ${codeList(unique(anyMappings))}.`,
    "",
    "## Divergência de campos nos objetos comparáveis",
    "",
  );

  if (drift.length) {
    output.push(...table(
      ["Objeto", "Interface manual", "Campos ausentes no manual", "Campos extras no manual"],
      drift,
    ));
  } else {
    output.push("Nenhuma divergência de campos foi detectada nos objetos comparáveis.");
  }

  output.push(
    "",
    "## Estratégia recomendada",
    "",
    "1. Manter `database.types.generated.ts` como contrato bruto e não editável.",
    "2. Configurar o cliente Supabase com o tipo bruto gerado.",
    "3. Mover interfaces de tela, conteúdo JSON e agregados para um módulo de tipos de domínio.",
    "4. Substituir gradualmente interfaces `Db*` por aliases derivados de `Database[\"public\"]` quando a forma for idêntica.",
    "5. Criar adaptadores explícitos para formas compostas por tabela, view, RPC ou campos calculados.",
    "6. Remover `any` e objetos inexistentes somente depois de corrigir os consumidores.",
    "7. Executar build, TypeScript e E2E a cada grupo de migração.",
    "",
    "## Critérios para substituir o arquivo manual",
    "",
    "- nenhum consumidor depende de campo ausente no banco;",
    "- views não são declaradas como tabelas;",
    "- RPCs usadas pelo código existem na baseline gerada;",
    "- tipos de conteúdo JSON possuem adaptadores ou aliases próprios;",
    "- não há `Row: any`;",
    "- build e testes passam com o cliente tipado pela saída gerada;",
    "- a migração é dividida em commits revisáveis.",
    "",
    "## Limitações da auditoria",
    "",
    "- compara nomes e campos, não equivalência completa de tipos TypeScript;",
    "- não interpreta aliases condicionais ou generics complexos;",
    "- tipos de domínio sem correspondência direta são preservados;",
    "- diferenças exigem análise funcional antes de correção.",
    "",
  );

  return `${output.join("\n")}\n`;
}

async function writeOrCheck(content) {
  const absolute = path.join(ROOT, OUTPUT_PATH);
  if (CHECK_MODE) {
    let current = null;
    try {
      current = await readFile(absolute, "utf8");
    } catch {
      // Ausência é drift.
    }
    if (current !== content) {
      console.error(`Relatório desatualizado: ${OUTPUT_PATH}`);
      process.exitCode = 1;
    } else {
      console.log("Relatório de compatibilidade está atualizado.");
    }
    return;
  }

  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, content, "utf8");
  console.log(`Gerado: ${OUTPUT_PATH}`);
}

async function main() {
  await writeOrCheck(await generateReport());
}

main().catch(error => {
  console.error("Falha ao gerar relatório de compatibilidade:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
